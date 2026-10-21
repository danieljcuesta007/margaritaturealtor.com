/**
 * The site's JavaScript, inlined at build time. Every feature degrades:
 * - no JS: links are plain tel:/wa.me/mailto:, the intake shows step 1 only
 *   (so the "Call" and "WhatsApp" buttons remain the way in), the homes stage
 *   shows its first image whole.
 * - no GSAP (CDN blocked): the homes stage swaps images without the shape animation.
 * - no backend (api empty in identity.json): forms hand off to email/WhatsApp
 *   and the guide downloads directly.
 * localStorage only remembers the welcome window's state (has the toolkit,
 * said "not now" until <date>); losing it means at worst one extra ask.
 */

export const body = `(function(){
var d=document, rm=window.matchMedia('(prefers-reduced-motion: reduce)'), reduce=rm.matches;
function lget(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lset(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function sget(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function sset(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
// POST JSON with a time limit, so a hung network never leaves a form spinning.
function post(url,body,ms){
  var ctl=window.AbortController?new AbortController():null, t=setTimeout(function(){ if(ctl) ctl.abort(); },ms||10000);
  return fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:ctl?ctl.signal:undefined})
    .then(function(r){clearTimeout(t);return !!(r&&r.ok)},function(){clearTimeout(t);return false});
}
var y=d.querySelector('[data-year]'); if(y) y.textContent=new Date().getFullYear();

// Hide open-house announcements once they are over (the page may be cached).
d.querySelectorAll('[data-ends]').forEach(function(el){ if(new Date(el.dataset.ends)<new Date()) el.remove(); });

// ---- Listing galleries: a thumbnail swaps the large photo.
d.querySelectorAll('[data-gallery]').forEach(function(g){
  var main=g.querySelector('[data-main]'), pic=main&&main.parentNode.tagName==='PICTURE'?main.parentNode:null;
  g.querySelectorAll('.thumb').forEach(function(t){
    t.addEventListener('click',function(){
      if(pic){ var src=pic.querySelector('source'); if(src) src.remove(); pic=null; }
      main.removeAttribute('srcset'); main.src=t.dataset.src; main.alt=t.dataset.alt;
      g.querySelectorAll('.thumb').forEach(function(x){ var on=x===t; x.classList.toggle('is-on',on); x.setAttribute('aria-pressed',on); });
    });
  });
});

// ---- Where are you headed: GSAP shape loop over home photos.
var stage=d.querySelector('.j-stage');
if(stage){
  var items=[].slice.call(d.querySelectorAll('.j-item')), layers=[].slice.call(stage.querySelectorAll('.j-layer'));
  var active=0, tl=null, touched=false, laps=0;
  // Two laps through the three paths, then it rests on the first one: motion that never stops is noise.
  function show(i,last){
    active=i;
    items.forEach(function(b,k){b.classList.toggle('is-on',k===i);b.setAttribute('aria-pressed',k===i)});
    layers.forEach(function(g,k){g.classList.toggle('is-on',k===i)});
    if(!window.gsap||reduce) return;
    if(tl) tl.kill();
    var sel='#j-clip-'+i+' .path';
    gsap.set(sel,{scale:0,transformOrigin:'50% 50%'});
    if(last||touched){ tl=gsap.timeline(); tl.to(sel,{scale:1,duration:.8,stagger:{amount:.4,from:'random'},ease:'expo.out'}); return; }
    tl=gsap.timeline({repeat:-1,repeatDelay:.6,onRepeat:function(){ if(touched) return; laps++; show((active+1)%items.length, laps>=items.length*2); }});
    tl.to(sel,{scale:1,duration:.8,stagger:{amount:.4,from:'random'},ease:'expo.out'})
      .to(sel,{scale:1.04,duration:1.4,yoyo:true,repeat:1,ease:'sine.inOut',stagger:{amount:.2,from:'center'}})
      .to(sel,{scale:0,duration:.6,stagger:{amount:.3,from:'edges'},ease:'expo.in'});
  }
  if(rm.addEventListener) rm.addEventListener('change',function(e){ reduce=e.matches; if(!window.gsap) return; if(reduce){ if(tl) tl.kill(); gsap.set('.j-stage .path',{scale:1}); } else show(active,true); });
  items.forEach(function(b,i){
    b.addEventListener('mouseenter',function(){touched=true; if(i!==active) show(i)});
    b.addEventListener('focus',function(){touched=true; if(i!==active) show(i)});
    b.addEventListener('click',function(){
      if(i!==active){touched=true; show(i); return;}
      var t=d.querySelector(b.dataset.target); if(t) t.scrollIntoView({behavior:reduce?'auto':'smooth'});
    });
  });
  function start(){ show(0); }
  if(window.gsap) start(); else window.addEventListener('load',start);
}

// ---- Welcome window with the free toolkit. Ported from the W.O.W signup prompt:
// asks once per visit at a good moment (20s of the page actually being looked at,
// 55% down the home page, or the pointer leaving for the tabs), waits while the
// visitor is typing or another window is open, never asks someone who has the
// toolkit, and after "not now" stays quiet for 7, then 30, then 90 days.
var pop=d.getElementById('guide');
if(pop && typeof pop.showModal==='function'){
  var K={done:'mc-guide-done',quiet:'mc-guide-quiet',n:'mc-guide-no',shown:'mc-guide-shown',seen:'mc-attention'};
  var title=pop.querySelector('#guide-title'), pform=pop.querySelector('form'), fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var rect=null, queued=false, at={x:0,y:0}, how='welcome';
  function measure(){ rect=pop.open?pop.querySelector('.pop-card').getBoundingClientRect():null; }
  function open(){
    if(pop.open) return;
    pop.style.removeProperty('--p-alpha'); pop.removeAttribute('data-solid');
    pop.showModal(); measure(); title.focus({preventScroll:true}); sset(K.shown,'1');
  }
  // State is written the moment the visitor answers, not on 'close', which a background tab may never deliver.
  function close(why){
    if(!pop.open) return;
    if(why==='dismiss' && !lget(K.done)){ var n=(+lget(K.n)||0)+1; lset(K.n,n); lset(K.quiet,Date.now()+[7,30,90][Math.min(n,3)-1]*864e5); }
    if(why==='have') lset(K.done,Date.now());
    if(reduce){ pop.close(); return; }
    pop.classList.add('is-leaving'); setTimeout(function(){ pop.classList.remove('is-leaving'); pop.close(); },180);
  }
  pop.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click',function(){close('dismiss')}); });
  pop.querySelector('[data-already]').addEventListener('click',function(){close('have')});
  pop.addEventListener('click',function(e){ if(e.target===pop) close('dismiss'); });
  pop.addEventListener('cancel',function(e){ e.preventDefault(); close('dismiss'); });

  // Glass that turns to paper as the pointer approaches (the W.O.W search maths).
  if(fine){
    d.addEventListener('pointermove',function(e){
      if(!pop.open||e.pointerType==='touch') return; at={x:e.clientX,y:e.clientY}; if(queued) return; queued=true;
      requestAnimationFrame(function(){ queued=false; if(!rect) return;
        var dx=Math.max(rect.left-at.x,0,at.x-rect.right), dy=Math.max(rect.top-at.y,0,at.y-rect.bottom);
        var t=1-Math.min(Math.hypot(dx,dy)/190,1); t*=t;
        pop.style.setProperty('--p-alpha',(.78+.22*t).toFixed(3)); pop.toggleAttribute('data-solid',t>.985); });
    },{passive:true});
    addEventListener('resize',measure,{passive:true});
  }

  // 'how' records what opened it (the automatic ask, the toolkit band, or a ?guide=1 link) with the sign-up.
  d.querySelectorAll('[data-open-guide]').forEach(function(b){b.addEventListener('click',function(){ how='band'; open(); })});
  if(/[?&]guide=1/.test(location.search)){ how='link'; open(); }
  else if(!lget(K.done) && Date.now()>(+lget(K.quiet)||0) && !sget(K.shown) && d.body.classList.contains('page-home')){
    var fired=false, seen=+sget(K.seen)||0, band=d.querySelector('.giveaway');
    function busy(){
      var a=d.activeElement, r=band&&band.getBoundingClientRect();
      return !!(d.querySelector('dialog[open]') || (a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) || (r&&r.height&&r.bottom>0&&r.top<innerHeight));
    }
    function attempt(){ if(fired||busy()) return; fired=true; clearInterval(tick); open(); }
    var tick=setInterval(function(){ if(d.hidden) return; seen++; if(seen%5===0) sset(K.seen,seen); if(seen>=20) attempt(); },1000);
    addEventListener('scroll',function(){ if(seen>=8 && scrollY>(d.documentElement.scrollHeight-innerHeight)*.55) attempt(); },{passive:true});
    if(fine) d.documentElement.addEventListener('mouseleave',function(e){ if(!e.relatedTarget && e.clientY<=4 && seen>=10) attempt(); });
  }

  pform.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=pform.querySelector('[type=submit]'); if(btn.disabled) return;
    var f=new FormData(pform), api=pop.dataset.api, name=String(f.get('name')||'').trim(), email=String(f.get('email')||'').trim();
    // Open the PDF inside the submit gesture so popup blockers allow it.
    window.open(pop.dataset.pdf,'_blank','noopener');
    lset(K.done,Date.now());
    var done=pop.querySelector('.pop-done'), note=pop.querySelector('[data-note]'), mail=pop.querySelector('[data-note-mail]');
    // Sign the one-tap note with what they typed, so Margarita can add them straight away.
    mail.href=mail.href.replace(/(body=[^&]*)/,function(m){ return m+encodeURIComponent('\\n\\n'+name+' <'+email+'>'); });
    function showNote(failed){ note.hidden=false; if(failed) note.querySelector('[data-failed]').hidden=false; }
    pform.hidden=true; done.hidden=false;
    if(!api){ showNote(false); return; }
    btn.disabled=true;
    post(api,{name:name,email:email,lang:pop.dataset.lang,source:how,page:location.pathname,mc_trap:String(f.get('mc_trap')||'')},8000).then(function(ok){
      if(ok) pop.querySelector('[data-saved]').hidden=false; else showNote(true);
    });
  });
}

// ---- Work with me: four-step intake.
var form=d.querySelector('.intake');
if(form){
  var steps=[].slice.call(form.querySelectorAll('.step')), dots=[].slice.call(form.querySelectorAll('.stepper li'));
  var back=form.querySelector('[data-back]'), next=form.querySelector('[data-next]'), submit=form.querySelector('[data-submit]');
  var bookingMap={}; try{ bookingMap=JSON.parse(form.dataset.booking||'{}'); }catch(e){}
  var anyBooking=Object.keys(bookingMap).map(function(k){return bookingMap[k]}).filter(Boolean);
  var booking=bookingMap.discovery||anyBooking[0]||'', cur=0, q=new URLSearchParams(location.search);
  var listings=JSON.parse(form.querySelector('[data-listings]').textContent||'[]');

  if(booking){ form.querySelectorAll('[data-no-booking]').forEach(function(x){x.hidden=true}); form.querySelector('[data-booking-only]').hidden=false; }
  else form.querySelectorAll('[data-req-nobooking]').forEach(function(i){i.required=true});
  var g=q.get('goal'); [].forEach.call(form.querySelectorAll('input[name=goal]'),function(r){ if(r.value===g) r.checked=true; });
  // ?area=Cary (from an Around the Triangle card) starts the areas answer for them.
  var area=q.get('area'); if(area && form.areas && !form.areas.value) form.areas.value=area.slice(0,60);
  var lid=q.get('listing'), L=listings.filter(function(x){return x.id===lid})[0];
  if(L){ var chip=form.querySelector('.listing-chip'); chip.hidden=false; chip.querySelector('[data-listing-name]').textContent=L.name; chip.querySelector('input').value=L.name; }
  var today=new Date(); today.setMinutes(today.getMinutes()-today.getTimezoneOffset());
  form.querySelectorAll('input[type=date]').forEach(function(i){ i.min=today.toISOString().slice(0,10); });

  function goal(){ var c=form.querySelector('input[name=goal]:checked'); return c?c.value:'buy'; }
  function sync(){
    form.querySelectorAll('.when').forEach(function(w){ w.hidden=w.dataset.when.split(' ').indexOf(goal())<0; });
  }
  function go(i,scroll){
    cur=i; steps.forEach(function(s,k){ s.hidden=k!==i; s.classList.toggle('is-on',k===i); });
    dots.forEach(function(li,k){ li.classList.toggle('is-on',k===i); li.classList.toggle('is-done',k<i); if(k===i) li.setAttribute('aria-current','step'); else li.removeAttribute('aria-current'); });
    back.hidden=i===0; next.hidden=i===steps.length-1; submit.hidden=i!==steps.length-1;
    sync(); var first=steps[i].querySelector('input,select,textarea'); if(first && i>0) first.focus({preventScroll:true});
    if(scroll) form.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  }
  function valid(i){
    var ok=true;
    steps[i].querySelectorAll('input,select,textarea').forEach(function(el){
      if(el.closest('.when[hidden],[data-no-booking][hidden]')) return;
      var box=el.closest('.q')||el.closest('label');
      if(!el.checkValidity()){ ok=false; if(box) box.classList.add('is-bad'); }
      else if(box && !box.querySelector(':invalid')) box.classList.remove('is-bad');
    });
    if(!ok){ var bad=steps[i].querySelector('.is-bad input, .is-bad select, .is-bad textarea'); if(bad) bad.focus(); }
    return ok;
  }
  next.addEventListener('click',function(){ if(valid(cur)) go(cur+1,true); });
  back.addEventListener('click',function(){ go(cur-1,true); });
  form.addEventListener('change',sync);

  function brief(){
    var lines=[];
    steps.forEach(function(s){
      lines.push('== '+s.querySelector('legend').textContent+' ==');
      var seen={};
      s.querySelectorAll('input,select,textarea').forEach(function(el){
        if(el.closest('.when[hidden],[data-no-booking][hidden]') || seen[el.name] || el.type==='hidden') return;
        var m=/^slot(\\d)$/.exec(el.name); if(m && !form['day'+m[1]].value) return;
        var v; if(el.type==='radio'){ seen[el.name]=1; var c=s.querySelector('input[name="'+el.name+'"]:checked'); v=c?c.parentNode.textContent.trim():''; }
        else if(el.type==='checkbox') v=el.checked?'Yes':''; else v=el.value.trim();
        if(!v) return;
        var lab=el.closest('.q') ? el.closest('.q').querySelector('.q-l').textContent : el.type==='checkbox' ? el.closest('label').textContent : el.closest('label').firstChild.textContent;
        lines.push(lab.trim()+': '+v);
      });
    });
    var li=form.querySelector('input[name=listing]').value; if(li) lines.unshift('Listing: '+li);
    return lines.join('\\n');
  }
  function data(){
    var o={}; new FormData(form).forEach(function(v,k){ o[k]=v; });
    o.lang=form.dataset.lang; o.submittedAt=new Date().toISOString(); o.page=location.pathname; return o;
  }
  form.addEventListener('submit',function(e){
    e.preventDefault(); if(form.dataset.busy || !valid(cur)) return;
    // Enter in a field submits the form from any step: treat it as Continue until the last step.
    if(cur<steps.length-1){ go(cur+1,true); return; }
    var text=brief(), name=(form.firstName.value+' '+form.lastName.value).trim();
    var subject=form.dataset.subject+': '+name+' ('+goal()+')';
    var mail='mailto:'+form.dataset.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);
    var wa=form.dataset.wa+'?text='+encodeURIComponent(subject+'\\n\\n'+text);
    var doneEl=form.querySelector('.done');
    function finish(sent){
      delete form.dataset.busy; submit.disabled=false;
      if(!sent) ['[data-done-title]','[data-done-body]'].forEach(function(q){ var el=doneEl.querySelector(q); el.textContent=el.dataset.unsent; });
      steps.forEach(function(s){s.hidden=true}); form.querySelector('.form-nav').hidden=true; form.querySelector('.stepper').hidden=true;
      doneEl.hidden=false; doneEl.focus();
      if(booking){
        // The Calendly event that fits: a showing if they came from a listing, else by goal.
        var g=goal(), fromListing=form.listing.value && (g==='buy'||g==='invest');
        var url=(fromListing && bookingMap.showing) || bookingMap[g] || booking;
        var b=doneEl.querySelector('[data-booking-link]'); b.hidden=false;
        try{ var U=new URL(url); U.searchParams.set('name',name); U.searchParams.set('email',form.email.value); b.href=U.toString(); }catch(e){ b.href=url; }
      }
      if(!sent){
        var fb=doneEl.querySelector('[data-fallback]'); fb.hidden=false;
        fb.querySelector('[data-send-email]').href=mail; fb.querySelector('[data-send-wa]').href=wa;
        // No automatic launch of the mail app: it surprised people (Daniel, 19 Oct 2026). They tap to send.
      }
    }
    var api=form.dataset.api;
    if(api){
      form.dataset.busy='1'; submit.disabled=true; submit.firstChild.textContent=submit.dataset.sending+' ';
      post(api,{brief:text,fields:data(),mc_trap:form.mc_trap.value},10000).then(finish);
    } else finish(false);
  });
  go(0);
}
})();`;
