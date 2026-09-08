(()=>{
'use strict';
const PERSIST_KEY='ag2.dev.auth.persistent.v3';
const LEGACY_AUTH_KEY='ag2.dev.auth.v1';
const DEFAULT_ACCESS_HASH='e0bc60c82713f64ef8a57c0c40d02ce24fd0141d5cc3086259c19b1e62a62bea'; // legacy 112233 fallback; UI gate only
const ACCESS_HASH=String(window.AG2_DEV_ACCESS_HASH||window.AG2_RUNTIME_CONFIG?.accessHash||DEFAULT_ACCESS_HASH).trim().toLowerCase();
const MAX_ATTEMPTS=5,LOCK_MS=30000;
let failed=0,lockUntil=0;
function safeGet(store,key){try{return store.getItem(key)}catch{return null}}
function safeSet(store,key,value){try{store.setItem(key,value)}catch{}}
function safeRemove(store,key){try{store.removeItem(key)}catch{}}
async function digestHex(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
if(safeGet(localStorage,PERSIST_KEY)==='1')safeSet(sessionStorage,LEGACY_AUTH_KEY,'1');else safeRemove(sessionStorage,LEGACY_AUTH_KEY);
function boot(){const form=document.getElementById('accessForm'),input=document.getElementById('accessKey'),error=document.getElementById('accessError'),logout=document.getElementById('logoutBtn');if(form&&input){form.addEventListener('submit',async e=>{e.preventDefault();e.stopImmediatePropagation();if(Date.now()<lockUntil){if(error)error.textContent='Temporarily locked. Try again shortly.';return}const raw=input.value.trim();if(!raw){if(error)error.textContent='Access key required.';return}const hash=await digestHex(raw);if(hash===ACCESS_HASH){safeSet(localStorage,PERSIST_KEY,'1');safeSet(sessionStorage,LEGACY_AUTH_KEY,'1');failed=0;input.value='';location.reload();return}failed++;input.value='';if(error)error.textContent='Access denied.';if(failed>=MAX_ATTEMPTS){failed=0;lockUntil=Date.now()+LOCK_MS;if(error)error.textContent='Too many attempts. Locked for 30 seconds.'}},true)}if(logout){logout.addEventListener('click',()=>{safeRemove(localStorage,PERSIST_KEY);safeRemove(sessionStorage,LEGACY_AUTH_KEY)},true)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
