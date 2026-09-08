(()=>{
'use strict';
const cfg=window.AG2_RUNTIME_CONFIG?.backend||{};
if(!cfg.enabled||cfg.provider!=='supabase'||!cfg.url||!cfg.publishableKey)return;

const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const AUTH_KEY='ag2.supabase.auth.v1';
const LOCAL_SESSIONS_KEY='ag2.creator.sessions.v1';
const META_KEY='ag2.creator.remote.meta.v1';
const fn=cfg.ingestFunction||'debug-ingest';
let auth=readJson(AUTH_KEY,null);
let currentUser=auth?.user||null;
let busy=false;

const link=document.createElement('link');
link.rel='stylesheet';
link.href='backend-sync.css?v=1';
document.head.appendChild(link);

function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function removeKey(key){try{localStorage.removeItem(key)}catch{}}
function latestSnapshot(){const rows=readJson(LOCAL_SESSIONS_KEY,[]);return Array.isArray(rows)&&rows.length?rows[0]:null}
function endpoint(path){return cfg.url.replace(/\/$/,'')+path}
function baseHeaders(extra={}){return{'apikey':cfg.publishableKey,'Content-Type':'application/json',...extra}}
function authHeaders(extra={}){return baseHeaders({'Authorization':`Bearer ${auth?.access_token||''}`,...extra})}
function setStatus(text,tone=''){const el=$('#remoteStatus');if(!el)return;el.textContent=text;el.className='backend-status '+tone}
function setBusy(on){busy=on;document.querySelectorAll('[data-backend-action]').forEach(b=>b.disabled=on)}
function saveAuth(data){
  const expiresIn=Number(data.expires_in||3600);
  auth={
    access_token:data.access_token,
    refresh_token:data.refresh_token,
    expires_at:Date.now()+Math.max(60,expiresIn-45)*1000,
    user:data.user||currentUser||null
  };
  currentUser=auth.user;
  writeJson(AUTH_KEY,auth);
}
function clearAuth(){auth=null;currentUser=null;removeKey(AUTH_KEY)}

async function api(path,options={}){
  const res=await fetch(endpoint(path),options);
  const text=await res.text();
  let data=null;
  try{data=text?JSON.parse(text):null}catch{data=text}
  if(!res.ok){const msg=(data&&typeof data==='object'&&(data.msg||data.message||data.error_description||data.error))||String(data||`HTTP ${res.status}`);throw new Error(msg)}
  return data;
}

async function refreshSession(force=false){
  if(!auth?.refresh_token)return false;
  if(!force&&auth.access_token&&Date.now()<(auth.expires_at||0))return true;
  try{
    const data=await api('/auth/v1/token?grant_type=refresh_token',{
      method:'POST',headers:baseHeaders(),body:JSON.stringify({refresh_token:auth.refresh_token})
    });
    saveAuth(data);return true;
  }catch(err){clearAuth();renderAuth();setStatus(`Session expired: ${err.message}`,'bad');return false}
}

async function signIn(){
  if(busy)return;
  const email=$('#backendEmail')?.value.trim();
  const password=$('#backendPassword')?.value||'';
  if(!email||!password){setStatus('Email and password are required.','bad');return}
  setBusy(true);setStatus('Signing in…','work');
  try{
    const data=await api('/auth/v1/token?grant_type=password',{
      method:'POST',headers:baseHeaders(),body:JSON.stringify({email,password})
    });
    saveAuth(data);if($('#backendPassword'))$('#backendPassword').value='';
    renderAuth();setStatus('Authenticated. Production sync is ready.','good');await loadRemoteHistory();
  }catch(err){setStatus(`Sign in failed: ${err.message}`,'bad')}finally{setBusy(false)}
}

async function signUp(){
  if(busy)return;
  const email=$('#backendEmail')?.value.trim();
  const password=$('#backendPassword')?.value||'';
  if(!email||password.length<6){setStatus('Enter an email and a password of at least 6 characters.','bad');return}
  setBusy(true);setStatus('Creating account…','work');
  try{
    const data=await api('/auth/v1/signup',{
      method:'POST',headers:baseHeaders(),body:JSON.stringify({email,password})
    });
    if(data?.access_token){saveAuth(data);if($('#backendPassword'))$('#backendPassword').value='';renderAuth();setStatus('Account created and signed in.','good');await loadRemoteHistory()}
    else{setStatus('Account created. Check your email if confirmation is required, then sign in.','good')}
  }catch(err){setStatus(`Account creation failed: ${err.message}`,'bad')}finally{setBusy(false)}
}

async function signOut(){
  if(busy)return;
  setBusy(true);
  try{if(auth?.access_token)await fetch(endpoint('/auth/v1/logout'),{method:'POST',headers:authHeaders()})}catch{}
  clearAuth();renderAuth();renderRemoteHistory([]);setStatus('Signed out. Local analysis remains available.','');setBusy(false)
}

function meta(){
  const saved=readJson(META_KEY,{});
  return{
    build:$('#syncBuild')?.value.trim()||saved.build||'',
    device:$('#syncDevice')?.value.trim()||saved.device||'',
    minecraft_version:$('#syncMinecraft')?.value.trim()||saved.minecraft_version||''
  };
}
function persistMeta(){const m=meta();writeJson(META_KEY,m);return m}

async function syncCurrent(){
  if(busy)return;
  if(!(await refreshSession())){setStatus('Sign in before syncing.','bad');renderAuth();return}
  const snap=latestSnapshot();
  if(!snap){setStatus('Analyze at least one ContentLog/profiler/diagnostics artifact first.','bad');return}
  const m=persistMeta();
  const payload={
    build:m.build||null,
    device:m.device||navigator.userAgent.slice(0,120),
    minecraft_version:m.minecraft_version||null,
    artifact_summary:snap.artifacts||[],
    contentlog_summary:snap.contentLog||null,
    profile_summary:snap.profile||null,
    diagnostics_summary:snap.diagnostics||null
  };
  setBusy(true);setStatus('Syncing summarized diagnostics to production…','work');
  try{
    const data=await api(`/functions/v1/${encodeURIComponent(fn)}`,{
      method:'POST',headers:authHeaders(),body:JSON.stringify(payload)
    });
    setStatus(`Synced successfully${data?.id?` · ${data.id.slice(0,8)}`:''}.`,'good');
    await loadRemoteHistory();
  }catch(err){
    if(/jwt|token|unauthorized/i.test(err.message||'')){await refreshSession(true)}
    setStatus(`Sync failed: ${err.message}`,'bad');
  }finally{setBusy(false)}
}

async function loadRemoteHistory(){
  if(!(await refreshSession())){renderRemoteHistory([]);return}
  setStatus('Loading production history…','work');
  try{
    const select='id,build,device,minecraft_version,artifact_summary,contentlog_summary,profile_summary,diagnostics_summary,created_at';
    const data=await api(`/rest/v1/ag2_debug_sessions?select=${encodeURIComponent(select)}&order=created_at.desc&limit=20`,{
      headers:authHeaders({'Content-Type':'application/json'})
    });
    renderRemoteHistory(Array.isArray(data)?data:[]);
    setStatus(`Production backend online · ${Array.isArray(data)?data.length:0} remote session(s).`,'good');
  }catch(err){renderRemoteHistory([]);setStatus(`History load failed: ${err.message}`,'bad')}
}

async function deleteRemote(id){
  if(!id||busy)return;
  if(!(await refreshSession()))return;
  setBusy(true);setStatus('Deleting remote session…','work');
  try{
    await api(`/rest/v1/ag2_debug_sessions?id=eq.${encodeURIComponent(id)}`,{
      method:'DELETE',headers:authHeaders({'Prefer':'return=minimal'})
    });
    await loadRemoteHistory();
  }catch(err){setStatus(`Delete failed: ${err.message}`,'bad')}finally{setBusy(false)}
}

function renderRemoteHistory(rows){
  const el=$('#remoteHistory');if(!el)return;
  if(!rows.length){el.innerHTML='<div class="empty">No production sessions for this account yet.</div>';return}
  el.innerHTML=rows.map(r=>{
    const errors=r.contentlog_summary?.error||0;
    const watchdogs=r.contentlog_summary?.watchdog||0;
    const cpu=r.profile_summary?.durationMs;
    const artifactCount=Array.isArray(r.artifact_summary)?r.artifact_summary.length:0;
    return `<div class="remote-row"><div><strong>${esc(r.build||'UNASSIGNED BUILD')}</strong><small>${esc(new Date(r.created_at).toLocaleString())} · ${artifactCount} artifact(s) · ${errors} errors · ${watchdogs} watchdog · ${cpu?Number(cpu).toFixed(0)+' ms CPU':'no CPU profile'}</small><small>${esc(r.device||'Unknown device')}${r.minecraft_version?' · MC '+esc(r.minecraft_version):''}</small></div><button data-delete-session="${esc(r.id)}">Delete</button></div>`
  }).join('');
  el.querySelectorAll('[data-delete-session]').forEach(b=>b.addEventListener('click',()=>deleteRemote(b.dataset.deleteSession)));
}

function renderAuth(){
  const signed=!!(auth?.access_token&&currentUser);
  const email=currentUser?.email||'';
  const badge=$('#syncBadge');
  if(badge){badge.textContent=signed?'SIGNED IN':'AUTH REQUIRED';badge.className='status '+(signed?'good':'warn')}
  const authState=$('#backendAuthState');
  if(authState)authState.innerHTML=signed?`<strong>${esc(email||'Authenticated user')}</strong><small>JWT protected · RLS own-session access</small>`:'<strong>Not signed in</strong><small>Sign in to enable encrypted cross-device history.</small>';
  const signOutBtn=$('#backendSignOut');if(signOutBtn)signOutBtn.hidden=!signed;
  const signInBtn=$('#backendSignIn');if(signInBtn)signInBtn.hidden=signed;
  const signUpBtn=$('#backendSignUp');if(signUpBtn)signUpBtn.hidden=signed;
  const emailInput=$('#backendEmail');if(emailInput){emailInput.disabled=signed;if(signed)emailInput.value=email}
  const passInput=$('#backendPassword');if(passInput){passInput.disabled=signed;if(signed)passInput.value=''}
  const syncBtn=$('#syncCurrentSession');if(syncBtn)syncBtn.disabled=!signed;
  const refreshBtn=$('#refreshRemoteHistory');if(refreshBtn)refreshBtn.disabled=!signed;
}

function injectUi(){
  const host=$('#backendInfo');if(!host)return;
  const saved=readJson(META_KEY,{});
  host.className='backend-production';
  host.innerHTML=`
    <div class="backend-meta">
      <div class="kv-row"><span>Provider</span><strong>Supabase Production</strong></div>
      <div class="kv-row"><span>Project</span><strong>drmacze · ydaeukhq…</strong></div>
      <div class="kv-row"><span>Protection</span><strong>Supabase Auth + JWT + RLS</strong></div>
      <div class="kv-row"><span>Stored remotely</span><strong>Summaries only, never raw files</strong></div>
    </div>
    <div class="backend-auth-grid">
      <label>Email<input id="backendEmail" type="email" autocomplete="username" placeholder="developer@example.com"></label>
      <label>Password<input id="backendPassword" type="password" autocomplete="current-password" placeholder="••••••••"></label>
      <div class="backend-actions"><button data-backend-action id="backendSignIn">Sign in</button><button data-backend-action class="ghost" id="backendSignUp">Create account</button><button data-backend-action class="ghost" id="backendSignOut" hidden>Sign out</button></div>
      <div id="backendAuthState" class="backend-auth-state"></div>
    </div>
    <div class="backend-session-grid">
      <label>Build<input id="syncBuild" placeholder="V3.7.4" value="${esc(saved.build||'')}"></label>
      <label>Device<input id="syncDevice" placeholder="iPhone / test device" value="${esc(saved.device||'')}"></label>
      <label>Minecraft version<input id="syncMinecraft" placeholder="26.45" value="${esc(saved.minecraft_version||'')}"></label>
    </div>
    <div class="backend-actions wide"><button data-backend-action id="syncCurrentSession">Sync current session</button><button data-backend-action class="ghost" id="refreshRemoteHistory">Refresh remote history</button></div>
    <div id="remoteStatus" class="backend-status">Production backend configured. Sign in to sync.</div>
    <div class="remote-head"><strong>Production history</strong><small>Latest 20 sessions for this account</small></div>
    <div id="remoteHistory" class="remote-history"><div class="empty">Sign in to load production history.</div></div>`;

  $('#backendSignIn')?.addEventListener('click',signIn);
  $('#backendSignUp')?.addEventListener('click',signUp);
  $('#backendSignOut')?.addEventListener('click',signOut);
  $('#syncCurrentSession')?.addEventListener('click',syncCurrent);
  $('#refreshRemoteHistory')?.addEventListener('click',loadRemoteHistory);
  ['syncBuild','syncDevice','syncMinecraft'].forEach(id=>$('#'+id)?.addEventListener('change',persistMeta));
  $('#backendState').textContent='PRODUCTION ONLINE';
  renderAuth();
}

async function boot(){
  injectUi();
  if(auth?.refresh_token){const ok=await refreshSession();renderAuth();if(ok)await loadRemoteHistory()}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
