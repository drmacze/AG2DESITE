(()=>{
  if(!document.querySelector('link[data-ag2-immersive]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='immersive.css?v=29';link.dataset.ag2Immersive='1';document.head.appendChild(link);
  }else{
    const link=document.querySelector('link[data-ag2-immersive]');
    if(link) link.href='immersive.css?v=29';
  }

  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero=document.querySelector('.hero');
  const loader=document.getElementById('modelLoader');
  if(loader&&!loader.querySelector('.ag2-loader-track')){
    loader.innerHTML='<div class="ag2-loader-head"><span class="ag2-loader-dot"></span><strong>AG2 3D REMASTER</strong></div><div class="ag2-loader-track"><i id="ag2LoaderBar"></i></div><div class="ag2-loader-meta"><span id="ag2LoaderStatus">Preparing viewer</span><b id="ag2LoaderPercent">0%</b></div>';
  }

  function buildGlobalAmbient(){
    if(document.querySelector('.ag2-global-bg')) return;
    const bg=document.createElement('div');bg.className='ag2-global-bg';bg.setAttribute('aria-hidden','true');
    bg.innerHTML='<span class="g-grid"></span><span class="g-orb g-orb-red"></span><span class="g-orb g-orb-gold"></span><span class="g-beam"></span><span class="g-scan"></span><span class="g-streak s1"></span><span class="g-streak s2"></span><span class="g-streak s3"></span><span class="g-vignette"></span>';
    for(let i=0;i<20;i++){
      const p=document.createElement('i');p.className='g-particle';
      p.style.left=`${3+((i*19)%94)}%`;p.style.top=`${4+((i*31)%92)}%`;
      p.style.setProperty('--dur',`${8+(i%7)*1.45}s`);p.style.setProperty('--delay',`${-(i%9)*.72}s`);
      p.style.setProperty('--dx',`${(i%2?1:-1)*(10+(i%5)*6)}px`);p.style.setProperty('--dy',`${-(24+(i%6)*9)}px`);
      bg.appendChild(p);
    }
    document.body.prepend(bg);
  }
  function buildHeroAmbient(){
    if(!hero||hero.querySelector('.hero-ambient')) return;
    const fx=document.createElement('div');fx.className='hero-ambient';fx.innerHTML='<span class="ha-grid"></span><span class="ha-orb ha-orb-a"></span><span class="ha-orb ha-orb-b"></span><span class="ha-beam"></span><span class="ha-scan"></span>';
    for(let i=0;i<16;i++){
      const p=document.createElement('i');p.className='ha-particle';p.style.left=`${5+((i*17)%90)}%`;p.style.top=`${8+((i*29)%82)}%`;p.style.opacity=(.08+(i%5)*.035).toFixed(2);p.style.setProperty('--pDur',`${6.5+(i%6)*1.15}s`);p.style.setProperty('--px',`${(i%2?1:-1)*(8+(i%4)*6)}px`);p.style.setProperty('--py',`${-(12+(i%5)*7)}px`);fx.appendChild(p);
    }
    hero.prepend(fx);
  }
  function buildSectionAmbient(){
    document.querySelectorAll('.feature-strip,.section,.join').forEach(section=>{
      if(section.querySelector(':scope > .section-ambient')) return;
      const fx=document.createElement('div');fx.className='section-ambient';fx.innerHTML='<span class="sa-grid"></span><span class="sa-glow"></span><span class="sa-line"></span>';section.prepend(fx);
    });
  }
  buildGlobalAmbient();buildHeroAmbient();buildSectionAmbient();

  const gsap=window.gsap,ScrollTrigger=window.ScrollTrigger;
  const progress=document.querySelector('.scroll-progress')||document.createElement('div');
  if(!progress.parentNode){progress.className='scroll-progress';document.body.appendChild(progress)}
  if(!gsap||!ScrollTrigger||reduceMotion)return;
  gsap.registerPlugin(ScrollTrigger);

  const splitWords=(el)=>{
    if(!el)return[];if(el.dataset.fxSplit)return[...el.querySelectorAll('.fx-word')];
    el.dataset.fxSplit='1';const text=el.textContent.trim(),words=text.split(/\s+/);el.textContent='';el.classList.add('fx-words');
    return words.map((word,i)=>{const s=document.createElement('span');s.className='fx-word';s.textContent=word;el.appendChild(s);if(i<words.length-1)el.appendChild(document.createTextNode(' '));return s});
  };
  const replayGlint=(el)=>{el.classList.remove('glint-on');void el.offsetWidth;el.classList.add('glint-on')};
  const reversible=(trigger,animation,start='top 90%',end='bottom 10%')=>{
    animation.pause(0);
    ScrollTrigger.create({trigger,start,end,toggleActions:'restart reverse restart reverse',animation,
      onEnter:()=>trigger.classList?.add('is-active'),onEnterBack:()=>trigger.classList?.add('is-active'),onLeave:()=>trigger.classList?.remove('is-active'),onLeaveBack:()=>trigger.classList?.remove('is-active')});
    return animation;
  };

  gsap.to(progress,{scaleX:1,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:.1}});

  const gbg=document.querySelector('.ag2-global-bg');
  if(gbg){
    const grid=gbg.querySelector('.g-grid'),red=gbg.querySelector('.g-orb-red'),gold=gbg.querySelector('.g-orb-gold'),beam=gbg.querySelector('.g-beam');
    gsap.to(grid,{yPercent:22,xPercent:-4,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:1.25}});
    gsap.to(red,{xPercent:-16,yPercent:22,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:1.05}});
    gsap.to(gold,{xPercent:20,yPercent:-20,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:1.35}});
    gsap.to(beam,{xPercent:-14,rotation:-36,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:.9}});
  }

  document.querySelectorAll('h1,h2,.definitive').forEach(el=>{
    el.classList.add('fx-gradient','text-glint');const words=splitWords(el);
    const tl=gsap.timeline({paused:true,onStart:()=>replayGlint(el)}).fromTo(words,{yPercent:120,opacity:0,filter:'blur(12px)',rotateX:-24,scaleY:.92},{yPercent:0,opacity:1,filter:'blur(0px)',rotateX:0,scaleY:1,duration:.9,stagger:.05,ease:'power4.out'});
    reversible(el,tl,'top 91%','bottom 9%');
    gsap.to(el,{backgroundPosition:'-140% 0',ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:.55}});
  });

  document.querySelectorAll('.kicker,.eyebrow').forEach(el=>{
    if(!el.dataset.fxLetters){el.dataset.fxLetters='1';const raw=el.textContent;el.textContent='';[...raw].forEach(ch=>{const s=document.createElement('span');s.className='fx-letter';s.textContent=ch===' '?'\u00a0':ch;el.appendChild(s)})}
    const letters=el.querySelectorAll('.fx-letter');
    const tl=gsap.timeline({paused:true}).fromTo(letters,{y:14,opacity:0,rotateX:-80,filter:'blur(3px)'},{y:0,opacity:1,rotateX:0,filter:'blur(0px)',duration:.52,stagger:.016,ease:'power3.out'});
    reversible(el,tl,'top 94%','bottom 6%');
  });

  if(hero){
    const heroFx=hero.querySelector('.hero-ambient');
    if(heroFx){
      gsap.to(heroFx.querySelector('.ha-grid'),{yPercent:18,xPercent:-4,rotation:.6,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1.15}});
      gsap.to(heroFx.querySelector('.ha-orb-a'),{xPercent:-20,yPercent:22,scale:1.2,opacity:.44,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.9}});
      gsap.to(heroFx.querySelector('.ha-orb-b'),{xPercent:19,yPercent:-24,scale:.84,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1.05}});
      gsap.to(heroFx.querySelector('.ha-beam'),{xPercent:-22,yPercent:18,rotation:-50,scaleX:1.12,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.8}});
      heroFx.querySelectorAll('.ha-particle').forEach((p,i)=>gsap.to(p,{y:100+(i%5)*16,x:(i%2?1:-1)*(20+(i%4)*8),opacity:.03,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.7+(i%3)*.18}}));
    }
    const title=hero.querySelector('h1'),definitive=hero.querySelector('.definitive'),tagline=hero.querySelector('.tagline'),side=hero.querySelector('.side-copy'),copy=hero.querySelector('.hero-copy'),stage=hero.querySelector('.model-stage');
    if(copy)gsap.to(copy,{yPercent:-7,opacity:.68,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.65}});
    if(stage)gsap.to(stage,{yPercent:7,scale:.97,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.7}});
    if(title)gsap.to(title,{yPercent:-9,letterSpacing:'-.07em',ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.62}});
    if(definitive)gsap.to(definitive,{yPercent:-13,letterSpacing:innerWidth<520?'.09em':'.2em',ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.67}});
    if(tagline)gsap.to(tagline,{opacity:.38,yPercent:-18,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.68}});
    if(side)gsap.to(side,{yPercent:-22,xPercent:-4,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.72}});
    ScrollTrigger.create({trigger:hero,start:'top 85%',end:'bottom 15%',onEnter:()=>hero.classList.add('hero-ready'),onEnterBack:()=>hero.classList.add('hero-ready'),onLeaveBack:()=>hero.classList.remove('hero-ready')});
  }

  document.querySelectorAll('.feature-strip,.section,.join').forEach((section,index)=>{
    const fx=section.querySelector(':scope > .section-ambient'),wrap=section.querySelector(':scope > .wrap');
    if(fx){
      const line=fx.querySelector('.sa-line'),glow=fx.querySelector('.sa-glow'),grid=fx.querySelector('.sa-grid');
      gsap.fromTo(line,{scaleX:.05,opacity:.08},{scaleX:1,opacity:.62,ease:'none',scrollTrigger:{trigger:section,start:'top 96%',end:'top 50%',scrub:.55}});
      gsap.fromTo(glow,{xPercent:index%2?15:-15,yPercent:12,scale:.78,opacity:.12},{xPercent:index%2?-13:13,yPercent:-12,scale:1.2,opacity:.54,ease:'none',scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:.95}});
      gsap.to(grid,{yPercent:14+(index%3)*3,xPercent:index%2?-3:3,rotation:index%2?-.35:.35,ease:'none',scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.15}});
    }
    if(wrap){
      gsap.fromTo(wrap,{y:58,opacity:.35,scale:.985},{y:0,opacity:1,scale:1,ease:'none',scrollTrigger:{trigger:section,start:'top 98%',end:'top 62%',scrub:.6}});
      gsap.to(wrap,{y:-22,opacity:.72,ease:'none',scrollTrigger:{trigger:section,start:'bottom 44%',end:'bottom 5%',scrub:.6}});
    }
    ScrollTrigger.create({trigger:section,start:'top 72%',end:'bottom 28%',onEnter:()=>section.classList.add('is-active'),onEnterBack:()=>section.classList.add('is-active'),onLeave:()=>section.classList.remove('is-active'),onLeaveBack:()=>section.classList.remove('is-active')});
  });

  document.querySelectorAll('.feature-card').forEach(card=>{
    const icon=card.querySelector('.ico'),copy=card.querySelector('div');
    const tl=gsap.timeline({paused:true,onStart:()=>{card.classList.remove('is-active');void card.offsetWidth;card.classList.add('is-active')}})
      .fromTo(card,{y:42,opacity:0,rotateX:10,scale:.97},{y:0,opacity:1,rotateX:0,scale:1,duration:.72,ease:'power3.out'},0)
      .fromTo(icon,{x:-14,rotate:-12,opacity:.15},{x:0,rotate:0,opacity:1,duration:.64,ease:'back.out(1.7)'},.08)
      .fromTo(copy,{x:18,opacity:.18},{x:0,opacity:1,duration:.62,ease:'power3.out'},.12);
    reversible(card,tl,'top 92%','bottom 8%');
  });

  document.querySelectorAll('.gallery-grid .shot').forEach((shot,i)=>{
    const from=i===0?'inset(0 100% 0 0)':'inset(100% 0 0 0)';
    const tl=gsap.timeline({paused:true,onStart:()=>{shot.classList.remove('is-active');void shot.offsetWidth;shot.classList.add('is-active')}})
      .fromTo(shot,{clipPath:from,filter:'brightness(.5) blur(5px)',rotateY:i===0?-5:5,scale:.965},{clipPath:'inset(0 0% 0 0)',filter:'brightness(1) blur(0px)',rotateY:0,scale:1,duration:1,ease:'power4.out'});
    reversible(shot,tl,'top 91%','bottom 9%');
    gsap.to(shot,{yPercent:i===0?-6:7,rotationZ:i===0?-.35:.35,ease:'none',scrollTrigger:{trigger:'.gallery-grid',start:'top bottom',end:'bottom top',scrub:.75}});
  });

  const mm=gsap.matchMedia();
  mm.add('(min-width: 901px)',()=>{
    document.querySelectorAll('.weapon-card').forEach((card,i)=>{
      const tl=gsap.timeline({paused:true}).fromTo(card,{y:58+(i%2)*18,opacity:0,rotateX:12,rotateY:(i-2)*1.1,filter:'blur(7px)',scale:.94},{y:0,opacity:1,rotateX:0,rotateY:0,filter:'blur(0px)',scale:1,duration:.82,ease:'power3.out'});
      reversible(card,tl,'top 92%','bottom 8%');
      gsap.to(card,{yPercent:i%2?-7:7,xPercent:(i-2)*.45,ease:'none',scrollTrigger:{trigger:'.arsenal-section',start:'top bottom',end:'bottom top',scrub:.78}});
    });
  });
  mm.add('(max-width: 900px)',()=>{
    document.querySelectorAll('.weapon-card').forEach(card=>{
      const tl=gsap.timeline({paused:true}).fromTo(card,{y:40,opacity:0,scale:.955,filter:'blur(4px)'},{y:0,opacity:1,scale:1,filter:'blur(0px)',duration:.66,ease:'power3.out'});
      reversible(card,tl,'top 94%','bottom 6%');
    });
  });

  document.querySelectorAll('.section-copy p,.weapons-heading p,.join p').forEach(el=>{
    const words=splitWords(el);const tl=gsap.timeline({paused:true}).fromTo(words,{opacity:.06,y:12,filter:'blur(2px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.38,stagger:.012,ease:'power2.out'});reversible(el,tl,'top 92%','bottom 8%');
  });

  const join=document.querySelector('.join');
  if(join){
    const left=join.querySelector('.join-inner>div:first-child'),right=join.querySelector('.download-block');
    if(left)gsap.fromTo(left,{x:-70,opacity:.16},{x:0,opacity:1,ease:'none',scrollTrigger:{trigger:join,start:'top 95%',end:'top 54%',scrub:.58}});
    if(right)gsap.fromTo(right,{x:70,opacity:.16},{x:0,opacity:1,ease:'none',scrollTrigger:{trigger:join,start:'top 95%',end:'top 54%',scrub:.58}});
    gsap.to('.join-parallax',{scale:1.12,yPercent:12,xPercent:-2,ease:'none',scrollTrigger:{trigger:join,start:'top bottom',end:'bottom top',scrub:.9}});
  }

  const footer=document.querySelector('footer');
  if(footer){const tl=gsap.timeline({paused:true}).fromTo('.footer-inner',{y:34,opacity:0,filter:'blur(5px)'},{y:0,opacity:1,filter:'blur(0px)',duration:.72,ease:'power3.out'});reversible(footer,tl,'top 96%','bottom 4%')}

  document.querySelectorAll('.btn-primary').forEach(btn=>{
    btn.addEventListener('pointermove',e=>{if(matchMedia('(pointer:fine)').matches){const r=btn.getBoundingClientRect();gsap.to(btn,{x:(e.clientX-r.left-r.width/2)*.04,y:(e.clientY-r.top-r.height/2)*.04,scale:1.012,duration:.22,overwrite:true})}});
    btn.addEventListener('pointerleave',()=>gsap.to(btn,{x:0,y:0,scale:1,duration:.5,ease:'elastic.out(1,.42)'}));
  });

  if(matchMedia('(pointer:fine)').matches&&gbg){
    window.addEventListener('pointermove',e=>{const nx=e.clientX/innerWidth-.5,ny=e.clientY/innerHeight-.5;gsap.to(gbg.querySelector('.g-orb-red'),{x:nx*18,y:ny*14,duration:1.2,ease:'power2.out',overwrite:'auto'});gsap.to(gbg.querySelector('.g-orb-gold'),{x:-nx*12,y:-ny*10,duration:1.5,ease:'power2.out',overwrite:'auto'})},{passive:true});
  }

  window.addEventListener('ag2-model-ready',()=>{
    gsap.fromTo('.model-stage',{filter:'brightness(.58) saturate(.7)',scale:.955,rotateY:-2},{filter:'brightness(1) saturate(1)',scale:1,rotateY:0,duration:1.15,ease:'power4.out'});
    gsap.fromTo('.model-glow',{opacity:.04,scale:.65},{opacity:1,scale:1,duration:1.45,ease:'power3.out'});
  },{once:true});

  window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
