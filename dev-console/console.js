(()=>{
'use strict';

const ACCESS_HASH='149471c729bc10501bab859a88852e4c88f3fc0401e76e90736e2d3632bd5eb4';
const AUTH_KEY='ag2.dev.auth.v1';
const BUILD_KEY='ag2.dev.builds.v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const state={
  entries:[],groups:[],groupMap:new Map(),categoryCounts:new Map(),
  performance:{watchdogs:[],scriptTicks:[],slowEvents:0,entityQueries:0,projectile:0,attachment:0,ads:0,recoil:0},
  weapons:new Map(),file:{name:'—',size:0,lines:0},activeFilter:'ALL',activeGroup:null
};

const channelOrder=['ALL','CRITICAL','ERROR','WARNING','INFO','SCRIPT','ANIMATION','MOLANG','PARTICLE','RECIPE','BLOCK','RESOURCE PACK','ITEM','WEAPON'];
const subsystemDefs=[
  ['Script Runtime',['SCRIPT']],['Resource Pack',['RESOURCE PACK']],['Behavior Pack',['BLOCK','ITEM','RECIPE']],
  ['PBR',['RESOURCE PACK']],['Animation',['ANIMATION','MOLANG']],['Weapon Runtime',['WEAPON','SCRIPT']]
];

function escapeHTML(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function formatBytes(bytes){if(!bytes)return'0 B';const units=['B','KB','MB','GB'];let i=0,n=bytes;while(n>=1024&&i<units.length-1){n/=1024;i++;}return`${n.toFixed(i?1:0)} ${units[i]}`;}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;}
function nowStamp(){return new Date().toISOString();}
function digestHex(text){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)).then(b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''));}

// Access gate. Only a SHA-256 digest is shipped; the actual developer key is not in the repository.
const accessShell=$('#accessShell'),appShell=$('#appShell'),accessForm=$('#accessForm'),accessInput=$('#accessKey'),accessError=$('#accessError');
let failedAttempts=0,lockUntil=0;
function unlock(){accessShell.hidden=true;accessShell.style.display='none';appShell.hidden=false;renderAll();}
function lock(){sessionStorage.removeItem(AUTH_KEY);location.reload();}
if(sessionStorage.getItem(AUTH_KEY)==='1')unlock();
accessForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(Date.now()<lockUntil){accessError.textContent='Temporarily locked. Try again shortly.';return;}
  const raw=accessInput.value.trim();
  if(!raw){accessError.textContent='Access key required.';return;}
  const hash=await digestHex(raw);
  if(hash===ACCESS_HASH){sessionStorage.setItem(AUTH_KEY,'1');accessInput.value='';failedAttempts=0;unlock();return;}
  failedAttempts++;accessInput.value='';accessError.textContent='Access denied.';
  if(failedAttempts>=5){lockUntil=Date.now()+30000;failedAttempts=0;accessError.textContent='Too many attempts. Locked for 30 seconds.';}
});
$('#logoutBtn')?.addEventListener('click',lock);

