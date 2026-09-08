(()=>{
'use strict';
const PERSIST_KEY='ag2.dev.auth.persistent.v2';
const LEGACY_AUTH_KEY='ag2.dev.auth.v1';
const ACCESS_KEY='112233';
const MAX_ATTEMPTS=5;
const LOCK_MS=30000;
let failed=0;
let lockUntil=0;

function safeGet(store,key){try{return store.getItem(key)}catch{return null}}
function safeSet(store,key,value){try{store.setItem(key,value)}catch{}}
function safeRemove(store,key){try{store.removeItem(key)}catch{}}

// Persistent trusted-device login. A successful unlock survives browser/app restarts
// until the user presses LOCK CONSOLE or clears site data.
if(safeGet(localStorage,PERSIST_KEY)==='1') safeSet(sessionStorage,LEGACY_AUTH_KEY,'1');
else safeRemove(sessionStorage,LEGACY_AUTH_KEY);

function boot(){
  const form=document.getElementById('accessForm');
  const input=document.getElementById('accessKey');
  const error=document.getElementById('accessError');
  const logout=document.getElementById('logoutBtn');

  if(form&&input){
    form.addEventListener('submit',e=>{
      // Capture and fully own authentication so the legacy hash-based handler
      // in console.js cannot accept the previous developer key.
      e.preventDefault();
      e.stopImmediatePropagation();

      if(Date.now()<lockUntil){
        if(error) error.textContent='Temporarily locked. Try again shortly.';
        return;
      }

      const raw=input.value.trim();
      if(!raw){
        if(error) error.textContent='Access key required.';
        return;
      }

      if(raw===ACCESS_KEY){
        safeSet(localStorage,PERSIST_KEY,'1');
        safeSet(sessionStorage,LEGACY_AUTH_KEY,'1');
        failed=0;
        input.value='';
        location.reload();
        return;
      }

      failed++;
      input.value='';
      if(error) error.textContent='Access denied.';
      if(failed>=MAX_ATTEMPTS){
        failed=0;
        lockUntil=Date.now()+LOCK_MS;
        if(error) error.textContent='Too many attempts. Locked for 30 seconds.';
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

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
