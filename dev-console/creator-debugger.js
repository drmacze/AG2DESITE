(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString();
const fmtMs=n=>n>=1000?`${(n/1000).toFixed(2)} s`:`${Number(n||0).toFixed(n>=10?0:2)} ms`;
const cfg=window.AG2_RUNTIME_CONFIG||{backend:{enabled:false,provider:'none'}};
const storeKey='ag2.creator.sessions.v1';
const state={artifacts:[],profile:null,diagnostics:null,contentLog:null};

function safeGet(){try{return JSON.parse(localStorage.getItem(storeKey)||'[]')}catch{return[]}}
function safeSet(v){try{localStorage.setItem(storeKey,JSON.stringify(v.slice(0,12)))}catch{}}
function copyText(text){return navigator.clipboard?.writeText(text).catch(()=>fallbackCopy(text))||Promise.resolve(fallbackCopy(text))}
function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
function download(name,content,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0)}

function launchConfig(){return JSON.stringify({version:'0.3.0',configurations:[{type:'minecraft-js',request:'attach',name:'Debug AG2 with Minecraft',mode:'connect',targetModuleUuid:$('#moduleUuid').value.trim(),localRoot:$('#localRoot').value.trim()||'${workspaceFolder}/',port:Number($('#debugPort').value)||19144}]},null,2)}
function debuggerCommand(){const host=$('#debugHost').value.trim();const port=Number($('#debugPort').value)||19144;return host&&host!=='127.0.0.1'?`/script debugger connect ${host} ${port}`:'/script debugger connect'}
function renderConnection(){const commands=[['Connect Minecraft',debuggerCommand()],['Close debugger','/script debugger close'],['Reload scripts','/reload']];$('#commandStack').innerHTML=commands.map(([n,c])=>`<div class="command-line"><div><small>${esc(n)}</small><br><code>${esc(c)}</code></div><button data-copy="${esc(c)}">Copy</button></div>`).join('');$('#launchPreview').textContent=launchConfig();renderCreatorCommands();bindCopyButtons()}
['moduleUuid','debugHost','debugPort','localRoot'].forEach(id=>$('#'+id)?.addEventListener('input',renderConnection));
$('#downloadLaunch')?.addEventListener('click',()=>download('launch.json',launchConfig()));
$('#copyLaunch')?.addEventListener('click',()=>copyText(launchConfig()));

const creatorCommands=[
 ['Profiler start','/script profiler start','Begin CPU profiling.'],
 ['Profiler stop','/script profiler stop','Stop and generate a .cpuprofile artifact.'],
 ['Diagnostics start','/script diagnostics startcapture','Begin comprehensive diagnostics capture.'],
 ['Diagnostics stop','/script diagnostics stopcapture','Stop diagnostics capture.'],
 ['Debugger connect',()=>debuggerCommand(),'Connect Minecraft client to VS Code listener.'],
 ['Debugger close','/script debugger close','Close the active debugger connection.'],
 ['Reload','/reload','Reload behavior/resource scripts after connection.']
];
function renderCreatorCommands(){const el=$('#creatorCommands');el.innerHTML=creatorCommands.map(([n,c,d])=>{const cmd=typeof c==='function'?c():c;return`<div class="command-card"><strong>${esc(n)}</strong><small>${esc(d)}</small><code>${esc(cmd)}</code><button data-copy="${esc(cmd)}">Copy</button></div>`}).join('');bindCopyButtons()}
function bindCopyButtons(){document.querySelectorAll('[data-copy]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',async()=>{await copyText(b.dataset.copy);const old=b.textContent;b.textContent='Copied';setTimeout(()=>b.textContent=old,900)})})}

