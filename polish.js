(()=>{
  const gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
  const progress=document.createElement('div'); progress.className='scroll-progress'; document.body.appendChild(progress);
  if(!gsap||!ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.to(progress,{scaleX:1,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:.12}});

  const splitWords=(el)=>{
    if(!el||el.dataset.fxSplit) return [];
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
    el.classList.add('fx-gradient');
    const words=splitWords(el);
    gsap.fromTo(words,{yPercent:115,opacity:0,filter:'blur(8px)'},{yPercent:0,opacity:1,filter:'blur(0px)',duration:.9,stagger:.055,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
    gsap.to(el,{backgroundPosition:'-120% 0',ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}});
  });

  document.querySelectorAll('.kicker,.eyebrow').forEach((el)=>{
    const raw=el.textContent; el.textContent='';
    [...raw].forEach(ch=>{const s=document.createElement('span');s.className='fx-letter';s.textContent=ch===' '?'\u00a0':ch;el.appendChild(s)});
    gsap.fromTo(el.querySelectorAll('.fx-letter'),{y:12,opacity:0,rotateX:-70},{y:0,opacity:1,rotateX:0,duration:.55,stagger:.018,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});
  });
  ScrollTrigger.batch('.kicker',{start:'top 90%',onEnter:els=>els.forEach(el=>el.classList.add('kicker-on'))});

  gsap.utils.toArray('.feature-card').forEach((card,i)=>{
    gsap.fromTo(card,{y:34,opacity:0,clipPath:'inset(0 0 100% 0)'},{y:0,opacity:1,clipPath:'inset(0 0 0% 0)',duration:.8,delay:i*.03,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 92%',once:true}});
  });

  gsap.fromTo('.weapon-card',{y:42,opacity:0,rotateX:8},{y:0,opacity:1,rotateX:0,duration:.8,stagger:.08,ease:'power3.out',scrollTrigger:{trigger:'.weapon-row',start:'top 90%',once:true}});
  gsap.to('.weapon-row',{xPercent:-3,ease:'none',scrollTrigger:{trigger:'.arsenal-section',start:'top bottom',end:'bottom top',scrub:.8}});
  gsap.to('.model-stage',{yPercent:5,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:.55}});
  gsap.to('.hero-copy',{yPercent:-5,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:.55}});
  gsap.to('.hero-diagonal',{xPercent:7,yPercent:-4,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});

  document.querySelectorAll('.section-copy p,.weapons-heading p,.join p').forEach(el=>{
    const words=splitWords(el);
    gsap.fromTo(words,{opacity:.12,y:9},{opacity:1,y:0,duration:.45,stagger:.014,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
  });

  document.querySelectorAll('.btn-primary').forEach(btn=>{
    btn.addEventListener('pointermove',e=>{if(matchMedia('(pointer:fine)').matches){const r=btn.getBoundingClientRect();gsap.to(btn,{x:(e.clientX-r.left-r.width/2)*.035,y:(e.clientY-r.top-r.height/2)*.035,duration:.25,overwrite:true})}});
    btn.addEventListener('pointerleave',()=>gsap.to(btn,{x:0,y:0,duration:.5,ease:'elastic.out(1,.45)'}));
  });

  window.addEventListener('ag2-model-ready',()=>{
    gsap.fromTo('.model-stage',{filter:'brightness(.72)',scale:.985},{filter:'brightness(1)',scale:1,duration:.85,ease:'power2.out'});
    gsap.fromTo('.model-glow',{opacity:.15,scale:.8},{opacity:1,scale:1,duration:1.2,ease:'power3.out'});
  },{once:true});

  window.addEventListener('load',()=>ScrollTrigger.refresh());
})();
