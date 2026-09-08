(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensureToastRegion(){
  let region=$('.ag2-toast-region');
  if(region)return region;
  region=document.createElement('div');
  region.className='ag2-toast-region';
  region.setAttribute('role','status');
  region.setAttribute('aria-live','polite');
  region.setAttribute('aria-atomic','false');
  document.body.appendChild(region);
  return region;
}

function toast(message){
  const region=ensureToastRegion();
  const item=document.createElement('div');
  item.className='ag2-toast';
  item.textContent=String(message||'');
  region.appendChild(item);
  const remove=()=>item.remove();
  setTimeout(()=>{
    if(reduced){remove();return}
    item.animate([
      {opacity:1,transform:'translateY(0) scale(1)'},
      {opacity:0,transform:'translateY(6px) scale(.985)'}
    ],{duration:160,easing:'ease',fill:'forwards'}).finished.then(remove).catch(remove);
  },2600);
}

/* Replace browser-native alert used by legacy handlers with an app-owned status surface. */
window.alert=message=>toast(message);
window.AG2_DEV_TOAST=toast;

let scrollQueued=false;
function syncScrollState(){
  scrollQueued=false;
  document.body.classList.toggle('ag2-scrolled',scrollY>22);
}
addEventListener('scroll',()=>{
  if(scrollQueued)return;
  scrollQueued=true;
  requestAnimationFrame(syncScrollState);
},{passive:true});
syncScrollState();

function activeViewName(){return $('.view.active')?.dataset.panel||'overview'}
function syncNavigation(){
  const active=activeViewName();
  $$('.nav-item').forEach(item=>{
    const current=item.dataset.view===active;
    if(current)item.setAttribute('aria-current','page');
    else item.removeAttribute('aria-current');
  });
  document.body.dataset.consoleView=active;
}

const viewObserver=new MutationObserver(records=>{
  if(records.some(r=>r.type==='attributes'&&r.attributeName==='class'))requestAnimationFrame(syncNavigation);
});
$$('.view').forEach(view=>viewObserver.observe(view,{attributes:true,attributeFilter:['class']}));
syncNavigation();

function syncChartEmptyState(){
  ['#performanceEmpty','#errorFlowEmpty'].forEach(selector=>{
    const empty=$(selector);
    if(!empty)return;
    const panel=empty.closest('.panel');
    if(!panel)return;
    const visible=getComputedStyle(empty).display!=='none';
    panel.classList.toggle('ag2-chart-empty',visible);
  });
}

['#performanceEmpty','#errorFlowEmpty'].forEach(selector=>{
  const el=$(selector);
  if(!el)return;
  new MutationObserver(syncChartEmptyState).observe(el,{attributes:true,attributeFilter:['style','class']});
});
syncChartEmptyState();

/* Keep search ergonomics consistent when route changes or programmatic fills occur. */
function syncSearchState(input){
  if(!input)return;
  input.closest('.top-search,.console-search')?.classList.toggle('has-value',!!input.value);
}
['#globalSearch','#consoleSearch'].forEach(selector=>{
  const input=$(selector);
  if(!input)return;
  input.addEventListener('input',()=>syncSearchState(input));
  syncSearchState(input);
});

/* Give the fake legacy weapon silhouette no semantic weight. The current UI is runtime-data first. */
function normalizeWeaponPanel(){
  const card=$('#weaponCard');
  if(!card)return;
  const schematic=$('.weapon-schematic',card);
  if(schematic){
    schematic.setAttribute('aria-hidden','true');
    schematic.setAttribute('role','presentation');
  }
  const kv=$('.weapon-kv',card);
  if(kv)kv.setAttribute('aria-label','Weapon runtime properties');
}
const weaponCard=$('#weaponCard');
if(weaponCard)new MutationObserver(()=>requestAnimationFrame(normalizeWeaponPanel)).observe(weaponCard,{childList:true,subtree:false});
normalizeWeaponPanel();

/* Improve fault-table row semantics without changing the parser rendering contract. */
function normalizeFaultRows(){
  $$('#faultList .fault-row').forEach(row=>{
    row.setAttribute('role','button');
    row.setAttribute('tabindex','0');
    if(row.dataset.ag2Keyboard==='1')return;
    row.dataset.ag2Keyboard='1';
    row.addEventListener('keydown',event=>{
      if(event.isComposing)return;
      if(event.key==='Enter'||event.key===' '){event.preventDefault();row.click()}
    });
  });
}
const faultList=$('#faultList');
if(faultList)new MutationObserver(normalizeFaultRows).observe(faultList,{childList:true});
normalizeFaultRows();

/* Keep the iPhone viewport from leaving the active control under browser/tool bars. */
function ensureFocusedVisible(event){
  const target=event.target;
  if(!(target instanceof HTMLElement))return;
  if(!target.matches('input,select,button,[tabindex]'))return;
  if(innerWidth>760)return;
  setTimeout(()=>{
    const rect=target.getBoundingClientRect();
    const safeTop=86;
    const safeBottom=innerHeight-120;
    if(rect.top<safeTop||rect.bottom>safeBottom){
      target.scrollIntoView({block:'center',behavior:reduced?'auto':'smooth'});
    }
  },80);
}
document.addEventListener('focusin',ensureFocusedVisible);

/* Mobile topbar becomes a compact command surface after the user starts scrolling. */
let lastScrollY=scrollY;
let directionQueued=false;
addEventListener('scroll',()=>{
  if(directionQueued)return;
  directionQueued=true;
  requestAnimationFrame(()=>{
    directionQueued=false;
    const y=scrollY;
    document.body.classList.toggle('ag2-scroll-down',y>lastScrollY&&y>120);
    document.body.classList.toggle('ag2-scroll-up',y<lastScrollY);
    lastScrollY=y;
  });
},{passive:true});

/* Optimize off-screen diagnostic canvases on resize by avoiding redundant synchronous work. */
$$('canvas').forEach(canvas=>{
  canvas.setAttribute('aria-hidden','true');
  canvas.style.contain='strict';
});

/* Re-apply derived states after analysis renders many sections at once. */
const appShell=$('#appShell');
if(appShell){
  let pending=false;
  new MutationObserver(()=>{
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{
      pending=false;
      syncChartEmptyState();
      normalizeWeaponPanel();
      normalizeFaultRows();
    });
  }).observe(appShell,{childList:true,subtree:true});
}

})();
