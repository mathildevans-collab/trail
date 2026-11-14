// Cadenzo · séances guidées : renfo et mobilité avec minuteur, enchaînement automatique et pictogrammes animés.
// Tout est dessiné ici (pictogrammes originaux en SVG) : aucune image à télécharger, ça marche hors connexion.
(function(){
"use strict";

// ---------- pictogrammes ----------
// Personnage de profil, vu de gauche à droite. Une pose = tête, cou, bassin, bras proche, bras loin, jambe proche, jambe loin
// (coude ou genou, puis main ou pied). Deux poses par mouvement : le dessin alterne de l’une à l’autre.
function F(h,n,p,a,b,l,m){return {h:h,n:n,p:p,a:a,b:b,l:l,m:m};}
var STAND=F([58,13],[58,22],[58,42],[[58,32],[58,42]],[[60,32],[60,42]],[[58,57],[58,70]],[[61,57],[61,70]]);
function mir(q){function X(a){return [120-a[0],a[1]];} function L(a){return [X(a[0]),X(a[1])];} return F(X(q.h),X(q.n),X(q.p),L(q.a),L(q.b),L(q.l),L(q.m));}
function up(q,dy){function Y(a){return [a[0],a[1]-dy];} function L(a){return [Y(a[0]),Y(a[1])];} return F(Y(q.h),Y(q.n),Y(q.p),L(q.a),L(q.b),L(q.l),L(q.m));}
var PROP={
  step:'<rect x="46" y="62" width="38" height="10" rx="2"/>',
  stepL:'<rect x="44" y="64" width="40" height="8" rx="2"/>',
  wall:'<path d="M24 6V72"/>',
  wallR:'<path d="M98 6V72"/>',
  chair:'<path d="M24 56h26M26 56V72M48 56V72M24 40V56"/>',
  couch:'<rect x="2" y="52" width="26" height="20" rx="3"/>',
  chairS:'<path d="M18 56h22M20 56V72M38 56V72"/>',
  chairA:'<path d="M26 48h26M28 48V72M50 48V72"/>'
};
var FIG={
  stand:{a:STAND},
  squat:{a:F([60,12],[58,21],[58,41],[[67,27],[77,28]],[[69,27],[79,28]],[[58,56],[58,70]],[[61,56],[61,70]]),
         b:F([66,28],[58,36],[44,54],[[70,38],[80,38]],[[72,38],[82,38]],[[70,56],[58,70]],[[73,56],[61,70]])},
  jumpsquat:{a:F([66,28],[58,36],[44,54],[[70,38],[80,38]],[[72,38],[82,38]],[[70,56],[58,70]],[[73,56],[61,70]]),
         b:up(F([60,12],[58,21],[58,41],[[56,10],[56,0]],[[60,10],[60,0]],[[58,56],[58,66]],[[61,56],[61,66]]),-4)},
  lunge:{a:F([58,12],[58,21],[58,41],[[52,34],[57,43]],[[54,34],[59,43]],[[58,57],[58,70]],[[61,57],[61,70]]),
         b:F([58,24],[58,33],[58,53],[[51,44],[57,53]],[[53,44],[59,53]],[[73,58],[72,70]],[[46,66],[32,68]])},
  sidelunge:{a:F([60,13],[60,22],[60,44],[[54,32],[58,38]],[[66,32],[62,38]],[[56,58],[54,70]],[[64,58],[66,70]]),
         b:F([76,24],[74,32],[74,50],[[68,40],[72,46]],[[80,40],[76,46]],[[92,58],[94,70]],[[56,60],[44,70]])},
  lungetwist:{a:F([58,24],[58,33],[58,53],[[66,38],[76,36]],[[68,38],[78,38]],[[73,58],[72,70]],[[46,66],[32,68]]),
         b:F([58,24],[58,33],[58,53],[[68,28],[78,24]],[[48,28],[38,24]],[[73,58],[72,70]],[[46,66],[32,68]])},
  bridge:{a:F([18,66],[28,67],[56,67],[[42,68],[54,68]],[[43,69],[55,69]],[[72,53],[80,69]],[[74,54],[82,69]]),
         b:F([18,66],[28,67],[56,48],[[42,68],[54,68]],[[43,69],[55,69]],[[74,50],[80,69]],[[76,51],[82,69]])},
  bridge1:{a:F([18,66],[28,67],[56,67],[[42,68],[54,68]],[[43,69],[55,69]],[[72,53],[80,69]],[[84,48],[98,44]]),
         b:F([18,66],[28,67],[56,48],[[42,68],[54,68]],[[43,69],[55,69]],[[74,50],[80,69]],[[86,40],[102,34]])},
  hamslide:{a:F([18,66],[28,67],[56,52],[[42,68],[54,68]],[[43,69],[55,69]],[[74,50],[80,69]],[[76,51],[82,69]]),
         b:F([18,66],[28,67],[56,54],[[42,68],[54,68]],[[43,69],[55,69]],[[76,60],[96,69]],[[78,61],[98,70]])},
  calf:{a:F([58,13],[58,22],[58,42],[[58,32],[58,42]],[[60,32],[60,42]],[[58,57],[58,70]],[[61,57],[61,70]]),
         b:F([58,6],[58,15],[58,35],[[58,25],[58,35]],[[60,25],[60,35]],[[58,52],[58,66]],[[61,52],[61,66]]), prop:"step"},
  plank:{a:F([96,46],[88,50],[50,58],[[88,66],[100,66]],[[90,66],[102,66]],[[32,63],[14,68]],[[33,64],[15,69]]),
         b:F([96,45],[88,49],[50,56],[[88,66],[100,66]],[[90,66],[102,66]],[[32,62],[14,68]],[[33,63],[15,69]])},
  plankTap:{a:F([96,38],[88,42],[50,52],[[88,56],[88,68]],[[90,56],[90,68]],[[32,60],[14,68]],[[33,61],[15,69]]),
         b:F([96,38],[88,42],[50,52],[[96,50],[94,40]],[[90,56],[90,68]],[[32,60],[14,68]],[[33,61],[15,69]])},
  sideplank:{a:F([90,38],[84,46],[52,58],[[84,66],[98,66]],[[84,30],[84,18]],[[36,63],[20,68]],[[38,64],[22,69]]),
         b:F([90,32],[84,40],[52,50],[[84,66],[98,66]],[[84,26],[84,14]],[[36,56],[20,68]],[[40,40],[24,34]])},
  wallsit:{a:F([34,22],[34,31],[34,54],[[40,42],[50,53]],[[42,42],[52,53]],[[58,54],[58,70]],[[60,54],[60,70]]), prop:"wall"},
  birddog:{a:F([88,38],[80,44],[44,46],[[80,56],[80,67]],[[82,56],[82,67]],[[44,57],[44,67]],[[46,58],[36,68]]),
         b:F([90,36],[80,42],[44,44],[[80,56],[80,67]],[[92,40],[108,38]],[[44,57],[44,67]],[[30,44],[12,42]])},
  stepup:{a:F([58,12],[58,21],[58,40],[[58,30],[58,40]],[[60,30],[60,40]],[[68,50],[68,64]],[[56,56],[50,70]]), prop:"stepL",
         b:F([66,8],[66,17],[66,36],[[66,26],[66,36]],[[68,26],[68,36]],[[66,50],[66,64]],[[76,42],[72,54]])},
  bulgarian:{a:F([60,10],[58,19],[58,36],[[52,28],[57,36]],[[54,28],[59,36]],[[62,52],[64,70]],[[42,48],[26,50]]), prop:"couch",
         b:F([60,22],[58,31],[56,50],[[50,42],[55,50]],[[52,42],[57,50]],[[74,56],[66,70]],[[42,60],[26,50]])},
  pistol:{a:F([54,12],[54,21],[54,40],[[62,28],[72,28]],[[64,28],[74,28]],[[54,56],[54,70]],[[68,44],[84,42]]), prop:"chairS",
         b:F([56,26],[54,35],[44,55],[[64,40],[76,42]],[[66,40],[78,42]],[[66,60],[54,70]],[[62,50],[86,52]])},
  skater:{a:F([44,18],[46,26],[50,42],[[56,32],[64,38]],[[40,34],[34,42]],[[44,56],[40,70]],[[60,55],[76,60]]),
         b:mir(F([44,18],[46,26],[50,42],[[56,32],[64,38]],[[40,34],[34,42]],[[44,56],[40,70]],[[60,55],[76,60]]))},
  pushup:{a:F([98,34],[90,40],[50,52],[[90,54],[90,68]],[[92,54],[92,68]],[[32,60],[14,68]],[[33,61],[15,69]]),
         b:F([100,56],[90,58],[50,63],[[78,62],[90,68]],[[80,62],[92,68]],[[32,66],[14,69]],[[33,67],[15,70]])},
  climber:{a:F([98,34],[90,40],[50,52],[[90,54],[90,68]],[[92,54],[92,68]],[[70,56],[62,66]],[[32,60],[14,68]]),
         b:F([98,34],[90,40],[50,52],[[90,54],[90,68]],[[92,54],[92,68]],[[32,60],[14,68]],[[70,56],[62,66]])},
  hipflexor:{a:F([56,22],[56,31],[54,52],[[62,22],[66,10]],[[64,22],[68,10]],[[72,54],[72,70]],[[48,67],[30,68]]),
         b:F([62,22],[62,31],[60,53],[[68,22],[72,10]],[[70,22],[74,10]],[[78,54],[78,70]],[[52,67],[34,68]])},
  hamstretch:{a:F([62,46],[54,50],[38,66],[[68,56],[80,62]],[[70,56],[82,62]],[[62,66],[86,66]],[[54,60],[44,66]]),
         b:F([70,52],[60,56],[38,66],[[76,60],[86,64]],[[78,60],[88,64]],[[62,66],[86,66]],[[54,60],[44,66]])},
  calfwall:{a:F([84,20],[80,29],[60,44],[[88,30],[96,28]],[[89,31],[97,29]],[[74,56],[74,70]],[[46,58],[32,70]]), prop:"wallR",
         b:F([84,20],[80,29],[60,44],[[88,30],[96,28]],[[89,31],[97,29]],[[74,56],[74,70]],[[50,62],[38,70]])},
  pigeon:{a:F([72,52],[64,56],[46,62],[[72,64],[82,68]],[[74,64],[84,68]],[[62,62],[48,70]],[[30,68],[12,68]]),
         b:F([80,60],[68,60],[46,62],[[78,66],[86,68]],[[80,66],[88,68]],[[62,62],[48,70]],[[30,68],[12,68]])},
  seat9090:{a:F([52,24],[52,33],[50,60],[[44,50],[40,64]],[[46,50],[42,64]],[[70,62],[52,70]],[[36,62],[46,70]]),
         b:mir(F([52,24],[52,33],[50,60],[[44,50],[40,64]],[[46,50],[42,64]],[[70,62],[52,70]],[[36,62],[46,70]]))},
  anklecircle:{a:F([44,16],[44,26],[44,46],[[50,36],[56,46]],[[52,36],[58,46]],[[66,46],[84,38]],[[68,48],[66,70]]), prop:"chairA",
         b:F([44,16],[44,26],[44,46],[[50,36],[56,46]],[[52,36],[58,46]],[[66,46],[84,52]],[[68,48],[66,70]])},
  balance:{a:F([58,12],[58,21],[58,41],[[70,28],[84,32]],[[46,28],[32,32]],[[58,56],[58,70]],[[70,50],[60,60]]),
         b:F([58,13],[58,22],[58,42],[[72,32],[86,38]],[[44,32],[30,38]],[[58,57],[58,70]],[[72,52],[62,62]])}
};
var MATCH=[
  [/chaise murale/,"wallsit"],[/pont fessier.*une jambe|pont fessier, pieds sur une chaise/,"bridge1"],[/ischios gliss/,"hamslide"],[/pont fessier/,"bridge"],
  [/mollets? contre un mur/,"calfwall"],[/mollet/,"calf"],[/planche.*[ée]paule/,"plankTap"],[/planche/,"plank"],[/gainage lat/,"sideplank"],[/bird dog/,"birddog"],
  [/step-up/,"stepup"],[/descente de marche/,"stepup"],[/squat bulgare/,"bulgarian"],[/squat sur une jambe/,"pistol"],[/squat saut/,"jumpsquat"],[/squat/,"squat"],
  [/fente lat/,"sidelunge"],[/fente avec rotation/,"lungetwist"],[/fente saut|fente/,"lunge"],[/patineur/,"skater"],[/pompes/,"pushup"],[/mountain/,"climber"],
  [/fl[ée]chisseurs de hanche/,"hipflexor"],[/ischios jambe tendue/,"hamstretch"],[/pigeon/,"pigeon"],[/90\/90/,"seat9090"],[/chevilles/,"anklecircle"],[/[ée]quilibre/,"balance"]
];
function figKey(name){var n=String(name||"").toLowerCase(); for(var i=0;i<MATCH.length;i++)if(MATCH[i][0].test(n))return MATCH[i][1]; return "stand";}
var HOT={squat:["thigh","glute"],jumpsquat:["thigh","glute","shin"],lunge:["thigh","glute"],sidelunge:["thigh","glute"],lungetwist:["thighL","torso"],
  bridge:["glute","thighL"],bridge1:["glute","thighL"],hamslide:["glute","thigh"],calf:["shin"],plank:["torso"],plankTap:["torso","arm"],sideplank:["torso"],
  wallsit:["thigh"],birddog:["torso","glute"],stepup:["thighL","glute"],bulgarian:["thighL","glute"],pistol:["thighL","glute"],skater:["thigh","glute"],
  pushup:["arm","torso"],climber:["torso","thigh"],hipflexor:["thighM"],hamstretch:["thighL"],calfwall:["shinM"],pigeon:["glute"],seat9090:["glute","thighL"],
  anklecircle:["shinL"],balance:["thighL","shinL"]};
var MUS={squat:"Cuisses · fessiers",jumpsquat:"Cuisses · fessiers · mollets",lunge:"Cuisses · fessiers",sidelunge:"Cuisses · fessiers",lungetwist:"Cuisses · tronc",
  bridge:"Fessiers · ischios",bridge1:"Fessiers · ischios",hamslide:"Ischios · fessiers",calf:"Mollets",plank:"Gainage du tronc",plankTap:"Gainage · épaules",
  sideplank:"Gainage latéral",wallsit:"Cuisses",birddog:"Dos · fessiers",stepup:"Cuisses · fessiers",bulgarian:"Cuisses · fessiers",pistol:"Cuisses · fessiers",
  skater:"Jambes · équilibre",pushup:"Pectoraux · bras",climber:"Tronc · jambes",hipflexor:"Étirement : hanche",hamstretch:"Étirement : ischios",
  calfwall:"Étirement : mollet",pigeon:"Étirement : fessiers",seat9090:"Mobilité : hanches",anklecircle:"Mobilité : chevilles",balance:"Équilibre · chevilles"};
function pose(q,cls,hot){
  hot=hot||[]; function on(k){return hot.indexOf(k)>=0;}
  function seg(a,b,w,col,o){return '<path d="M'+a[0]+' '+a[1]+'L'+b[0]+' '+b[1]+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round"'+(o?' opacity="'+o+'"':'')+'/>';}
  function foot(f,o){return '<path d="M'+f[0]+' '+f[1]+'l7 0" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round"'+(o?' opacity="'+o+'"':'')+'/>';}
  var C="currentColor", H="var(--acc,#ff4b1f)", g='<g class="'+cls+'">';
  // membres éloignés (plus clairs), puis tronc, puis membres proches
  g+=seg(q.p,q.m[0],6.4,C,.4)+seg(q.m[0],q.m[1],5,C,.4)+foot(q.m[1],.4)+seg(q.n,q.b[0],4.4,C,.4)+seg(q.b[0],q.b[1],3.8,C,.4);
  g+=seg(q.n,q.p,9,on("torso")?H:C);
  g+=seg(q.p,q.l[0],6.8,on("thigh")||on("thighL")?H:C)+seg(q.l[0],q.l[1],5.4,on("shin")||on("shinL")?H:C)+foot(q.l[1]);
  if(on("thighM")||on("thigh"))g+=seg(q.p,q.m[0],6.4,H,.8);
  if(on("shinM")||on("shin"))g+=seg(q.m[0],q.m[1],5,H,.8);
  g+=seg(q.n,q.a[0],4.8,on("arm")?H:C)+seg(q.a[0],q.a[1],4,on("arm")?H:C);
  if(on("glute"))g+='<circle cx="'+q.p[0]+'" cy="'+q.p[1]+'" r="5.6" fill="'+H+'"/>';
  g+='<circle cx="'+q.h[0]+'" cy="'+q.h[1]+'" r="6.6" fill="'+C+'"/></g>';
  return g;
}
function img(name,thumb){
  var figKey0=figKey(name), f=FIG[figKey0]||FIG.stand, two=!!f.b&&!thumb;
  return '<svg viewBox="0 0 120 76" class="wfig'+(two?' anim':'')+'" role="img" aria-label="'+String(name).replace(/"/g,"")+'"><g class="prop" fill="none" stroke="var(--muted,#999)" stroke-width="2.4" stroke-linecap="round">'+
    (f.prop?(PROP[f.prop].replace("<rect",'<rect fill="var(--line,#ddd)"')):'')+'</g><path d="M2 72H118" stroke="var(--line,#ccc)" stroke-width="2" stroke-linecap="round"/>'+pose(f.a,"p1",HOT[figKey0])+(two?pose(f.b,"p2",HOT[figKey0]):'')+'</svg>';
}

// ---------- construction de la séance ----------
function side(txt){return /par jambe/.test(txt)?["Jambe droite","Jambe gauche"]:/par c[ôo]t[ée]/.test(txt)?["Côté droit","Côté gauche"]:/chaque sens/.test(txt)?["Sens horaire","Sens inverse"]:null;}
function build(kind,code,R,MOB){
  var S=[], list, tours=1, rest=0, title;
  if(kind==="mob"){list=MOB; title="Mobilité";}
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
          S.push({t:"ex",name:name,fig:name,sec:sec,reps:reps,sub:lab,note:note,amount:q});
          if(sec&&(sd&&k===0||(!sd&&sets>1&&s<sets)||(sd&&k===1&&s<sets)))S.push({t:"rest",name:sd&&k===0?"Change de côté":"Souffle",sec:5,sub:"Ensuite : "+name,fig:name});
        });
      }
      var last=(i===list.length-1&&t===tours);
      if(!last&&rest){var nx=(i===list.length-1)?list[0][0]:list[i+1][0]; S.push({t:"rest",name:"Repos",sec:rest,sub:(i===list.length-1?"Tour "+(t+1)+" · ":"")+"Ensuite : "+nx,fig:nx});}
      else if(!last&&kind==="mob")S.push({t:"rest",name:"Transition",sec:5,sub:"Ensuite : "+list[i+1][0],fig:list[i+1][0]});
    });
  }
  return {title:title,steps:S,kind:kind,code:code};
}
function total(w){return w.steps.reduce(function(a,s){return a+(s.sec||(s.reps?s.reps*4:20));},0);}
function minutes(w){return Math.max(1,Math.round(total(w)/60));}

