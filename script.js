const menuButton=document.querySelector('.menu-btn');
const menu=document.getElementById('mobileMenu');

function closeMenu(){
  menu?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded','false');
}
menuButton?.addEventListener('click',()=>{
  const open=!menu.classList.contains('open');
  menu.classList.toggle('open',open);
  menuButton.setAttribute('aria-expanded',String(open));
});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{
  if(!menu?.classList.contains('open'))return;
  if(menu.contains(e.target)||menuButton?.contains(e.target))return;
  closeMenu();
});

const links=[...document.querySelectorAll('.nav-links a')];
const sections=[...document.querySelectorAll('header[id],section[id]')];
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));
  });
},{rootMargin:'-35% 0px -55% 0px'});
sections.forEach(s=>observer.observe(s));

const viewer=document.getElementById('heroModel');
document.querySelector('.viewer-reset')?.addEventListener('click',()=>{
  if(!viewer)return;
  viewer.cameraOrbit='28deg 72deg 120%';
  viewer.fieldOfView='30deg';
  viewer.jumpCameraToGoal?.();
});

const cards=[...document.querySelectorAll('.weapon-card')];
const selectedWeapon=document.getElementById('selectedWeapon');
const selectedType=document.getElementById('selectedType');
cards.forEach(card=>card.addEventListener('click',()=>{
  cards.forEach(c=>c.classList.toggle('active',c===card));
  selectedWeapon.textContent=card.dataset.weapon||'';
  selectedType.textContent=card.dataset.type||'';
  card.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
}));

const galleryItems=[
  {src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Flickr_-_The_U.S._Army_-_Helicopter_over_Baghdad.jpg',caption:'Real weapons in a new world'},
  {src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/ISTC_Urban_Sniper_Course_-_FN_SCAR-H_PR_with_night_vision.webp',caption:'Tactical gear'},
  {src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset_in_the_ruins_of_Hampi.jpg',caption:'Dynamic environments'}
];
const modal=document.getElementById('galleryModal');
const modalImage=document.getElementById('galleryImage');
const modalCaption=document.getElementById('galleryCaption');
let galleryIndex=0;
function renderGallery(index){
  galleryIndex=(index+galleryItems.length)%galleryItems.length;
  const item=galleryItems[galleryIndex];
  modalImage.src=item.src;
  modalImage.alt=item.caption;
  modalCaption.textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(galleryItems.length).padStart(2,'0')} — ${item.caption}`;
}
function openGallery(index=0){
  renderGallery(index);
  if(typeof modal.showModal==='function')modal.showModal(); else modal.setAttribute('open','');
}
document.querySelector('.gallery-launch')?.addEventListener('click',()=>openGallery(0));
document.querySelectorAll('[data-gallery-index]').forEach(el=>el.addEventListener('click',()=>openGallery(Number(el.dataset.galleryIndex)||0)));
document.querySelector('.modal-close')?.addEventListener('click',()=>modal.close());
document.querySelector('.modal-prev')?.addEventListener('click',()=>renderGallery(galleryIndex-1));
document.querySelector('.modal-next')?.addEventListener('click',()=>renderGallery(galleryIndex+1));
modal?.addEventListener('click',e=>{if(e.target===modal)modal.close();});
document.addEventListener('keydown',e=>{
  if(!modal?.open)return;
  if(e.key==='ArrowLeft')renderGallery(galleryIndex-1);
  if(e.key==='ArrowRight')renderGallery(galleryIndex+1);
});
