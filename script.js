const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower=matchMedia('(max-width:900px)').matches||matchMedia('(pointer:coarse)').matches||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4);
window.AG2LowPower=lowPower;

let lenis=null;
if(!reduceMotion&&!lowPower&&window.Lenis){
  lenis=new window.Lenis({duration:.92,smoothWheel:true,syncTouch:false,wheelMultiplier:.9});
  if(window.ScrollTrigger)lenis.on('scroll',window.ScrollTrigger.update);
  if(window.gsap){
    const lenisTick=time=>lenis?.raf(time*1000);
    window.gsap.ticker.add(lenisTick);
    window.gsap.ticker.lagSmoothing(0);
  }
}
window.AG2Lenis=lenis;

const nav=qs('.nav');
const menuButton=qs('.menu-btn');
const menu=qs('#mobileMenu');
let lastY=0;
function setMenu(open){
  menu?.classList.toggle('open',open);
  menu?.setAttribute('aria-hidden',String(!open));
  menuButton?.setAttribute('aria-expanded',String(open));
  document.body.classList.toggle('menu-open',open);
  if(open)lenis?.stop();else lenis?.start();
}
menuButton?.addEventListener('click',()=>setMenu(!menu?.classList.contains('open')));
document.addEventListener('click',e=>{
  if(!menu?.classList.contains('open'))return;
  if(menu.contains(e.target)||menuButton?.contains(e.target))return;
  setMenu(false);
});

qsa('[data-scroll-to]').forEach(link=>link.addEventListener('click',e=>{
  const href=link.getAttribute('href');
  if(!href?.startsWith('#'))return;
  const target=qs(href);if(!target)return;
  e.preventDefault();setMenu(false);
  if(lenis)lenis.scrollTo(target,{offset:-68,duration:.9});
  else target.scrollIntoView({behavior:reduceMotion||lowPower?'auto':'smooth',block:'start'});
}));

function updateNav(y){
  nav?.classList.toggle('scrolled',y>20);
  if(innerWidth>980&&!lowPower){
    const goingDown=y>lastY+4;
    nav?.classList.toggle('nav-hidden',goingDown&&y>220&&!menu?.classList.contains('open'));
  }else nav?.classList.remove('nav-hidden');
  lastY=y;
}
if(lenis)lenis.on('scroll',({scroll})=>updateNav(scroll));
else addEventListener('scroll',()=>updateNav(scrollY),{passive:true});

const navLinks=qsa('.nav-links a[href^="#"]');
const sections=qsa('header[id],section[id]');
const sectionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));
  });
},{rootMargin:'-34% 0px -58% 0px'});
sections.forEach(s=>sectionObserver.observe(s));

qs('.viewer-reset')?.addEventListener('click',()=>window.dispatchEvent(new Event('ag2-reset-viewer')));

const cards=qsa('.weapon-card');
const selectedWeapon=qs('#selectedWeapon');
const selectedType=qs('#selectedType');
cards.forEach(card=>card.addEventListener('click',()=>{
  cards.forEach(c=>c.classList.toggle('active',c===card));
  if(selectedWeapon)selectedWeapon.textContent=card.dataset.weapon||'';
  if(selectedType)selectedType.textContent=card.dataset.type||'';
  card.scrollIntoView({behavior:lowPower?'auto':'smooth',block:'nearest',inline:'center'});
}));

const galleryItems=[
  {src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Flickr_-_The_U.S._Army_-_Helicopter_over_Baghdad.jpg',caption:'Real weapons in a new world'},
  {src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/ISTC_Urban_Sniper_Course_-_FN_SCAR-H_PR_with_night_vision.webp',caption:'Tactical gear'},
  {src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset_in_the_ruins_of_Hampi.jpg',caption:'Dynamic environments'}
];
const modal=qs('#galleryModal'),modalImage=qs('#galleryImage'),modalCaption=qs('#galleryCaption');
let galleryIndex=0;
function renderGallery(index){
  galleryIndex=(index+galleryItems.length)%galleryItems.length;
  const item=galleryItems[galleryIndex];
  if(modalImage){modalImage.src=item.src;modalImage.alt=item.caption}
  if(modalCaption)modalCaption.textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(galleryItems.length).padStart(2,'0')} — ${item.caption}`;
}
function openGallery(index=0){
  renderGallery(index);setMenu(false);lenis?.stop();
  if(typeof modal?.showModal==='function')modal.showModal();else modal?.setAttribute('open','');
}
function closeGallery(){
  if(modal?.open)modal.close();else modal?.removeAttribute('open');
  lenis?.start();
}
qs('.gallery-launch')?.addEventListener('click',()=>openGallery(0));
qsa('[data-gallery-index]').forEach(el=>el.addEventListener('click',()=>openGallery(Number(el.dataset.galleryIndex)||0)));
qs('.modal-close')?.addEventListener('click',closeGallery);
qs('.modal-prev')?.addEventListener('click',()=>renderGallery(galleryIndex-1));
qs('.modal-next')?.addEventListener('click',()=>renderGallery(galleryIndex+1));
modal?.addEventListener('click',e=>{if(e.target===modal)closeGallery()});
modal?.addEventListener('close',()=>lenis?.start());
document.addEventListener('keydown',e=>{
  if(!modal?.open)return;
  if(e.key==='ArrowLeft')renderGallery(galleryIndex-1);
  if(e.key==='ArrowRight')renderGallery(galleryIndex+1);
  if(e.key==='Escape')closeGallery();
});

if(!reduceMotion&&!lowPower&&window.gsap&&window.ScrollTrigger){
  const {gsap,ScrollTrigger}=window;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    trigger:'.hero',start:'top top',end:'bottom top',scrub:.6,
    onUpdate:self=>window.dispatchEvent(new CustomEvent('ag2-model-scroll',{detail:self.progress}))
  });
  if(matchMedia('(pointer:fine)').matches){
    const stage=qs('.model-stage');
    stage?.addEventListener('pointermove',e=>{
      const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      gsap.to('.model-label',{x:x*5,y:y*4,duration:.4,ease:'power2.out',overwrite:true});
    });
    stage?.addEventListener('pointerleave',()=>gsap.to('.model-label',{x:0,y:0,duration:.45,ease:'power2.out'}));
  }
}