// Navigation
const titles={overview:['01','SYSTEM OVERVIEW'],console:['02','LIVE CONSOLE'],crash:['03','CRASH ANALYZER'],performance:['04','PERFORMANCE'],weapon:['05','WEAPON DEBUG'],inspector:['06','ERROR INSPECTOR'],builds:['07','BUILD COMPARISON'],upload:['08','CONTENTLOG ANALYZER']};
function setView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.panel===name));
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  const meta=titles[name]||['--','DEV CONSOLE'];$('#viewCode').textContent=meta[0];$('#viewTitle').textContent=meta[1];
  $('#sidebar')?.classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$$('[data-jump]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.jump)));
$('#mobileMenu')?.addEventListener('click',()=>$('#sidebar')?.classList.toggle('open'));
document.addEventListener('click',e=>{if(innerWidth<=820&&$('#sidebar')?.classList.contains('open')&&!$('#sidebar').contains(e.target)&&!$('#mobileMenu').contains(e.target))$('#sidebar').classList.remove('open');});

function timestampOf(line){
  const bracket=line.match(/\[(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\]/);if(bracket)return bracket[1];
  const iso=line.match(/\b(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\b/);return iso?iso[1]:'—';
}
function sourceOf(line){
  const m=line.match(/([\w@./-]+\.(?:json|js|ts|mcfunction|material|lang|png|tga|entity|animation|controller))(?:[:(](\d+))?/i);
  return m?m[1]+(m[2]?`:${m[2]}`:''):'—';
}
function categoryOf(line){
  const s=line.toLowerCase();
  if(/watchdog|script runtime|javascript|@minecraft|typeerror|referenceerror|syntaxerror|event handler/.test(s))return'SCRIPT';
  if(/animation|anim_controller|animation_controller|state machine|reload_start|animation state/.test(s))return'ANIMATION';
  if(/molang|unknown token|query\.|variable\.|math\./.test(s))return'MOLANG';
  if(/particle|billboard|emitter|particle_effect/.test(s))return'PARTICLE';
  if(/recipe|crafting|furnace recipe/.test(s))return'RECIPE';
  if(/block schema|block component|minecraft:block|block permutation|block definition/.test(s))return'BLOCK';
  if(/item component|minecraft:item|item definition|invalid item/.test(s))return'ITEM';
  if(/resource pack|texture|render_controller|geometry\.|material|pbr|normal map|roughness|metalness|attachable/.test(s))return'RESOURCE PACK';
  if(/weapon|gun|recoil|ads\b|ammo|chamber|attachment|projectile|laser|bipod|wall collision/.test(s))return'WEAPON';
  return'INFO';
}
function severityOf(line){
  const s=line.toLowerCase();
  if(/fatal|force[- ]?close|crash|terminated|watchdog.*(?:terminate|kill|fatal)|out of memory/.test(s))return'CRITICAL';
  if(/\berror\b|exception|failed|failure|invalid|not found|missing|unknown token|cannot|could not|schema error/.test(s))return'ERROR';
  if(/\bwarn(?:ing)?\b|deprecated|fallback|ignored/.test(s))return'WARNING';
  return'INFO';
}
function displayLevel(sev,cat){return sev!=='INFO'?sev:(cat!=='INFO'?cat:'INFO');}
function normalizeKey(line,cat){
  let s=line.toLowerCase().replace(/\[(?:\d{2}:){2}\d{2}(?:\.\d+)?\]/g,'').replace(/\b\d{4}-\d{2}-\d{2}[t ]\d{2}:\d{2}:\d{2}(?:\.\d+)?z?\b/g,'');
  s=s.replace(/0x[0-9a-f]+/gi,'<hex>').replace(/\bline\s+\d+\b/gi,'line <n>').replace(/:\d+\b/g,':<n>').replace(/\b\d+(?:\.\d+)?\s*ms\b/gi,'<ms>').replace(/\b\d{4,}\b/g,'<n>').replace(/\s+/g,' ').trim();
  return`${cat}|${s.slice(0,420)}`;
}
function likelyFix(line,cat){
  const s=line.toLowerCase();
  if(/reload_start\w*.*not found|state.*not found/.test(s))return'Transition references an animation-controller state that does not exist. Add the missing state or update the transition target to the current state name.';
  if(cat==='MOLANG'&&/unknown token|syntax/.test(s))return'Validate the Molang expression around the reported token. Check unmatched operators/brackets and confirm the query is valid in this animation context.';
  if(cat==='ANIMATION')return'Check animation/controller identifiers, state names and resource-pack references. Confirm the referenced animation exists and is namespaced correctly.';
  if(cat==='BLOCK')return'Validate the block JSON against the active Bedrock format version. Remove unsupported components and verify component placement and permutations.';
  if(cat==='ITEM')return'Check item components against the target Bedrock version. Replace deprecated/invalid components and verify identifier namespaces.';
  if(cat==='RECIPE')return'Validate recipe identifiers, ingredient/result IDs, tags and recipe format version. Confirm every referenced item exists.';
  if(cat==='PARTICLE')return'Inspect the particle definition and emitter/billboard settings. Confirm referenced particle identifiers, materials and direction modes are valid.';
  if(cat==='RESOURCE PACK')return'Confirm the referenced texture, geometry, material or attachable exists with exact casing and the correct namespace/path.';
  if(cat==='SCRIPT'&&/watchdog/.test(s))return'Reduce work performed in one tick: batch entity queries, cache repeated lookups, limit projectile/attachment loops and spread expensive work across ticks.';
  if(cat==='SCRIPT')return'Inspect the script stack/source reference. Guard undefined values, verify API availability for the target Bedrock version and isolate the failing event handler.';
  if(cat==='WEAPON')return'Inspect the weapon runtime state and referenced profile. Verify weapon ID, attachment state, ammo/chamber values, recoil/ADS profile and event ordering.';
  if(/not found|missing/.test(s))return'A referenced identifier or source file is missing. Verify exact path, namespace, casing and pack dependency order.';
  return'Inspect the first occurrence and its source file. Fix the earliest root error before secondary errors that follow it.';
}
function parsePerformance(entry){
  const s=entry.raw;
  let m=s.match(/watchdog[^\d]{0,24}(\d+(?:\.\d+)?)\s*ms/i)||s.match(/(\d+(?:\.\d+)?)\s*ms[^\n]{0,30}watchdog/i);if(m)state.performance.watchdogs.push(Number(m[1]));
  m=s.match(/(?:script\s*(?:tick|runtime)|tick time)[^\d]{0,20}(\d+(?:\.\d+)?)\s*ms/i);if(m)state.performance.scriptTicks.push(Number(m[1]));
  if(/slow event|event handler.*(?:slow|took)|handler[^\d]{0,20}\d+(?:\.\d+)?\s*ms/i.test(s))state.performance.slowEvents++;
  if(/entity quer(?:y|ies)|getentities|getplayers|dimension\.getentities/i.test(s))state.performance.entityQueries++;
  if(/projectile/i.test(s))state.performance.projectile++;
  if(/attachment|attachable/i.test(s))state.performance.attachment++;
  if(/\bads\b|aim down sight/i.test(s))state.performance.ads++;
  if(/recoil/i.test(s))state.performance.recoil++;
}
function weaponIdOf(line){const m=line.match(/(?:weapon(?:\s+id)?|gun(?:\s+id)?)\s*[:=]\s*([\w:.-]+)/i)||line.match(/\b(ag2:[\w.-]+)\b/i);return m?m[1]:null;}
function field(line,label,regex){const m=line.match(regex);return m?m[1].trim():null;}
function parseWeapon(entry){
  if(entry.category!=='WEAPON')return;
  const id=weaponIdOf(entry.raw)||'AG2_RUNTIME';let w=state.weapons.get(id);if(!w){w={id,skin:'—',attachments:new Set(),recoil:'—',adsFov:'—',handling:'—',laser:'—',bipod:'—',wallCollision:'—',ammo:'—',chamber:'—',events:[]};state.weapons.set(id,w);}
  const s=entry.raw;const skin=field(s,'skin',/skin\s*[:=]\s*([^,;\]\s]+)/i);if(skin)w.skin=skin;
  const att=field(s,'attachment',/attachment(?:s| active)?\s*[:=]\s*([^;\]]+)/i);if(att)att.split(/[,|]/).map(x=>x.trim()).filter(Boolean).forEach(x=>w.attachments.add(x));
  const recoil=field(s,'recoil',/recoil(?: profile)?\s*[:=]\s*([^,;\]]+)/i);if(recoil)w.recoil=recoil;
  const fov=field(s,'fov',/(?:ads\s*fov|fov\s*ads)\s*[:=]\s*([\d.]+)/i);if(fov)w.adsFov=fov;
  const handling=field(s,'handling',/handling\s*[:=]\s*([^,;\]]+)/i);if(handling)w.handling=handling;
  const laser=field(s,'laser',/laser\s*[:=]\s*([^,;\]]+)/i);if(laser)w.laser=laser;
  const bipod=field(s,'bipod',/bipod\s*[:=]\s*([^,;\]]+)/i);if(bipod)w.bipod=bipod;
  const wall=field(s,'wall',/wall collision\s*[:=]\s*([^,;\]]+)/i);if(wall)w.wallCollision=wall;
  const ammo=field(s,'ammo',/(?:current\s*)?ammo\s*[:=]\s*([\d/.-]+)/i);if(ammo)w.ammo=ammo;
  const chamber=field(s,'chamber',/chamber\s*[:=]\s*([^,;\]\s]+)/i);if(chamber)w.chamber=chamber;
  w.events.push(entry);
}
function makeEntry(raw,index){
  const severity=severityOf(raw),category=categoryOf(raw),level=displayLevel(severity,category),source=sourceOf(raw),time=timestampOf(raw);
  return{raw,index,severity,category,level,source,time,key:normalizeKey(raw,category)};
}
function resetAnalysis(){
  state.entries=[];state.groups=[];state.groupMap=new Map();state.categoryCounts=new Map();state.performance={watchdogs:[],scriptTicks:[],slowEvents:0,entityQueries:0,projectile:0,attachment:0,ads:0,recoil:0};state.weapons=new Map();state.activeGroup=null;
}
async function analyzeText(text,meta={}){
  resetAnalysis();
  const lines=text.replace(/\r\n?/g,'\n').split('\n').filter((l,i,a)=>l.trim()||i<a.length-1);state.file={name:meta.name||'Pasted ContentLog',size:meta.size||new Blob([text]).size,lines:lines.length};
  setParseProgress(3,'Preparing parser');
  const chunk=600;
  for(let start=0;start<lines.length;start+=chunk){
    const end=Math.min(lines.length,start+chunk);
    for(let i=start;i<end;i++){
      const raw=lines[i];if(!raw.trim())continue;const entry=makeEntry(raw,i+1);state.entries.push(entry);
      const interesting=entry.severity!=='INFO'||entry.category!=='INFO';
      if(interesting){
        let g=state.groupMap.get(entry.key);if(!g){g={key:entry.key,category:entry.category,severity:entry.severity,count:0,source:entry.source,message:entry.raw,firstLine:entry.index,lastLine:entry.index,entries:[],fix:likelyFix(entry.raw,entry.category)};state.groupMap.set(entry.key,g);}
        g.count++;g.lastLine=entry.index;if(g.entries.length<80)g.entries.push(entry);
      }
      state.categoryCounts.set(entry.category,(state.categoryCounts.get(entry.category)||0)+1);parsePerformance(entry);parseWeapon(entry);
    }
    setParseProgress(8+84*(end/Math.max(1,lines.length)),`Parsing ${end.toLocaleString()} / ${lines.length.toLocaleString()} lines`);
    await new Promise(r=>setTimeout(r,0));
  }
  state.groups=[...state.groupMap.values()].sort((a,b)=>severityRank(b.severity)-severityRank(a.severity)||b.count-a.count);
  setParseProgress(96,'Building diagnostics');await new Promise(r=>setTimeout(r,60));
  renderAll();setParseProgress(100,'Analysis complete');
  setTimeout(()=>setView('overview'),260);
}
function severityRank(s){return s==='CRITICAL'?4:s==='ERROR'?3:s==='WARNING'?2:1;}

