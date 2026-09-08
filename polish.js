(()=>{
  // Load the immersive refinement layer without touching the main document structure.
  if(!document.querySelector('link[data-ag2-immersive]')){
    const link=document.createElement('link');
    link.rel='stylesheet'; link.href='immersive.css?v=27'; link.dataset.ag2Immersive='1';
    document.head.appendChild(link);
  }

  const loader=document.getElementById('modelLoader');
  if(loader&&!loader.querySelector('.ag2-loader-track')){
    loader.innerHTML='<div class="ag2-loader-head"><span class="ag2-loader-dot"></span><strong>AG2 3D REMASTER</strong></div><div class="ag2-loader-track"><i id="ag2LoaderBar"></i></div><div class="ag2-loader-meta"><span id="ag2LoaderStatus">Preparing viewer</span><b id="ag2LoaderPercent">0%</b></div>';
  }

  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero=document.querySelector('.hero');

  function buildHeroAmbient(){
    if(!hero||hero.querySelector('.hero-ambient')) return;
    const fx=document.createElement('div');
    fx.className='hero-ambient';
    fx.innerHTML='<span class="ha-grid"></span><span class="ha-orb ha-orb-a"></span><span class="ha-orb ha-orb-b"></span><span class="ha-beam"></span><span class="ha-scan"></span>';
    for(let i=0;i<14;i++){
      const p=document.createElement('i');
      p.className='ha-particle';
      p.style.left=`${8+((i*17)%86)}%`;
      p.style.top=`${12+((i*29)%74)}%`;
      p.style.opacity=(.08+(i%5)*.035).toFixed(2);
      p.style.transform=`scale(${.65+(i%4)*.22})`;
      fx.appendChild(p);
    }
    hero.prepend(fx);
  }

  function buildSectionAmbient(){
    document.querySelectorAll('.feature-strip,.section,.join').forEach(section=>{
      if(section.querySelector(':scope > .section-ambient')) return;
      const fx=document.createElement('div');
      fx.className='section-ambient';
      fx.innerHTML='<span class="sa-grid"></span><span class="sa-glow"></span><span class="sa-line"></span>';
      section.prepend(fx);
    });
  }

  buildHeroAmbient();
  buildSectionAmbient();

  const gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
  const progress=document.querySelector('.scroll-progress')||document.createElement('div');
  if(!progress.parentNode){progress.className='scroll-progress';document.body.appendChild(progress);}
  if(!gsap||!ScrollTrigger||reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.to(progress,{scaleX:1,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:.12}});

  const splitWords=(el)=>{
    if(!el) return [];
    if(el.dataset.fxSplit) return [...el.querySelectorAll('.fx-word')];
    el.dataset.fxSplit='1';
    const text=el.textContent.trim();
    const words=text.split(/\s+/);
    el.textContent=''; el.classList.add('fx-words');
    return words.map((word,i)=>{
      const span=document.createElement('span'); span.className='fx-word'; span.textContent=word;
      el.appendChild(span); if(i<words.length-1) el.appendChild(document.createTextNode(' ')); return span;
    });
  };

  document.querySelectorAll('h1,h2,.definitive').forEach((el)=>{
    el.classList.add('fx-gradient','text-glint');
    const words=splitWords(el);
    gsap.fromTo(words,{yPercent:112,opacity:0,filter:'blur(9px)',rotateX:-16},{yPercent:0,opacity:1,filter:'blur(0px)',rotateX:0,duration:.95,stagger:.052,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 90%',once:true,onEnter:()=>{el.classList.remove('glint-on');void el.offsetWidth;el.classList.add('glint-on')}}});
    gsap.to(el,{backgroundPosition:'-120% 0',ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:.65}});
  });

  document.querySelectorAll('.kicker,.eyebrow').forEach((el)=>{
    if(el.dataset.fxLetters) return;
    el.dataset.fxLetters='1';
    const raw=el.textContent; el.textContent='';
    [...raw].forEach(ch=>{const s=document.createElement('span');s.className='fx-letter';s.textContent=ch===' '?'\u00a0':ch;el.appendChild(s)});
    gsap.fromTo(el.querySelectorAll('.fx-letter'),{y:12,opacity:0,rotateX:-75},{y:0,opacity:1,rotateX:0,duration:.58,stagger:.017,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}});
  });
  ScrollTrigger.batch('.kicker',{start:'top 91%',onEnter:els=>els.forEach(el=>el.classList.add('kicker-on'))});

  // Background motion: slow enough to feel premium rather than decorative.
  const heroFx=hero?.querySelector('.hero-ambient');
  if(heroFx){
    gsap.to(heroFx.querySelector('.ha-grid'),{yPercent:16,xPercent:-3,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1.2}});
    gsap.to(heroFx.querySelector('.ha-orb-a'),{xPercent:-18,yPercent:18,scale:1.18,opacity:.42,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1}});
    gsap.to(heroFx.querySelector('.ha-orb-b'),{xPercent:16,yPercent:-20,scale:.86,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1.15}});
    gsap.to(heroFx.querySelector('.ha-beam'),{xPercent:-18,yPercent:14,rotation:-47,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.9}});
    gsap.to(heroFx.querySelector('.ha-scan'),{y:'62vh',opacity:.05,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1.05}});
    heroFx.querySelectorAll('.ha-particle').forEach((p,i)=>{
      gsap.to(p,{y:80+(i%5)*18,x:(i%2?1:-1)*(18+(i%4)*7),opacity:.04,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.8+(i%3)*.18}});
    });
  }

  document.querySelectorAll('.feature-strip,.section,.join').forEach((section,index)=>{
    const fx=section.querySelector(':scope > .section-ambient');
    if(!fx) return;
    const line=fx.querySelector('.sa-line'),glow=fx.querySelector('.sa-glow'),grid=fx.querySelector('.sa-grid');
    gsap.fromTo(line,{scaleX:.08,opacity:.08},{scaleX:1,opacity:.5,ease:'none',scrollTrigger:{trigger:section,start:'top 94%',end:'top 54%',scrub:.65}});
    gsap.fromTo(glow,{xPercent:index%2?12:-12,yPercent:8,scale:.8,opacity:.12},{xPercent:index%2?-10:10,yPercent:-8,scale:1.15,opacity:.46,ease:'none',scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.1}});
    gsap.to(grid,{yPercent:10+(index%3)*3,xPercent:index%2?-2:2,ease:'none',scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.2}});
    const wrap=section.querySelector(':scope > .wrap');
    if(wrap){
      gsap.fromTo(wrap,{y:42,opacity:.72,scale:.992},{y:0,opacity:1,scale:1,ease:'none',scrollTrigger:{trigger:section,start:'top 96%',end:'top 66%',scrub:.75}});
    }
  });

  // Refined hero motion and type compression on scroll.
  if(hero){
    const heroTitle=hero.querySelector('h1');
    const definitive=hero.querySelector('.definitive');
    const tagline=hero.querySelector('.tagline');
    const sideCopy=hero.querySelector('.side-copy');
    gsap.to(heroTitle,{yPercent:-7,letterSpacing:'-.065em',ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.65}});
    gsap.to(definitive,{yPercent:-11,letterSpacing:innerWidth<520?'.11em':'.22em',ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.7}});
    gsap.to(tagline,{opacity:.52,yPercent:-15,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.7}});
    if(sideCopy) gsap.to(sideCopy,{yPercent:-18,letterSpacing:innerWidth<520?'.25em':'.39em',ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.75}});
    setTimeout(()=>hero.classList.add('hero-ready'),120);
  }

  // Feature strip gets a mild cinematic cascade, but individual cards remain readable.
  document.querySelectorAll('.feature-card').forEach((card,i)=>{
    const icon=card.querySelector('.ico');
    const copy=card.querySelector('div');
    if(icon) gsap.fromTo(icon,{y:20,opacity:.2,rotate:-7},{y:0,opacity:1,rotate:0,duration:.72,delay:i*.045,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 93%',once:true}});
    if(copy) gsap.fromTo(copy,{x:16,opacity:.25},{x:0,opacity:1,duration:.68,delay:i*.04,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 93%',once:true}});
  });

  // Gallery: mask reveal + subtle depth during scroll.
  document.querySelectorAll('.gallery-grid .shot').forEach((shot,i)=>{
    const from=i===0?'inset(0 100% 0 0)':'inset(100% 0 0 0)';
    gsap.fromTo(shot,{clipPath:from,filter:'brightness(.65)',rotateY:i===0?-3:3},{clipPath:'inset(0 0% 0 0)',filter:'brightness(1)',rotateY:0,duration:1.05,delay:i*.08,ease:'power4.out',scrollTrigger:{trigger:shot,start:'top 90%',once:true}});
    gsap.to(shot,{yPercent:i===0?-4:5,ease:'none',scrollTrigger:{trigger:'.gallery-grid',start:'top bottom',end:'bottom top',scrub:.8}});
  });

  // Arsenal: no boxes, with staggered floating movement instead of a flat row.
  const mm=gsap.matchMedia();
  mm.add('(min-width: 901px)',()=>{
    document.querySelectorAll('.weapon-card').forEach((card,i)=>{
      gsap.fromTo(card,{y:48+(i%2)*18,opacity:0,rotateX:8,filter:'blur(4px)'},{y:0,opacity:1,rotateX:0,filter:'blur(0px)',duration:.9,delay:i*.06,ease:'power3.out',scrollTrigger:{trigger:'.weapon-row',start:'top 88%',once:true}});
      gsap.to(card,{yPercent:i%2?-5:5,ease:'none',scrollTrigger:{trigger:'.arsenal-section',start:'top bottom',end:'bottom top',scrub:.9}});
    });
  });
  mm.add('(max-width: 900px)',()=>{
    document.querySelectorAll('.weapon-card').forEach((card,i)=>{
      gsap.fromTo(card,{y:34,opacity:0,scale:.97},{y:0,opacity:1,scale:1,duration:.72,delay:i*.045,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 92%',once:true}});
    });
  });

  document.querySelectorAll('.section-copy p,.weapons-heading p,.join p').forEach(el=>{
    const words=splitWords(el);
    gsap.fromTo(words,{opacity:.08,y:10},{opacity:1,y:0,duration:.48,stagger:.013,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}});
  });

  // Join section uses opposing movement to create a stronger final CTA moment.
  const join=document.querySelector('.join');
  if(join){
    const left=join.querySelector('.join-inner>div:first-child');
    const right=join.querySelector('.download-block');
    if(left) gsap.fromTo(left,{x:-52,opacity:.25},{x:0,opacity:1,ease:'none',scrollTrigger:{trigger:join,start:'top 90%',end:'top 58%',scrub:.7}});
    if(right) gsap.fromTo(right,{x:52,opacity:.25},{x:0,opacity:1,ease:'none',scrollTrigger:{trigger:join,start:'top 90%',end:'top 58%',scrub:.7}});
    gsap.to('.join-parallax',{scale:1.08,yPercent:9,ease:'none',scrollTrigger:{trigger:join,start:'top bottom',end:'bottom top',scrub:1}});
  }

  const footer=document.querySelector('footer');
  if(footer) gsap.fromTo('.footer-inner',{y:28,opacity:0},{y:0,opacity:1,duration:.85,ease:'power3.out',scrollTrigger:{trigger:footer,start:'top 94%',once:true}});

  document.querySelectorAll('.btn-primary').forEach(btn=>{
    btn.addEventListener('pointermove',e=>{if(matchMedia('(pointer:fine)').matches){const r=btn.getBoundingClientRect();gsap.to(btn,{x:(e.clientX-r.left-r.width/2)*.035,y:(e.clientY-r.top-r.height/2)*.035,duration:.25,overwrite:true})}});
    btn.addEventListener('pointerleave',()=>gsap.to(btn,{x:0,y:0,duration:.5,ease:'elastic.out(1,.45)'}));
  });

  window.addEventListener('ag2-model-ready',()=>{
    gsap.fromTo('.model-stage',{filter:'brightness(.66) saturate(.75)',scale:.975},{filter:'brightness(1) saturate(1)',scale:1,duration:1.05,ease:'power3.out'});
    gsap.fromTo('.model-glow',{opacity:.08,scale:.75},{opacity:1,scale:1,duration:1.35,ease:'power3.out'});
  },{once:true});

  window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