function renderReadiness(){const items=[
 ['ContentLog analyzer',true,'Existing AG2 console parses ContentLog locally.'],
 ['Profiler analyzer',true,'.cpuprofile import and hot-path ranking are enabled.'],
 ['Diagnostics analyzer',true,'Text/JSON captures can be summarized locally.'],
 ['VS Code launch config',true,'AG2 module UUID and port 19144 are preconfigured.'],
 ['Direct GitHub Pages debugger socket',false,'Not possible by browser/GitHub Pages design. Use VS Code as the debugger endpoint.'],
 ['Dedicated Server dependency',true,'Not required for Minecraft client debugging.']
];
$('#readinessGrid').innerHTML=items.map(([n,ok,d])=>`<article class="ready-card ${ok?'':'warn'}"><i></i><div><strong>${esc(n)}</strong><p>${esc(d)}</p></div></article>`).join('');
const browserOk=!!(window.FileReader&&window.crypto&&window.Blob);const score=browserOk?92:76;$('#readinessScore').textContent=score+'%';$('#readinessCopy').textContent=browserOk?'Local artifact tooling is available. Direct breakpoints still require VS Code.':'Some browser file APIs are unavailable.';
}

function classify(file,text){const n=file.name.toLowerCase();if(n.endsWith('.cpuprofile'))return'cpuprofile';if(n.includes('contentlog')||/^\d{1,2}:\d{2}:\d{2}\[/.test(text.trim())||/\[(?:Scripting|Animation|Molang|UI|Blocks?)\]/i.test(text))return'contentlog';if(n.endsWith('.json')){try{const j=JSON.parse(text);if(j.nodes&&j.samples)return'cpuprofile';return'diagnostics-json'}catch{return'unknown'}}if(/diagnostic|watchdog|memory|heap|script/i.test(text))return'diagnostics-text';return'unknown'}

function parseContentLog(text){const lines=text.replace(/\r/g,'').split('\n');const out={lines:lines.length,error:0,warning:0,watchdog:0,molang:0,animation:0,ui:0,lastErrors:[]};for(const line of lines){if(/\[error\]|\berror\b/i.test(line)){out.error++;if(out.lastErrors.length>=12)out.lastErrors.shift();out.lastErrors.push(line.trim())}if(/\[warning\]|\bwarning\b/i.test(line))out.warning++;if(/watchdog/i.test(line))out.watchdog++;if(/\[Molang\]/i.test(line))out.molang++;if(/\[Animation\]/i.test(line))out.animation++;if(/\[UI\]/i.test(line))out.ui++}return out}

function parseCpuProfile(text){const p=JSON.parse(text);if(!Array.isArray(p.nodes)||!Array.isArray(p.samples))throw new Error('Not a Chrome/V8 CPU profile');const byId=new Map(p.nodes.map(n=>[n.id,n]));const self=new Map();let totalUs=0;const deltas=Array.isArray(p.timeDeltas)?p.timeDeltas:[];for(let i=0;i<p.samples.length;i++){const id=p.samples[i],dt=Number(deltas[i]||0);totalUs+=dt;self.set(id,(self.get(id)||0)+dt)}const rows=[...self.entries()].map(([id,us])=>{const node=byId.get(id)||{};const cf=node.callFrame||{};return{id,name:cf.functionName||'(anonymous)',url:cf.url||'',line:(cf.lineNumber??-1)+1,selfUs:us,share:totalUs?us/totalUs*100:0}}).sort((a,b)=>b.selfUs-a.selfUs);return{durationMs:totalUs/1000,samples:p.samples.length,nodes:p.nodes.length,rows:rows.slice(0,30)}}

function flattenObject(obj,prefix='',out=[]){if(out.length>160)return out;if(obj===null||typeof obj!=='object'){out.push([prefix||'value',String(obj)]);return out}if(Array.isArray(obj)){out.push([prefix||'array',`Array(${obj.length})`]);obj.slice(0,24).forEach((v,i)=>flattenObject(v,`${prefix}[${i}]`,out));return out}Object.entries(obj).slice(0,100).forEach(([k,v])=>flattenObject(v,prefix?`${prefix}.${k}`:k,out));return out}
function parseDiagnostics(text,isJson){if(isJson){const obj=JSON.parse(text);const flat=flattenObject(obj);const signals=flat.filter(([k,v])=>/watchdog|memory|heap|script|tick|error|warning|entity|event|duration|time/i.test(k+' '+v)).slice(0,40);return{kind:'json',signals,total:flat.length}}
const lines=text.replace(/\r/g,'').split('\n').filter(Boolean);const counts={errors:0,warnings:0,watchdogs:0,memory:0,script:0};const signals=[];for(const line of lines){if(/error/i.test(line))counts.errors++;if(/warn/i.test(line))counts.warnings++;if(/watchdog/i.test(line))counts.watchdogs++;if(/memory|heap|allocation/i.test(line))counts.memory++;if(/script|tick|event handler|runtime/i.test(line))counts.script++;if(/watchdog|memory|heap|error|warning|script.*(?:ms|time|slow)|tick.*ms/i.test(line)&&signals.length<60)signals.push(['line',line.trim()])}return{kind:'text',signals,counts,total:lines.length}}

async function loadFiles(files){for(const file of files){try{const text=await file.text();const type=classify(file,text);let summary={};if(type==='cpuprofile'){state.profile=parseCpuProfile(text);summary={durationMs:state.profile.durationMs,samples:state.profile.samples,nodes:state.profile.nodes}}else if(type==='contentlog'){state.contentLog=parseContentLog(text);summary=state.contentLog}else if(type==='diagnostics-json'||type==='diagnostics-text'){state.diagnostics=parseDiagnostics(text,type==='diagnostics-json');summary={signals:state.diagnostics.signals.length,total:state.diagnostics.total}}else summary={note:'Unrecognized artifact'};state.artifacts.push({name:file.name,size:file.size,type,loadedAt:new Date().toISOString(),summary})}catch(err){state.artifacts.push({name:file.name,size:file.size,type:'error',loadedAt:new Date().toISOString(),summary:{error:String(err.message||err)}})}}renderArtifacts();renderSession();saveSessionSnapshot()}

function renderArtifacts(){const el=$('#artifactList');if(!state.artifacts.length){el.innerHTML='<div class="empty">No artifacts loaded.</div>';return}el.innerHTML=state.artifacts.map(a=>`<div class="artifact-item"><div><strong>${esc(a.name)}</strong><br><small>${esc(a.type)} · ${(a.size/1024).toFixed(1)} KB</small></div><span class="status ${a.type==='error'?'warn':'good'}">${a.type==='error'?'ERROR':'LOADED'}</span></div>`).join('')}
function renderProfile(){const p=state.profile;if(!p){$('#profileMeta').textContent='No profile';$('#profileTable').innerHTML='<div class="empty">Import a .cpuprofile produced by /script profiler stop.</div>';return}$('#profileMeta').textContent=`${fmtMs(p.durationMs)} · ${fmt(p.samples)} samples`;$('#profileTable').innerHTML='<div class="table-row head"><span>Function</span><span>Self time</span><span>Share</span></div>'+p.rows.slice(0,18).map(r=>`<div class="table-row"><code>${esc(r.name)}${r.url?` · ${esc(r.url.split('/').pop())}:${r.line}`:''}</code><strong>${fmtMs(r.selfUs/1000)}</strong><span>${r.share.toFixed(1)}%</span></div>`).join('')}
function renderDiagnostics(){const d=state.diagnostics;if(!d){$('#diagMeta').textContent='No capture';$('#diagTable').innerHTML='<div class="empty">Import diagnostics output from /script diagnostics stopcapture.</div>';return}$('#diagMeta').textContent=`${d.kind.toUpperCase()} · ${fmt(d.total)} records`;$('#diagTable').innerHTML='<div class="table-row head"><span>Signal</span><span>Value</span><span></span></div>'+d.signals.slice(0,20).map(([k,v])=>`<div class="table-row"><code>${esc(k)}</code><strong>${esc(String(v).slice(0,180))}</strong><span></span></div>`).join('')}
function renderSession(){renderProfile();renderDiagnostics();const c=state.contentLog,p=state.profile,d=state.diagnostics;$('#sessionTitle').textContent=state.artifacts.length?`${state.artifacts.length} artifact${state.artifacts.length===1?'':'s'} analyzed`:'No artifacts loaded';const metrics=[['Artifacts',state.artifacts.length],['Log errors',c?.error||0],['Watchdogs',c?.watchdog||0],['CPU duration',p?fmtMs(p.durationMs):'—'],['CPU samples',p?fmt(p.samples):'—'],['Diag signals',d?d.signals.length:0],['Molang',c?.molang||0],['UI errors',c?.ui||0]];$('#sessionMetrics').innerHTML=metrics.map(([k,v])=>`<div class="metric"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');const notes=[];if(c?.watchdog)notes.push(`ContentLog contains ${c.watchdog} watchdog references.`);if(c?.ui>100)notes.push(`High repeating UI error volume detected (${c.ui}).`);if(c?.molang>100)notes.push(`High Molang error volume detected (${c.molang}).`);if(p?.rows?.[0])notes.push(`Top CPU self-time: ${p.rows[0].name} (${p.rows[0].share.toFixed(1)}%).`);if(!notes.length&&state.artifacts.length)notes.push('No high-level risk rule triggered by the imported artifacts.');$('#sessionNotes').innerHTML=notes.map(n=>`<div class="note">${esc(n)}</div>`).join('')}

function snapshot(){return{createdAt:new Date().toISOString(),artifacts:state.artifacts.map(a=>({name:a.name,size:a.size,type:a.type,summary:a.summary})),contentLog:state.contentLog,profile:state.profile?{durationMs:state.profile.durationMs,samples:state.profile.samples,nodes:state.profile.nodes,top:state.profile.rows.slice(0,10)}:null,diagnostics:state.diagnostics?{kind:state.diagnostics.kind,total:state.diagnostics.total,signals:state.diagnostics.signals.slice(0,15)}:null}}
function saveSessionSnapshot(){if(!state.artifacts.length)return;const history=safeGet();history.unshift(snapshot());safeSet(history);renderHistory()}
function renderHistory(){const h=safeGet();const el=$('#historyList');if(!h.length){el.innerHTML='<div class="empty">No local sessions saved yet.</div>';return}el.innerHTML=h.slice(0,8).map(s=>`<div class="history-item"><strong>${new Date(s.createdAt).toLocaleString()}</strong><br><small>${s.artifacts.length} artifact(s) · ${s.contentLog?.error||0} log errors · ${s.profile?fmtMs(s.profile.durationMs):'no CPU profile'}</small></div>`).join('')}
$('#clearHistory')?.addEventListener('click',()=>{localStorage.removeItem(storeKey);renderHistory()});
$('#exportSession')?.addEventListener('click',()=>download(`ag2-debug-session-${Date.now()}.json`,JSON.stringify(snapshot(),null,2)));

const input=$('#artifactInput'),drop=$('#artifactDrop');input?.addEventListener('change',()=>loadFiles([...input.files]));['dragenter','dragover'].forEach(t=>drop?.addEventListener(t,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(t=>drop?.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('drag')}));drop?.addEventListener('drop',e=>loadFiles([...e.dataTransfer.files]));

function renderBackend(){const b=cfg.backend||{};const enabled=!!(b.enabled&&b.url&&b.publishableKey);$('#backendState').textContent=enabled?'BACKEND READY':'LOCAL MODE';$('#syncBadge').textContent=enabled?'CONFIGURED':'DISABLED';$('#syncBadge').className='status '+(enabled?'good':'warn');$('#backendInfo').innerHTML=[['Provider',enabled?(b.provider||'supabase'):'Local only'],['Endpoint',enabled?b.url:'Not configured'],['Remote writes',enabled?'Requires authenticated user token':'Off by default'],['Service role key','Never exposed in browser']].map(([k,v])=>`<div class="kv-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}

renderReadiness();renderConnection();renderCreatorCommands();renderArtifacts();renderSession();renderHistory();renderBackend();
})();