function counts(){
  const c={critical:0,error:0,warning:0};for(const e of state.entries){if(e.severity==='CRITICAL')c.critical++;else if(e.severity==='ERROR')c.error++;else if(e.severity==='WARNING')c.warning++;}return c;
}
function renderMetrics(){const c=counts();$('#mCritical').textContent=c.critical;$('#mError').textContent=c.error;$('#mWarning').textContent=c.warning;$('#mWatchdog').textContent=state.performance.watchdogs.length;$('#mGroups').textContent=state.groups.length;$('#mLines').textContent=state.file.lines||0;$('#currentErrors').textContent=c.critical+c.error;}
function renderHealth(){
  const wrap=$('#healthList');if(!wrap)return;wrap.innerHTML='';
  const total=state.entries.length;$('#healthLabel').textContent=total?'ANALYZED':'NO DATA';
  subsystemDefs.forEach(([name,cats])=>{const n=state.groups.filter(g=>cats.includes(g.category)).reduce((a,g)=>a+g.count,0);const bad=state.groups.some(g=>cats.includes(g.category)&&g.severity==='CRITICAL');const cls=bad?'bad':n?'warn':'ok';const row=document.createElement('div');row.className='health-row';row.innerHTML=`<i class="health-dot ${cls}"></i><div><strong>${escapeHTML(name)}</strong><small>${n?n+' related log events':'No detected faults'}</small></div><b class="health-value">${n}</b>`;wrap.appendChild(row);});
}
function renderTopFaults(){const wrap=$('#topFaults');if(!wrap)return;if(!state.groups.length){wrap.innerHTML='<div class="empty">Upload a ContentLog to populate diagnostics.</div>';return;}wrap.innerHTML='';state.groups.slice(0,7).forEach(g=>{const row=document.createElement('div');row.className='fault-row';row.innerHTML=`<div><strong>${escapeHTML(g.category)}</strong><small>${escapeHTML(g.source==='—'?g.message.slice(0,64):g.source)}</small></div><b class="fault-count ${g.severity==='CRITICAL'||g.severity==='ERROR'?'bad':''}">${g.count}×</b>`;row.addEventListener('click',()=>{state.activeGroup=g;setView('inspector');renderInspector();});wrap.appendChild(row);});}
function renderFilters(){const wrap=$('#consoleFilters');if(!wrap)return;wrap.innerHTML='';channelOrder.forEach(ch=>{const count=ch==='ALL'?state.entries.length:state.entries.filter(e=>e.level===ch||e.category===ch||e.severity===ch).length;if(ch!=='ALL'&&!count)return;const b=document.createElement('button');b.className='filter-chip'+(state.activeFilter===ch?' active':'');b.textContent=`${ch} · ${count}`;b.addEventListener('click',()=>{state.activeFilter=ch;renderFilters();renderConsole();});wrap.appendChild(b);});}
function filteredEntries(){const q=($('#consoleSearch')?.value||'').trim().toLowerCase();return state.entries.filter(e=>(state.activeFilter==='ALL'||e.level===state.activeFilter||e.category===state.activeFilter||e.severity===state.activeFilter)&&(!q||e.raw.toLowerCase().includes(q)||e.source.toLowerCase().includes(q)||e.category.toLowerCase().includes(q)));}
function renderConsole(){const wrap=$('#consoleList');if(!wrap)return;const entries=filteredEntries();$('#consoleCount').textContent=`${entries.length.toLocaleString()} lines`;if(!entries.length){wrap.innerHTML='<div class="empty">No matching log entries.</div>';return;}wrap.innerHTML='';const frag=document.createDocumentFragment();entries.slice(-1500).forEach(e=>{const row=document.createElement('div');row.className='log-row';row.innerHTML=`<span class="log-time">${escapeHTML(e.time)}</span><b class="log-level level-${escapeHTML(e.level)}">${escapeHTML(e.level)}</b><span class="log-category">${escapeHTML(e.category)}</span><span class="log-message">${escapeHTML(e.raw)}</span><span class="log-file">${escapeHTML(e.source)}</span>`;frag.appendChild(row);});wrap.appendChild(frag);}
$('#consoleSearch')?.addEventListener('input',renderConsole);$('#clearConsole')?.addEventListener('click',()=>{state.activeFilter='ALL';if($('#consoleSearch'))$('#consoleSearch').value='';renderFilters();renderConsole();});