// ---------- lecteur ----------
var W=null, el=null, tick=null, wake=null, ac=null, ctx={};
function $(id){return document.getElementById(id);}
function mmss(s){s=Math.max(0,Math.ceil(s)); return Math.floor(s/60)+":"+(s%60<10?"0":"")+(s%60);}
function beep(f,d){try{if(!ac)return; var o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=f; o.type="sine"; g.gain.value=.15; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+d);}catch(e){}}
function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function ensure(){
  if(el)return el; el=document.createElement("section"); el.id="wo"; el.className="wo"; el.hidden=true; el.setAttribute("aria-label","Séance guidée"); document.body.appendChild(el);
  el.addEventListener("click",function(e){var b=e.target.closest("button"); if(!b)return; var a=b.dataset.wa; if(!a)return;
    if(a==="close")close(); else if(a==="pause")toggle(); else if(a==="next")go(W.i+1); else if(a==="prev")go(W.i-1); else if(a==="done")go(W.i+1);
    else if(a==="mob"){var c=ctx; close(true); start("mob",null,c);} else if(a==="sound"){W.mute=!W.mute; render();}});
  return el;
}
function start(kind,code,c){
  ctx=c||ctx; var R=ctx.RENFO, M=ctx.MOB; if(!R||!M)return;
  var w=build(kind,code,R,M); ensure();
  W={w:w,i:0,left:0,end:0,paused:false,t0:Date.now(),mute:false,last:-1,el0:Date.now()};
  try{var AC=window.AudioContext||window.webkitAudioContext; if(AC&&!ac)ac=new AC(); if(ac&&ac.state==="suspended")ac.resume();}catch(e){}
  try{if(navigator.wakeLock)navigator.wakeLock.request("screen").then(function(x){wake=x;}).catch(function(){});}catch(e){}
  el.hidden=false; document.body.style.overflow="hidden"; var sh=$("sheet"); if(sh&&!sh.hidden&&ctx.closeSheet)ctx.closeSheet();
  begin(0); clearInterval(tick); tick=setInterval(loop,250);
}
function close(keep){
  clearInterval(tick); tick=null; if(el)el.hidden=true; if(!keep)document.body.style.overflow=""; try{if(wake){wake.release();wake=null;}}catch(e){} W=null;
}
function begin(i){
  var s=W.w.steps[i]; W.i=i; W.paused=false; W.last=-1; W.el0=Date.now();
  if(s&&s.sec){W.left=s.sec; W.end=Date.now()+s.sec*1000;} else {W.left=0; W.end=0;}
  render(); if(s&&!W.mute){if(s.t==="ex")beep(880,.18); }
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
  clearInterval(tick); tick=null; var secs=Math.round((Date.now()-W.t0)/1000), w=W.w;
  el.innerHTML='<div class="wo-in wo-end"><div class="wo-top"><b>'+esc(w.title)+'</b><button class="wo-x" data-wa="close" aria-label="Fermer">×</button></div>'+
    '<div class="wo-done"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-7"/></svg><h2>Séance terminée</h2><p class="wo-big num">'+mmss(secs)+'</p><p>Bien joué. '+(w.kind==="mob"?"Tes hanches et tes mollets te remercient.":"Pense à t’hydrater et à manger dans l’heure.")+'</p></div>'+
    '<div class="wo-ctl">'+(w.kind==="mob"?"":'<button class="wo-b prim" data-wa="mob">Enchaîner : mobilité · '+minutes(build("mob",null,ctx.RENFO,ctx.MOB))+' min</button>')+'<button class="wo-b" data-wa="close">Fermer</button></div></div>';
  buzz([200,80,200,80,200]); if(!W.mute){beep(660,.15); setTimeout(function(){beep(880,.15);},180); setTimeout(function(){beep(1100,.3);},360);}
}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function render(){
  if(!W)return; var w=W.w, s=w.steps[W.i], n=w.steps.length, rest=s.t!=="ex", exs=w.steps.filter(function(x){return x.t==="ex";}), idx=w.steps.slice(0,W.i+1).filter(function(x){return x.t==="ex";}).length;
  var nx=null; for(var j=W.i+1;j<n;j++){if(w.steps[j].t==="ex"){nx=w.steps[j];break;}}
  var big=s.sec?'<div class="wo-ring"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15.9155" class="bg"/><circle cx="20" cy="20" r="15.9155" class="fg" data-wr="1" stroke-dasharray="100" stroke-dashoffset="0"/></svg><div class="wo-t num" data-wt="1">'+mmss(s.sec)+'</div></div>'
     :'<div class="wo-reps"><b class="num">'+s.reps+'</b><span>répétitions</span><small class="num" data-wt="1">0:00</small></div>';
  el.innerHTML='<div class="wo-in'+(rest?' wo-rest':'')+'"><div class="wo-top"><div><b>'+esc(w.title)+'</b><small class="num">'+(s.t==="ex"?'Exercice '+idx+' / '+exs.length:rest?'Pause':'')+'</small></div><div class="wo-tr"><button class="wo-x" data-wa="sound" aria-label="Son" title="Son">'+(W.mute?"🔇":"🔊")+'</button><button class="wo-x" data-wa="close" aria-label="Fermer">×</button></div></div>'+
    '<div class="wo-bar"><i style="width:'+Math.round(W.i/(n-1)*100)+'%"></i></div>'+
    '<div class="wo-stage">'+img(s.fig,false)+'</div>'+
    '<h2 class="wo-name">'+esc(rest&&s.t!=="ready"?s.name:s.t==="ready"?s.name:s.name)+'</h2>'+
    '<p class="wo-sub">'+esc(s.sub||"")+(s.note?' · '+esc(s.note):'')+'</p>'+(s.t==="ex"&&MUS[figKey(s.fig)]?'<p class="wo-mus"><i></i>'+esc(MUS[figKey(s.fig)])+'</p>':'')+big+
    (s.t==="ex"&&nx&&false?'':'')+
    '<div class="wo-ctl"><button class="wo-b" data-wa="prev" aria-label="Précédent">‹</button>'+
      (s.sec?'<button class="wo-b prim" data-wa="pause">'+(W.paused?"Reprendre":"Pause")+'</button>':'<button class="wo-b prim" data-wa="done">Fait ›</button>')+
      '<button class="wo-b" data-wa="next" aria-label="Passer">›</button></div></div>';
  paintTime(W.left);
}

window.WORKOUT={muscles:function(n){return MUS[figKey(n)]||"";},img:img,figKey:figKey,start:start,build:build,minutes:minutes,close:close};
})();
