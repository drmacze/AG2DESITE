const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis=null;
if(!reduceMotion && window.Lenis){
  lenis=new window.Lenis({duration:1.05,smoothWheel:true,syncTouch:false,touchMultiplier:1.1,wheelMultiplier:.92});
  if(window.ScrollTrigger)lenis.on('scroll',window.ScrollTrigger.update);
  if(window.gsap){
    window.gsap.ticker.add(time=>lenis.raf(time*1000));
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
  if(open)lenis?.stop(); else lenis?.start();
}
menuButton?.addEventListener('click',()=>setMenu(!menu.classList.contains('open')));
document.addEventListener('click',e=>{
  if(!menu?.classList.contains('open'))return;
  if(menu.contains(e.target)||menuButton?.contains(e.target))return;
  setMenu(false);
});

qsa('[data-scroll-to]').forEach(link=>link.addEventListener('click',e=>{
  const href=link.getAttribute('href');
  if(!href?.startsWith('#'))return;
  const target=qs(href);
  if(!target)return;
  e.preventDefault();
  setMenu(false);
  if(lenis)lenis.scrollTo(target,{offset:-68,duration:1.05});
  else target.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});
}));

function updateNav(y){
  nav?.classList.toggle('scrolled',y>20);
  if(innerWidth>980){
    const goingDown=y>lastY+4;
    nav?.classList.toggle('nav-hidden',goingDown&&y>220&&!menu?.classList.contains('open'));
  }else nav?.classList.remove('nav-hidden');
  lastY=y;
}
if(lenis)lenis.on('scroll',({scroll})=>updateNav(scroll));
else addEventListener('scroll',()=>updateNav(scrollY),{passive:true});

const navLinks=qsa('.nav-links a[href^="#"]');
const sections=qsa('header[id],section[id]');
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));
  });
},{rootMargin:'-34% 0px -58% 0px'});
sections.forEach(s=>observer.observe(s));

qs('.viewer-reset')?.addEventListener('click',()=>window.dispatchEvent(new Event('ag2-reset-viewer')));

const cards=qsa('.weapon-card');
const selectedWeapon=qs('#selectedWeapon');
const selectedType=qs('#selectedType');
cards.forEach(card=>card.addEventListener('click',()=>{
  cards.forEach(c=>c.classList.toggle('active',c===card));
  if(selectedWeapon)selectedWeapon.textContent=card.dataset.weapon||'';
  if(selectedType)selectedType.textContent=card.dataset.type||'';
  card.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'nearest',inline:'center'});
  if(window.gsap&&!reduceMotion)window.gsap.fromTo(card,{scale:.985},{scale:1,duration:.42,ease:'back.out(2)'});
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
  if(modalImage){modalImage.src=item.src;modalImage.alt=item.caption;}
  if(modalCaption)modalCaption.textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(galleryItems.length).padStart(2,'0')} — ${item.caption}`;
}
function openGallery(index=0){
  renderGallery(index);setMenu(false);lenis?.stop();
  if(typeof modal?.showModal==='function')modal.showModal(); else modal?.setAttribute('open','');
}
function closeGallery(){if(modal?.open)modal.close();else modal?.removeAttribute('open');lenis?.start();}
qs('.gallery-launch')?.addEventListener('click',()=>openGallery(0));
qsa('[data-gallery-index]').forEach(el=>el.addEventListener('click',()=>openGallery(Number(el.dataset.galleryIndex)||0)));
qs('.modal-close')?.addEventListener('click',closeGallery);
qs('.modal-prev')?.addEventListener('click',()=>renderGallery(galleryIndex-1));
qs('.modal-next')?.addEventListener('click',()=>renderGallery(galleryIndex+1));
modal?.addEventListener('click',e=>{if(e.target===modal)closeGallery();});
modal?.addEventListener('close',()=>lenis?.start());
document.addEventListener('keydown',e=>{
  if(!modal?.open)return;
  if(e.key==='ArrowLeft')renderGallery(galleryIndex-1);
  if(e.key==='ArrowRight')renderGallery(galleryIndex+1);
  if(e.key==='Escape')closeGallery();
});

if(!reduceMotion && window.gsap && window.ScrollTrigger){
  const {gsap,ScrollTrigger}=window;
  gsap.registerPlugin(ScrollTrigger);

  gsap.set('.hero-reveal',{opacity:0,y:28});
  gsap.timeline({defaults:{ease:'power3.out'}})
    .to('.hero-copy .hero-reveal',{opacity:1,y:0,duration:.8,stagger:.075},.12)
    .to('.hero-visual.hero-reveal',{opacity:1,y:0,duration:1.05},.25);

  gsap.from('.feature-card',{
    scrollTrigger:{trigger:'#features',start:'top 84%'},
    opacity:0,y:34,duration:.72,stagger:.075,ease:'power3.out',clearProps:'transform'
  });

  qsa('.reveal-block').forEach(el=>gsap.from(el,{
    scrollTrigger:{trigger:el,start:'top 86%'},
    opacity:0,y:46,duration:.9,ease:'power3.out'
  }));

  gsap.from('.gallery-grid .shot',{
    scrollTrigger:{trigger:'.gallery-grid',start:'top 83%'},
    opacity:0,y:55,scale:.985,duration:.82,stagger:.11,ease:'power3.out'
  });

  gsap.from('.weapon-card',{
    scrollTrigger:{trigger:'.weapon-row',start:'top 86%'},
    opacity:0,y:42,duration:.72,stagger:.08,ease:'power3.out',clearProps:'transform'
  });

  gsap.to('.hero-diagonal',{
    yPercent:18,ease:'none',
    scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:.7}
  });
  gsap.to('.hero-visual',{
    yPercent:5,ease:'none',
    scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:.7}
  });
  ScrollTrigger.create({
    trigger:'.hero',start:'top top',end:'bottom top',scrub:true,
    onUpdate:self=>window.dispatchEvent(new CustomEvent('ag2-model-scroll',{detail:self.progress}))
  });
  gsap.to('.join-parallax',{
    yPercent:12,ease:'none',
    scrollTrigger:{trigger:'.join',start:'top bottom',end:'bottom top',scrub:.8}
  });

  if(matchMedia('(pointer:fine)').matches){
    const stage=qs('.model-stage');
    stage?.addEventListener('pointermove',e=>{
      const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      gsap.to('.model-label',{x:x*7,y:y*5,duration:.45,ease:'power2.out',overwrite:true});
    });
    stage?.addEventListener('pointerleave',()=>gsap.to('.model-label',{x:0,y:0,duration:.6,ease:'power3.out'}));
  }

  addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
}