function crashCandidate(){
  const crit=state.entries.filter(e=>e.severity==='CRITICAL');if(crit.length)return crit[crit.length-1];
  const errs=state.entries.filter(e=>e.severity==='ERROR');return errs.length?errs[errs.length-1]:null;
}
function renderCrash(){
  const c=crashCandidate();const signals=$('#crashSignals'),timeline=$('#crashTimeline');
  if(!c){$('#crashTitle').textContent='No critical event detected';$('#crashTime').textContent='—';$('#crashMessage').textContent='Upload a ContentLog. The analyzer will identify the final error sequence, likely subsystem and repeated fault groups.';$('#crashCause').textContent='—';signals.innerHTML='';timeline.innerHTML='<div class="empty">No crash timeline available.</div>';return;}
  $('#crashTitle').textContent=`${c.category} · ${c.severity}`;$('#crashTime').textContent=c.time;$('#crashMessage').textContent=c.raw;$('#crashCause').textContent=likelyFix(c.raw,c.category);
  const same=state.groups.find(g=>g.key===c.key);const values=[['Subsystem',c.category],['Source',c.source],['Repeated',same?.count||1],['Watchdog spikes',state.performance.watchdogs.length],['Last line',c.index]];signals.innerHTML=values.map(([k,v])=>`<div class="kv-row"><span>${escapeHTML(k)}</span><strong>${escapeHTML(v)}</strong></div>`).join('');
  const from=Math.max(0,state.entries.findIndex(e=>e===c)-12),list=state.entries.slice(from,from+13);timeline.innerHTML=list.map(e=>`<div class="timeline-row"><time>${escapeHTML(e.time)}</time><b class="level-${escapeHTML(e.level)}">${escapeHTML(e.level)}</b><p>${escapeHTML(e.raw)}</p></div>`).join('');
}
function renderPerformance(){
  const p=state.performance;$('#pTick').textContent=p.scriptTicks.length?avg(p.scriptTicks).toFixed(1):'—';$('#pPeak').textContent=p.watchdogs.length?Math.max(...p.watchdogs).toFixed(0):'—';$('#pSlow').textContent=p.slowEvents;$('#pEntity').textContent=p.entityQueries;
  const chart=$('#watchdogChart');if(!p.watchdogs.length){chart.innerHTML='<div class="empty">No timing samples found.</div>';}else{const vals=p.watchdogs.slice(-30),max=Math.max(...vals,1);chart.innerHTML=vals.map(v=>`<i class="bar-item" style="--h:${Math.max(3,(v/max)*210)}px" data-value="${v.toFixed(1)} ms"></i>`).join('');}
  const proc=[['Projectile processing',p.projectile],['Attachment processing',p.attachment],['ADS processing',p.ads],['Recoil processing',p.recoil],['Entity queries',p.entityQueries],['Slow handlers',p.slowEvents]];$('#processList').innerHTML=proc.map(([k,v])=>`<div class="process-row"><div><strong>${escapeHTML(k)}</strong><small>matching runtime entries</small></div><b class="process-count">${v}</b></div>`).join('');
}
function renderWeaponSelect(){const sel=$('#weaponSelect');if(!sel)return;const current=sel.value;sel.innerHTML='<option value="">Detected weapons</option>'+[...state.weapons.keys()].map(k=>`<option value="${escapeHTML(k)}">${escapeHTML(k)}</option>`).join('');if(current&&state.weapons.has(current))sel.value=current;else if(state.weapons.size){sel.value=[...state.weapons.keys()][0];}renderWeapon();}
function renderWeapon(){
  const id=$('#weaponSelect')?.value||[...state.weapons.keys()][0],w=id?state.weapons.get(id):null;const kv=$('#weaponKv'),tl=$('#weaponTimeline');
  if(!w){$('#wId').textContent='NO WEAPON DATA';$('#wSkin').textContent='Skin: —';kv.innerHTML='<div class="empty">Weapon fields will appear when AG2 runtime logs contain weapon telemetry.</div>';tl.innerHTML='<div class="empty">No weapon runtime lines detected.</div>';return;}
  $('#wId').textContent=w.id;$('#wSkin').textContent=`Skin: ${w.skin}`;const fields=[['Skin',w.skin],['Attachments',w.attachments.size?[...w.attachments].join(', '):'—'],['Recoil profile',w.recoil],['ADS FOV',w.adsFov],['Handling',w.handling],['Laser',w.laser],['Bipod',w.bipod],['Wall collision',w.wallCollision],['Ammo',w.ammo],['Chamber',w.chamber]];kv.innerHTML=fields.map(([k,v])=>`<div class="kv-row"><span>${escapeHTML(k)}</span><strong>${escapeHTML(v)}</strong></div>`).join('');tl.innerHTML=w.events.slice(-80).map(e=>`<div class="timeline-row"><time>${escapeHTML(e.time)}</time><b class="level-${escapeHTML(e.level)}">${escapeHTML(e.level)}</b><p>${escapeHTML(e.raw)}</p></div>`).join('')||'<div class="empty">No weapon events.</div>';
}
$('#weaponSelect')?.addEventListener('change',renderWeapon);

