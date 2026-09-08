(()=>{
'use strict';
const PERSIST_KEY='ag2.dev.auth.persistent.v3';
const LEGACY_AUTH_KEY='ag2.dev.auth.v1';
const DEFAULT_ACCESS_HASH='e0bc60c82713f64ef8a57c0c40d02ce24fd0141d5cc3086259c19b1e62a62bea'; // 112233 fallback; UI gate only
const ACCESS_HASH=String(window.AG2_DEV_ACCESS_HASH||window.AG2_RUNTIME_CONFIG?.accessHash||DEFAULT_ACCESS_HASH).trim().toLowerCase();
const MAX_ATTEMPTS=5,LOCK_MS=30000;
let failed=0,lockUntil=0;

function safeGet(store,key){try{return store.getItem(key)}catch{return null}}
function safeSet(store,key,value){try{store.setItem(key,value)}catch{}}
function safeRemove(store,key){try{store.removeItem(key)}catch{}}
async function digestHex(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}

function ensureEnhancementStyles(){
  if(document.querySelector('link[data-ag2-ui-enhancements]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='ui-enhancements.css?v=1';
  link.dataset.ag2UiEnhancements='1';
  document.head.appendChild(link);
}
ensureEnhancementStyles();

if(safeGet(localStorage,PERSIST_KEY)==='1')safeSet(sessionStorage,LEGACY_AUTH_KEY,'1');
else safeRemove(sessionStorage,LEGACY_AUTH_KEY);

function icon(paths){return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`}

function enhanceSecretField(input){
  if(!input||input.closest('.secret-input-wrap'))return;
  const parent=input.parentElement;
  if(!parent)return;
  const wrap=document.createElement('div');
  wrap.className='secret-input-wrap';
  parent.insertBefore(wrap,input);
  wrap.appendChild(input);
  input.autocomplete='current-password';
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.className='secret-reveal';
  toggle.setAttribute('aria-label','Show developer access key');
  toggle.setAttribute('aria-pressed','false');
  toggle.title='Show developer access key';
  toggle.innerHTML=icon('<path d="M2.8 12s3.2-5.2 9.2-5.2S21.2 12 21.2 12s-3.2 5.2-9.2 5.2S2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.4"/>');
  toggle.addEventListener('click',()=>{
    const reveal=input.type==='password';
    input.type=reveal?'text':'password';
    toggle.setAttribute('aria-pressed',String(reveal));
    toggle.setAttribute('aria-label',reveal?'Hide developer access key':'Show developer access key');
    toggle.title=reveal?'Hide developer access key':'Show developer access key';
    input.focus({preventScroll:true});
  });
  wrap.appendChild(toggle);
}

function attachClearButton(input){
  if(!input||input.dataset.ag2Clear==='1')return;
  input.dataset.ag2Clear='1';
  const host=input.parentElement;
  if(!host)return;
  const clear=document.createElement('button');
  clear.type='button';
  clear.className='search-clear';
  clear.setAttribute('aria-label','Clear search');
  clear.title='Clear search';
  clear.innerHTML=icon('<path d="m7 7 10 10M17 7 7 17"/>');
  const sync=()=>{clear.hidden=!input.value};
  clear.addEventListener('click',()=>{
    input.value='';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    input.focus({preventScroll:true});
    sync();
  });
  input.addEventListener('input',sync);
  host.appendChild(clear);
  sync();
}

function installDocumentTitles(){
  const titles={
    overview:'System Overview',console:'Live Console',crash:'Crash Analyzer',performance:'Performance',weapon:'Weapon Debug',inspector:'Error Inspector',builds:'Build Comparison',upload:'ContentLog'
  };
  const set=name=>{if(titles[name])document.title=`${titles[name]} — DLAVIE DEV`};
  document.addEventListener('click',event=>{
    const target=event.target.closest?.('[data-view],[data-jump]');
    if(!target)return;
    set(target.dataset.view||target.dataset.jump);
  });
  const active=document.querySelector('.view.active')?.dataset.panel||'overview';
  set(active);
}

function installDrawerKeyboard(){
  const sidebar=document.getElementById('sidebar');
  const opener=document.getElementById('mobileMenu');
  const close=document.getElementById('sideClose');
  const scrim=document.getElementById('sidebarScrim');
  if(!sidebar||!opener)return;
  let restoreTo=null;
  const focusables=()=>[...sidebar.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null);
  opener.addEventListener('click',()=>{
    restoreTo=opener;
    requestAnimationFrame(()=>{if(sidebar.classList.contains('open'))focusables()[0]?.focus({preventScroll:true})});
  });
  const restore=()=>requestAnimationFrame(()=>restoreTo?.focus({preventScroll:true}));
  close?.addEventListener('click',restore);
  scrim?.addEventListener('click',restore);
  document.addEventListener('keydown',event=>{
    if(!sidebar.classList.contains('open')||window.innerWidth>1180)return;
    if(event.key==='Escape'){
      event.preventDefault();
      close?.click();
      restore();
      return;
    }
    if(event.key!=='Tab')return;
    const items=focusables();
    if(items.length<2)return;
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });
}

function boot(){
  const form=document.getElementById('accessForm'),input=document.getElementById('accessKey'),error=document.getElementById('accessError'),logout=document.getElementById('logoutBtn');
  enhanceSecretField(input);
  attachClearButton(document.getElementById('globalSearch'));
  attachClearButton(document.getElementById('consoleSearch'));
  installDocumentTitles();
  installDrawerKeyboard();

  if(form)form.setAttribute('novalidate','');
  if(form&&input){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      if(Date.now()<lockUntil){if(error)error.textContent='Temporarily locked. Try again shortly.';return}
      const raw=input.value.trim();
      if(!raw){if(error)error.textContent='Enter the developer access key.';input.focus();return}
      const hash=await digestHex(raw);
      if(hash===ACCESS_HASH){
        safeSet(localStorage,PERSIST_KEY,'1');
        safeSet(sessionStorage,LEGACY_AUTH_KEY,'1');
        failed=0;
        input.value='';
        location.reload();
        return;
      }
      failed++;
      input.value='';
      input.type='password';
      if(error)error.textContent='Access key not recognized.';
      input.focus();
      if(failed>=MAX_ATTEMPTS){
        failed=0;
        lockUntil=Date.now()+LOCK_MS;
        if(error)error.textContent='Too many attempts. Try again in 30 seconds.';
      }
    },true);
  }
  if(logout){
    logout.addEventListener('click',()=>{
      safeRemove(localStorage,PERSIST_KEY);
      safeRemove(sessionStorage,LEGACY_AUTH_KEY);
    },true);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
