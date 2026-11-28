// Cadenzo · séances guidées : renfo et mobilité avec minuteur, enchaînement automatique et pictogrammes animés.
// Tout est dessiné ici (pictogrammes originaux en SVG) : aucune image à télécharger, ça marche hors connexion.
(function(){
"use strict";

// ---------- dessins et fiches : tout vient de exo.js / exo-txt.js ----------
function figKey(name){return window.EXO?EXO.find(name):null;}
function img(name,thumb){var id=figKey(name); if(!id||!window.EXO)return ''; return EXO.one(id,false);}
function reduced(){try{return window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;}catch(e){return false;}}
function imgDyn(name){var id=figKey(name); if(!id||!window.EXO)return ''; return reduced()?EXO.one(id,true):EXO.one(id,false,true);}
function tempo(s){var m=/descente en (\d)\s*s/.exec((s&&(s.amount||s.sub))||""); var n=m?+m[1]:0; return n>=4?5400:n===3?4200:2600;}
function stopAnim(){if(W&&W.stop){try{W.stop();}catch(e){}W.stop=null;}}
function zone(name){var id=figKey(name); return id&&window.EXO?EXO.zone(id):"";}

// ---------- construction de la séance ----------
function side(txt){return /par jambe/.test(txt)?["Jambe droite","Jambe gauche"]:/par c[ôo]t[ée]/.test(txt)?["Côté droit","Côté gauche"]:/chaque sens/.test(txt)?["Sens horaire","Sens inverse"]:null;}
function build(kind,code,R,MOB,MS){
  var S=[], list, tours=1, rest=0, title;
  if(kind==="mob"){var ms=MS&&MS[code||"complet"]; list=ms?ms.ex:MOB; title=ms?ms.name:"Mobilité";}
  else{var r=R[code]; list=r.ex; title=r.name; var mt=/(\d+)\s*tours/.exec(r.tours); tours=mt?+mt[1]:1; var mr=/(\d+)\s*s de repos/.exec(r.tours); rest=mr?+mr[1]:45;}
  S.push({t:"ready",name:"Prépare-toi",sec:10,sub:"On commence par : "+list[0][0],fig:list[0][0]});
  for(var t=1;t<=tours;t++){
    list.forEach(function(e,i){
      var name=e[0], q=String(e[1]), sd=side(q), mm=/^(\d+)\s*[×x]\s*(\d+)\s*s/.exec(q), ms=/^(\d+)\s*s\b/.exec(q), mr2=/^(\d+)/.exec(q);
      var note=(q.split(",")[1]||"").trim(), sets=1, sec=0, reps=0;
      if(mm){sets=+mm[1]; sec=+mm[2];} else if(ms){sec=+ms[1];} else if(mr2){reps=+mr2[1];}
      var tag=tours>1?"Tour "+t+"/"+tours:"";
      for(var s=1;s<=sets;s++){
        var sides=sd||[null];
        sides.forEach(function(sl,k){
          var lab=[tag,sets>1?"Série "+s+"/"+sets:"",sl].filter(Boolean).join(" · ");
          S.push({t:"ex",name:name,fig:name,id:figKey(name),sec:sec,reps:reps,sub:lab,note:note,amount:q});
          if(sec&&(sd&&k===0||(!sd&&sets>1&&s<sets)||(sd&&k===1&&s<sets)))S.push({t:"rest",name:sd&&k===0?"Change de côté":"Souffle",sec:5,sub:"Ensuite : "+name,fig:name});
        });
      }
      var last=(i===list.length-1&&t===tours);
      if(!last&&rest){var nx=(i===list.length-1)?list[0][0]:list[i+1][0]; S.push({t:"rest",name:"Repos",sec:rest,sub:(i===list.length-1?"Tour "+(t+1)+" · ":"")+"Ensuite : "+nx,fig:nx});}
      else if(!last&&kind==="mob")S.push({t:"rest",name:"Transition",sec:5,sub:"Ensuite : "+list[i+1][0],fig:list[i+1][0]});
    });
  }
  return {title:title,steps:S,kind:kind,code:code,count:list.length};
}
function total(w){return w.steps.reduce(function(a,s){return a+(s.sec||(s.reps?s.reps*4:20));},0);}
function minutes(w){return Math.max(1,Math.round(total(w)/60));}

// ---------- lecteur ----------
var opener=null, W=null, el=null, tick=null, wake=null, ac=null, ctx={};
function $(id){return document.getElementById(id);}
function mmss(s){s=Math.max(0,Math.ceil(s)); return Math.floor(s/60)+":"+(s%60<10?"0":"")+(s%60);}
function beep(f,d){try{if(!ac)return; var o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=f; o.type="sine"; g.gain.value=.15; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+d);}catch(e){}}
function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function ensure(){
  if(el)return el; el=document.createElement("section"); el.id="wo"; el.className="wo"; el.hidden=true; el.setAttribute("aria-label","Séance guidée"); el.setAttribute("role","dialog"); el.setAttribute("aria-modal","true"); el.setAttribute("tabindex","-1"); document.body.appendChild(el);
  el.addEventListener("keydown",function(e){ if(e.key==="Escape"){close();return;} if(e.key!=="Tab")return; var f=[].slice.call(el.querySelectorAll("button:not([disabled])")).filter(function(x){return x.offsetParent!==null;}); if(!f.length)return; var a=document.activeElement; if(a===el||!el.contains(a)){e.preventDefault(); f[0].focus(); return;} if(e.shiftKey&&a===f[0]){e.preventDefault(); f[f.length-1].focus();} else if(!e.shiftKey&&a===f[f.length-1]){e.preventDefault(); f[0].focus();} });
  el.addEventListener("click",function(e){var b=e.target.closest("button"); if(!b)return; var a=b.dataset.wa; if(!a)return;
    if(a==="close")close(); else if(a==="pause")toggle(); else if(a==="next")go(W.i+1); else if(a==="prev")go(W.i-1); else if(a==="done")go(W.i+1);
    else if(a==="tech"){W.tech=!W.tech; render();} else if(a==="mob"){var c=ctx, mc=W.w.mobNext||null; close(true); start("mob",mc,c);} else if(a==="sound"){W.mute=!W.mute; render();}});
  return el;
}
function start(kind,code,c){
  ctx=c||ctx; var R=ctx.RENFO, M=ctx.MOB; if(!R||!M)return;
  var w=build(kind,code,R,M,ctx.MOBS); ensure();
  W={w:w,i:0,left:0,end:0,paused:false,t0:Date.now(),mute:false,last:-1,el0:Date.now()};
  try{var AC=window.AudioContext||window.webkitAudioContext; if(AC&&!ac)ac=new AC(); if(ac&&ac.state==="suspended")ac.resume();}catch(e){}
  try{if(navigator.wakeLock)navigator.wakeLock.request("screen").then(function(x){wake=x;}).catch(function(){});}catch(e){}
  if(el.hidden)opener=document.activeElement; el.hidden=false; document.body.style.overflow="hidden"; var sh=$("sheet"); if(sh&&!sh.hidden&&ctx.closeSheet)ctx.closeSheet();
  begin(0); try{el.focus({preventScroll:true});}catch(e){} clearInterval(tick); tick=setInterval(loop,250);
}
function close(keep){
  stopAnim(); clearInterval(tick); tick=null; if(el)el.hidden=true; if(!keep)document.body.style.overflow=""; try{if(wake){wake.release();wake=null;}}catch(e){} W=null; if(!keep&&opener&&document.contains(opener)){try{opener.focus({preventScroll:true});}catch(e){}} if(!keep)opener=null;
}
function begin(i){
  var s=W.w.steps[i]; W.i=i; W.paused=false; W.last=-1; W.el0=Date.now();
  if(s&&s.sec){W.left=s.sec; W.end=Date.now()+s.sec*1000;} else {W.left=0; W.end=0;}
  render(); try{if(!el.contains(document.activeElement))el.focus({preventScroll:true}); var lv=$("wo-live"); if(!lv){lv=document.createElement("div"); lv.id="wo-live"; lv.className="sr"; lv.setAttribute("aria-live","polite"); document.body.appendChild(lv);} if(s)lv.textContent=(s.t==="ex"?"Exercice : ":"")+s.name+(s.sec?", "+s.sec+" secondes":s.reps?", "+s.reps+" répétitions":"");}catch(e){}
  if(s&&!W.mute){if(s.t==="ex")beep(880,.18); }
  if(s&&s.t==="ex")buzz(40);
}
function go(i){ if(!W)return; if(i<0)i=0; if(i>=W.w.steps.length){finish();return;} begin(i); }
function toggle(){ if(!W)return; var s=W.w.steps[W.i]; if(!s.sec){return;} if(W.paused){W.end=Date.now()+W.left*1000; W.paused=false;} else {W.left=(W.end-Date.now())/1000; W.paused=true;} render(); }
function loop(){
  if(!W||W.paused)return; var s=W.w.steps[W.i]; if(!s)return;
  if(s.sec){var left=(W.end-Date.now())/1000; W.left=left; var sec=Math.ceil(left);
    if(sec!==W.last){W.last=sec; if(sec<=3&&sec>0&&!W.mute){beep(660,.1);} paintTime(left);}
    if(left<=0){ if(!W.mute){beep(990,.25);} buzz([120,60,120]); go(W.i+1); }
  } else paintTime(0);
}
function paintTime(left){
  var s=W.w.steps[W.i], t=el.querySelector("[data-wt]"), ring=el.querySelector("[data-wr]");
  if(t)t.textContent=s.sec?mmss(left):mmss((Date.now()-W.el0)/1000);
  if(ring&&s.sec){var f=Math.max(0,Math.min(1,left/s.sec)); ring.style.strokeDashoffset=String(Math.round((1-f)*100*10)/10);}
}
function finish(){
  clearInterval(tick); tick=null; var secs=Math.round((Date.now()-W.t0)/1000), w=W.w, mnx=w.kind==="mob"?null:((ctx.MOBFOR&&ctx.MOBFOR[w.code])||"complet"); w.mobNext=mnx;
  el.innerHTML='<div class="wo-in wo-end"><div class="wo-top"><b>'+esc(w.title)+'</b><button class="wo-x" data-wa="close" aria-label="Fermer">×</button></div>'+
    '<div class="wo-done"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-7"/></svg><h2>Séance terminée</h2><p class="wo-big num">'+mmss(secs)+'</p><p>Bien joué. '+(w.kind==="mob"?"Ton corps te remercie.":"Pense à t’hydrater et à manger dans l’heure.")+'</p></div>'+
    '<div class="wo-ctl">'+(w.kind==="mob"?"":'<button class="wo-b prim" data-wa="mob">Enchaîner : '+esc(ctx.MOBS&&ctx.MOBS[mnx]?ctx.MOBS[mnx].name:"mobilité")+' · '+minutes(build("mob",mnx,ctx.RENFO,ctx.MOB,ctx.MOBS))+' min</button>')+'<button class="wo-b" data-wa="close">Fermer</button></div></div>';
  buzz([200,80,200,80,200]); if(!W.mute){beep(660,.15); setTimeout(function(){beep(880,.15);},180); setTimeout(function(){beep(1100,.3);},360);}
}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function techBox(s){
  var id=s.t==="ex"?figKey(s.fig):null, t=id&&window.EXO&&EXO.T[id]; if(!t)return "";
  var h='<button class="wo-tb" data-wa="tech" aria-expanded="'+(W.tech?"true":"false")+'">'+(W.tech?"Masquer la technique":"Technique")+'</button>';
  if(W.tech)h+='<div class="wo-tech"><p><b>Départ</b> '+esc(t.d)+'</p><ol>'+t.e.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ol><p><b>Respiration</b> '+esc(t.r)+'</p><p><b>À éviter</b> '+esc(t.x[0])+(t.x[1]?' · '+esc(t.x[1]):'')+'</p></div>';
  return h;
}
function render(){
  if(!W)return; stopAnim(); var w=W.w, s=w.steps[W.i], n=w.steps.length, rest=s.t!=="ex", exs=w.steps.filter(function(x){return x.t==="ex";}), idx=w.steps.slice(0,W.i+1).filter(function(x){return x.t==="ex";}).length;
  var nx=null; for(var j=W.i+1;j<n;j++){if(w.steps[j].t==="ex"){nx=w.steps[j];break;}}
  var big=s.sec?'<div class="wo-ring"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15.9155" class="bg"/><circle cx="20" cy="20" r="15.9155" class="fg" data-wr="1" stroke-dasharray="100" stroke-dashoffset="0"/></svg><div class="wo-t num" data-wt="1">'+mmss(s.sec)+'</div></div>'
     :'<div class="wo-reps"><b class="num">'+s.reps+'</b><span>répétitions</span><small class="num" data-wt="1">0:00</small></div>';
  el.innerHTML='<div class="wo-in'+(rest?' wo-rest':'')+'"><div class="wo-top"><div><b>'+esc(w.title)+'</b><small class="num">'+(s.t==="ex"?'Exercice '+idx+' / '+exs.length:rest?'Pause':'')+'</small></div><div class="wo-tr"><button class="wo-x" data-wa="sound" aria-label="Son" title="Son">'+(W.mute?"🔇":"🔊")+'</button><button class="wo-x" data-wa="close" aria-label="Fermer">×</button></div></div>'+
    '<div class="wo-bar"><i style="width:'+Math.round(W.i/(n-1)*100)+'%"></i></div>'+
    '<div class="wo-stage">'+imgDyn(s.fig)+'</div>'+
    '<div class="wo-txt"><h2 class="wo-name">'+esc(s.name)+'</h2>'+
    '<p class="wo-sub">'+esc(s.sub||"")+(s.note?' · '+esc(s.note):'')+'</p>'+(s.t==="ex"&&zone(s.fig)?'<p class="wo-mus"><i></i>'+esc(zone(s.fig))+'</p>':'')+'</div>'+
    '<div class="wo-clk">'+big+'</div><div class="wo-tbw">'+techBox(s)+'</div>'+
    '<div class="wo-ctl"><button class="wo-b" data-wa="prev" aria-label="Précédent">‹</button>'+
      (s.sec?'<button class="wo-b prim" data-wa="pause">'+(W.paused?"Reprendre":"Pause")+'</button>':'<button class="wo-b prim" data-wa="done">Fait ›</button>')+
      '<button class="wo-b" data-wa="next" aria-label="Passer">›</button></div></div>';
  paintTime(W.left);
  var fg=el.querySelector(".wfig.dyn"); if(fg&&window.EXO&&EXO.animate)W.stop=EXO.animate(fg,fg.dataset.fig,tempo(s));
}

window.WORKOUT={muscles:zone,img:img,figKey:figKey,start:start,build:build,minutes:minutes,close:close};
})();