function categoryLabel(g){return `${g.category} · ${g.severity}`;}
function renderInspector(){
  const q=($('#groupSearch')?.value||'').trim().toLowerCase();const list=$('#categoryList');const groups=state.groups.filter(g=>!q||g.category.toLowerCase().includes(q)||g.source.toLowerCase().includes(q)||g.message.toLowerCase().includes(q));
  if(!groups.length){list.innerHTML='<div class="empty">No diagnostics loaded.</div>';$('#detailTitle').textContent='Select an error group';$('#detailCount').textContent='0×';$('#detailBody').innerHTML='<div class="empty">Choose a category to inspect source lines and likely fixes.</div>';return;}
  if(!state.activeGroup||!groups.includes(state.activeGroup))state.activeGroup=groups[0];list.innerHTML='';groups.slice(0,500).forEach(g=>{const b=document.createElement('button');b.className='category-item'+(g===state.activeGroup?' active':'');b.innerHTML=`<div><span>${escapeHTML(categoryLabel(g))}</span><small>${escapeHTML(g.source==='—'?g.message:g.source)}</small></div><b>${g.count}</b>`;b.addEventListener('click',()=>{state.activeGroup=g;renderInspector();});list.appendChild(b);});
  const g=state.activeGroup;$('#detailTitle').textContent=categoryLabel(g);$('#detailCount').textContent=`${g.count}×`;$('#detailBody').innerHTML=`<div class="detail-summary"><div><span>SOURCE</span><strong>${escapeHTML(g.source)}</strong></div><div><span>FIRST LINE</span><strong>${g.firstLine}</strong></div><div><span>LAST LINE</span><strong>${g.lastLine}</strong></div></div><div class="fix-card"><span>LIKELY FIX</span><p>${escapeHTML(g.fix)}</p></div><div class="source-lines">${g.entries.slice(0,60).map(e=>`<div class="source-line">#${e.index} · ${escapeHTML(e.raw)}</div>`).join('')}</div>`;
}
$('#groupSearch')?.addEventListener('input',renderInspector);

