/**
 * The site's JavaScript, inlined at build time. Every feature degrades:
 * - no JS: links are plain tel:/wa.me/mailto:, the intake shows step 1 only
 *   (so the "Call" and "WhatsApp" buttons remain the way in), the homes stage
 *   shows its first image whole.
 * - no GSAP (CDN blocked): the homes stage swaps images without the shape animation.
 * - no backend (api empty in identity.json): forms hand off to email/WhatsApp
 *   and the guide downloads directly.
 * localStorage only remembers "popup already shown"; losing it is harmless.
 */

export const body = `(function(){
var d=document, reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var y=d.querySelector('[data-year]'); if(y) y.textContent=new Date().getFullYear();

// Hide open-house announcements once they are over (the page may be cached).
d.querySelectorAll('[data-ends]').forEach(function(el){ if(new Date(el.dataset.ends)<new Date()) el.remove(); });

// ---- Listing flip cards: hover flips on mouse devices, the button flips anywhere.
d.querySelectorAll('[data-flip]').forEach(function(card){
  card.querySelectorAll('.flip-btn').forEach(function(b){
    b.addEventListener('click',function(){
      var on=!card.classList.contains('is-flipped'); card.classList.toggle('is-flipped',on);
      card.querySelectorAll('.flip-btn').forEach(function(x){x.setAttribute('aria-expanded',on)});
    });
  });
});

// ---- Where are you headed: GSAP shape loop over home photos.
var stage=d.querySelector('.j-stage');
if(stage){
  var items=[].slice.call(d.querySelectorAll('.j-item')), layers=[].slice.call(stage.querySelectorAll('.j-layer'));
  var active=0, tl=null, touched=false;
  function show(i){
    active=i;
    items.forEach(function(b,k){b.classList.toggle('is-on',k===i);b.setAttribute('aria-pressed',k===i)});
    layers.forEach(function(g,k){g.classList.toggle('is-on',k===i)});
    if(!window.gsap||reduce) return;
    if(tl) tl.kill();
    var sel='#j-clip-'+i+' .path';
    gsap.set(sel,{scale:0,transformOrigin:'50% 50%'});
    tl=gsap.timeline({repeat:-1,repeatDelay:.6,onRepeat:function(){ if(!touched) show((active+1)%items.length); }});
    tl.to(sel,{scale:1,duration:.8,stagger:{amount:.4,from:'random'},ease:'expo.out'})
      .to(sel,{scale:1.04,duration:1.4,yoyo:true,repeat:1,ease:'sine.inOut',stagger:{amount:.2,from:'center'}})
      .to(sel,{scale:0,duration:.6,stagger:{amount:.3,from:'edges'},ease:'expo.in'});
  }
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

// ---- Free guide popup.
var pop=d.getElementById('guide');
if(pop && typeof pop.showModal==='function'){
  var KEY='mc-guide-seen', seen=false;
  try{ seen=Date.now()-(+localStorage.getItem(KEY)||0) < 14*864e5; }catch(e){}
  function open(){ if(pop.open) return; pop.showModal(); try{localStorage.setItem(KEY,Date.now())}catch(e){} }
  pop.querySelector('[data-close]').addEventListener('click',function(){pop.close()});
  pop.addEventListener('click',function(e){ if(e.target===pop) pop.close(); });
  d.querySelectorAll('[data-open-guide]').forEach(function(b){b.addEventListener('click',open)});
  if(/[?&]guide=1/.test(location.search)) open();
  else if(!seen && !d.body.classList.contains('page-work')){
    var armed=true;
    function auto(){ if(!armed) return; armed=false; open(); }
    setTimeout(auto,20000);
    window.addEventListener('scroll',function(){ if(armed && scrollY>(d.body.scrollHeight-innerHeight)*.55) auto(); },{passive:true});
  }
  pop.querySelector('form').addEventListener('submit',function(e){
    e.preventDefault();
    var f=new FormData(e.target), api=pop.dataset.api;
    var payload={name:f.get('name'),email:f.get('email'),lang:pop.dataset.lang,source:'guide',page:location.pathname};
    // Open the PDF inside the submit gesture so popup blockers allow it; record the lead in the background.
    window.open(pop.dataset.pdf,'_blank','noopener');
    e.target.hidden=true; pop.querySelector('.pop-done').hidden=false;
    if(api) fetch(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(function(){});
  });
}

// ---- Work with me: four-step intake.
var form=d.querySelector('.intake');
if(form){
  var steps=[].slice.call(form.querySelectorAll('.step')), dots=[].slice.call(form.querySelectorAll('.stepper li'));
  var back=form.querySelector('[data-back]'), next=form.querySelector('[data-next]'), submit=form.querySelector('[data-submit]');
  var booking=form.dataset.booking, cur=0, q=new URLSearchParams(location.search);
  var listings=JSON.parse(form.querySelector('[data-listings]').textContent||'[]');

  if(booking){ form.querySelector('[data-no-booking]').hidden=true; form.querySelector('[data-booking-only]').hidden=false; }
  else form.querySelectorAll('[data-req-nobooking]').forEach(function(i){i.required=true});
  var g=q.get('goal'); [].forEach.call(form.querySelectorAll('input[name=goal]'),function(r){ if(r.value===g) r.checked=true; });
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
    e.preventDefault(); if(!valid(cur)) return;
    // Enter in a field submits the form from any step: treat it as Continue until the last step.
    if(cur<steps.length-1){ go(cur+1,true); return; }
    var text=brief(), name=(form.firstName.value+' '+form.lastName.value).trim();
    var subject=form.dataset.subject+': '+name+' ('+goal()+')';
    var mail='mailto:'+form.dataset.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);
    var wa=form.dataset.wa+'?text='+encodeURIComponent(subject+'\\n\\n'+text);
    var doneEl=form.querySelector('.done');
    function finish(sent){
      steps.forEach(function(s){s.hidden=true}); form.querySelector('.form-nav').hidden=true; form.querySelector('.stepper').hidden=true;
      doneEl.hidden=false; doneEl.focus();
      if(booking){ var b=doneEl.querySelector('[data-booking-link]'); b.hidden=false; b.href=booking; }
      if(!sent){
        var fb=doneEl.querySelector('[data-fallback]'); fb.hidden=false;
        fb.querySelector('[data-send-email]').href=mail; fb.querySelector('[data-send-wa]').href=wa;
        location.href=mail;
      }
    }
    var api=form.dataset.api;
    if(api){
      fetch(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({brief:text,fields:data()})})
        .then(function(r){ finish(r.ok); },function(){ finish(false); });
    } else finish(false);
  });
  go(0);
}
})();`;
