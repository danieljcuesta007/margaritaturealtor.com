/**
 * The only JavaScript on the site, inlined at build time. The page works
 * without it: links are plain tel:/sms:/wa.me/mailto:, and the form falls back
 * to a mailto: post. localStorage holds only the light/dark choice, a per-
 * visitor convenience; losing it just means following the system setting.
 */

// Runs in <head> before paint, so a saved dark choice never flashes light.
export const head = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export const body = `(function(){
var root=document.documentElement;
var btn=document.querySelector('.theme');
function isDark(){var t=root.dataset.theme;if(t)return t==='dark';return window.matchMedia('(prefers-color-scheme: dark)').matches}
if(btn)btn.addEventListener('click',function(){var next=isDark()?'light':'dark';root.dataset.theme=next;try{localStorage.setItem('theme',next)}catch(e){}});
var y=document.querySelector('[data-year]');if(y)y.textContent=new Date().getFullYear();
var form=document.querySelector('.form');
if(form){
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var channel=(ev.submitter&&ev.submitter.dataset.channel)||'email';
    var f=new FormData(form),lines=[];
    form.querySelectorAll('label').forEach(function(l){var el=l.querySelector('input,select,textarea');if(!el)return;var v=(f.get(el.name)||'').toString().trim();if(v)lines.push(l.firstChild.textContent.trim()+': '+v)});
    var text=lines.join('\\n');
    if(channel==='whatsapp'){window.open(form.dataset.wa+'?text='+encodeURIComponent(text),'_blank','noopener');return}
    var name=(f.get('name')||'').toString().trim();
    location.href='mailto:'+form.dataset.email+'?subject='+encodeURIComponent(form.dataset.subject+(name?' - '+name:''))+'&body='+encodeURIComponent(text);
  });
}
})();`;