function builds(){try{return JSON.parse(localStorage.getItem(BUILD_KEY)||'[]')}catch{return[]}}
function saveBuilds(list){localStorage.setItem(BUILD_KEY,JSON.stringify(list.slice(-20)));}
function snapshot(name){const c=counts();return{name,createdAt:nowStamp(),errors:c.critical+c.error,warnings:c.warning,groups:state.groups.map(g=>g.key),groupMeta:state.groups.map(g=>({key:g.key,category:g.category,severity:g.severity,count:g.count,source:g.source}))};}
function renderBuilds(){
  const list=builds(),select=$('#compareBuild'),history=$('#buildHistory');const currentName=($('#buildName')?.value||'').trim()||'UNASSIGNED';$('#currentBuildName').textContent=currentName;$('#activeBuild').textContent=currentName;
  select.innerHTML='<option value="">Select saved build</option>'+list.map((b,i)=>`<option value="${i}">${escapeHTML(b.name)} · ${new Date(b.createdAt).toLocaleDateString()}</option>`).join('');
  history.innerHTML=list.length?list.slice().reverse().map(b=>`<div class="build-row"><div><strong>${escapeHTML(b.name)}</strong><small>${new Date(b.createdAt).toLocaleString()}</small></div><b>${b.errors} errors</b></div>`).join(''):'<div class="empty">No saved snapshots.</div>';renderComparison();
}
function renderComparison(){
  const list=builds(),idx=$('#compareBuild')?.value,base=idx!==''?list[Number(idx)]:null,curr=snapshot((($('#buildName')?.value||'').trim()||'UNASSIGNED'));$('#baseBuildName').textContent=base?.name||'—';$('#baseErrors').textContent=base?.errors||0;$('#currentBuildName').textContent=curr.name;$('#currentErrors').textContent=curr.errors;
  if(!base){$('#fixedCount').textContent=0;$('#regressionCount').textContent=0;$('#netChange').textContent=curr.errors;return;}
  const old=new Set(base.groups||[]),now=new Set(curr.groups||[]);let fixed=0,newReg=0;old.forEach(k=>{if(!now.has(k))fixed++});now.forEach(k=>{if(!old.has(k))newReg++});$('#fixedCount').textContent=fixed;$('#regressionCount').textContent=newReg;const delta=curr.errors-base.errors;$('#netChange').textContent=(delta>0?'+':'')+delta;
}
$('#saveBuildBtn')?.addEventListener('click',()=>{const name=($('#buildName')?.value||'').trim();if(!name){$('#buildName').focus();return;}const list=builds();list.push(snapshot(name));saveBuilds(list);renderBuilds();});
$('#compareBuild')?.addEventListener('change',renderComparison);$('#buildName')?.addEventListener('input',()=>{const n=$('#buildName').value.trim()||'UNASSIGNED';$('#activeBuild').textContent=n;renderComparison();});$('#clearBuilds')?.addEventListener('click',()=>{localStorage.removeItem(BUILD_KEY);renderBuilds();});

