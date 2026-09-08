(()=>{
  const lowPower=window.AG2LowPower??(matchMedia('(max-width:900px)').matches||matchMedia('(pointer:coarse)').matches);
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('ag2-lite',lowPower);

  let link=document.querySelector('link[data-ag2-immersive]');
  if(!link){link=document.createElement('link');link.rel='stylesheet';link.dataset.ag2Immersive='1';document.head.appendChild(link)}
  link.href='immersive.css?v=31';

  const hero=document.querySelector('.hero');
  const loader=document.getElementById('modelLoader');
  if(loader&&!loader.querySelector('.ag2-loader-track')){
    loader.innerHTML='<div class="ag2-loader-head"><span class="ag2-loader-dot"></span><strong>AG2 3D REMASTER</strong></div><div class="ag2-loader-track"><i id="ag2LoaderBar"></i></div><div class="ag2-loader-meta"><span id="ag2LoaderStatus">Preparing viewer</span><b id="ag2LoaderPercent">0%</b></div>';
  }

  function buildGlobalAmbient(){
    if(document.querySelector('.ag2-global-bg'))return;
    const bg=document.createElement('div');
    bg.className='ag2-global-bg';bg.setAttribute('aria-hidden','true');
    bg.innerHTML='<span class="g-grid"></span><span class="g-orb g-orb-red"></span><span class="g-orb g-orb-gold"></span><span class="g-beam"></span><span class="g-scan"></span><span class="g-vignette"></span>';
    const count=lowPower?0:8;
    for(let i=0;i<count;i++){
      const p=document.createElement('i');p.className='g-particle';
      p.style.left=`${7+((i*23)%86)}%`;p.style.top=`${8+((i*31)%82)}%`;
      p.style.setProperty('--dur',`${10+(i%4)*2}s`);p.style.setProperty('--delay',`${-i*.9}s`);
      bg.appendChild(p);
    }
    document.body.prepend(bg);
  }
  function buildHeroAmbient(){
    if(!hero||hero.querySelector('.hero-ambient'))return;
    const fx=document.createElement('div');fx.className='hero-ambient';
    fx.innerHTML='<span class="ha-grid"></span><span class="ha-orb"></span><span class="ha-beam"></span><span class="ha-scan"></span>';
    const count=lowPower?0:5;
    for(let i=0;i<count;i++){
      const p=document.createElement('i');p.className='ha-particle';p.style.left=`${12+((i*19)%72)}%`;p.style.top=`${14+((i*27)%68)}%`;p.style.setProperty('--delay',`${-i*1.2}s`);fx.appendChild(p);
    }
    hero.prepend(fx);
  }
  function buildSectionAmbient(){
    document.querySelectorAll('.feature-strip,.section,.join').forEach(section=>{
      if(section.querySelector(':scope > .section-ambient'))return;
      const fx=document.createElement('div');fx.className='section-ambient';fx.innerHTML='<span class="sa-glow"></span><span class="sa-line"></span>';section.prepend(fx);
    });
  }
  buildGlobalAmbient();buildHeroAmbient();buildSectionAmbient();

  const revealTargets=[...document.querySelectorAll('.hero-reveal,h1,h2,.definitive,.kicker,.eyebrow,.feature-card,.gallery-grid .shot,.weapon-card,.section-copy,.weapons-heading,.join-inner,.footer-inner')];
  revealTargets.forEach((el,i)=>{el.classList.add('ag2-reveal');el.style.setProperty('--reveal-delay',`${Math.min((i%5)*45,180)}ms`)});
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const el=entry.target;
      if(entry.isIntersecting){
        el.classList.add('in-view');
        if(el.matches('h1,h2,.definitive')){el.classList.remove('glint-on');requestAnimationFrame(()=>el.classList.add('glint-on'))}
      }else el.classList.remove('in-view');
    });
  },{rootMargin:'-6% 0px -8% 0px',threshold:.08});
  revealTargets.forEach(el=>observer.observe(el));

  const activeObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('is-active',entry.isIntersecting));
  },{rootMargin:'-20% 0px -20% 0px',threshold:.05});
  document.querySelectorAll('.feature-strip,.section,.join').forEach(s=>activeObserver.observe(s));

  const progress=document.querySelector('.scroll-progress')||document.createElement('div');
  if(!progress.parentNode){progress.className='scroll-progress';document.body.appendChild(progress)}
  const gsap=window.gsap,ScrollTrigger=window.ScrollTrigger;
  if(!gsap||!ScrollTrigger||reduceMotion)return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.to(progress,{scaleX:1,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:.15}});

  if(!lowPower){
    const gbg=document.querySelector('.ag2-global-bg');
    if(gbg){
      const tl=gsap.timeline({scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:1.2}});
      tl.to(gbg.querySelector('.g-grid'),{yPercent:12,xPercent:-2,ease:'none'},0)
        .to(gbg.querySelector('.g-beam'),{xPercent:-9,rotation:-4,ease:'none'},0)
        .to(gbg.querySelector('.g-orb-red'),{yPercent:10,xPercent:-7,ease:'none'},0);
    }
    if(hero){
      const tl=gsap.timeline({scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.9}});
      const copy=hero.querySelector('.hero-copy'),stage=hero.querySelector('.model-stage'),beam=hero.querySelector('.ha-beam'),grid=hero.querySelector('.ha-grid');
      if(copy)tl.to(copy,{yPercent:-4,opacity:.8,ease:'none'},0);
      if(stage)tl.to(stage,{yPercent:4,scale:.985,ease:'none'},0);
      if(beam)tl.to(beam,{xPercent:-12,yPercent:7,ease:'none'},0);
      if(grid)tl.to(grid,{yPercent:9,xPercent:-2,ease:'none'},0);
    }
    const join=document.querySelector('.join');
    if(join&&document.querySelector('.join-parallax')){
      gsap.to('.join-parallax',{yPercent:7,scale:1.05,ease:'none',scrollTrigger:{trigger:join,start:'top bottom',end:'bottom top',scrub:1}});
    }
  }

  window.addEventListener('ag2-model-ready',()=>{
    const stage=document.querySelector('.model-stage');
    if(stage)stage.classList.add('model-ready');
  },{once:true});

  addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
