const btn=document.querySelector('.menu-btn');
const menu=document.getElementById('mobileMenu');
btn?.addEventListener('click',()=>{
  const open=menu.classList.toggle('open');
  btn.setAttribute('aria-expanded',open?'true':'false');
  btn.textContent=open?'×':'☰';
});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  menu.classList.remove('open');
  btn.textContent='☰';
  btn.setAttribute('aria-expanded','false');
}));
const links=[...document.querySelectorAll('.nav-links a')];
const sections=[...document.querySelectorAll('header[id],section[id]')];
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));
  });
},{rootMargin:'-35% 0px -55% 0px'});
sections.forEach(s=>observer.observe(s));