function setParseProgress(value,status){const v=Math.max(0,Math.min(100,value));$('#parseBar').style.transform=`scaleX(${v/100})`;$('#parsePercent').textContent=`${Math.round(v)}%`;$('#parseStatusTitle').textContent=status;}
function updateFileMeta(){const spans=$$('#parseMeta span');if(spans[0])spans[0].textContent=`Filename: ${state.file.name}`;if(spans[1])spans[1].textContent=`Size: ${formatBytes(state.file.size)}`;if(spans[2])spans[2].textContent=`Lines: ${state.file.lines.toLocaleString()}`;}
async function readFile(file){if(!file)return;setParseProgress(1,'Reading file');try{const text=await file.text();state.file={name:file.name,size:file.size,lines:0};updateFileMeta();await analyzeText(text,{name:file.name,size:file.size});}catch(err){console.error(err);setParseProgress(0,'Could not read file');}}
const drop=$('#dropZone'),fileInput=$('#fileInput');fileInput?.addEventListener('change',()=>readFile(fileInput.files?.[0]));['dragenter','dragover'].forEach(ev=>drop?.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop?.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));drop?.addEventListener('drop',e=>readFile(e.dataTransfer?.files?.[0]));$('#parsePaste')?.addEventListener('click',()=>{const text=$('#logPaste').value;if(text.trim())analyzeText(text,{name:'Pasted ContentLog',size:new Blob([text]).size});});

function renderAll(){if(appShell?.hidden)return;renderMetrics();renderHealth();renderTopFaults();renderFilters();renderConsole();renderCrash();renderPerformance();renderWeaponSelect();renderInspector();renderBuilds();updateFileMeta();}
renderAll();
})();