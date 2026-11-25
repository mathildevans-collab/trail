// Plan THP40 · v3 · plusieurs courses, un plan par course A, séances modifiables
(function(){
"use strict";
var $=function(id){return document.getElementById(id);};

// ---------- constantes ----------
var USER_ID=String(window.CADENZO_USER_ID||"anonymous").replace(/[^a-zA-Z0-9_-]/g,"");
function userKey(k){return k+":"+USER_ID;}
var KEY="thp40v3:"+USER_ID, OLDKEY="thp40v2:"+USER_ID;
var APPV=177;
var STRAVA=true;    // activités du compte Strava connecté via Supabase
var REPO="mathildevans-collab/trail";
var DOW=["lun","mar","mer","jeu","ven","sam","dim"], DOWL=["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"], DL=["L","M","M","J","V","S","D"];
var KEYS=["mon","tue","wed","thu","fri","sat","sun"];
var MON=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
var DAY=864e5, WEEK=7*DAY;
var THPCP=[{km:9.5,n:"Ongles"},{km:19.9,n:"Saint-Étienne-les-Orgues"},{km:29,n:"Fontienne"}];
var THPADV=[[10,"Départ prudent en zone 2-3, jamais plus vite que l’allure course, même si le peloton part vite."],[15,"Longue montée : marche dès que ta FC dépasse 165 bpm. Mange avant le sommet."],[28,"Rythme régulier, 60 g de glucides par heure."],[32.6,"Descente à −13 % : petits pas, jambes souples, épargne tes quadriceps."],[35.6,"Montée à +12 % : marche active, mains sur les cuisses."],[39,"Ça descend jusqu’à l’arrivée : lâche ce qu’il te reste."]];
var WHY={"Côtes":"Les montées répétées construisent la force dont tu auras besoin dans les grandes montées de la course.","Tempo long":"Tenir longtemps une allure soutenue, c’est ce qui fera la différence dans la seconde moitié de la course.","Côtes courtes":"Des efforts brefs et vifs : puissance et foulée en montée, sans fatigue durable.","Côtes enchaînées":"Repartir fort quand les jambes chauffent, comme en fin de course.","Descentes":"Tes quadriceps apprennent à freiner : c’est ce qui protège tes jambes dans les descentes raides.","Fartlek nature":"Changer de rythme sur sentier réveille la vitesse sans la rigueur de la piste.","Progressif":"Du volume facile qui finit un peu plus vite, sans fatigue.","Endurance + renfo":"La zone 2 construit le moteur, le renfo protège les articulations et prépare les descentes.","Club · piste":"La séance du club apporte la vitesse. Le plan ne la juge pas, il en tient compte.","Sortie longue":"La séance qui prépare le plus directement la course : endurance, dénivelé, ravitaillement.","Sortie club · dimanche":"Le volume du week-end en groupe : régularité et dénivelé.","Jour 2 du bloc":"Courir sur des jambes déjà fatiguées, c’est répéter la seconde moitié de la course.","Rappel":"Garder les jambes vives sans fatigue avant le jour J.","Footing":"Juste bouger, sans fatigue.","Club allégé":"Garder le rythme du club sans te fatiguer.","Activation":"Réveiller les jambes la veille, sans les fatiguer.","Jour J":"Le jour pour lequel tu t’es entraînée.","Récupération":"Bouger doucement aide à récupérer plus vite.","Course B":"Une course de préparation : un test grandeur nature d’allure, de ravitaillement et de matériel."};
var TYPELIST=["Côtes","Tempo long","Côtes courtes","Côtes enchaînées","Descentes","Fartlek nature","Progressif","Endurance + renfo","Footing","Club · piste","Sortie longue","Sortie club · dimanche","Récupération","Activation","Renfo seul","Autre sport"];
var QT={"Côtes":1,"Tempo long":1,"Côtes courtes":1,"Côtes enchaînées":1,"Descentes":1,"Fartlek nature":1,"Club · piste":1,"Rappel":1};
var LT={"Sortie longue":1,"Sortie club · dimanche":1,"Jour 2 du bloc":1,"Course B":1};
var ZX={"Renfo seul":"Hors course","Autre sport":"Z1-Z2","Course B":"Allure course","Activation":"Z1-Z2"};
function zoneOf(t){return ZONE[t]||ZX[t]||"";}
if(window.FIT){FIT.zoneOf=zoneOf; FIT.dbg=function(){return {activeRace:activeRace,planOf:planOf,P:P,openRace:openRace,RS:function(){return RS;}};};}
function tagOf(t){return QT[t]?"q":LT[t]?"l":"e";}

// ---------- état ----------
function thpRace(){return {id:"thp40",name:"THP40",full:"Trail de Haute Provence",place:"Forcalquier",date:"2027-05-08",time:"08:00",km:38.8,dp:1279,goal:295,prio:"A",builtin:true,start:"2026-11-09"};}
var OWNER_USER_ID="73faf8ae-c637-4161-8f66-4aef8c67d88c";
function blank(){return {v:3,ownerId:USER_ID,races:[],active:null,focus:null,done:{},undone:{},actual:{},ci:{},adj:{},edits:{},tseen:"",kit:{},todo:{},
  set:{theme:"auto",gel:35,water:15,vib:true,checkin:true,fake:""},race:null,practice:null,results:{},sync:{t:0,upd:"",err:"",gh:""}};}
var OBJ={set:1,sync:1};
function assignState(n,o){for(var k in n){if(o[k]==null)continue; if(OBJ[k]&&typeof o[k]==="object")Object.assign(n[k],o[k]); else n[k]=o[k];} return n;}
var LOADNOTE="", SEEN="";
function parseKey(k){try{var r=JSON.parse(localStorage.getItem(k)||"null"); return r&&typeof r==="object"&&!Array.isArray(r)?r:null;}catch(e){return null;}}
function fromRaw(r){ // refuse explicitement toute sauvegarde provenant d’un autre compte
  if(r.ownerId&&r.ownerId!==USER_ID)return blank();
  if(!r.ownerId&&USER_ID!==OWNER_USER_ID)return blank();
  var v=window.SAFE?SAFE.validate(r):{ok:false}; if(v.ok){r=v.state; if(!r.races||!r.races.length)delete r.races;} return assignState(blank(),r);}
function load(){
  var raw=null; try{raw=localStorage.getItem(KEY);}catch(e){}
  var r=parseKey(KEY);
  if(!r&&raw){ // présent mais illisible : copie de côté, jamais écrasé en silence
    LOADNOTE="bad"; try{localStorage.setItem(KEY+".bad",raw);}catch(e){}
    r=parseKey(KEY+".prev"); if(r)LOADNOTE="prev";
  }
  if(r){SEEN=raw||""; return fromRaw(r);}
  if(USER_ID===OWNER_USER_ID){
    try{var old=JSON.parse(localStorage.getItem(OLDKEY)||"null"); if(old&&typeof old==="object")return migrate(old,blank());}catch(e){}
    try{var v1=JSON.parse(localStorage.getItem(userKey("thp40-state"))||"null"); if(v1&&typeof v1==="object"){var kit=null; try{kit=JSON.parse(localStorage.getItem(userKey("thp40-kit"))||"null");}catch(e){} if(kit&&typeof kit==="object")v1.kit=kit; return migrate(v1,blank());}}catch(e){}
  }
  return blank();
}
function migrate(o,n){
  var t=thpRace(), s=o.set||{}; n.races=[t]; n.active=t.id; n.focus=t.id;
  if(s.goal)t.goal=s.goal; if(isoOk(s.raceDate))t.date=s.raceDate; if(s.raceTime)t.time=s.raceTime;
  ["theme","gel","water","vib","checkin"].forEach(function(k){if(s[k]!=null)n.set[k]=s[k];});
  Object.keys(o.done||{}).forEach(function(k){n.done["thp40:"+k]=1;});
  Object.keys(o.actual||{}).forEach(function(k){var a=o.actual[k]; if(a&&a.src!=="strava")n.actual["thp40:"+k]=a;});
  Object.keys(o.adj||{}).forEach(function(k){n.adj["thp40:"+k]=o.adj[k];});
  Object.keys(o.ci||{}).forEach(function(k){n.ci["thp40:"+k]=o.ci[k];});
  if(o.kit)n.kit={thp40:o.kit};
  Object.keys(o.todo||{}).forEach(function(k){n.todo["thp40:"+k]=o.todo[k];});
  if(o.result)n.results.thp40=o.result; if(o.gpx)t.gpx=o.gpx;
  return n;
}
var D=load(), VER=0;
var TRAIN_PREF=window.CADENZO_TRAINING_PREFS||null;
function save(){
  D.ownerId=USER_ID;
  VER++; var cur=null; try{cur=localStorage.getItem(KEY);}catch(e){}
  if(cur&&SEEN&&cur!==SEEN&&window.SAFE){ // une autre fenêtre a écrit entre-temps : on fusionne au lieu d’écraser
    try{var o=JSON.parse(cur); var v=SAFE.validate(o); if(v.ok){D=assignState(blank(),SAFE.merge(D,v.state).state); MC={}; PC={};}}catch(e){}
  }
  D.rev=(D.rev||0)+1; D.saved=Date.now(); var s; try{s=JSON.stringify(D);}catch(e){toast("Enregistrement impossible."); return false;}
  try{ if(cur&&cur!==s&&parseKey(KEY)){try{localStorage.setItem(KEY+".prev",cur);}catch(e){}}
    localStorage.setItem(KEY,s); if(localStorage.getItem(KEY)!==s)throw new Error("verif"); SEEN=s;
  }catch(e){toast("Mémoire du téléphone pleine : données non enregistrées. Exporte une sauvegarde."); return false;}
  snapSoon(s); gsyncSoon(); return true;
}
var snapT=null;
function snapSoon(s){ if(!window.SAFE)return; clearTimeout(snapT); snapT=setTimeout(function(){
  var last=0; try{last=+localStorage.getItem(userKey("cadenzo-snap"))||0;}catch(e){}
  if(Date.now()-last<6*3600*1000)return; try{localStorage.setItem(userKey("cadenzo-snap"),String(Date.now()));}catch(e){}
  SAFE.snap("auto",s);},4000);}

// ---------- dates ----------
var QS=new URLSearchParams(location.search);
function isoOk(s){return typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+"T00:00:00Z"));}
function dms(s){return Date.parse(s+"T00:00:00Z");}
function fakeDate(){var f=QS.get("date"); if(isoOk(f))return f; return isoOk(D.set.fake)?D.set.fake:"";}
function realToday(){var t=new Date(); return Date.UTC(t.getFullYear(),t.getMonth(),t.getDate());}
function todayUTC(){var f=fakeDate(); return f?dms(f):realToday();}
function iso(x){var d=typeof x==="number"?new Date(x):x; return d.getUTCFullYear()+"-"+pz(d.getUTCMonth()+1)+"-"+pz(d.getUTCDate());}
function dowOf(ms){return (new Date(ms).getUTCDay()+6)%7;}
function mondayOf(ms){return ms-dowOf(ms)*DAY;}
function nextMonday(){var t=todayUTC(); return iso(mondayOf(t)+(dowOf(t)?WEEK:0));}
function daysTo(r){return Math.round((dms(r.date)-todayUTC())/DAY);}
function phaseOf(r){var j=daysTo(r); return j<0?"after":j===0?"race":j<=7?"taper":"prep";}
function startMin(r){var m=/^(\d{1,2}):(\d{2})$/.exec(r.time||""); return m?(+m[1])*60+(+m[2]):480;}
function raceStartTs(r){var d=new Date(dms(r.date)); return new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),0,startMin(r)).getTime();}

// ---------- formats ----------
function pz(n){return (n<10?"0":"")+n;}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function kmS(x){return String(Math.round(x*10)/10).replace(".",",");}
function nb(x){return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g,"\u00A0");} // espace insécable : un nombre ne se coupe jamais en fin de ligne (U+202F se coupait sur iPhone)
function hm(m){m=Math.round(m); var h=Math.floor(m/60); return h+"\u00A0h\u00A0"+pz(m-h*60);}
function hmc(m){m=Math.round(m); var h=Math.floor(m/60); return h+"h"+pz(m-h*60);}
function hmi(m){m=Math.round(m); var h=Math.floor(m/60); return h+":"+pz(m-h*60);}
function hms(s){s=Math.max(0,Math.floor(s)); return Math.floor(s/3600)+":"+pz(Math.floor(s/60)%60)+":"+pz(s%60);}
function dur(sec){var h=Math.floor(sec/3600), m=Math.round((sec%3600)/60); if(m===60){h++;m=0;} return h>0?h+"\u00A0h\u00A0"+pz(m):m+"\u00A0min";}
function sgn(m){m=Math.round(m); return (m>0?"+":m<0?"−":"±")+Math.abs(m)+" min";}
function tod(r,min){var t=Math.round(startMin(r)+min); return Math.floor(t/60)%24+":"+pz(t%60);}
function fmtS(ms){var d=new Date(ms); return d.getUTCDate()+" "+MON[d.getUTCMonth()];}
function fmtL(ms){var d=new Date(ms), s=DOWL[(d.getUTCDay()+6)%7]; return s.charAt(0).toUpperCase()+s.slice(1)+" "+d.getUTCDate()+" "+MON[d.getUTCMonth()];}
function fmtD(ms){var d=new Date(ms); return DOW[(d.getUTCDay()+6)%7]+". "+d.getUTCDate()+" "+MON[d.getUTCMonth()];}
function jx(r){var j=daysTo(r); return j>0?"J-"+j:j===0?"Jour J":"J+"+(-j);}
function num(x){if(typeof x==="number")return x; if(x==null)return NaN; var s=String(x).trim().replace(/\s/g,""); if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,""); else s=s.replace(",","."); return parseFloat(s);}
function parseDur(x){if(x==null||x==="")return 0; x=String(x).trim().replace(/\s*h\s*/i,":"); if(x.indexOf(":")>=0){var p=x.split(":"),t=0; if(p.length===2)p.push("0"); p.forEach(function(v){t=t*60+(parseFloat(v)||0);}); return t;} var n=num(x); return n>0?n*60:0;}
function uid(){return "r"+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);}

// ---------- courses ----------
function races(){return D.races.slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});}
function raceById(id){for(var i=0;i<D.races.length;i++)if(D.races[i].id===id)return D.races[i]; return null;}
function activeRace(){
  var r=raceById(D.active); if(r&&r.prio==="A")return r;
  var A=races().filter(function(x){return x.prio==="A";}), t=todayUTC();
  r=A.filter(function(x){return dms(x.date)>=t;})[0]||A[A.length-1]||null; D.active=r?r.id:null; return r;
}
function focusRace(){var r=raceById(D.focus); if(!r){r=activeRace()||races()[0]||null; D.focus=r?r.id:null;} return r;}
function estGoal(km,dp){return Math.max(30,Math.round((km+dp/100)*5.75*(1+Math.max(0,km-20)/200)/5)*5);}
// Estimation actuelle : prédictions Garmin (semi, ramenées à l’effort de la course) et sorties récentes de 12 km et plus ; sinon formule simple.
function estNow(r){
  var km=+r.km||10, dp=+r.dp||0, E=km+dp/100, P=[], src=[], k;
  try{var g=window.GARMIN&&GARMIN.data&&GARMIN.data(), best=null;
    if(g&&g.days){Object.keys(g.days).sort().reverse().some(function(d){var x=g.days[d]; if(x&&x.p&&x.p[2]>0&&dayN(d)>dayN(isoAgo(400))){best=x.p[2];return true;}return false;});
      if(best){P.push(best/60*Math.pow(E/21.0975,1.06)); src.push("Garmin");}}}catch(e){}
  var lr=(typeof HIST!=="undefined"&&HIST||[]).filter(function(a){return a.km>=12&&a.t>0&&dayN(a.date)>dayN(isoAgo(150));}).map(function(a){return a.t/60*Math.pow(E/(a.km+a.dp/100),1.06);}).sort(function(a,b){return a-b;});
  if(lr.length){P.push(lr[Math.floor(lr.length/2)]); src.push(lr.length+(lr.length>1?" sorties":" sortie"));}
  if(!P.length)return {min:estGoal(km,dp),src:"formule simple"};
  var m=P.reduce(function(a,b){return a+b;},0)/P.length; return {min:Math.max(30,Math.round(m/5)*5),src:src.join(" + ")};
}
function goalAuto(r){return r.gm!==undefined?!r.gm:(r.builtin?true:!(+r.goal>0));}
function goalOf(r){return goalAuto(r)?estNow(r).min:(+r.goal||estGoal(+r.km||10,+r.dp||0));}

// ---------- modèle d’une course : profil, passages, stratégie ----------
var MC={};
function model(r){
  var key=[r.km,r.dp,goalOf(r),r.prof?r.prof.length:0,JSON.stringify(r.cps||[])].join("|");
  if(MC[r.id]&&MC[r.id].key===key)return MC[r.id].m;
  var m={r:r,L:+r.km||1,dp:+r.dp||0,goal:goalOf(r)}; m.eff=m.goal*60/(m.L+m.dp/100);
  m.prof=r.builtin?PROFILE:(r.prof&&r.prof.length>4?r.prof:null);
  var raw=0,i; if(m.prof)for(i=1;i<m.prof.length;i++){var d=m.prof[i][1]-m.prof[i-1][1]; if(d>0)raw+=d;}
  m.upK=raw?m.dp/raw:0;
  m.elevAt=function(k){var P=m.prof; if(!P)return 0; for(var i=1;i<P.length;i++){if(P[i][0]>=k){var a=P[i-1],b=P[i]; return b[0]===a[0]?b[1]:a[1]+(b[1]-a[1])*(k-a[0])/(b[0]-a[0]);}} return P[P.length-1][1];};
  function integ(a,b,sign){if(b<=a)return 0; if(!m.prof)return sign>0?Math.round((b-a)*m.dp/m.L):Math.round((b-a)*m.dp/m.L); var s=0,P=m.prof; for(var i=1;i<P.length;i++){var p=P[i-1],q=P[i]; if(q[0]<=a||p[0]>=b)continue; var d=sign*(q[1]-p[1]); if(d<=0)continue; s+=d*(Math.min(b,q[0])-Math.max(a,p[0]))/(q[0]-p[0]);} return Math.round(s*m.upK);}
  m.dplus=function(a,b){return integ(a,b,1);}; m.dminus=function(a,b){return integ(a,b,-1);};
  var cps=r.builtin?THPCP:(r.cps||[]).filter(function(c){return c.km>0&&c.km<m.L;}).sort(function(a,b){return a.km-b.km;});
  m.cps=cps.map(function(c){return {km:+c.km,n:c.n||("Ravito km "+kmS(c.km))};}).concat([{km:m.L,n:"Arrivée"}]);
  if(r.builtin){
    m.cumMin=function(km){var f=m.goal/285,Pp=[[0,0]].concat(PASS),i=1; km=Math.max(0,Math.min(km,m.L)); while(i<Pp.length-1&&Pp[i][0]<km)i++; var a=Pp[i-1],b=Pp[i]; return (a[1]+(b[1]-a[1])*(km-a[0])/(b[0]-a[0]))*f;};
    m.sect=SECT.map(function(s){return {a:s.a,b:s.b,n:s.n,up:s.up,dn:s.dn};});
    m.strat=STRAT; m.adv=THPADV; m.traps=[[30,32.6],[33.9,35.6]]; m.trapTxt="Pièges km 30 et 34";
  }else{
    var N=Math.max(2,Math.round(m.L*10)), E=[0];
    for(var k=1;k<=N;k++){var x0=(k-1)*m.L/N,x1=k*m.L/N,fat=1+0.12*x1/m.L; E.push(E[k-1]+((x1-x0)+m.dplus(x0,x1)/100+m.dminus(x0,x1)/1000)*fat);}
    m.cumMin=function(km){km=Math.max(0,Math.min(km,m.L)); var f=km/m.L*N,j=Math.min(N-1,Math.floor(f)); return m.goal*(E[j]+(E[j+1]-E[j])*(f-j))/E[N];};
    var prev=0; m.sect=m.cps.map(function(c,j){var s={a:prev,b:c.km,n:(j?m.cps[j-1].n:"Départ")+" → "+(j===m.cps.length-1?"arrivée":c.n),up:m.dplus(prev,c.km),dn:m.dminus(prev,c.km)}; prev=c.km; return s;});
    genStrat(m);
    if(r.strat&&r.strat.length){m.strat=r.strat; m.adv=r.strat.map(function(x){return [x[2],x[1]];}); m.adv[m.adv.length-1][0]=m.L+1;}
  }
  m.diff=m.prof?diffs(m):[];
  (m.diff||[]).forEach(function(d){if((m.traps||[]).some(function(t){return d.a<t[1]&&d.b>t[0];}))d.hard=true;});
  m.kmAt=function(min){if(min<=0)return 0; var lo=0,hi=m.L; for(var k=0;k<32;k++){var x=(lo+hi)/2; if(m.cumMin(x)<min)lo=x; else hi=x;} return lo;};
  MC[r.id]={key:key,m:m}; return m;
}
function diffs(m){ // difficultés : montées de 60 m et plus, descentes raides, tirées du profil
  var D_=[]; segs(m,1).forEach(function(c){D_.push({a:c.a,b:c.b,g:c.g,p:c.p,up:true,hard:c.p>=10});});
  segs(m,-1).forEach(function(c){if(c.p>=8)D_.push({a:c.a,b:c.b,g:c.g,p:c.p,up:false,hard:c.p>=12});});
  D_.sort(function(x,y){return x.a-y.a;}); return D_.slice(0,14);
}
function segs(m,sign){ // montées (1) ou descentes (−1) d’au moins 60 m, replats de 25 m tolérés
  var P=m.prof, out=[], n=P.length, i=0;
  while(i<n-1){
    if(sign*(P[i+1][1]-P[i][1])<=0){i++;continue;}
    var s=i,top=i,j=i+1;
    while(j<n){if(sign*(P[j][1]-P[top][1])>=0)top=j; if(sign*(P[top][1]-P[j][1])>25)break; j++;}
    var g=sign*(P[top][1]-P[s][1]), len=P[top][0]-P[s][0];
    if(g>=60&&len>0)out.push({a:P[s][0],b:P[top][0],g:Math.round(g*(m.upK||1)),p:Math.round(g/(len*10))});
    i=Math.max(top,i+1);
  }
  return out;
}
function genStrat(m){
  var L=m.L, S=[], T=[];
  if(m.prof){
    var up=segs(m,1).sort(function(a,b){return b.g-a.g;}).slice(0,4);
    var dn=segs(m,-1).filter(function(d){return d.p>=8;}).sort(function(a,b){return b.g-a.g;}).slice(0,3);
    var ev=up.map(function(c){return {a:c.a,b:c.b,p:c.p,t:["Montée · km "+kmS(c.a)+" à "+kmS(c.b),"+"+c.g+" m à environ "+c.p+" %. Marche active dès que ta FC dépasse 165 bpm, mange avant le sommet.",c.b]};})
      .concat(dn.map(function(c){return {a:c.a,b:c.b,p:c.p,t:["Descente · km "+kmS(c.a)+" à "+kmS(c.b),"Environ −"+c.p+" % : petits pas, jambes souples, épargne tes quadriceps.",c.b]};}))
      .sort(function(a,b){return a.a-b.a;});
    var first=Math.min(ev.length?ev[0].a:L*0.25,L*0.3);
    if(first>=2)S.push(["Départ · km 0 à "+kmS(first),"Zone 2-3, jamais plus vite que ton allure de course, même si le peloton part vite.",first]);
    else if(ev.length)ev[0].t[1]="Ça monte dès le départ : pars très prudemment. "+ev[0].t[1];
    ev.forEach(function(e){S.push(e.t); if(e.p>=10)T.push([e.a,e.b]);});
    var lastEnd=S[S.length-1][2], downEnd=m.elevAt(L)<m.elevAt(Math.max(0,L-3))-40;
    if(lastEnd<L-0.5)S.push(["Fin · km "+kmS(lastEnd)+" à "+kmS(L),downEnd?"Ça descend vers l’arrivée : lâche ce qu’il te reste.":"Garde quelque chose pour la fin et relance dès que le terrain le permet.",L]);
  }else S.push(["Départ · premier quart","Zone 2-3, jamais plus vite que ton allure de course.",L*0.25],["Milieu de course","Rythme régulier, 60 g de glucides par heure, bois à chaque ravito.",L*0.75],["Fin · dernier quart","Relance dès que le terrain le permet : c’est là que l’entraînement paie.",L]);
  m.strat=S; m.adv=S.map(function(s){return [s[2],s[1]];}); m.adv[m.adv.length-1][0]=L+1; m.traps=T; m.trapTxt="Passages à 10 % et plus";
}

// ---------- plan d’une course A ----------
function phaseName(w,n,taper){var M=n-1-taper; if(w>M)return "Affûtage"; var b=Math.round(M*0.35),c=Math.round(M*0.35); return w<=b?"Base":w<=b+c?"Construction":"Spécifique";}
function renfoOf(ph,w){return ph==="Affûtage"?"D":(ph==="Base"?"A":ph==="Construction"?"B":"C")+(w%2===1?"1":"2");}
function rpace(m,km,dp){return m.eff*(1+(km?dp/km/100:0));}
function tempoPace(ph,km,dp){var flat=ph==="Base"?335:(ph==="Construction"?328:320), c=flat*(1+0.033*(dp/km/10)); return {lo:c-8,hi:c+8,flat:flat};}
var CD=[["10 min","Retour au calme, puis 5 min de mobilité"]], WU=["15 min","Échauffement en zone 2"];
function tuesdayOf(T,n,ph){
  if(T==="cotes")return {tag:"q",type:"Côtes",km:n+4,dp:n*CLIMB_D,steps:[WU,[n+" × 500 m","Montées en zone 4 (+"+CLIMB_D+" m), descente en trot"]].concat(CD),txt:"Échauffement 15 min, puis "+n+" montées de 500 m (+"+CLIMB_D+" m chacune) en zone 4, descente en trot facile. Total : +"+(n*CLIMB_D)+" m."};
  if(T==="tempo"){var km=Math.round((25+n)/6.4), dp=Math.round(km*18), tp=tempoPace(ph,km,dp); return {tag:"q",type:"Tempo long",km:km,dp:dp,pace:mmss(tp.lo)+" à "+mmss(tp.hi)+"/km · "+mmss(tp.flat)+" à plat",steps:[WU,[n+" min","Tempo à "+mmss(tp.lo)+" – "+mmss(tp.hi)+"/km, 153-167 bpm"]].concat(CD),txt:"15 min d’échauffement, puis "+n+" min de tempo continu, 10 min de retour au calme. Allure : "+mmss(tp.lo)+" à "+mmss(tp.hi)+"/km (environ "+mmss(tp.flat)+" à plat). Si ta FC dépasse 167 bpm, ralentis."};}
  if(T==="courtes")return {tag:"q",type:"Côtes courtes",km:8,dp:n*20,steps:[WU,[n+" × 30 s","Côtes vives à 8-12 %, descente en marchant"]].concat(CD),txt:"Échauffement 15 min, puis "+n+" côtes courtes de 30 s (pente de 8 à 12 %), effort vif, descente en marchant, 2 min de récupération."};
  if(T==="paires")return {tag:"q",type:"Côtes enchaînées",km:2*n+4,dp:n*2*CLIMB_D,steps:[WU,[n+" paires","2 montées de 500 m enchaînées, Z3-Z4, 3 min de récup"]].concat(CD),txt:"Échauffement 15 min, puis "+n+" paires de montées de 500 m enchaînées (+"+(2*CLIMB_D)+" m par paire), 3 min de récupération entre les paires. Marche active si la FC dépasse 175 bpm."};
  if(T==="desc")return {tag:"q",type:"Descentes",km:n+4,dp:n*CLIMB_D,steps:[WU,[n+" × 500 m","Descentes contrôlées, foulée courte, remontée en marchant"]].concat(CD),txt:"Échauffement 15 min, puis "+n+" descentes de 500 m contrôlées (foulée courte, souple), remontée en marchant. Ça prépare tes quadriceps aux descentes raides."};
  if(T==="fartlek")return {tag:"q",type:"Fartlek nature",km:9,dp:100,steps:[["15 min","Footing en zone 2"],[n+" × 2 min","Zone 4, avec 2 min en zone 2 entre"]].concat(CD),txt:"Footing 15 min, puis "+n+" × 2 min en zone 4 avec 2 min en zone 2 sur sentier, retour au calme 10 min."};
  return {tag:"e",type:"Progressif",km:Math.round(n/6.2),dp:100,steps:[[n+" min","De la zone 1-2 à la zone 3 basse, facile et fluide"]],txt:n+" min en progressif : démarre en zone 1-2 et finis en zone 3 basse. Facile et fluide."};
}
function sess(o){o.k=o.k||KEYS[o.dow]; return o;}
function wedOf(km,code,w){return sess({dow:2,tag:"e",type:"Endurance + renfo",km:km,dp:0,pace:"6:00 à 6:25/km",pacel:"Allure facile",renfo:code,steps:[[km+" km","Zone 2, 135-150 bpm"],[woMin("renfo",code)+" min",RENFO[code].name+" à la maison"]],txt:km+" km en zone 2 (135 à 150 bpm) "+WEDV[(w-1)%4]+", puis "+woMin("renfo",code)+" min de renforcement à la maison ("+RENFO[code].name+")."});}
function thuOf(light){return sess({dow:3,tag:"e",type:"Endurance facile",km:light?5:7,dp:0,steps:[[String(light?5:7)+" km","Zone 1-2, respiration facile. Pas de séance intense."]],txt:light?"Footing très facile de récupération, en aisance respiratoire.":"Footing facile en zone 2. Les séances de club sont ajoutées uniquement aux jours renseignés dans tes préférences."});}
function longSteps(km){return km>=14?[[km+" km","Zone 2, marche active dans les côtes"]]:[[km+" km","Zone 2, allure conversation"]];}
function raceWeek(r,m){
  var rd=dowOf(dms(r.date)), S=[];
  if(rd>=2)S.push(sess({dow:0,tag:"e",type:"Footing d'activation",km:4,dp:0,steps:[["4 km","Endurance très facile, respiration confortable."]],txt:"Dernier footing facile de la semaine, sans intensité ni recherche d'allure."}));
  if(rd>=4)S.push(sess({dow:2,tag:"e",type:"Footing léger",km:3,dp:0,steps:[["3 km","Endurance très facile. Arrête-toi avec de bonnes sensations."]],txt:"Petit footing de fraîcheur, sans fatigue résiduelle."}));
  if(rd>=1&&!S.some(function(x){return x.dow===rd-1;}))S.push(sess({dow:rd-1,tag:"e",type:"Activation",km:2,dp:0,steps:[["2 km maximum","Très facile, quelques accélérations souples uniquement si tu en as l'habitude."]],txt:"Activation courte la veille : reste frais, ne cherche aucun entraînement."}));
  S.push(sess({k:"race",dow:rd,tag:"l",type:"Jour J",km:m.L,dp:m.dp,race:true,txt:r.name+" : "+kmS(m.L)+" km, +"+nb(m.dp)+" m, objectif "+hm(m.goal)+". Départ à "+r.time+"."}));
  if(rd<6)S.push(sess({dow:rd+1,tag:"e",type:"Récupération",km:0,dp:0,txt:"Marche douce de 20 à 30 min selon les sensations. Pas de course obligatoire."}));
  return S;
}
function thpWeek(w,r,m){
  if(w===26)return {ph:"Affûtage",rec:false,s:raceWeek(r,m),note:NOTES[26]};
  var ph=w<=8?"Base":w<=16?"Construction":w<=23?"Spécifique":"Affûtage", rec=!!REC[w];
  var d=R[w-1], sk_=d[3], sd=d[4], uk=Math.max(15,d[5]), ud=Math.max(500,d[6]);
  if(ph!=="Base"){if(sk_>=18)sd=Math.min(sd,Math.round(sk_*36)); if(uk>=18)ud=Math.min(ud,Math.round(uk*36));}
  var t=TS[w-1], b2b=canBackToBack()&&(w===14||w===18||w===21), code=w>=24?"D":(w<=8?"A":w<=16?"B":"C")+(w%2===1?"1":"2");
  var S=[sess(Object.assign({dow:1},tuesdayOf(t[0],t[1],ph))),wedOf(d[1],code,w),thuOf(rec),
    sess({dow:5,tag:"l",type:"Sortie longue",km:sk_,dp:sd,steps:longSteps(sk_),txt:sk_+" km de trail, +"+sd+" m. "+SAT_T[w-1]}),
    sess({dow:6,tag:"l",type:b2b?"Jour 2 du bloc":"Sortie longue",km:uk,dp:ud,steps:longSteps(uk),txt:"Sortie longue trail. Prévu aujourd’hui : "+uk+" km, +"+ud+" m. "+SUN_T[w-1]})];
  S.forEach(function(x){if(x.km&&/allure course/i.test(x.txt)&&x.k!=="thu")x.txt+=" Allure course : environ "+mmss(rpace(m,x.km,x.dp))+"/km sur ce relief.";});
  return {ph:ph,rec:rec,s:S,note:NOTES[w]};
}
var CYC={Base:["cotes","fartlek","cotes"],Construction:["tempo","cotes","courtes","tempo"],"Spécifique":["tempo","paires","tempo","desc"]};
var SATG={Base:"Sentier roulant en zone 2, allure conversation.",Construction:"Z2 sur terrain vallonné, marche active dans les côtes raides.","Spécifique":"Z2 avec 2 × 15 min à allure course sur un relief proche de celui de la course.",Affûtage:"Sortie facile, garde des jambes fraîches."};
function genWeek(w,n,taper,r,m){
  if(w===n)return {ph:"Affûtage",rec:false,s:raceWeek(r,m),note:"Semaine de course. Vérifie l’heure de départ et prépare ton matériel."};
  var M=n-1-taper, ph=phaseName(w,n,taper), g=m.dp/m.L, flat=g<12, L=m.L;
  var peakSat=Math.max(8,Math.min(30,Math.round(L*0.62))), peakSun=Math.max(10,Math.min(22,Math.round(L*0.5)));
  var f, rec=false, note="";
  if(w<=M){f=M>1?0.6+0.4*(w-1)/(M-1):1; rec=w%4===0&&w<M; if(rec)f*=0.72;} else f=(w-M===1&&taper===2)?0.75:0.55;
  var ps=w===1||phaseName(w-1,n,taper)!==ph;
  if(w===1)note=NOTES[1]; else if(rec)note=NOTES[4]; else if(ps&&ph==="Construction")note="On construit : plus de dénivelé, un tempo ou des côtes chaque mardi."; else if(ps&&ph==="Spécifique")note="Phase spécifique : on se rapproche du terrain de la course ("+kmS(L)+" km, +"+nb(m.dp)+" m). Teste ton ravitaillement en sortie longue."; else if(ps&&ph==="Affûtage")note="L’affûtage commence : moins de volume, même intensité. Les jambes doivent se sentir légères.";
  var tu;
  if(rec)tu=tuesdayOf("prog",40,ph);
  else if(ph==="Affûtage")tu=tuesdayOf("tempo",20,ph);
  else{var st=1; for(var x=1;x<w;x++)if(phaseName(x,n,taper)!==ph)st=x+1; var T=CYC[ph][(w-st)%CYC[ph].length];
    if(flat){if(T==="cotes")T="fartlek"; if(T==="paires")T="courtes"; if(T==="desc")T="tempo";}
    var p=(f-0.6)/0.4, nn={cotes:Math.round(4+4*p),tempo:Math.round((15+25*p)/5)*5,courtes:Math.round(6+4*p),paires:Math.round(3+2*p),desc:Math.round(4+2*p),fartlek:Math.round(4+2*p)}[T];
    tu=tuesdayOf(T,Math.max(2,nn),ph);}
  var sk_=Math.max(6,Math.round(peakSat*f)), uk=ph==="Affûtage"?Math.max(10,Math.round(peakSun*f)):Math.max(15,Math.round(peakSun*f));
  var b2b=canBackToBack()&&ph==="Spécifique"&&!rec&&w%4===2&&w<n-taper;
  var sd=Math.round(sk_*g*0.85/10)*10, ud=ph==="Affûtage"?Math.round(uk*g*0.6/10)*10:Math.max(500,Math.round(uk*g*0.75/10)*10);
  var wed=rec?7:Math.round(6+3*f), code=renfoOf(ph,w);
  var S=[sess(Object.assign({dow:1},tu)),wedOf(wed,code,w),thuOf(rec||ph==="Affûtage"),
    sess({dow:5,tag:"l",type:"Sortie longue",km:sk_,dp:sd,steps:longSteps(sk_),txt:sk_+" km de trail, +"+sd+" m. "+(rec?"Sortie facile pour récupérer.":SATG[ph])}),
    sess({dow:6,tag:"l",type:b2b?"Jour 2 du bloc":"Sortie longue",km:uk,dp:ud,steps:longSteps(uk),txt:(ph==="Affûtage"?"Sortie facile, "+uk+" km, +"+ud+" m.":"Sortie longue vallonnée. Prévu aujourd’hui : "+uk+" km, +"+ud+" m.")+(ph==="Spécifique"&&!rec?" Les 20 dernières minutes à allure course (environ "+mmss(rpace(m,uk,ud))+"/km sur ce relief).":"")})];
  return {ph:ph,rec:rec,s:S,note:note};
}
var PC={};
function isClubSession(s){return !!(s&&(s.club||/^Club(?:\s|·)/i.test(String(s.type||""))));}
function canBackToBack(){
  var p=TRAIN_PREF&&TRAIN_PREF.athlete_profile||{},days=(TRAIN_PREF&&TRAIN_PREF.training_days||[]).map(Number);
  return !!(TRAIN_PREF&&TRAIN_PREF.onboarding_completed&&
    (p.discipline==="trail"||p.discipline==="mixte")&&p.experience==="confirme"&&
    Number(p.weekly_km)>=35&&Number(p.runs_per_week)>=5&&
    Number(TRAIN_PREF.sessions_per_week)>=5&&days.indexOf(5)>=0&&days.indexOf(6)>=0);
}
function applyTrailElevation(sessions,m,pref){
  var p=pref&&pref.athlete_profile||{};
  var trail=p.discipline==="trail"||(p.discipline==="mixte"&&m.L>0&&m.dp/m.L>=12);
  if(!trail||!(m.L>0)||!(m.dp>0))return sessions;
  var grade=m.dp/m.L;
  return sessions.map(function(s){
    if(!s||s.race||!(+s.km>0)||(+s.dp||0)>0||s.type==="Renfo seul"||s.type==="Autre sport")return s;
    var factor=s.tag==="q"?0.3:s.tag==="l"?0.75:0.2;
    if(isClubSession(s)){
      var type=String(s.type||"");
      factor=/sortie trail|sortie longue|côtes/i.test(type)?0.55:0.12;
    }
    s.dp=Math.max(10,Math.round((s.km*grade*factor)/10)*10);
    s.dpEstimated=true;
    s.txt=(s.txt||"")+" D+ indicatif, à ajuster selon le terrain réellement parcouru.";
    return s;
  });
}
function athleteLoadRules(sessions,pref,weekNo,weekRec){
  var p=pref&&pref.athlete_profile||{}, base=Number(p.weekly_km), exp=p.experience||"regulier";
  if(!isFinite(base)||base<0)return {sessions:sessions,cap:null,adjusted:false,warning:""};
  base=Math.max(5,base);
  var rate={debutant:0.035,reprise:0.04,regulier:0.055,confirme:0.07}[exp]||0.05;
  var steps=Math.min(8,Math.floor(Math.max(0,weekNo-1)/2));
  var cap=base*Math.min(1.55,1+rate*steps);
  if(weekRec)cap*=0.88;
  var target=Math.max(1,Math.min(7,Number(pref.sessions_per_week)||4));
  var currentRuns=Math.max(0,Math.min(14,Number(p.runs_per_week)||0));
  var clubCount=sessions.filter(isClubSession).length;
  var maxRuns=Math.min(target,Math.max(clubCount,Math.max(1,currentRuns+Math.floor(Math.max(0,weekNo-1)/2))));
  var mandatory=sessions.filter(function(s){return s.race||isClubSession(s)||s.type==="Course B";});
  var optional=sessions.filter(function(s){return !s.race&&!isClubSession(s)&&s.type!=="Course B";});
  var advancedTrail=(p.discipline==="trail"||p.discipline==="mixte")&&exp==="confirme"&&base>=35&&target>=5;
  var plannedB2B=sessions.some(function(s){return s.tag==="l"&&s.type==="Jour 2 du bloc";});
  var eventWeek=sessions.some(function(s){return s.type==="Course B"||s.race;});
  var maxLong=eventWeek?0:(advancedTrail&&plannedB2B?2:1);
  var mandatoryLong=mandatory.filter(function(s){return s.tag==="l";}).length;
  var optionalLong=optional.filter(function(s){return s.tag==="l";}).sort(function(a,b){return (+b.km||0)-(+a.km||0);});
  var keepOptionalLong=Math.max(0,maxLong-mandatoryLong);
  var keepLongIds=optionalLong.slice(0,keepOptionalLong).map(function(s){return s.k;});
  optional=optional.map(function(s){
    if(s.tag!=="l"||keepLongIds.indexOf(s.k)>=0)return s;
    var c=Object.assign({},s), oldKm=+c.km||0;
    c.tag="e";c.type="Endurance de récupération";c.km=oldKm>0?Math.max(1,Math.min(8,Math.round(oldKm*0.4))):0;
    c.dp=Math.round((+c.dp||0)*0.25);c.pace=null;
    c.steps=[[String(c.km)+" km","Endurance très facile, sans intensité. Cette sortie remplace la deuxième sortie longue."]];
    c.txt="Endurance de récupération : "+c.km+" km faciles. La deuxième sortie longue est réservée aux profils trail expérimentés avec une charge adaptée.";
    return c;
  });
  optional.sort(function(a,b){
    function rank(x){return x.tag==="q"?90:x.tag==="l"?80:x.type==="Endurance + renfo"?65:40;}
    return rank(b)-rank(a)||a.dow-b.dow;
  });
  sessions=mandatory.concat(optional.slice(0,Math.max(0,maxRuns-mandatory.length))).sort(function(a,b){return a.dow-b.dow;});
  var clubKm=0,otherKm=0,eventKm=0;
  sessions.forEach(function(s){
    var km=Math.max(0,+s.km||0);
    if(isClubSession(s))clubKm+=km;
    else if(s.race||s.type==="Course B")eventKm+=km;
    else otherKm+=km;
  });
  var adjusted=false, warning="", room=Math.max(0,cap-clubKm-eventKm);
  if(otherKm>room&&otherKm>0){
    var factor=room/otherKm, remaining=room;
    sessions=sessions.map(function(s){
      if(s.race||s.type==="Course B"||isClubSession(s)||!(+s.km>0))return s;
      var copy=Object.assign({},s), oldKm=+copy.km||0;
      var nextKm=Math.floor(Math.min(oldKm*factor,remaining)*10)/10;
      remaining=Math.max(0,Math.round((remaining-nextKm)*10)/10);
      copy.km=nextKm;
      if(copy.dp)copy.dp=oldKm?Math.floor(copy.dp*nextKm/oldKm):0;
      copy.pace=null;
      if(nextKm<1){
        copy.km=0;copy.dp=0;copy.tag="e";copy.type="Renfo seul";
        copy.steps=[["10–15 min","Mobilité douce, gainage et récupération. Pas de course supplémentaire."]];
        copy.txt="Séance de mobilité et gainage à la place d’une sortie : le volume de course prévu atteint déjà le plafond prudent.";
      }else{
        copy.steps=null;
        copy.txt=(copy.txt||"Séance prévue.")+" Volume ajusté à "+kmS(copy.km)+" km selon ton volume récent.";
      }
      return copy;
    });
    adjusted=true;
  }
  if(clubKm+eventKm>cap)warning="Les courses et séances collectives obligatoires dépassent déjà le plafond prudent calculé à partir de ton volume récent. Les autres séances de course sont supprimées ou remplacées par de la mobilité.";
  return {sessions:sessions,cap:Math.round(cap*10)/10,adjusted:adjusted,warning:warning};
}
function coachingRules(sessions,pref,weekNo,weekRec,phase){
  var p=pref&&pref.athlete_profile||{}, exp=p.experience||"regulier", discipline=p.discipline||"mixte";
  var eventWeek=sessions.some(function(x){return x.race||x.type==="Course B";});
  var limit=(exp==="debutant"||exp==="reprise")?1:2;
  if(weekRec||phase==="Affûtage"||eventWeek)limit=0;
  var quality=sessions.filter(function(x){return !x.race&&x.tag==="q";});
  var clubQuality=quality.filter(isClubSession);
  var optionalQuality=quality.filter(function(x){return !isClubSession(x);}).sort(function(a,b){
    function priority(x){return x.type==="Tempo long"?90:x.type==="Côtes"||x.type==="Fartlek nature"?80:60;}
    return priority(b)-priority(a)||a.dow-b.dow;
  });
  var keep=Math.max(0,limit-clubQuality.length), changed=false, warnings=[];
  if(weekRec||phase==="Affûtage"||eventWeek){
    var clubFactor=eventWeek?0.4:(weekRec?0.65:0.6);
    sessions=sessions.map(function(x){
      if(!isClubSession(x)||x.race)return x;
      var c=Object.assign({},x);c.club=true;c.tag="e";c.type="Club allégé · "+String(x.type||"séance collective");
      c.km=Math.min(eventWeek?3:6,Math.max(0,Math.round((+x.km||0)*clubFactor)));c.dp=Math.max(0,Math.round((+x.dp||0)*clubFactor));
      c.steps=[[String(c.km)+" km","Présence au club, mais séance allégée en endurance facile. Évite le travail intense."]];
      c.txt="Présence au club maintenue. Demande une version allégée à ton coach : endurance facile, sans fractionné ni effort prolongé.";
      return c;
    });
  }
  var selected=[], blocked=[];
  optionalQuality.forEach(function(x){
    var spaced=clubQuality.concat(selected).every(function(y){var diff=Math.abs((+x.dow||0)-(+y.dow||0));return Math.min(diff,7-diff)>=2;});
    if(selected.length<keep&&spaced)selected.push(x);else blocked.push(x);
  });
  var downgrade=blocked.map(function(x){return x.k;});
  var mandatoryClose=clubQuality.some(function(x,i){return clubQuality.slice(i+1).some(function(y){var diff=Math.abs((+x.dow||0)-(+y.dow||0));return Math.min(diff,7-diff)<2;});});
  if(mandatoryClose)warnings.push("Tes séances collectives intenses sont trop rapprochées pour garantir 48 h de récupération. Garde les autres sorties faciles et échange avec ton coach si possible.");
  if(downgrade.length){
    sessions=sessions.map(function(x){
      if(downgrade.indexOf(x.k)<0)return x;
      var c=Object.assign({},x,{tag:"e",type:"Endurance facile",pace:null,steps:[[String(x.km)+" km","Zone 1-2, respiration facile. Pas de fractionné ni de tempo."]],txt:"Séance transformée en endurance facile pour équilibrer les intensités de la semaine. "+String(x.km)+" km en aisance respiratoire."});
      changed=true; return c;
    });
  }
  if(clubQuality.length>limit)warnings.push((clubQuality.length>1?"Plusieurs séances collectives intenses sont obligatoires":"Une séance collective intense est obligatoire")+" cette semaine. Ne rajoute aucune autre intensité et signale au coach si la récupération est insuffisante.");
  if(weekRec)warnings.push("Semaine de récupération : conserve les séances de club obligatoires en demandant une version allégée au coach. Toutes les sorties individuelles restent faciles.");
  if(phase==="Affûtage")warnings.push("Affûtage : réduis la durée des efforts, garde seulement quelques rappels dynamiques et évite toute fatigue résiduelle.");
  if(discipline==="trail"||discipline==="mixte"){
    sessions=sessions.map(function(x){
      if(x.race||x.tag!=="l"||x.club||!x.km)return x;
      var c=Object.assign({},x), grade=(+c.dp||0)/(+c.km||1);
      var terrain=grade>=25?"Terrain vallonné : marche active dans les pentes raides, relance progressive en haut, descente contrôlée sans chercher la vitesse.":grade>=12?"Sentier vallonné : alterne course et marche en côte, cadence courte en descente.":"Sentier roulant : reste en aisance, travaille la pose de pied et la stabilité.";
      var fueling=(+c.km>=15)?" Teste ton ravitaillement sur cette sortie longue ; prends de petites prises régulières et utilise uniquement des produits déjà tolérés.":"";
      c.txt=(c.txt||"Sortie trail facile.")+" "+terrain+fueling;
      if(!c.steps||!c.steps.length)c.steps=[[String(c.km)+" km","Endurance facile sur sentier"],["D+ "+String(c.dp||0)+" m",terrain]];
      return c;
    });
  }
  return {sessions:sessions,changed:changed,warnings:warnings};
}
// ---------- calibration personnelle : FC et allures d’après les données de l’utilisateur ----------
var CAL_CACHE=null, BESTD={"5k":5000,"10k":10000,"Half-Marathon":21097};
function profOf(){return (TRAIN_PREF&&TRAIN_PREF.athlete_profile)||{};}
function vdotOf(t,d){var m=t/60,v=d/m,pc=0.8+0.1894393*Math.exp(-0.012778*m)+0.2989558*Math.exp(-0.1932605*m); return (-4.6+0.182258*v+0.000104*v*v)/pc;}
function paceAt(vdot,f){var vo=vdot*f,v=(-0.182258+Math.sqrt(0.182258*0.182258+4*0.000104*(4.6+vo)))/(2*0.000104); return 60000/v;}
function calibrate(){
  var pf=profOf(), last=HIST.length?HIST[HIST.length-1].date:"", sig=HIST.length+":"+last+":"+(pf.hr_max||"");
  if(CAL_CACHE&&CAL_CACHE.sig===sig)return CAL_CACHE;
  var c={sig:sig,hrMax:0,est:false,vdot:0,easy:0,thr:0,itv:0,mar:0}, pm=+pf.hr_max;
  if(pm>=150&&pm<=220)c.hrMax=Math.round(pm);
  else{var hs=HIST.filter(function(q){return q.hr>=100&&q.t>=1200&&q.km>=3;}).map(function(q){return q.hr;}).sort(function(a,b){return a-b;});
    if(hs.length>=6){c.hrMax=Math.max(165,Math.min(205,Math.round(hs[Math.min(hs.length-1,Math.floor(hs.length*0.95))]/0.9)));c.est=true;}}
  HIST.forEach(function(q){(q.be||[]).forEach(function(b){var d=BESTD[b.n]; if(d&&b.t>0){var v=vdotOf(b.t,d); if(v>c.vdot&&v<85)c.vdot=v;}});});
  var ez=HIST.filter(function(q){return c.hrMax&&q.hr>=c.hrMax*0.62&&q.hr<=c.hrMax*0.78&&q.km>=4&&q.t>0&&q.dp/q.km<20;}).map(function(q){return q.t/q.km;}).sort(function(a,b){return a-b;});
  if(ez.length>=3)c.easy=ez[Math.floor(ez.length/2)];
  if(c.vdot){c.thr=paceAt(c.vdot,0.88);c.itv=paceAt(c.vdot,0.975);c.mar=paceAt(c.vdot,0.80);if(!c.easy)c.easy=paceAt(c.vdot,0.66);}
  else if(c.easy){c.thr=c.easy*0.86;c.itv=c.easy*0.79;c.mar=c.easy*0.92;}
  CAL_CACHE=c; return c;
}
function zoneBpm(z){var c=calibrate(), mx=c.hrMax||196, B=[0.6,0.7,0.78,0.86,0.92,1.0]; return [Math.round(mx*B[z-1]),Math.round(mx*B[z])];}
function paceTxt(s,w){return s?mmss(s-(w||6))+"–"+mmss(s+(w||6))+"/km":"";}
function persoOn(){return !!(TRAIN_PREF&&TRAIN_PREF.onboarding_completed&&!TRAIN_PREF.legacy);}
function persoStr(s,zonesOnly){ // adapte les textes d’un plan (bpm, allures, zones) à la personne
  if(typeof s!=="string"||!s)return s; var c=calibrate();
  if(!zonesOnly&&c.hrMax&&c.hrMax!==196){var f=c.hrMax/196; s=s.replace(/\b(1\d\d)(?:(\s*(?:-|–|à)\s*)(1\d\d))?(?=\s*bpm)/g,function(m,a,sep,b){return Math.round(a*f)+(b?sep+Math.round(b*f):"");});}
  if(!zonesOnly&&c.easy&&Math.abs(c.easy/372-1)>0.03){var g=c.easy/372; s=s.replace(/\b([3-9]):([0-5]\d)(?=\s*(?:\/km|à|–|-))/g,function(m,a,b){return mmss(Math.round((+a*60+ +b)*g));});}
  if(c.hrMax&&!/bpm/.test(s)){
    s=s.replace(/\b([Zz]one) ([1-5])(?:-([1-5]))?(?![\d-])/g,function(m,w,a,b){return m+" ("+zoneBpm(+a)[0]+"-"+zoneBpm(+(b||a))[1]+" bpm)";});
    s=s.replace(/\bZ([1-5])-Z([1-5])\b/g,function(m,a,b){return m+" ("+zoneBpm(+a)[0]+"-"+zoneBpm(+b)[1]+" bpm)";});}
  return s;
}
function persoSess(s){
  if(!s||s.race||s.club)return s; var c=Object.assign({},s), z=!!s.cal, f=function(x){return persoStr(x,z);};
  c.txt=f(c.txt); if(c.pace&&!z&&calibrate().easy)c.pace=persoStr(c.pace);
  if(Array.isArray(c.steps))c.steps=c.steps.map(function(x){return Array.isArray(x)?x.map(f):x;});
  return c;
}
function isRoutePlan(m,pref){
  var p=pref&&pref.athlete_profile||{}; if(p.discipline==="route")return true; if(p.discipline==="trail")return false;
  var fl=HIST.filter(function(q){return q.km>=3;}); if(fl.length<6)return false;
  var g=0,k=0; fl.forEach(function(q){g+=q.dp||0;k+=q.km;}); return k>0&&g/k<10&&m.L>0&&m.dp/m.L<12;
}
var RWU=["15 min","Échauffement en zone 2, puis 4 lignes droites de 15 s"], RCD=["10 min","Retour au calme en trot lent"];
function routeQuality(kind,n,wkn,m){
  var c=calibrate(), z4=zoneBpm(4), z5=zoneBpm(5), pc=Math.max(0,Math.min(1,(wkn-1)/Math.max(8,n)));
  function ptxt(sec,t){return sec?" à "+paceTxt(sec,5)+" ":" à "+t+" ";}
  if(kind==="vma30"){var S=2+(pc>0.5?1:0),R=8+Math.round(pc*4),tot=S*R;
    return {tag:"q",type:"Fractionné 30/30",km:Math.round(4+tot*0.1),dp:0,cal:1,steps:[RWU,[S+" × "+R+" × 30/30","30 s vite"+ptxt(c.itv,"effort 8/10")+"("+z5[0]+"-"+z5[1]+" bpm en fin de série), 30 s de trot lent. 3 min de trot entre les séries."],RCD],
      txt:"Échauffement 15 min, puis "+S+" séries de "+R+" × (30 s vite / 30 s trot)"+(c.itv?", rapide à "+paceTxt(c.itv,5):"")+". Les 30 s rapides doivent rester relâchées et régulières. Retour au calme 10 min."};}
  if(kind==="vmal"){var K=4+Math.round(pc*3),r=1000;
    return {tag:"q",type:"Fractionné long",km:Math.round(5+K*1.25),dp:0,cal:1,steps:[RWU,[K+" × 1 000 m","Allure 5 km"+ptxt(c.itv,"effort 8/10")+"("+z5[0]+"-"+z5[1]+" bpm), 2 min de trot entre"],RCD],
      txt:"Échauffement 15 min, puis "+K+" × 1 000 m à allure 5 km"+(c.itv?" ("+paceTxt(c.itv,5)+")":"")+", 2 min de trot entre chaque. Régularité avant vitesse : la dernière répétition doit être aussi rapide que la première."};}
  if(kind==="seuil"){var B=2+(pc>0.35?1:0)+(pc>0.7?1:0),d=6+Math.round(pc*4);
    return {tag:"q",type:"Seuil",km:Math.round(5+B*d/4.8+B*0.3),dp:0,cal:1,steps:[RWU,[B+" × "+d+" min","Seuil"+ptxt(c.thr,"effort 7/10")+"("+z4[0]+"-"+z4[1]+" bpm), 2 min de trot entre"],RCD],
      txt:"Échauffement 15 min, puis "+B+" × "+d+" min au seuil"+(c.thr?" ("+paceTxt(c.thr,5)+")":"")+", zone 4 ("+z4[0]+"-"+z4[1]+" bpm), avec 2 min de trot. Effort soutenu mais contrôlé : tu pourrais dire quelques mots, pas une phrase."};}
  if(kind==="fartlek"){var F=6+Math.round(pc*4);
    return {tag:"q",type:"Fartlek route",km:9,dp:0,cal:1,steps:[["15 min","Endurance en zone 2"],[F+" × 2 min","Rapide"+ptxt(c.thr,"effort 7-8/10")+"(zone 4), 2 min de trot entre"],RCD],
      txt:"15 min faciles, puis "+F+" × 2 min rapides"+(c.thr?" (~"+mmss(c.thr)+"/km)":"")+" avec 2 min de trot, retour au calme 10 min."};}
  var L=m.L||10, sp=L>=35?c.mar:(L>=18?(c.mar+c.thr)/2:c.thr*0.99), spn=L>=35?"marathon":(L>=18?"semi-marathon":"10 km"), zz=L>=35?zoneBpm(3):zoneBpm(4);
  var blk=2+(pc>0.5?1:0), mn=8+Math.round(pc*8);
  return {tag:"q",type:"Allure spécifique",km:Math.round(5+blk*mn/5.5+blk*0.4),dp:0,cal:1,steps:[RWU,[blk+" × "+mn+" min","Allure "+spn+ptxt(sp,"effort 6-7/10")+"("+zz[0]+"-"+zz[1]+" bpm), 3 min de trot entre"],RCD],
    txt:"Échauffement 15 min, puis "+blk+" × "+mn+" min à allure "+spn+(sp?" ("+paceTxt(sp,5)+")":"")+", 3 min de trot entre. C’est ton allure de course : cherche la régularité et note tes sensations."};
}
var RQ={Base:["vma30","fartlek","vma30"],Construction:["seuil","vmal","seuil","fartlek"],"Spécifique":["spe","seuil","spe","vmal"]};
function routeify(sessions,wk,n,m){
  var c=calibrate(), qi=0, z2=zoneBpm(2);
  return sessions.map(function(s){
    if(!s||s.race||s.club||s.type==="Course B"||s.type==="Renfo seul"||s.type==="Autre sport")return s;
    if(s.tag==="q"){var list=RQ[wk.ph]; if(!list)return s; var kind=list[(wk.n+qi++)%list.length]; return sess(Object.assign({k:s.k,dow:s.dow},routeQuality(kind,n,wk.n,m)));}
    if(s.tag==="l"&&s.type==="Sortie longue"&&s.km>=8){
      var c2=Object.assign({},s,{dp:Math.min(s.dp||0,Math.round(s.km*4)),cal:1}), prog=!wk.rec&&(wk.ph==="Construction"||wk.ph==="Spécifique")&&s.km>=12, k=Math.max(3,Math.round(s.km*(wk.ph==="Spécifique"?0.35:0.25))), mz=zoneBpm(3);
      if(prog){c2.type="Sortie longue progressive"; c2.steps=[[(s.km-k)+" km","Endurance zone 2 ("+z2[0]+"-"+z2[1]+" bpm)"+(c.easy?", ~"+paceTxt(c.easy*1.02,10):"")],[k+" km","Allure marathon"+(c.mar?" ("+paceTxt(c.mar,5)+")":"")+", zone 3 ("+mz[0]+"-"+mz[1]+" bpm)"]]; c2.txt=s.km+" km : "+(s.km-k)+" km en endurance, puis les "+k+" derniers km à allure marathon. Hydrate-toi et teste ton ravitaillement.";}
      else{c2.type="Sortie longue endurance"; c2.steps=[[s.km+" km","Zone 2 ("+z2[0]+"-"+z2[1]+" bpm)"+(c.easy?", ~"+paceTxt(c.easy*1.02,10):", allure conversation")]]; c2.txt=s.km+" km en endurance fondamentale, allure conversation. Terrain plat ou peu vallonné.";}
      return c2;}
    if(s.tag==="e"&&s.km>=5&&!wk.rec&&wk.ph!=="Affûtage"&&(s.type==="Endurance facile"||s.type==="Footing"||s.type==="Progressif")){
      var c3=Object.assign({},s,{type:"Endurance + lignes droites",cal:1,dp:0});
      c3.steps=[[s.km+" km","Zone 2 ("+z2[0]+"-"+z2[1]+" bpm)"+(c.easy?", ~"+paceTxt(c.easy,10):"")],["6 × 20 s","Lignes droites relâchées en fin de sortie, 1 min de marche entre"]];
      c3.txt=s.km+" km en endurance, puis 6 lignes droites de 20 s (foulée vive et relâchée). Ça entretient la vitesse sans fatigue.";
      return c3;}
    return s;});
}
function planOf(r){
  if(!r)return null;
  var prefKey=TRAIN_PREF?JSON.stringify([TRAIN_PREF.has_club,TRAIN_PREF.club_days,TRAIN_PREF.club_sessions,TRAIN_PREF.athlete_profile,TRAIN_PREF.sessions_per_week,TRAIN_PREF.training_days,TRAIN_PREF.onboarding_completed,TRAIN_PREF.legacy,calibrate().sig]):"default";
  var key=VER+"|"+todayUTC()+"|"+r.date+"|"+r.start+"|"+r.km+"|"+r.dp+"|"+goalOf(r)+"|"+prefKey;
  if(PC[r.id]&&PC[r.id].key===key)return PC[r.id].p;
  var m=model(r), rws=mondayOf(dms(r.date)), start=r.builtin?dms(r.start):mondayOf(dms(isoOk(r.start)?r.start:nextMonday()));
  if(start>rws)start=rws;
  var n=r.builtin?26:Math.max(1,Math.round((rws-start)/WEEK)+1), taper=n>=14?2:n>=8?1:0, weeks=[];
  for(var w=1;w<=n;w++){var b=r.builtin?thpWeek(w,r,m):genWeek(w,n,taper,r,m); weeks.push({n:w,ph:b.ph,rec:b.rec,s:b.s,note:b.note||"",start:start+(w-1)*WEEK});}
  // courses B dans la période du plan
  D.races.forEach(function(b){if(b.prio!=="B")return; var t=dms(b.date); if(t<start||t>=dms(r.date))return;
    var wk=weeks[Math.floor((t-start)/WEEK)], dw=dowOf(t), bm=model(b);
    wk.s=wk.s.filter(function(s){return s.dow!==dw;}).map(function(s){
      if(s.dow===dw-1&&s.km)return sess({k:s.k,dow:s.dow,tag:"e",type:"Activation",km:3,dp:0,txt:"Veille de course : 15 min très faciles et 3 lignes droites."});
      if(s.dow===dw+1&&s.km)return sess({k:s.k,dow:s.dow,tag:"e",type:"Récupération",km:Math.min(6,s.km),dp:0,txt:"Lendemain de course : footing très facile en zone 1, ou marche."});
      return s;});
    wk.s.push(sess({k:KEYS[dw],dow:dw,tag:"l",type:"Course B",name:b.name,bid:b.id,km:bm.L,dp:bm.dp,txt:b.name+" : "+kmS(bm.L)+" km, +"+nb(bm.dp)+" m. Course de préparation : teste ton allure, ton ravitaillement et ton matériel."+(dms(r.date)-t<21*DAY?" À moins de 3 semaines de l’objectif : ne la cours pas à fond.":"")}));
    wk.hasB=true;});
  // modifications faites à la main
  var E=D.edits[r.id]||{};
  weeks.forEach(function(wk){
    wk.s=wk.s.map(function(s){var o=E[wk.n+"-"+s.k]; if(!o)return s; if(o.del)return null; var c=Object.assign({},s,o,{edited:true}); if((o.type&&o.type!==s.type)||(o.km!=null&&o.km!==s.km)){c.steps=null; c.pace=null;} if(o.type&&o.type!==s.type&&o.type!=="Endurance + renfo")c.renfo=null; return c;}).filter(Boolean);
    Object.keys(E).forEach(function(k){var mm=/^(\d+)-(x\w+)$/.exec(k); if(mm&&+mm[1]===wk.n&&!E[k].del)wk.s.push(Object.assign({k:mm[2],added:true,edited:true},E[k]));});
    wk.s.sort(function(a,b){return a.dow-b.dow;});
    wk.km=0; wk.dp=0; wk.s.forEach(function(s){wk.km+=s.km||0; wk.dp+=s.dp||0;}); wk.km=Math.round(wk.km); wk.dp=Math.round(wk.dp);
  });
  if(TRAIN_PREF&&TRAIN_PREF.onboarding_completed&&!TRAIN_PREF.legacy){ // préférences appliquées à tous les plans, y compris les plans intégrés
    var pref=TRAIN_PREF, days=(pref.training_days||[1,2,3,5,6]).map(Number), clubDays=pref.has_club?(pref.club_days||[]).map(Number):[], target=Math.max(2,Math.min(7,+pref.sessions_per_week||4));
    weeks.forEach(function(wk){
      var byDow={}; wk.s.forEach(function(s){byDow[s.dow]=s;});
      var mandatory=clubDays.slice();
      wk.s.forEach(function(s){if(s.race||s.type==="Course B")if(mandatory.indexOf(s.dow)<0)mandatory.push(s.dow);});
      var ranked=days.slice().sort(function(a,b){
        function score(d){if(mandatory.indexOf(d)>=0)return 1000;var s=byDow[d];if(!s)return 0;if(s.tag==="q")return 90;if(s.tag==="l")return 80;if(s.type==="Endurance + renfo")return 65;return 40;}
        return score(b)-score(a)||a-b;
      });
      var chosen=ranked.slice(0,target);
      mandatory.forEach(function(d){if(chosen.indexOf(d)<0)chosen.push(d);});
      chosen.sort(function(a,b){return a-b;});
      var planned=[],clubRaceConflict=false;
      chosen.forEach(function(d){
        var s=byDow[d];
        if(s&&(s.race||s.type==="Course B")){
          planned.push(s);
          if(clubDays.indexOf(d)>=0)clubRaceConflict=true;
        }else if(clubDays.indexOf(d)>=0){
          var cs=(pref.club_sessions||[]).filter(function(x){return +x.day===d;})[0]||{type:"Fractionné / piste",estimated_km:8};
          var ckm=Math.max(0,Math.min(100,Number(cs.estimated_km)||0));
          var ctype=String(cs.type||"Autre");
          var ctag=/fractionné|piste|côtes/i.test(ctype)?"q":/sortie longue/i.test(ctype)?"l":"e";
          planned.push(sess({k:KEYS[d],dow:d,tag:ctag,type:ctype,km:ckm,dp:0,club:true,steps:[],txt:"Séance collective obligatoire : "+ctype+". Estimation modifiable après la séance. Elle remplace la séance initialement prévue ce jour-là et compte dans ton volume hebdomadaire."}));
        }else if(s)planned.push(s);
        else if(wk.hasB||wk.s.some(function(x){return x.race;})){}
        else planned.push(sess({k:KEYS[d],dow:d,tag:"e",type:"Footing",km:6,dp:0,steps:[[ "6 km","Footing facile en zone 2" ]],txt:"Footing facile en zone 2, ajouté selon tes disponibilités."}));
      });
      if(clubRaceConflict)wk.note=(wk.note?wk.note+" ":"")+"Une course tombe un jour de club : la course est prioritaire et la séance collective n'est pas programmée ce jour-là.";
      if(mandatory.length>target)wk.note=(wk.note?wk.note+" ":"")+"Les séances obligatoires (club et course) dépassent ton objectif hebdomadaire : elles sont conservées, les séances individuelles sont limitées.";
      if(days.length<target)wk.note=(wk.note?wk.note+" ":"")+"Tu as sélectionné moins de jours disponibles que ton objectif de séances : le plan respecte tes jours déclarés.";
      var coached=coachingRules(planned,pref,wk.n,wk.rec,wk.ph);
      var load=athleteLoadRules(coached.sessions,pref,wk.n,wk.rec);
      wk.s=applyTrailElevation(load.sessions,m,pref);
      if(isRoutePlan(m,pref))wk.s=routeify(wk.s,wk,n,m);
      wk.s=wk.s.map(persoSess);
      if(load.adjusted)wk.note=(wk.note?wk.note+" ":"")+"Volume plafonné progressivement selon ton historique sportif.";
      if(load.warning)wk.note=(wk.note?wk.note+" ":"")+load.warning;
      if(coached.changed)wk.note=(wk.note?wk.note+" ":"")+"Intensités rééquilibrées selon ton niveau et les séances collectives.";
      if(coached.warnings.length)wk.note=(wk.note?wk.note+" ":"")+coached.warnings.join(" ");
      wk.km=0;wk.dp=0;wk.s.forEach(function(s){wk.km+=s.km||0;wk.dp+=s.dp||0;});
      wk.km=Math.round(wk.km*10)/10;wk.dp=Math.round(wk.dp);
    });
  }
  // indisponibilité ponctuelle : jours choisis pour UNE semaine (stockés dans les modifications : « n-avail »)
  Object.keys(E).forEach(function(k){var mm=/^(\d+)-avail$/.exec(k); if(!mm||!E[k]||!Array.isArray(E[k].days))return;
    var wk=weeks[+mm[1]-1]; if(!wk)return;
    var A=E[k].days.map(Number).filter(function(d){return d>=0&&d<=6;}).sort(function(a,b){return a-b;}); if(!A.length)return;
    var fixed=wk.s.filter(function(x){return x.race||x.club||x.bid||x.type==="Course B"||isClubSession(x);}), mov=wk.s.filter(function(x){return fixed.indexOf(x)<0;});
    var taken={}; fixed.forEach(function(x){taken[x.dow]=1;}); var slots=A.filter(function(d){return !taken[d];});
    function pr(x){return x.tag==="l"?3:x.tag==="q"?2.5:(x.renfo?1.5:1);}
    var keep=mov.slice().sort(function(a,b){return pr(b)-pr(a)||a.dow-b.dow;}).slice(0,slots.length), lost=mov.length-keep.length;
    keep.sort(function(a,b){return a.dow-b.dow;}); keep.forEach(function(x,i){x.dow=slots[i];});
    wk.s=fixed.concat(keep).sort(function(a,b){return a.dow-b.dow;});
    wk.avail=A; wk.note=(wk.note?wk.note+" ":"")+"Semaine adaptée à tes jours disponibles."+(lost>0?" "+lost+" séance"+(lost>1?"s":"")+" facile"+(lost>1?"s":"")+" retirée"+(lost>1?"s":"")+" faute de jour.":"");
    wk.km=0;wk.dp=0;wk.s.forEach(function(x){wk.km+=x.km||0;wk.dp+=x.dp||0;}); wk.km=Math.round(wk.km*10)/10; wk.dp=Math.round(wk.dp);});
  // déplacements de séances d’un jour à l’autre (glisser-déposer / échange) : appliqués en dernier, comme « n-avail »
  Object.keys(E).forEach(function(k){var mm=/^(\d+)-mv$/.exec(k); if(!mm||!E[k])return; var wk=weeks[+mm[1]-1]; if(!wk)return;
    wk.s.forEach(function(x){var d=E[k][x.k]; if(d!=null&&d>=0&&d<=6&&!x.race&&!x.club&&!x.bid)x.dow=+d;});
    wk.s.sort(function(a,b){return a.dow-b.dow;}); wk.moved=true;});
  var p={r:r,m:m,start:start,n:n,weeks:weeks,end:dms(r.date)};
  PC[r.id]={key:key,p:p}; return p;
}
function sk(r,w,k){return r.id+":"+w+"-"+k;}
function sessDate(pl,w,s){return pl.start+((w-1)*7+s.dow)*DAY;}
function sessByKey(wk,k){if(!wk)return null; for(var i=0;i<wk.s.length;i++)if(wk.s[i].k===k)return wk.s[i]; return null;}
function sessAt(wk,dow){if(!wk)return null; for(var i=0;i<wk.s.length;i++)if(wk.s[i].dow===dow)return wk.s[i]; return null;}
function planIdx(pl){return Math.floor((todayUTC()-pl.start)/DAY);}
function nowWeek(pl){var i=planIdx(pl); return i<0?1:Math.min(pl.n,Math.floor(i/7)+1);}
function extraWk(wk){var o={km:0,dp:0,n:0}; if(!wk||!wk.start||!D.extra)return o; for(var i=0;i<7;i++){var e=D.extra[iso(wk.start+i*DAY)]; if(e){o.km+=e.km;o.dp+=e.dp||0;o.n++;}} return o;}
function weekDone(r,wk){var c=0; wk.s.forEach(function(s){if(D.done[sk(r,wk.n,s.k)])c++;}); return c+extraWk(wk).n;}
function nSess(wk){return wk.s.filter(function(s){return !s.race;}).length+extraWk(wk).n;}
function totals(pl){var t=0,d=0; pl.weeks.forEach(function(wk){t+=nSess(wk); d+=weekDone(pl.r,wk);}); return {t:t,d:d};}
function estDur(m,s){if(s.bid){var br=raceById(s.bid); return br?goalOf(br)*60:0;} if(!s.km||s.race)return 0; return (s.km+(s.dp||0)/100)*m.eff*(s.tag==="q"?1:1.12);}
function byDate(pl){var o={}; pl.weeks.forEach(function(wk){wk.s.forEach(function(s){o[iso(sessDate(pl,wk.n,s))]={w:wk.n,s:s};});}); return o;}

// ---------- coach ----------
var BADGE=[["ok","En cible"],["warn","À ajuster"],["off","Hors cible"]];
function review(m,s,ac){
  var L=[],lvl=0,fast=false; function bump(n){if(n>lvl)lvl=n;}
  if(s.club||s.type.indexOf("Club")===0){L.push("Séance collective obligatoire enregistrée. Elle compte dans ta semaine, rien à comparer avec le plan."); return {lvl:0,lines:L,fast:false};}
  if(s.race||s.type==="Course B"){L.push("Course enregistrée : "+kmS(ac.km)+" km"+(ac.t?" en "+dur(ac.t):"")+"."); return {lvl:0,lines:L,fast:false};}
  if(s.km>0){var r=ac.km/s.km;
    if(r>1.15&&ac.km-s.km>=3){bump(2);L.push("Tu as dépassé de "+kmS(Math.round((ac.km-s.km)*10)/10)+" km ("+kmS(ac.km)+" km pour "+kmS(s.km)+" prévus). Reste dans le plan : ce surplus est retiré de tes prochaines sorties, y compris le club.");}
    else if(r>1.15){bump(1);L.push("Plus long que prévu : "+kmS(ac.km)+" km pour "+kmS(s.km)+" prévus. Garde de la fraîcheur pour la suite.");}
    else if(r>=0.9)L.push("Distance dans la cible : "+kmS(ac.km)+" km pour "+kmS(s.km)+" prévus.");
    else if(r>=0.75){bump(1);L.push("Un peu court : "+kmS(ac.km)+" km pour "+kmS(s.km)+" prévus.");}
    else{bump(2);L.push("Nettement en dessous : "+kmS(ac.km)+" km pour "+kmS(s.km)+" prévus. Si c’était de la fatigue, tu as bien fait. Sinon, ne rattrape pas d’un coup.");}}
  if(s.dp>=100&&ac.dp>0){var dr=ac.dp/s.dp;
    if(dr<0.75){bump(dr<0.5?2:1);L.push("Il manque du dénivelé : +"+ac.dp+" m pour +"+s.dp+" m prévus.");}
    else if(dr>1.3)L.push("Beaucoup de dénivelé : +"+ac.dp+" m pour +"+s.dp+" m prévus. Bien, si tu récupères correctement.");
    else L.push("Dénivelé dans la cible : +"+ac.dp+" m pour +"+s.dp+" m prévus.");}
  if((s.tag==="e"||s.tag==="l")&&ac.t>0&&ac.km>0){var e=ac.t/(ac.km+(ac.dp||0)/100);
    if(e<m.eff*0.97){fast=true;bump(1);L.push("Trop rapide pour une sortie facile : "+mmss(e)+" par km-effort, plus vite que ton allure de course ("+mmss(m.eff)+"). Ralentis pour rester en zone 2.");}}
  if(!L.length)L.push("Séance enregistrée.");
  return {lvl:lvl,lines:L,fast:fast};
}
function weekStats(pl,wk){
  var n=0,pk=0,ak=0,pd=0,ad=0,fast=0,c=[0,0,0];
  wk.s.forEach(function(s){var ac=D.actual[sk(pl.r,wk.n,s.k)]; if(!ac||s.race)return; n++; var rv=review(pl.m,s,ac); c[rv.lvl]++; if(rv.fast)fast++; if(s.km){pk+=s.km;ak+=ac.km;} if(s.dp>=100){pd+=s.dp;ad+=ac.dp;}});
  return {n:n,pk:pk,ak:ak,pd:pd,ad:ad,fast:fast,c:c,pc:pk?Math.round(ak/pk*100):0};
}
var LIGHT=0.82, MICRO=0.88;
function ciOf(r,w){return D.ci[r.id+":"+w]||{};}
function adjFor(pl,w){
  if(w<2||w>=pl.n||pl.weeks[w-1].ph==="Affûtage")return null;
  var st=weekStats(pl,P(pl,w-1)), c=ciOf(pl.r,w), pv=ciOf(pl.r,w-1);
  var ok=st.n>=3, pc=st.pc, heavy=c.f>=4, bad=c.s>0&&c.s<=2, feel2=c.f===5&&pv.f===5, hasCi=!!(c.f||c.s);
  var cip=[]; if(heavy)cip.push("une fatigue de "+c.f+"/5"); if(bad)cip.push("un sommeil de "+c.s+"/5");
  var reasons=[];
  if(ok)reasons.push({k:"Volume réalisé",v:pc+" % du prévu ("+kmS(st.ak)+" km sur "+kmS(st.pk)+" km)",r:"Moins de 75 % : semaine allégée. 90 à 115 % : plan normal. Plus de 120 % : micro-récupération."});
  if(ok&&st.fast>0)reasons.push({k:"Sorties faciles",v:st.fast+" trop rapide"+(st.fast>1?"s":""),r:"À partir de 2 sorties trop rapides : Zone 2 stricte."});
  reasons.push(hasCi?{k:"Check-in",v:cip.length?"tu indiques "+cip.join(" et "):"fatigue et sommeil corrects",r:cip.length?"Une grosse fatigue ou un mauvais sommeil renforcent une proposition d’allègement.":"Rien d’inquiétant côté récupération."}:{k:"Check-in",v:"pas encore rempli",r:"Il affine la proposition."});
  var wk=pl.weeks[w-1], sat=sessAt(wk,5), tue=sessAt(wk,1), mode=null, lead="", prop="", effx=[];
  function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
  var volTxt=ok?"tu as fait "+pc+" % du volume prévu":"", ciTxt=cip.length?"ton check-in indique "+cip.join(" et "):"";
  if(feel2||(ok&&pc>120)){mode="micro"; lead=cap((ok&&pc>120?"volume à "+pc+" %":"")+(ok&&pc>120&&feel2?" et ":"")+(feel2?"fatigue à 5/5 deux semaines de suite":"")+"."); prop="Je te propose une micro-récupération (environ −12 %).";
    effx=["Mardi : footing progressif de 40 min"+(tue?" à la place de « "+tue.type.toLowerCase()+" »":"")+".","Mercredi et samedi : environ −12 %"+(sat?" (samedi "+kmS(sat.km)+" → "+kmS(sat.km*MICRO)+" km)":"")+".","Dimanche (club) : jamais sous le minimum du club (15 km, 2 h, +500 m).","Jeudi : club, inchangé."];}
  else if((ok&&pc<75)||(ok&&pc<90&&(heavy||bad))||(heavy&&bad)||c.f===5){mode="light"; lead=cap(volTxt+(volTxt&&ciTxt?" et ":"")+ciTxt+"."); prop="Je te propose une semaine allégée (−18 %).";
    effx=["Mardi, mercredi, samedi : −18 % en distance et en dénivelé"+(sat?" (samedi "+kmS(sat.km)+" → "+kmS(sat.km*LIGHT)+" km)":"")+".","Dimanche (club) : jamais sous le minimum du club.","Jeudi : club, inchangé."];}
  else if(ok&&st.fast>=2){mode="z2"; lead=st.fast+" sorties faciles trop rapides la semaine dernière."; prop="Cette semaine, Zone 2 stricte."; effx=["Sorties faciles et longues : sous 150 bpm, même si ça paraît lent.","Marche dès que la FC dépasse 150 bpm dans les côtes.","Le volume ne change pas."];}
  else if(ok||hasCi){mode="normal"; lead=cap(volTxt+(volTxt&&hasCi?", ":"")+(hasCi?"ton check-in est bon":"")+"."); prop="On garde le plan normal."; effx=["Aucun changement cette semaine."];}
  if(!mode)return null;
  return {mode:mode,lead:lead,prop:prop,reasons:reasons,eff:effx};
}
function P0(pl,w){
  var wk=pl.weeks[w-1]; if(!wk||w<2||D.adj[pl.r.id+":"+w]!=="on")return wk;
  var a=adjFor(pl,w); if(!a||(a.mode!=="light"&&a.mode!=="micro"))return wk;
  var f=a.mode==="light"?LIGHT:MICRO, lab=a.mode==="light"?"Allégée −18 %":"Micro-récup. −12 %";
  var S=wk.s.map(function(s){var c=Object.assign({},s); if(s.club||s.type.indexOf("Club")===0||s.race||s.type==="Course B")return c; c.km=Math.round(s.km*f*10)/10; c.dp=Math.round(s.dp*f); c.adjusted=true; c.steps=null;
    if(s.club){c.km=Math.max(15,c.km); c.dp=Math.max(500,c.dp);} c.txt=s.txt+" Version allégée : vise "+kmS(c.km)+" km"+(c.dp?" et +"+c.dp+" m":"")+"."; return c;});
  if(a.mode==="micro")S=S.map(function(s){return s.dow===1&&s.tag==="q"?sess({k:s.k,dow:1,tag:"e",type:"Progressif",km:7,dp:100,adjusted:true,steps:[["40 min","De la zone 1-2 à la zone 3 basse"]],txt:"Micro-récupération : 40 min en progressif. Pas de séance de qualité aujourd’hui."}):s;});
  return Object.assign({},wk,{s:S,adjLabel:lab});
}
// ---------- Rééquilibrage de la semaine en cours (séance plus forte ou plus faible que prévu) ----------
// Règles : on ne rattrape jamais tout. Surplus : on en absorbe 70 % sur les sorties faciles / longues restantes (max −30 % chacune).
// Manque : on rend 50 % seulement, sur la sortie longue, max +10 %, et rien si la fraîcheur est très basse. Club, courses et séances modifiées : jamais touchés.
function rbCompute(pl,w,wk){
  var r=pl.r, ti=planIdx(pl), td=ti-(w-1)*7; if(ti<0||td<0||td>6||!wk)return null;
  var pk=0, dk=0, dd=0, any=false;
  wk.s.forEach(function(x){if(x.race)return; pk+=x.km||0; var ac=D.actual[sk(r,w,x.k)]; if(ac&&ac.km>0){dk+=ac.km-(x.km||0); dd+=(ac.dp||0)-(x.dp||0); any=true;}});
  var ex=extraWk(wk); if(ex.km>0){dk+=ex.km; dd+=ex.dp; any=true;}
  if(!any||pk<=0)return null;
  function flex(x){return !x.race&&(!x.club||x.tag==="l")&&x.type.indexOf("Club")!==0&&x.type!=="Course B"&&!x.edited&&x.km>0&&x.dow>=td&&!D.actual[sk(r,w,x.k)]&&!D.done[sk(r,w,x.k)]&&(x.tag==="e"||x.tag==="l");}
  var cand=wk.s.filter(flex), ch={}, items=[], txt="";
  if(dk>=Math.max(3,0.12*pk)&&cand.length){
    var tot=cand.reduce(function(a,x){return a+x.km;},0), A=Math.min(0.7*dk,0.3*tot);
    cand.forEach(function(x){var cut=A*x.km/tot, to=Math.max(x.tag==="l"?x.km*0.7:Math.min(4,x.km),x.km-cut); if(x.club)to=Math.max(4,x.km-dk); to=Math.round(to*2)/2; if(to<x.km)ch[x.k]=to;});
    txt=(ex.km>0?"Tu as couru "+kmS(Math.round(ex.km*10)/10)+" km un jour sans séance prévue. ":"")+"Tu as couru "+kmS(Math.round(dk*10)/10)+" km de plus que prévu cette semaine"+(dd>=200?" (et +"+nb(Math.round(dd))+" m de dénivelé)":"")+". Pour arriver reposée à tes prochaines séances de qualité, j’en absorbe environ 70 % sur tes sorties faciles à venir.";
  } else if(dk<=-Math.max(3,0.15*pk)){
    var lg=cand.filter(function(x){return x.tag==="l";})[0], fr=null; try{var S=formeSeries(); fr=S&&S.pts[S.pts.length-1].z;}catch(e){}
    if(lg&&!(fr!=null&&fr<-25)){var to2=Math.round(Math.min(lg.km*1.1,lg.km+0.5*(-dk))*2)/2; if(to2>lg.km)ch[lg.k]=to2;}
    txt="Il te manque "+kmS(Math.round(-dk*10)/10)+" km sur ce qui était prévu. Je ne rattrape jamais tout d’un coup : je rends la moitié, uniquement sur ta sortie longue, au maximum +10 %.";
    if(fr!=null&&fr<-25)txt="Il te manque "+kmS(Math.round(-dk*10)/10)+" km, mais ta fraîcheur est très basse : je ne rattrape rien, mieux vaut récupérer.";
  } else return null;
  Object.keys(ch).forEach(function(k){var x=cand.filter(function(y){return y.k===k;})[0]; items.push({k:k,dow:x.dow,type:x.type,from:x.km,to:ch[k]});});
  return {items:items,txt:txt,dk:dk,ch:ch};
}
function P(pl,w){
  var wk=P0(pl,w); if(!wk||w!==nowWeek(pl))return wk;
  var rb=rbCompute(pl,w,wk); if(!rb)return wk;
  var off=D.adj[pl.r.id+":"+w+":rb"]==="off";
  if(off||!rb.items.length)return Object.assign({},wk,{rb:rb,rbOff:off});
  var S=wk.s.map(function(x){var to=rb.ch[x.k]; if(to==null)return x; var f=to/x.km, c=Object.assign({},x); c.rbFrom=x.km; c.km=to; c.dp=Math.round((x.dp||0)*f); c.rbd=true; if(x.club)c.cw=1; c.steps=null;
    if(x.club){c.txt=c.km<=4?"Repos conseillé. "+kmS(c.km)+" km très faciles au maximum.":"Pas la sortie complète : vise "+kmS(c.km)+" km."; return c;}
    c.txt=(x.txt||"")+" Ajustée selon ta semaine : vise "+kmS(c.km)+" km"+(c.dp?" et +"+c.dp+" m":"")+"."+(x.club?(c.km<=4?" Tu as déjà couru le volume prévu de la semaine : repos conseillé, au maximum "+kmS(c.km)+" km très faciles. Ne fais pas la sortie du club en entier.":" Tu as déjà couru une partie du volume de la semaine : ne fais pas la sortie du club en entier, vise "+kmS(c.km)+" km."):""); return c;});
  return Object.assign({},wk,{s:S,rb:rb,rbOff:false});
}
function rbCard(r,wk){
  var rb=wk.rb; if(!rb||!rb.items.length)return ""; var off=wk.rbOff, h='<details class="card fold"><summary><h2>Ajustement de ta semaine</h2><span>'+(off?"désactivé":rb.items.length+" séance"+(rb.items.length>1?"s":"")+" adaptée"+(rb.items.length>1?"s":""))+'</span></summary><p class="small" style="margin:6px 0 8px">'+esc(rb.txt)+'</p>';
  h+='<ul class="pts">'+rb.items.map(function(x){return '<li>'+DOWL[x.dow]+' ('+esc(x.type.toLowerCase())+') : '+kmS(x.from)+' → <b>'+kmS(x.to)+' km</b>'+(off?" (non appliqué)":"")+'</li>';}).join("")+'</ul>';
  h+='<p class="small muted" style="margin:8px 0 10px">Les séances du jeudi au club, les courses et celles que tu as modifiées ne changent jamais. La sortie club du dimanche peut passer sous le minimum du club.</p>';
  return h+'<button class="btn sm" data-rb="'+(off?"on":"off")+'" data-w="'+wk.n+'">'+(off?"Appliquer l’ajustement":"Annuler l’ajustement")+'</button></details>';
}
// ---------- icônes ----------
// Compatibilité des autres pictogrammes de l'application.
function sv(p,w){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';}
// Material Symbols Rounded : SVG embarqués, sans dépendance ni requête réseau.
function ms(d){return '<svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path fill="currentColor" d="'+d+'"/></svg>';}
var TI={cotes:ms('M120-240q-25 0-36-22t4-42l160-213q6-8 14.5-12t17.5-4q9 0 17.5 4t14.5 12l148 197h300L560-586l-68 90q-12 16-28 16.5t-28-8.5q-12-9-16-24.5t8-31.5l100-133q6-8 14.5-12t17.5-4q9 0 17.5 4t14.5 12l280 373q15 20 4 42t-36 22H120Zm340-80h300-312 68.5H460Zm-260 0h160l-80-107-80 107Zm0 0h160-160Z'),frac:ms('M400-840q-17 0-28.5-11.5T360-880q0-17 11.5-28.5T400-920h160q17 0 28.5 11.5T600-880q0 17-11.5 28.5T560-840H400Zm80 440q17 0 28.5-11.5T520-440v-160q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600v160q0 17 11.5 28.5T480-400Zm0 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l28-28q11-11 28-11t28 11q11 11 11 28t-11 28l-28 28q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-280Z'),tempo:ms('M418-340q24 24 62 23.5t56-27.5l169-253q9-14-2.5-25.5T677-625L424-456q-27 18-28.5 55t22.5 61Zm62-460q36 0 71 6t68 19q16 6 34 22.5t10 31.5q-8 15-36 20t-45-1q-25-9-50.5-13.5T480-720q-133 0-226.5 93.5T160-400q0 42 11.5 83t32.5 77h552q23-38 33.5-79t10.5-85q0-26-4.5-51T782-504q-6-17-2-33t18-27q13-10 28.5-6t21.5 18q15 35 23 71.5t9 74.5q1 57-13 109t-41 99q-11 18-30 28t-40 10H204q-21 0-40-10t-30-28q-26-45-40-95.5T80-400q0-83 31.5-155.5t86-127Q252-737 325-768.5T480-800Zm7 313Z'),long:ms('M360-120q-66 0-113-47t-47-113v-327q-35-13-57.5-43.5T120-720q0-50 35-85t85-35q50 0 85 35t35 85q0 39-22.5 69.5T280-607v327q0 33 23.5 56.5T360-200q33 0 56.5-23.5T440-280v-400q0-66 47-113t113-47q66 0 113 47t47 113v327q35 13 57.5 43.5T840-240q0 50-35 85t-85 35q-50 0-85-35t-35-85q0-39 22.5-70t57.5-43v-327q0-33-23.5-56.5T600-760q-33 0-56.5 23.5T520-680v400q0 66-47 113t-113 47ZM240-680q17 0 28.5-11.5T280-720q0-17-11.5-28.5T240-760q-17 0-28.5 11.5T200-720q0 17 11.5 28.5T240-680Zm480 480q17 0 28.5-11.5T760-240q0-17-11.5-28.5T720-280q-17 0-28.5 11.5T680-240q0 17 11.5 28.5T720-200ZM240-720Zm480 480Z'),endu:ms('M520-80v-200l-84-80-31 138q-4 16-17.5 24.5T358-192l-198-40q-17-3-26-17t-6-31q3-17 17-26.5t31-5.5l152 32 64-324-72 28v96q0 17-11.5 28.5T280-440q-17 0-28.5-11.5T240-480v-122q0-12 6.5-21.5T264-638l134-58q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q21 34 54.5 59t77.5 33q17 3 28.5 15t11.5 29q0 17-11.5 28t-27.5 9q-54-8-101-33.5T540-540l-24 120 72 68q6 6 9 13.5t3 15.5v243q0 17-11.5 28.5T560-40q-17 0-28.5-11.5T520-80Zm20-660q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z'),race:ms('M440-200v-124q-49-11-87.5-41.5T296-442q-75-9-125.5-65.5T120-640v-40q0-33 23.5-56.5T200-760h80q0-33 23.5-56.5T360-840h240q33 0 56.5 23.5T680-760h80q33 0 56.5 23.5T840-680v40q0 76-50.5 132.5T664-442q-18 46-56.5 76.5T520-324v124h120q17 0 28.5 11.5T680-160q0 17-11.5 28.5T640-120H320q-17 0-28.5-11.5T280-160q0-17 11.5-28.5T320-200h120ZM280-528v-152h-80v40q0 38 22 68.5t58 43.5Zm200 128q50 0 85-35t35-85v-240H360v240q0 50 35 85t85 35Zm200-128q36-13 58-43.5t22-68.5v-40h-80v152Zm-200-52Z'),club:ms('M40-240q-17 0-28.5-11.5T0-280v-23q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H40Zm240 0q-17 0-28.5-11.5T240-280v-25q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v25q0 17-11.5 28.5T680-240H280Zm500 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v23q0 17-11.5 28.5T920-240H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z'),rest:ms('M524-40q-84 0-157.5-32t-128-86.5Q184-213 152-286.5T120-444q0-128 72-232t193-146q22-8 41 5.5t18 36.5q-3 85 27 162t90 137q60 60 137 90t162 27q26-1 38.5 17.5T903-305q-44 120-147.5 192.5T524-40Zm0-80q88 0 163-44t118-121q-86-8-163-43.5T504-425q-61-61-97-138t-43-163q-77 43-120.5 118.5T200-444q0 135 94.5 229.5T524-120Zm-20-305Z'),renfo:ms('M282-622 168-508q-11 11-27.5 11.5T112-508q-11-11-11.5-27.5T111-564l29-30-28-28q-12-12-12-28t12-28l56-56-29-30q-11-11-11-27.5t12-28.5q11-11 27.5-11.5T196-821l30 29 56-56q12-12 28-12t28 12l28 28 30-29q11-11 27.5-11t28.5 12q11 11 11 28t-11 28L338-678l340 340 114-114q11-11 27.5-11.5T848-452q11 11 11.5 27.5T849-396l-29 30 28 28q12 12 12 28t-12 28l-56 56 29 30q11 11 11 27.5T820-140q-11 11-27.5 11.5T764-139l-30-29-56 56q-12 12-28 12t-28-12l-28-28-30 29q-11 11-27.5 11T508-112q-11-11-11-28t11-28l114-114-340-340Z'),mobilite:ms('M480-720q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720ZM360-120v-480q-49-4-99-11t-98-18q-17-4-27.5-19t-5.5-32q5-17 21-25t34-4q70 15 145.5 22t149.5 7q74 0 149.5-7T775-709q18-4 34 4t21 25q5 17-5.5 32T797-629q-48 11-98 18t-99 11v480q0 17-11.5 28.5T560-80q-17 0-28.5-11.5T520-120v-200h-80v200q0 17-11.5 28.5T400-80q-17 0-28.5-11.5T360-120Z'),recovery:ms('M480-480Zm0 360q-18 0-34.5-6.5T416-146L148-415q-35-35-51.5-80T80-589q0-103 67-177t167-74q48 0 90.5 19t75.5 53q32-34 74.5-53t90.5-19q100 0 167.5 74T880-590q0 49-17 94t-51 80L543-146q-13 13-29 19.5t-34 6.5Zm40-520q10 0 19 5t14 13l68 102h166q7-17 10.5-34.5T801-590q-2-69-46-118.5T645-758q-31 0-59.5 12T536-711l-27 29q-5 6-13 9.5t-16 3.5q-8 0-16-3.5t-14-9.5l-27-29q-21-23-49-36t-60-13q-66 0-110 50.5T160-590q0 18 3 35.5t10 34.5h187q10 0 19 5t14 13l35 52 54-162q4-12 14.5-20t23.5-8Zm12 130-54 162q-4 12-15 20t-24 8q-10 0-19-5t-14-13l-68-102H236l237 237q2 2 3.5 2.5t3.5.5q2 0 3.5-.5t3.5-2.5l236-237H600q-10 0-19-5t-15-13l-34-52Z'),desc:ms('M744-320 536-526 433-423q-23 23-57 23t-57-23L108-636q-11-11-11.5-27.5T108-692q11-11 28-11t28 11l212 212 103-103q23-23 57-23t57 23l207 207v-64q0-17 11.5-28.5T840-480q17 0 28.5 11.5T880-440v160q0 17-11.5 28.5T840-240H680q-17 0-28.5-11.5T640-280q0-17 11.5-28.5T680-320h64Z'),trail:ms('M436-360 371-72q-3 14-14.5 23T330-40q-20 0-32-15t-8-34l113-573q6-29 27-43.5t44-14.5q23 0 42.5 10t31.5 30l40 64q18 29 46.5 52.5T700-529v-41q0-13 8.5-21.5T730-600q13 0 21.5 8.5T760-570v500q0 13-8.5 21.5T730-40q-13 0-21.5-8.5T700-70v-376q-48-11-89-35t-71-59l-24 120 72 68q6 6 9 13.5t3 15.5v243q0 17-11.5 28.5T560-40q-17 0-28.5-11.5T520-80v-200l-84-80Zm-178-82-46-9q-16-3-25-16.5t-6-30.5l30-157q6-34 36-51.5t65-10.5q17 3 25.5 16.5T343-670l-38 196q-3 17-16.5 26t-30.5 6Zm282-298q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z'),piste:ms('M120-712v-96q0-11 9.5-17t19.5-1l95 48q11 5 11 18t-11 18l-95 48q-10 5-19.5-1t-9.5-17Zm600 0v-96q0-11 9.5-17t19.5-1l95 48q11 5 11 18t-11 18l-95 48q-10 5-19.5-1t-9.5-17Zm-280-40v-96q0-11 9.5-17t19.5-1l95 48q11 5 11 18t-11 18l-95 48q-10 5-19.5-1t-9.5-17ZM406-81q-140-8-233-41.5T80-200v-360q0-25 31.5-46.5t85.5-38q54-16.5 127-26t156-9.5q83 0 156 9.5t127 26q54 16.5 85.5 38T880-560v360q0 45-93.5 78T553-81q-14 1-23.5-8.5T520-113v-127h-80v126q0 14-10 24t-24 9Zm74-439q97 0 167.5-11.5T760-558q0-5-76-23.5T480-600q-128 0-204 18.5T200-558q42 15 112.5 26.5T480-520ZM360-166v-74q0-33 23.5-56.5T440-320h80q33 0 56.5 23.5T600-240v74q80-8 131-23.5t69-27.5v-271q-55 22-138 35t-182 13q-99 0-182-13t-138-35v271q18 12 69 27.5T360-166Zm120-161Z'),swim:ms('M480-160q-36 0-57 20t-77 20q-56 0-77-20t-57-20q-29 0-44 13.5T121-125q-16 4-28.5-7T80-160q0-17 12-29.5t27-20.5q17-9 36-19.5t57-10.5q56 0 77 20t57 20q36 0 57-20t77-20q56 0 77 20t57 20q36 0 57-20t77-20q38 0 57 10.5t36 19.5q15 8 27 20.5t12 29.5q0 17-12.5 28t-28.5 7q-32-8-47-21.5T748-160q-36 0-57 20t-77 20q-56 0-77-20t-57-20Zm0-180q-38 0-56.5 20T346-300q-59 0-78.5-20T212-340q-29 0-44 13.5T121-305q-16 4-28.5-7T80-340q0-17 12-29.5t27-20.5q17-9 36-19.5t57-10.5q56 0 77.5 20t56.5 20q36 0 57-20t77-20q56 0 77 20t57 20q36 0 57-20t77-20q38 0 57 10.5t36 19.5q15 8 27 20.5t12 29.5q0 17-12.5 28t-28.5 7q-32-8-47-21.5T748-340q-36 0-55.5 20T614-300q-57 0-77.5-20T480-340ZM276-504l133-133-40-40q-25-25-51.5-39.5T257-736q-20-4-34.5-19T208-790q0-21 15-35.5t35-12.5q54 5 93 22.5t77 55.5l256 256q-17 11-33 17.5t-37 6.5q-36 0-57-20t-77-20q-56 0-77 20t-57 20q-21 0-37-6.5T276-504Zm392-336q42 0 71 29.5t29 70.5q0 42-29 71t-71 29q-42 0-71-29t-29-71q0-41 29-70.5t71-29Z'),bike:ms('M620-740q-33 0-56.5-23.5T540-820q0-33 23.5-56.5T620-900q33 0 56.5 23.5T700-820q0 33-23.5 56.5T620-740ZM432-540l66 69q11 11 16.5 25t5.5 30v176q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-160L312-512q-14-12-19-25t-5-31q0-18 5.5-30.5T312-624l112-112q13-13 27.5-18.5T484-760q18 0 32.5 5.5T544-736l76 76q21 21 47 35.5t58 20.5q17 3 28 15t11 29q0 17-12 28t-29 9q-49-7-90-28t-73-53l-32-32-96 96Zm-232 60q85 0 142.5 57.5T400-280q0 85-57.5 142.5T200-80q-85 0-142.5-57.5T0-280q0-85 57.5-142.5T200-480Zm0 340q57 0 98.5-41.5T340-280q0-57-41.5-98.5T200-420q-57 0-98.5 41.5T60-280q0 57 41.5 98.5T200-140Zm560-340q85 0 142.5 57.5T960-280q0 85-57.5 142.5T760-80q-85 0-142.5-57.5T560-280q0-85 57.5-142.5T760-480Zm0 340q57 0 98.5-41.5T900-280q0-57-41.5-98.5T760-420q-57 0-98.5 41.5T620-280q0 57 41.5 98.5T760-140Z'),sport:ms('M440-200q-100 0-170-70t-70-170q0-11 1-22t3-22q-5 2-12 3t-12 1q-42 0-71-29t-29-71q0-42 27.5-71t69.5-29q33 0 59.5 18.5T274-614q33-30 75.5-48t90.5-18h400q17 0 28.5 11.5T880-640v80q0 17-11.5 28.5T840-520H680v80q0 100-70 170t-170 70ZM180-540q17 0 28.5-11.5T220-580q0-17-11.5-28.5T180-620q-17 0-28.5 11.5T140-580q0 17 11.5 28.5T180-540Zm260 240q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Zm0-60q33 0 56.5-23.5T520-440q0-33-23.5-56.5T440-520q-33 0-56.5 23.5T360-440q0 33 23.5 56.5T440-360Zm0-80Z')};
function tkind(s){
 if(!s)return "rest";
 var t=String(s.type||"").toLowerCase();
 if(s.race||/^course|jour j/i.test(t))return "race";
 if(/récup|recup/.test(t))return "recovery";
 if(/mobilit/.test(t))return "mobilite";
 if(/renfo|gainage/.test(t))return "renfo";
 if(/natation|nage|piscine/.test(t))return "swim";
 if(/vélo|velo|cycl/.test(t))return "bike";
 if(/autre sport/.test(t))return "sport";
 if(/descente/.test(t))return "desc";
 if(/c[ôo]te/.test(t))return "cotes";
 if(/piste/.test(t))return "piste";
 if(s.club||(typeof isClubSession==="function"&&isClubSession(s)))return "club";
 if(/fraction|fartlek|vma|intervall|rappel|activation/.test(t))return "frac";
 if(/tempo|seuil|allure/.test(t))return "tempo";
 if(/long|bloc/.test(t))return "long";
 if(/trail|rando|montagne/.test(t))return "trail";
 if(/endurance|footing|progress/.test(t))return "endu";
 return "endu";
}
function tico(s){return TI[tkind(s)];}
var I={
 bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
 logout:sv('<path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>'),
 gear:sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
 check:sv('<path d="M5 12l5 5 9-10"/>',3), play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
 back:sv('<path d="M15 5l-7 7 7 7"/>',2.4), sync:sv('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
 heart:sv('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
 bell:sv('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'), flag:sv('<path d="M5 21V4h11l-2 4 2 4H5"/>'),
 gel:sv('<path d="M9 3h6v4l2 3v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9l2-3z"/>'), drop:sv('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
 vib:sv('<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 8v8M20 8v8"/>'), up:sv('<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>'),
 down:sv('<path d="M12 3v12M7 10l5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>'), trash:sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
 help:sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01"/>'), dumb:sv('<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>'),
 leaf:sv('<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19l7-7"/>'), pin:sv('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
 watch:sv('<rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2l1.5 1"/>'), pen:sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'), list:sv('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>')
};

// ---------- petits blocs ----------
// ---------- notifications : ce qui demande ton attention ----------
function notifs(){
  var L=[], r=activeRace(); if(!r)return L;
  try{var pl=planOf(r); if(pl){var ti=planIdx(pl), w=nowWeek(pl);
    if(ti>=0){
      if(D.set.checkin&&w>=2&&pl.weeks[w-1].ph!=="Affûtage"){var c=ciOf(r,w), dw=((ti%7)+7)%7; if(!(c.f&&c.s))L.push({t:dw===0?"Check-in du lundi":"Check-in oublié",d:"10 secondes pour que le coach ajuste ta semaine.",go:"today"});}
      var a=adjFor(pl,w), st=D.adj[r.id+":"+w];
      if(a&&!st&&(a.mode==="light"||a.mode==="micro"||a.mode==="z2"))L.push({t:"Ajustement conseillé",d:{light:"Semaine allégée proposée.",micro:"Micro-récupération proposée.",z2:"Zone 2 stricte cette semaine."}[a.mode],go:"today"});
      if(ti>=1){var yi=ti-1, yw=Math.floor(yi/7)+1, yd=((yi%7)+7)%7, ws=pl.weeks[yw-1], ys=ws&&sessAt(ws,yd);
        if(ys&&!ys.race&&!ys.club&&ys.km>0&&!D.done[sk(r,yw,ys.k)]&&!D.actual[sk(r,yw,ys.k)])L.push({t:"Séance d’hier non faite",d:ys.type+" · tu peux la déplacer ou la marquer faite.",go:"goto:"+yw+"-"+yd});}
    }}}catch(e){}
  var sy=D.sync||{}; if(sy.err)L.push({t:"Synchronisation Strava",d:String(sy.err).slice(0,90),go:"today"});
  return L;
}
function bellBtn(){var n=notifs().length; return '<button class="ibtn bell'+(n?" on":"")+'" data-act="notifs" aria-label="Notifications'+(n?' ('+n+')':'')+'">'+I.bell+(n?'<i class="bn">'+n+'</i>':'')+'</button>';}
function openNotifs(){
  var L=notifs(), h='<h2>Notifications</h2>';
  if(!L.length)h+='<p class="small muted">Rien à signaler. Ton plan est à jour.</p>';
  else h+='<div class="ntf">'+L.map(function(x){return '<button class="ntf-i" data-ngo="'+esc(x.go)+'"><b>'+esc(x.t)+'</b><span>'+esc(x.d)+'</span></button>';}).join("")+'</div>';
  openSheet(h,{kind:"ntf"});
}
function header(eyebrow,title){return '<div class="top"><div><span class="eyebrow">'+eyebrow+'</span><h1>'+title+'</h1></div><div class="top-actions">'+bellBtn()+'<button class="ibtn account-logout" type="button" data-account-logout title="Se déconnecter" aria-label="Se déconnecter">'+I.logout+'</button><button class="ibtn" data-go="settings" aria-label="Réglages">'+I.gear+'</button></div></div>';}
function todoBtn(key,label,store){var st=store||D.todo, on=!!st[key]; return '<button class="todo" data-todo="'+esc(key)+'"'+(store?' data-store="kit"':'')+' aria-pressed="'+on+'"><span class="box">'+(on?I.check:"")+'</span><span class="t">'+label+'</span></button>';}
function woFor(s,wk){ // séance guidée proposée sur toute séance de renfo ou de mobilité
  if(!window.WORKOUT)return "";
  var code=s.renfo||(s.type==="Renfo seul"?renfoOf(wk.ph,wk.n):null);
  if(code)return woBtns(code);
  var txt=JSON.stringify(s.steps||"")+" "+(s.txt||"");
  return (/mobilit/i.test(txt)||s.type==="Récupération"||s.type==="Activation")?woBtns(null,0,MOBROT[(wk.n+(s.dow||0))%MOBROT.length]):"";
}
var WOM={};
function woMin(kind,code){var k=kind+(code||""); if(WOM[k]==null)WOM[k]=window.WORKOUT?WORKOUT.minutes(WORKOUT.build(kind,code||null,RENFO,MOB,MOBS)):(kind==="mob"?12:32); return WOM[k];} // une seule source : la durée du lecteur guidé
function mobOf(code){return MOBS[(code&&MOBFOR[code])||code]||MOBS.complet;}
function woBtns(code,only,mob){ // boutons de lancement : renfo guidé + la mobilité qui lui correspond
  if(!window.WORKOUT)return "";
  var mc=mob||(code&&MOBFOR[code])||"complet", h='<div class="wo-start">';
  if(code)h+='<button class="btn" data-wo="renfo:'+code+'">▶ Renfo guidé · '+woMin("renfo",code)+' min</button>';
  if(!only)h+='<button class="btn'+(code?' ghost':'')+'" data-wo="mob:'+mc+'">▶ '+esc(MOBS[mc].name)+' · '+woMin("mob",mc)+' min</button>';
  return h+'</div>';
}
function exHTML(list){ // chaque exercice s’ouvre sur sa fiche : dessin en 2 étapes, départ, exécution, respiration, erreurs
  return list.map(function(e){
    var id=window.EXO&&EXO.find(e[0]), thumb='<span class="exi">'+(id?EXO.one(id,true):"")+'</span>';
    if(!id)return '<div class="ex"><span class="exn">'+thumb+'<span>'+esc(e[0])+'</span></span><span>'+esc(e[1])+'</span></div>';
    return '<details class="ex2"><summary class="ex"><span class="exn">'+thumb+'<span>'+esc(e[0])+'</span></span><span>'+esc(e[1])+'</span></summary>'+EXO.sheet(id)+'</details>';
  }).join("");
}
var LOK={"Endurance + renfo":1,"Sortie longue":1,"Sortie club · dimanche":1,"Jour 2 du bloc":1,"Tempo long":1,"Fartlek nature":1,"Progressif":1,"Footing":1};
function loopHTML(o){var link=o.src==="Komoot"?"Chercher « "+o.n+" » sur Komoot":"Voir le tracé sur "+o.src; return '<div class="loop"><div class="lh"><b>'+esc(o.a)+' · '+esc(o.n)+'</b><span class="chip">'+esc(o.t)+'</span></div><div class="muted num">'+kmS(o.km)+' km · +'+o.dp+' m</div><p>'+esc(o.d)+'</p><a href="'+o.u+'" target="_blank" rel="noopener noreferrer">'+esc(link)+'</a></div>';}
function bestLoops(s){if(!s||!LOK[s.type]||s.km<5)return []; var pool=s.dp<100?LOCAL.filter(function(o){return o.dp<=150;}):LOCAL; return pool.map(function(o){return {o:o,v:Math.abs(s.km-o.km)/s.km+(s.dp>=100?Math.abs(s.dp-o.dp)/s.dp:0)};}).sort(function(a,b){return a.v-b.v;}).slice(0,2).map(function(x){return x.o;});}
function banners(){var f=fakeDate(); return f?'<div class="banner warn mini"><span>Date simulée : <b>'+fmtS(todayUTC())+'</b></span>'+(QS.get("date")?'':'<button data-act="unfake">Vraie date</button>')+'</div>':"";}

// ---------- profil ----------
function profileSVG(m,o){
  o=o||{}; var W=360,H=o.h||170,top=o.top||26,bot=H-22,L=m.L,P=m.prof;
  var dark=o.dark, line=dark?"#7fb898":"var(--brand)", trap=dark?"#ec8a52":"var(--off)", txt=dark?"#9aa49d":"var(--muted)", grid=dark?"#2d3530":"var(--line)";
  var X=function(k){return 10+k/L*(W-20);}, ring=dark?"#141917":"var(--card)";
  if(!P){var yy=(top+bot)/2, s0='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Parcours">';
    s0+='<line x1="10" x2="'+(W-10)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+line+'" stroke-width="3" stroke-linecap="round"/>';
    m.cps.slice(0,-1).forEach(function(c,i){s0+='<circle cx="'+X(c.km)+'" cy="'+yy+'" r="4" fill="'+line+'"/><text x="'+X(c.km)+'" y="'+(yy-10)+'" text-anchor="middle" font-size="10" font-weight="700" fill="'+txt+'">R'+(i+1)+'</text>';});
    if(o.pos!=null)s0+='<circle cx="'+X(o.pos)+'" cy="'+yy+'" r="7" fill="'+line+'" stroke="'+ring+'" stroke-width="3"/>';
    [0,L/2,L].forEach(function(k){s0+='<text x="'+Math.min(W-14,Math.max(14,X(k)))+'" y="'+(H-6)+'" text-anchor="middle" font-size="10" fill="'+txt+'">'+kmS(k)+'</text>';});
    return s0+'</svg>';}
  var lo=1e9,hi=-1e9; P.forEach(function(p){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);}); var pad=Math.max(20,(hi-lo)*0.1); lo-=pad; hi+=pad;
  var Y=function(e){return bot-(e-lo)/(hi-lo)*(bot-top);};
  var pts=function(arr){return arr.map(function(p,i){return (i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1);}).join(" ");};
  var d=pts(P), s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Profil de '+esc(m.r.name)+'"'+(o.id?' id="'+o.id+'" style="touch-action:none;cursor:crosshair"':'')+'>';
  if(!o.small){var st=Math.pow(10,Math.floor(Math.log10(Math.max(10,hi-lo)))); if((hi-lo)/st<3)st/=2; for(var e=Math.ceil(lo/st)*st;e<hi;e+=st)s+='<line x1="10" x2="'+(W-10)+'" y1="'+Y(e)+'" y2="'+Y(e)+'" stroke="'+grid+'" stroke-width="1"/><text x="'+(W-10)+'" y="'+(Y(e)-3)+'" text-anchor="end" font-size="9">'+Math.round(e)+' m</text>';}
  s+='<path d="'+d+' L'+X(L)+','+bot+' L'+X(0)+','+bot+'Z" fill="'+line+'" fill-opacity="'+(dark?.16:.14)+'"/>';
  if(o.pos!=null){var cut=P.filter(function(p){return p[0]<=o.pos;}); cut.push([o.pos,m.elevAt(o.pos)]); s+='<path d="'+pts(cut)+' L'+X(o.pos)+','+bot+' L'+X(0)+','+bot+'Z" fill="'+line+'" fill-opacity=".4"/>';}
  s+='<path d="'+d+'" fill="none" stroke="'+line+'" stroke-width="2.4" stroke-linejoin="round"/>';
  (m.traps||[]).forEach(function(t){var seg=P.filter(function(p){return p[0]>=t[0]&&p[0]<=t[1];}); if(seg.length>1)s+='<path d="'+pts(seg)+'" fill="none" stroke="'+trap+'" stroke-width="3.6" stroke-linecap="round"/>';});
  m.cps.slice(0,-1).forEach(function(c,i){s+='<line x1="'+X(c.km)+'" x2="'+X(c.km)+'" y1="'+(top-8)+'" y2="'+bot+'" stroke="'+txt+'" stroke-dasharray="2 3" stroke-width="1"/><text x="'+X(c.km)+'" y="'+(top-11)+'" text-anchor="middle" font-size="10" font-weight="700" fill="'+txt+'">R'+(i+1)+'</text>';});
  if(o.diff&&m.diff)m.diff.forEach(function(d,i){var seg=P.filter(function(p){return p[0]>=d.a&&p[0]<=d.b;}); if(!seg.length)return; var ey=d.up?Math.max.apply(null,seg.map(function(p){return p[1];})):Math.min.apply(null,seg.map(function(p){return p[1];})); var cx=X((d.a+d.b)/2), cy=Math.max(top+6,Math.min(bot-6,Y(ey)+(d.up?-11:11)));
    s+='<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="7.5" fill="'+(d.hard?trap:line)+'" stroke="'+ring+'" stroke-width="1.5"/><text x="'+cx.toFixed(1)+'" y="'+(cy+3.4).toFixed(1)+'" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff" style="fill:#fff">'+(i+1)+'</text>';});
  if(o.pos!=null)s+='<circle cx="'+X(o.pos)+'" cy="'+Y(m.elevAt(o.pos))+'" r="6" fill="'+line+'" stroke="'+ring+'" stroke-width="3"/>';
  var ticks=L>30?[0,10,20,30]:L>12?[0,5,10,15,20,25].filter(function(k){return k<L-2;}):[0,Math.round(L/2)]; ticks.push(L);
  ticks.forEach(function(k){s+='<text x="'+Math.min(W-14,Math.max(14,X(k)))+'" y="'+(H-6)+'" text-anchor="middle" font-size="10" fill="'+txt+'">'+kmS(k)+'</text>';});
  if(o.id)s+='<line id="profcur" x1="0" x2="0" y1="'+(top-8)+'" y2="'+bot+'" stroke="'+line+'" stroke-width="1.5" style="display:none"/><circle id="profdot" r="5" fill="'+line+'" stroke="var(--card)" stroke-width="2" style="display:none"/>';
  if(o.id)m._Y=Y;
  return s+'</svg>';
}
function bindProfile(m){
  var svg=$("profsvg"); if(!svg||!m.prof)return; var cur=$("profcur"),dot=$("profdot"),info=$("profinfo"),W=360;
  function at(cx){var r=svg.getBoundingClientRect(), x=(cx-r.left)/r.width*W, km=Math.max(0,Math.min(m.L,(x-10)/(W-20)*m.L)), sx=10+km/m.L*(W-20);
    cur.setAttribute("x1",sx); cur.setAttribute("x2",sx); cur.style.display=""; dot.setAttribute("cx",sx); dot.setAttribute("cy",m._Y(m.elevAt(km))); dot.style.display="";
    var nx=m.cps.filter(function(c){return c.km>km+0.05;})[0];
    info.textContent="Km "+kmS(km)+" · "+Math.round(m.elevAt(km))+" m · +"+m.dplus(0,km)+" m depuis le départ · passage visé "+hm(m.cumMin(km))+(nx&&nx.km<m.L?" · "+nx.n+" dans "+kmS(nx.km-km)+" km":""); info.classList.remove("muted");}
  svg.addEventListener("pointermove",function(e){at(e.clientX);}); svg.addEventListener("pointerdown",function(e){at(e.clientX);});
  svg.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"){cur.style.display="none";dot.style.display="none";info.textContent="Touche le profil : km, altitude, D+ et passage visé.";info.classList.add("muted");}});
}

// ---------- navigation ----------
var FOLD={}, planCurW=0, tab="today", cur=1, sel=1, browsing=false, openWk=null, openPh=null, CV="list", CT="", prevTab="today", resetArmed=false, editRes=false;
function goNow(){browsing=false; var r=activeRace(), pl=planOf(r); if(!pl)return; var i=planIdx(pl); cur=nowWeek(pl);
  if(i>=0&&i<pl.n*7)sel=i%7; else{var wk=pl.weeks[cur-1]; sel=wk&&wk.s.length?wk.s[0].dow:1;}}

// ---------- Aujourd’hui ----------
function vToday(){
  var r=activeRace();
  if(!r)return header(fmtL(todayUTC()),"Aujourd’hui")+banners()+'<div class="card empty"><h2>Aucune course au programme</h2><p class="muted">Ajoute une course objectif : l’appli te prépare un plan jusqu’au jour J.</p><button class="btn primary" data-act="addrace">+ Ajouter une course</button></div>';
  var pl=planOf(r), ph=phaseOf(r);
  if(browsing||ph==="prep")return vPrep(r,pl);
  if(ph==="taper")return vTaper(r,pl);
  if(ph==="race")return vRaceDay(r,pl);
  return vAfter(r,pl);
}
var COTES={}; try{COTES=JSON.parse(localStorage.getItem(userKey("cadenzo-cotes"))||"{}")||{};}catch(e){}
var CTS={l:"",off:0,open:false}; try{CTS=Object.assign(CTS,JSON.parse(localStorage.getItem(userKey("cadenzo-ct"))||"{}"));}catch(e){}
// Une position GPS est propre à l’instant et à l’appareil : ne jamais restaurer une ancienne position depuis le cache.
delete CTS.pos; CTS.city=""; CTS.l=""; CTS.loading=false; CTS.autoSearchDone=false;
function ctSave(){try{localStorage.setItem(userKey("cadenzo-ct"),JSON.stringify(CTS));}catch(e){}}
function cotesList(){ // seuls les segments recherchés depuis la position GPS actuelle sont affichés
  var cur=CTS.l;
  // Ne jamais remplacer une recherche locale par un cache partagé ou une ancienne ville.
  if(!cur||cur==="strava-cache"||!COTES[cur]||!CTS.city)return null;
  var L=COTES[cur], last={}, best={}, src=(L.items||[]).filter(function(x){return +x.g>=4&&+x.e>=8;}), loc=L.nom||CTS.city||"Autour de toi", nom=loc==="Segments partagés"?"Autour de toi":loc;
  HIST.forEach(function(r){(r.sg||[]).forEach(function(e){
    if(!last[e.i]||r.date>last[e.i])last[e.i]=r.date;
    if(e.p>0&&e.p<=3&&(!best[e.i]||e.p<best[e.i]))best[e.i]=e.p;
  });});
  var it=src.filter(function(c){return c&&c.i;}).map(function(c){
    return {c:c,last:last[c.i]||"",p:best[c.i]||0};
  });
  // Distance GPS réelle en premier ; les segments jamais réalisés restent dans la liste
  // et sont prioritaires uniquement à distance équivalente.
  it.sort(function(a,b){
    var da=ctDist(a.c), db=ctDist(b.c), va=Number.isFinite(da), vb=Number.isFinite(db);
    if(va&&vb&&da!==db)return da-db;
    if(va!==vb)return va?-1:1;
    var ad=a.last?Date.parse(a.last):0, bd=b.last?Date.parse(b.last):0;
    return ad-bd || (+b.c.e||0)-(+a.c.e||0) || (+b.c.g||0)-(+a.c.g||0) ||
      (+a.c.d||0)-(+b.c.d||0) || String(a.c.n||"").localeCompare(String(b.c.n||"")) ||
      String(a.c.i).localeCompare(String(b.c.i));
  });
  return {nom:nom,items:it};
}
function ctAgo(d){if(!d)return "Jamais faite"; var n=Math.round((Date.parse(isoToday())-Date.parse(d))/864e5); return n<14?"Il y a "+n+" j":"Il y a "+Math.round(n/7)+" sem.";}
function ctHav(a,b,c,d){var R=6371,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r*Math.cos((a+c)/2*r); return Math.sqrt(x*x+y*y)*R;}
function ctDist(c){return CTS.pos&&Number.isFinite(+c.la)&&Number.isFinite(+c.ln)?Math.round(ctHav(CTS.pos.la,CTS.pos.ln,+c.la,+c.ln)*10)/10:(Number.isFinite(+c.k)?+c.k:null);}
function ctNeedsSearch(pos){
  var saved=CTS.l&&COTES[CTS.l];
  if(!CTS.city||!saved||CTS.l==="strava-cache"||!Number.isFinite(+saved.lat)||!Number.isFinite(+saved.lng))return true;
  return ctHav(+saved.lat,+saved.lng,pos.la,pos.ln)>0.75;
}
function ctLvl(c){return c.g>=9?"raide":c.g>=6?"soutenue":"roulante";}
function ctWhere(c){var k=ctDist(c), t=c.v||""; if(k==null)return t; var d=k<0.5?"sur place":"à "+String(k).replace(".",",")+" km"+(CTS.pos?" de toi":"")+" ("+(k<=2?"proche":k<=4?"moyen":"loin")+")"; return t?t+" · "+d:d;}
function ctFix(){ // correction manuelle de la position (GPS imprécis ou faux)
  var a=CTS.pos&&CTS.pos.a, h='<div class="ctfix">';
  if(CTS.fix)return h+'<div class="ctq"><input id="ctq" type="search" placeholder="Ville ou lieu (ex. Annecy)" autocomplete="off" aria-label="Lieu"><button class="ctmore" data-ctq="go">Chercher</button></div>'+(CTS.pos&&CTS.pos.manual?'<button class="ctlnk" data-ctq="gps">Utiliser ma position GPS</button>':'')+'</div>';
  return h+'<span class="small muted">'+(CTS.pos&&CTS.pos.manual?'Position choisie à la main':a?'Précision GPS ± '+(a>=1000?Math.round(a/100)/10+' km':a+' m'):'')+'</span> <button class="ctlnk" data-ctq="open">Position fausse ? Corriger</button></div>';
}
function cotesCard(){var c=cotesCard0(); return c.replace(/<\/div>$/,ctFix()+"</div>");}
function cotesCard0(){
  var L=cotesList();
  var h='<div class="card ct"><div class="cthd"><b>Segments proposés</b><span class="ctch">📍 '+esc(L&&L.nom||CTS.city||"Localisation indisponible")+'</span>'+(L&&L.items&&L.items.length>1?'<button class="ctib" data-ctn="1" aria-label="Segment suivant">Suivant<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>':'')+'</div>';
  if(!L||!L.items||!L.items.length)return h+'<p class="small muted" style="margin:10px 0 6px">'+(CTS.loading?'Recherche des côtes Strava autour de toi…':'Aucune côte affichée pour le moment. Lance la recherche autour de ta position.')+'</p><button class="ctmore" data-ctg="1" style="margin:0"'+(CTS.loading?' disabled':'')+'>'+(CTS.loading?'Recherche en cours…':'Trouver les côtes autour de moi')+'</button></div>';
  if(L.far)return h+'<p class="small muted" style="margin:10px 0 6px">Aucune côte préparée autour de toi.</p><button class="ctmore" data-ctg="1" style="margin:0">Chercher des côtes ici</button></div>';
  if(!L.items.length)return h+'<p class="small muted" style="margin:10px 0 6px">'+(CTS.loading?'Recherche des côtes Strava autour de toi…':'Aucune côte enregistrée dans ce secteur pour le moment.')+'</p><button class="ctmore" data-ctg="1" style="margin:0"'+(CTS.loading?' disabled':'')+'>'+(CTS.loading?'Recherche en cours…':'Rechercher à nouveau')+'</button></div>';
  var n=L.items.length, v=[]; for(var k=0;k<Math.min(3,n);k++)v.push(L.items[(CTS.off+k)%n]);
  var x=v[0], c=x.c;
  h+='<div class="ctdots" role="group" aria-label="Position dans les segments">' + Array.from({length:n},function(_,i){return '<span class="ctdot'+(i===(CTS.off%n)?' on':'')+'" aria-label="Segment '+(i+1)+' sur '+n+'"></span>';}).join("") + '</div>';
  h+='<div class="cthero"><span class="cts">CONSEILLÉE · '+ctLvl(c).toUpperCase()+(x.p?' · '+(x.p===1?"1ER":x.p+"E")+' TEMPS':'')+'</span><a class="ctlk" href="https://www.strava.com/segments/'+c.i+'" target="_blank" rel="noopener"><b>'+esc(c.n)+' ↗</b></a><div class="ctst"><div><i>'+String(c.g).replace(".",",")+' %</i><span>pente</span></div><div><i>'+c.d+' m</i><span>longueur</span></div><div><i>+'+c.e+' m</i><span>D+</span></div></div><p>'+ctWhere(c)+' · '+ctAgo(x.last)+'</p></div>';
  if(v.length>1){
    if(CTS.open)h+=v.slice(1).map(function(y){return '<a class="ctrow" href="https://www.strava.com/segments/'+y.c.i+'" target="_blank" rel="noopener">'+(y.p?medal(y.p===1?"or":y.p===2?"ar":"br","",""):'<span class="ctg">'+Math.round(y.c.g)+'%</span>')+'<span><b>'+esc(y.c.n)+'</b><small>'+ctWhere(y.c)+'</small><small>'+ctAgo(y.last)+'</small></span><em>'+y.c.d+' m ↗</em></a>';}).join("");
    h+='<button class="ctmore" data-ctt="1">'+(CTS.open?"Masquer":"Voir les "+(v.length-1)+" autres")+(CTS.open?" ▴":" ▾")+'</button>';}
  return h+'</div>';
}
var CTW=null;
function ctWatch(){
  if(CTW!==null||!navigator.geolocation||!window.isSecureContext)return;
  CTW=navigator.geolocation.watchPosition(function(p){
    var accuracy=Math.round(p.coords.accuracy||0);
    if(!accuracy||accuracy>500||(CTS.pos&&CTS.pos.manual))return;
    var o=CTS.pos,moved=!o||ctHav(o.la,o.ln,p.coords.latitude,p.coords.longitude)>0.15;
    CTS.pos={la:p.coords.latitude,ln:p.coords.longitude,t:Date.now(),a:accuracy};
    ctSave();
    if(moved){
      if(ctNeedsSearch(CTS.pos)&&!CTS.loading){
        CTS.autoSearchDone=true;ctSave();ctHere();
      }else if(document.querySelector(".ct")&&$("sheet").hidden)render(true);
    }
  },function(){CTW=null;},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
}
document.addEventListener("visibilitychange",function(){
  if(document.hidden){if(CTW!==null){try{navigator.geolocation.clearWatch(CTW);}catch(e){} CTW=null;} return;}
  if(!navigator.geolocation||!window.isSecureContext)return;
  ctWatch(); // position fraîche dès le retour dans l’appli
  navigator.geolocation.getCurrentPosition(function(p){
    var accuracy=Math.round(p.coords.accuracy||0);
    if(!accuracy||accuracy>500||(CTS.pos&&CTS.pos.manual))return;
    var o=CTS.pos;CTS.pos={la:p.coords.latitude,ln:p.coords.longitude,t:Date.now(),a:accuracy};ctSave();
    if(ctNeedsSearch(CTS.pos)&&!CTS.loading){CTS.autoSearchDone=true;ctHere();return;}
    if((!o||ctHav(o.la,o.ln,CTS.pos.la,CTS.pos.ln)>0.15)&&$("sheet").hidden)render(true);
  },function(){},{enableHighAccuracy:true,maximumAge:0,timeout:15000});
});
function ctLocate(){
  if(!navigator.geolocation||!window.isSecureContext){toast("La géolocalisation nécessite une connexion sécurisée et une autorisation GPS.");return;}
  // Toujours demander une position actuelle : ne jamais réutiliser celle de la recherche précédente.
  CTS.pos=null;CTS.city="";CTS.l="";CTS.loading=false;
  toast("Recherche de ta position GPS…");
  navigator.geolocation.getCurrentPosition(function(p){
    var accuracy=Math.round(p.coords.accuracy||0);
    if(!accuracy||accuracy>500){toast("Position trop imprécise (±"+(accuracy||"inconnue")+" m). Active la localisation précise de ton appareil puis réessaie.");return;}
    CTS.pos={la:p.coords.latitude,ln:p.coords.longitude,t:Date.now(),a:accuracy};
    ctSave();ctHere();
  },function(err){
    var message=err&&err.code===1?"Autorise la localisation pour Cadenzo dans les réglages de ton appareil.":err&&err.code===3?"Le GPS met trop de temps à répondre. Réessaie à l’extérieur.":"Position GPS indisponible. Vérifie les réglages de localisation et réessaie.";
    toast(message);
  },{enableHighAccuracy:true,maximumAge:0,timeout:30000});
}
function ctHere(){
  if(!CTS.pos){ctLocate();return;}
  if(CTS.loading)return;
  if(!window.CadenzoAuth||!CadenzoAuth.segments){toast("Connexion indisponible. Reconnecte-toi.");return;}
  var lat=CTS.pos.la,lng=CTS.pos.ln;
  CTS.loading=true;render(true);
  var place=fetch("https://nominatim.openstreetmap.org/reverse?format=json&zoom=12&lat="+lat+"&lon="+lng,{headers:{"Accept-Language":"fr"}}).then(function(r){if(!r.ok)throw 0;return r.json();}).catch(function(){return null;});
  Promise.all([CadenzoAuth.segments({lat:lat,lng:lng,radiusKm:5}),place]).then(function(results){
    var j=results[1],a=j&&j.address||{},nom=(a.city||a.town||a.municipality||a.village||a.city_district||a.suburb||"Autour de toi").slice(0,40),id=ctSlug(nom);
    COTES[id]={nom:nom,lat:lat,lng:lng,items:results[0].items||[],updated:results[0].searchedAt||new Date().toISOString()};
    CTS.l=id;CTS.city=nom;CTS.off=0;CTS.open=false;CTS.loading=false;ctSave();
    try{localStorage.setItem(userKey("cadenzo-cotes"),JSON.stringify(COTES));}catch(e){}
    render(true);toast(COTES[id].items.length?COTES[id].items.length+" côtes trouvées autour de toi.":"Aucune côte répondant aux critères dans un rayon de 5 km.");
  }).catch(function(e){CTS.loading=false;CTS.autoSearchDone=false;render(true);toast("Recherche impossible : "+String(e&&e.message||"réessaie").slice(0,90));});
}
function ctSlug(n){return n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"lieu";}

function vPrep(r,pl){
  var ti=planIdx(pl), tw=ti>=0?Math.floor(ti/7)+1:0, td=ti>=0?ti%7:-1;
  if(cur>pl.n)cur=pl.n; if(cur<1)cur=1;
  var wk=P(pl,cur), selD=pl.start+((cur-1)*7+sel)*DAY, isToday=selD===todayUTC();
  var h=header(fmtL(todayUTC())+" · "+jx(r),isToday?"Aujourd’hui":fmtL(selD))+banners();
  if(ti<0&&!browsing)h+='<div class="banner">Ton plan '+esc(r.name)+' démarre le '+fmtL(pl.start).toLowerCase()+', dans '+(-ti)+' jour'+(-ti>1?"s":"")+'.</div>';
  var nw=nowWeek(pl);
  h+='<div class="wnav"><button data-wnav="-1" aria-label="Semaine précédente"'+(cur<=1?" disabled":"")+'>'+I.back+'</button><div><b>Semaine '+cur+'<small> / '+pl.n+'</small></b><span>'+esc(wk.ph)+'</span><button class="avl" data-act="availwk" data-w="'+wk.n+'">'+(wk.avail?'Mes jours de la semaine ✓':'Indispo cette semaine ?')+'</button></div><button data-wnav="1" aria-label="Semaine suivante"'+(cur>=pl.n?" disabled":"")+'>'+I.back+'</button></div>';
  if(browsing&&cur!==nw)h+='<div class="banner mini"><span>'+(cur<nw?'Semaine passée':'Semaine à venir')+'</span><button data-act="now">Aujourd’hui</button></div>';
  h+='<div class="strip" role="group" aria-label="Jours de la semaine">';
  for(var i=0;i<7;i++){var s0=sessAt(wk,i), dn=s0&&D.done[sk(r,cur,s0.k)], tdy=cur===tw&&i===td;
    h+='<button class="day'+(s0?" has":"")+(s0&&!dn&&!s0.race&&!s0.club&&!s0.bid&&!isClubSession(s0)?" mv":"")+(dn?" done":"")+(tdy?" today":"")+'" data-day="'+i+'"'+(s0&&!dn&&!s0.race&&!s0.club&&!s0.bid&&!isClubSession(s0)?' draggable="true" data-dk="'+s0.k+'"':'')+' aria-pressed="'+(sel===i)+'" aria-label="'+DOWL[i]+(s0?", "+esc(s0.type):", repos")+(dn?", faite":"")+'"><span>'+DL[i]+'</span><b>'+new Date(pl.start+((cur-1)*7+i)*DAY).getUTCDate()+'</b><em class="dic">'+tico(s0)+'</em><i></i>'+(s0?'<em class="dty">'+esc(s0.type)+'</em><em class="dkm">'+(s0.km?kmS(s0.km)+' km':'')+'</em>':'<em class="dty">Repos</em><em class="dkm"></em>')+'</button>';}
  h+='</div>';
  var s=sessAt(wk,sel);
  var showM=cur===tw&&sel===td;
  h+=s?sessionHero(r,pl,wk,s):restCard(wk,sel);
  if(s&&/^Côtes(?:$|\s)/i.test(s.type||"")){ctWatch();h+=cotesCard();} // Afficher les segments uniquement lorsqu’une séance de côtes est prévue aujourd’hui.
  if(cur===tw)h+=weekEndCard(r,pl,ti);
  h+=bilanCard(r,pl,wk,sel,selD);

  h+=weekCard(r,pl,wk,s,showM);
  h+=checkinCard(r,pl,cur);
  return h;
}
function sessionHero(r,pl,wk,s){
  var k=sk(r,wk.n,s.k), dn=!!D.done[k], z=zoneOf(s.type).split(" · ")[0], ed=estDur(pl.m,s), ac=D.actual[k], isB=s.type==="Course B";
  var h='<div class="card hero"><div class="sb"><span class="eyebrow">Semaine '+wk.n+' · '+wk.ph+(wk.rec?' · allégée':'')+'</span>'+(s.race?'':'<button class="hedit" data-edit="'+wk.n+'-'+s.k+'">Modifier</button>')+'</div><h2>'+esc(isB?s.name:s.type)+'</h2>';
  var tags=[]; if(isB)tags.push("Course B"); if(s.adjusted&&wk.adjLabel)tags.push(wk.adjLabel); if(s.cw)tags.push("⚠ Sortie club complète déconseillée"); if(s.rbd)tags.push("Ajustée : "+kmS(s.rbFrom)+" → "+kmS(s.km)+" km"); if(s.edited)tags.push(s.added?"Ajoutée par toi":"Modifiée par toi"); if(s.club)tags.push("Club : 15 km, 2 h, +500 m min.");
  if(tags.length)h+='<div class="tagline">'+tags.map(function(t){return '<span class="chip'+(t.indexOf("⚠")===0?' acc':'')+'">'+esc(t)+'</span>';}).join("")+'</div>';
  h+='<div class="facts num">'+(s.km?'<span>'+kmS(s.km)+' km</span>':'')+(s.dp?'<span>+'+nb(s.dp)+' m</span>':'')+(z?'<span>'+esc(z)+'</span>':'')+(ed&&s.type.indexOf("Club")<0?'<span>≈ '+dur(ed)+'</span>':'')+'</div>';
  if(s.steps&&s.steps.length)h+='<ul class="steps">'+s.steps.map(function(x){return '<li><span>'+esc(x[0])+'</span><span>'+esc(x[1])+'</span></li>';}).join("")+'</ul>'+(s.txt?'<p class="session-note">'+esc(s.txt)+'</p>':'');
  else if(s.txt)h+='<p>'+esc(s.txt)+'</p>';
  var a=adjFor(pl,wk.n); if(a&&a.mode==="z2"&&(s.tag==="e"||s.tag==="l"))h+='<p><b>Zone 2 stricte cette semaine :</b> reste sous '+(persoOn()?persoStr('150 bpm'):'150 bpm')+'.</p>';
  if(s.race)return h+'<button class="btn" data-go="today-race">'+I.play+' Voir le jour J</button></div>';
  if(isB)h+='<button class="btn" data-race="'+s.bid+'">'+I.play+' Lancer le mode Course</button>';
  h+=woFor(s,wk);
  h+='<button class="btn'+(dn?" isdone":"")+'" data-done="'+k+'"'+(isB?' style="margin-top:8px"':'')+'>'+I.check+(dn?' Faite · toucher pour annuler':' C’est fait')+'</button>';
  h+=swapChips(pl,wk,s,dn);
  h+='<p class="sub">'+(ac?'Tes chiffres : '+kmS(ac.km)+' km'+(ac.dp?' · +'+ac.dp+' m':'')+(ac.t?' · '+dur(ac.t):'')+'. <button data-act="manual" data-w="'+wk.n+'" data-k="'+s.k+'">Corriger</button>':STRAVA?'Le bilan arrive tout seul quand Strava reçoit ta sortie.':'<button data-act="manual" data-w="'+wk.n+'" data-k="'+s.k+'">Ajoute tes chiffres</button> pour avoir le bilan du coach.')+'</p>';
  return h+'</div>';
}
var DOWC=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
function swapChips(pl,wk,s,dn){
  if(dn||s.race||s.club||s.type==="Course B"||s.bid||isClubSession(s))return "";
  var t=todayUTC(), r=pl.r, L=[];
  wk.s.forEach(function(o){ if(o===s||o.race||o.club||o.bid||o.type==="Course B"||isClubSession(o)||D.done[sk(r,wk.n,o.k)])return;
    if(sessDate(pl,wk.n,o)<t||sessDate(pl,wk.n,s)<t)return;
    L.push('<button class="swap-b" data-swap="'+wk.n+'|'+s.k+'|'+o.k+'"><b>'+DOWC[o.dow]+'</b><span>'+esc(o.type)+'</span></button>');});
  for(var d=0;d<7;d++){ if(d===s.dow||wk.s.some(function(o){return o.dow===d;}))continue; if(sessDate(pl,wk.n,{dow:d})<t)continue;
    L.push('<button class="swap-b" data-swap="'+wk.n+'|'+s.k+'|d'+d+'"><b>'+DOWC[d]+'</b><span>Repos</span></button>');}
  return L.length?'<div class="swap"><p>Pas dispo ce jour-là ? Échange avec :</p><div>'+L.join("")+'</div></div>':"";
}
function swapDays(w,k,tgt){
  var r=activeRace(), pl=planOf(r), wk=pl&&pl.weeks[w-1], s=sessByKey(wk,k); if(!s||s.race||s.club||s.bid||isClubSession(s))return;
  var o0=/^d\d$/.test(tgt)?null:sessByKey(wk,tgt); if(o0&&(o0.race||o0.club||o0.bid||isClubSession(o0)||D.done[sk(r,w,o0.k)]))return;
  var td0=o0?o0.dow:+tgt.slice(1); if(sessDate(pl,w,{dow:td0})<todayUTC()){toast("Ce jour est déjà passé.");return;}
  var E=D.edits[r.id]||(D.edits[r.id]={}), U=snapU();
  var mvk=w+"-mv", MV=Object.assign({},E[mvk]||{});
  function setDow(x,dow){MV[x.k]=dow;}
  var other=/^d\d$/.test(tgt)?null:sessByKey(wk,tgt), dow=/^d\d$/.test(tgt)?+tgt.slice(1):other&&other.dow, from=s.dow;
  if(dow==null)return;
  if(other)setDow(other,from); setDow(s,dow); E[mvk]=MV;
  save(); PC={}; toast(other?"Jours échangés : "+DOWC[from]+" ⇄ "+DOWC[dow]+".":"Séance déplacée au "+DOWC[dow].toLowerCase()+".",U); render(true);
}
var WDRAG=null;
document.addEventListener("dragstart",function(e){var b=e.target.closest&&e.target.closest(".dc[data-wd]"); if(!b)return; var v=b.dataset.wd.split(":"); WDRAG={w:+v[0],k:v[1]}; e.dataTransfer.effectAllowed="move"; try{e.dataTransfer.setData("text/plain",b.dataset.wd);}catch(x){} b.classList.add("drag");});
document.addEventListener("dragover",function(e){var b=WDRAG&&e.target.closest&&e.target.closest(".dc[data-wt]"); if(!b)return; var v=b.dataset.wt.split(":"); if(+v[0]!==WDRAG.w||v[1]===WDRAG.k)return; e.preventDefault(); document.querySelectorAll(".dc.over").forEach(function(x){x.classList.remove("over");}); b.classList.add("over");});
document.addEventListener("drop",function(e){var b=WDRAG&&e.target.closest&&e.target.closest(".dc[data-wt]"); if(!b)return; var v=b.dataset.wt.split(":"), d=WDRAG; WDRAG=null; if(+v[0]!==d.w)return; e.preventDefault(); swapDays(d.w,d.k,v[1]);});
document.addEventListener("dragend",function(){WDRAG=null; document.querySelectorAll(".dc.drag,.dc.over").forEach(function(x){x.classList.remove("drag","over");});});
var DRAG=null;
document.addEventListener("dragstart",function(e){var b=e.target.closest&&e.target.closest(".strip .day[data-dk]"); if(!b)return; DRAG={k:b.dataset.dk,d:+b.dataset.day}; e.dataTransfer.effectAllowed="move"; try{e.dataTransfer.setData("text/plain",b.dataset.dk);}catch(_){} b.classList.add("drag");});
document.addEventListener("dragover",function(e){var b=DRAG&&e.target.closest&&e.target.closest(".strip .day"); if(!b)return; if(+b.dataset.day===DRAG.d||(b.classList.contains("has")&&!b.classList.contains("mv")))return; e.preventDefault(); document.querySelectorAll(".strip .day.over").forEach(function(x){if(x!==b)x.classList.remove("over");}); b.classList.add("over");});
document.addEventListener("drop",function(e){var b=DRAG&&e.target.closest&&e.target.closest(".strip .day"); if(!b)return; e.preventDefault(); var d=DRAG; DRAG=null; var tk=b.dataset.dk; swapDays(cur,d.k,tk||("d"+b.dataset.day));});
document.addEventListener("dragend",function(){DRAG=null; document.querySelectorAll(".strip .day.drag,.strip .day.over").forEach(function(x){x.classList.remove("drag","over");});});
function restCard(wk,dow){return '<div class="card"><div class="sb"><span class="eyebrow">Semaine '+wk.n+' · '+wk.ph+'</span><button class="btn sm" data-act="addses" data-w="'+wk.n+'" data-d="'+dow+'" style="min-height:36px">+ Séance</button></div><h2 style="font-size:26px;margin:6px 0 8px">Repos</h2>'+(function(){var e=D.extra&&D.extra[iso(wk.start+dow*DAY)]; return e?'<p><b>Sortie hors plan : '+kmS(e.km)+' km'+(e.dp?', +'+nb(e.dp)+' m':'')+'.</b> Elle compte dans ta semaine, et le reste de la semaine s’ajuste si besoin.</p>':'<p>Pas de course aujourd’hui. Dix minutes de mobilité suffisent.</p>';})()+(function(){var mc=MOBROT[(wk.n+dow)%MOBROT.length], M=MOBS[mc]; return '<details><summary>'+I.leaf+' '+esc(M.name)+' · '+woMin("mob",mc)+' min</summary><div class="in"><p class="muted small">'+esc(M.goal)+'</p>'+woBtns(null,0,mc)+exHTML(M.ex)+'</div></details>';})()+'</div>';}
function bilanCard(r,pl,wk,sel,selD){
  var t=todayUTC(); if(!wk||selD>t)return "";
  var s=sessAt(wk,sel), ac=s?D.actual[sk(r,wk.n,s.k)]:null, ex=!s&&D.extra?D.extra[iso(selD)]:null;
  var ttl=selD===t?"Bilan du jour":"Bilan de "+DOWL[sel];
  if(s&&ac){
    var rv=review(pl.m,s,ac), b=BADGE[rv.lvl];
    return '<div class="card bilan-card"><div class="verdict"><h2>'+ttl+'</h2><span class="chip '+b[0]+'">'+b[1]+'</span>'+medalBadge(selD)+'</div><div class="stats num"><div class="stat"><b>'+kmS(ac.km)+'</b><span>km<i class=\"pvu\">prévu <i class=\"nw\">'+kmS(s.km)+'</i></i></span></div><div class="stat"><b>+'+nb(ac.dp||0)+'</b><span>m<i class=\"pvu\">prévu <i class=\"nw\">'+nb(s.dp||0)+'</i></i></span></div><div class="stat"><b>'+(ac.t?mmss(ac.t/ac.km):"–")+'</b><span>/km'+(ac.t?" · "+dur(ac.t):"")+'</span></div></div>'+pvBars(pl,s,ac)+'<p class="small" style="margin:10px 0 0">'+esc(rv.lines.join(" "))+'</p></div>';
  }
  if(ex){
    var di=iso(selD), hr=0, hn=0; HIST.forEach(function(q){if(q.date===di&&q.hr>0){hr+=q.hr*q.km;hn+=q.km;}}); hr=hn?hr/hn:0;
    var pc=hr?hr/HRMAX:0, L=["Sortie non prévue au plan : "+kmS(ex.km)+" km"+(ex.dp>=100?" et +"+nb(ex.dp)+" m":"")+", elle compte dans ta semaine."];
    var lvl=0;
    if(hr){ if(pc>=0.85){lvl=1;L.push("Fréquence cardiaque moyenne "+Math.round(hr)+" bpm : effort soutenu pour un jour de repos, laisse-toi le temps de récupérer.");}
      else if(pc>=0.75)L.push("Fréquence cardiaque moyenne "+Math.round(hr)+" bpm : effort modéré.");
      else L.push("Fréquence cardiaque moyenne "+Math.round(hr)+" bpm : effort facile, bien pour récupérer.");}
    if(ex.km>=10){lvl=1;}
    if(wk.rb&&wk.rb.items&&wk.rb.items.length&&!wk.rbOff)L.push("Le reste de ta semaine a été ajusté en conséquence.");
    var bd=BADGE[lvl]; var chip=lvl?'<span class="chip warn">Hors plan</span>':'<span class="chip off">Hors plan</span>';
    return '<div class="card bilan-card"><div class="verdict"><h2>'+ttl+'</h2>'+chip+medalBadge(selD)+'</div><div class="stats num"><div class="stat"><b>'+kmS(ex.km)+'</b><span>km · non prévu</span></div><div class="stat"><b>+'+nb(ex.dp||0)+'</b><span>m</span></div><div class="stat"><b>'+(ex.t?mmss(ex.t/ex.km):"–")+'</b><span>/km'+(ex.t?" · "+dur(ex.t):"")+'</span></div></div><p class="small" style="margin:10px 0 0">'+esc(L.join(" "))+'</p></div>';
  }
  if(s&&!ac&&selD<t&&!s.race&&s.km>0&&!D.done[sk(r,wk.n,s.k)]){
    return '<div class="card bilan-card"><div class="verdict"><h2>'+ttl+'</h2><span class="chip off">Non faite</span></div><p class="small" style="margin:8px 0 0">Aucune sortie reçue de Strava ce jour-là pour « '+esc(s.type)+' ». '+(s.club||s.type.indexOf("Club")===0?'Si tu y es allée sans enregistrer, marque-la faite depuis la séance.':'Si tu l’as faite sans Strava, marque-la faite depuis la séance. Sinon, ne la rattrape pas d’un coup : le plan s’adapte.')+'</p></div>';
  }
  return "";
}
function weekTot(r,wk,upto){
  var pk=0,ak=0,pd=0,ad=0,ek=0,ed=0;
  wk.s.forEach(function(x){if(x.race)return; pk+=x.km||0; pd+=x.dp||0; if(x.dow<=upto){ek+=x.km||0; ed+=x.dp||0;} var ac=D.actual[sk(r,wk.n,x.k)]; if(ac){ak+=ac.km; ad+=ac.dp||0;} else if(D.done[sk(r,wk.n,x.k)]){ak+=x.km||0; ad+=x.dp||0;}});
  var ex=extraWk(wk); ak+=ex.km; ad+=ex.dp;
  return {pk:pk,ak:ak,pd:pd,ad:ad,ek:ek,ed:ed};
}
var WM="km";
// Résumé façon Strava : chiffres de la semaine + histogramme semaine par semaine (prévu en clair, réalisé en couleur)
function weekMeter(r,pl,wk,td){
  var t=weekTot(r,wk,td), isKm=WM==="km", tt=0;
  wk.s.forEach(function(x){var ac=D.actual[sk(r,wk.n,x.k)]; if(ac)tt+=ac.t||0;});
  var n0=Math.max(1,Math.min(wk.n-5,pl.n-7)), n1=Math.min(pl.n,n0+7), W=[], mx=1, i, o;
  for(i=n0;i<=n1;i++){o=weekTot(r,P(pl,i),6); W.push({n:i,pl:isKm?o.pk:o.pd,ac:isKm?o.ak:o.ad}); mx=Math.max(mx,isKm?o.pk:o.pd,isKm?o.ak:o.ad);}
  var h='<div class="card wm"><div class="wm-top"><h2>Cette semaine</h2><div class="wm-seg" role="group" aria-label="Afficher">'+
    '<button data-wm="km" aria-pressed="'+isKm+'">Distance</button><button data-wm="dp" aria-pressed="'+!isKm+'">Dénivelé</button></div></div>';
  h+='<div class="wm-nums num"><div><b>'+kmS(Math.round(t.ak*10)/10)+'<small> km</small></b><span>sur '+kmS(Math.round(t.pk*10)/10)+' prévus</span></div>'+
     '<div><b>+'+nb(t.ad)+'<small> m</small></b><span>sur '+nb(t.pd)+' prévus</span></div>'+
     '<div><b>'+(tt?dur(tt):"–")+'</b><span>temps couru</span></div></div>';
  h+='<div class="wm-bars" style="grid-template-columns:repeat('+W.length+',1fr)" role="img" aria-label="Histogramme semaine par semaine, '+(isKm?"distance":"dénivelé")+'">';
  W.forEach(function(w){
    var ph=w.pl?Math.max(6,w.pl/mx*100):0, ah=w.ac?Math.max(6,w.ac/mx*100):0;
    h+='<div class="wm-col'+(w.n===wk.n?" today":"")+'"><span class="wm-v num">'+(w.ac?(isKm?kmS(Math.round(w.ac)):nb(w.ac)):"")+'</span><div class="wm-plot">'+
       (ph?'<i class="p" style="height:'+ph+'%"></i>':'<i class="rest"></i>')+(ah?'<i class="a" style="height:'+ah+'%"></i>':'')+'</div><b>'+w.n+'</b></div>';
  });
  return h+'</div><p class="small muted" style="margin:8px 0 0">Numéro de semaine en bas. <i class="wm-key p"></i>prévu <i class="wm-key a"></i>réalisé</p></div>';
}
function weekCard(r,pl,wk,s,noMeter){
  var t0=weekTot(r,wk,6), pk=t0.pk, ak=t0.ak, pd=t0.pd, ad=t0.ad;
  var h=noMeter?'<div class="card week-card"><div>':'<div class="card week-card"><h2>Ta semaine</h2><div class="sb num small" style="margin-bottom:6px"><span>'+kmS(ak)+' / '+kmS(pk)+' km</span><span class="muted">'+nb(ad)+' / '+nb(pd)+' m D+</span></div><div class="bar"><i style="width:'+Math.min(100,pk?ak/pk*100:0)+'%"></i></div><div style="margin-top:8px">';
  h+='<details class="more"'+(MOREOPEN?' open':'')+'><summary><span>Plus pour aujourd’hui<small>renfo · montre · boucles</small></span></summary>';
  var t=todayUTC(), rf=null; wk.s.forEach(function(x){if(x.renfo&&!rf&&sessDate(pl,wk.n,x)>=t)rf=x;}); if(!rf)wk.s.forEach(function(x){if(x.renfo&&!rf)rf=x;});
  if(rf){var R0=RENFO[rf.renfo], dd=Math.round((sessDate(pl,wk.n,rf)-t)/DAY), parts=R0.name.split(" · "); h+='<button class="link" data-sheet="renfo:'+rf.renfo+'"><span class="ico">'+I.dumb+'</span><span class="tx"><b>'+esc(parts[0])+' '+(dd===0?"aujourd’hui":dd===1?"demain":DOWL[rf.dow])+'</b><small>'+esc(parts[1]||"")+' · '+woMin("renfo",rf.renfo)+' min · une chaise</small></span><span class="chev">›</span></button>';}
  if(window.FIT&&FIT.wktOf(s))h+='<button class="link" data-act="watch" data-w="'+wk.n+'" data-k="'+s.k+'"><span class="ico">'+I.watch+'</span><span class="tx"><b>Envoyer à la montre</b><small>'+esc(s.type)+' en entraînement guidé · fichier .FIT</small></span><span class="chev">›</span></button>';
  if(bestLoops(s).length)h+='<button class="link" data-sheet="loops:'+wk.n+'-'+s.k+'"><span class="ico">'+I.pin+'</span><span class="tx"><b>Où courir près de chez toi</b><small>Boucles proches de '+kmS(s.km)+' km</small></span><span class="chev">›</span></button>';
  h+='<button class="link" data-act="weekplan" data-w="'+wk.n+'"><span class="ico">'+I.list+'</span><span class="tx"><b>Toute la semaine</b><small>'+weekDone(r,wk)+' / '+nSess(wk)+' séances faites · modifier</small></span><span class="chev">›</span></button>';
  return h+'</div>'+(wk.note?'<p class="small muted" style="margin:10px 0 0"><b style="color:var(--ink)">Le mot du coach :</b> '+esc(wk.note)+'</p>':'')+'</details></div>';
}
function checkinCard(r,pl,w){
  if(!D.set.checkin)return ""; var ti=planIdx(pl); if(ti<0||w!==nowWeek(pl)||w<2||pl.weeks[w-1].ph==="Affûtage")return "";
  var c=ciOf(r,w), a=adjFor(pl,w), st=D.adj[r.id+":"+w];
  try{if(a&&a.mode==="micro"&&!st&&!localStorage.getItem(userKey("cadenzo-nomicro"))){localStorage.setItem(userKey("cadenzo-nomicro"),r.id+":"+w); D.adj[r.id+":"+w]=st="off"; save();}}catch(e){}
  function scale(k,l,lo,hi){var h='<div class="ci-row"><span>'+l+'</span><div class="scale">'; for(var i=1;i<=5;i++)h+='<button data-ci="'+k+'" data-v="'+i+'" aria-pressed="'+(c[k]===i)+'">'+i+'</button>'; return h+'</div><div class="scalelab"><span>'+lo+'</span><span>'+hi+'</span></div></div>';}
  var dow=((ti%7)+7)%7, full=!!(c.f&&c.s), edit=dow===0||!(c.f||c.s), h;
  if(dow!==0&&(c.f||c.s))return "";
  if(edit)h='<div class="card checkin-card"><h2>Check-in du lundi</h2><p class="small muted" style="margin:0 0 10px">'+(dow===0?"10 secondes. Le coach ajuste la semaine avec tes réponses.":"Oublié lundi ? Tu peux le remplir maintenant.")+'</p>'+scale("f","Fatigue","fraîche","épuisée")+scale("s","Sommeil","mauvais","excellent")+(full?'<p class="small ci-ok" style="margin:8px 0 0"><span class="chip ok">✓ Enregistré</span> Fatigue '+c.f+'/5 · sommeil '+c.s+'/5</p>':(c.f||c.s?'<p class="small muted" style="margin:8px 0 0">Réponds aux deux pour que le coach ajuste.</p>':''));
  else h='<div class="card checkin-card"><h2>Check-in de la semaine</h2><p class="small" style="margin:0"><span class="chip ok">✓ Enregistré lundi</span> Fatigue '+c.f+'/5 · sommeil '+c.s+'/5</p>';
  if(a){var dec=a.mode==="light"||a.mode==="micro", B={normal:["ok","Semaine maintenue"],light:["warn","Semaine allégée proposée"],z2:["warn","Zone 2 stricte"],micro:["warn","Micro-récupération proposée"]}[a.mode];
    if(dec&&st==="on")B=["warn",a.mode==="light"?"Semaine allégée":"Micro-récupération"]; if(dec&&st==="off")B=["ok","Plan normal gardé"];
    h+='<p class="small" style="margin:6px 0 0"><span class="chip '+B[0]+'">'+B[1]+'</span></p><p class="small" style="margin:8px 0 0">'+esc(a.lead+" "+a.prop)+'</p>';
    if(dec&&st!=="on"&&st!=="off")h+='<div class="row" style="margin-top:8px"><button class="btn primary sm" data-adj="on" data-w="'+w+'">Appliquer</button><button class="btn sm" data-adj="off" data-w="'+w+'">Garder le plan</button></div>';
    else if(dec)h+='<div class="row" style="margin-top:8px"><button class="btn sm" data-adj="'+(st==="on"?"off":"reset")+'" data-w="'+w+'">'+(st==="on"?"Annuler l’ajustement":"Revoir la proposition")+'</button></div>';
  }
  return h+'</div>';
}

// --- semaine de course ---
function kitOf(r){return D.kit[r.id]||(D.kit[r.id]={});}
function vTaper(r,pl){
  var j=daysTo(r), rd=dms(r.date), kit=kitOf(r), bk=Object.keys(kit).filter(function(x){return kit[x];}).length;
  var h=header(fmtL(todayUTC())+" · semaine de course","Affûtage")+banners();
  h+='<div class="card"><div class="count"><b class="num">J-'+j+'</b><span><b style="font-family:var(--display);font-size:20px">'+esc(r.name)+'</b><br><span class="muted small">'+fmtD(rd)+' · '+esc(r.time)+(r.place?' · '+esc(r.place):'')+'</span></span></div><p class="small" style="margin:10px 0 0">Volume au plus bas, même intensité. Les jambes doivent se sentir légères le jour J.</p></div>';
  var T=[[-7,["Sortie test avec la tenue complète","Valider gels et sac sur 1 h 30"]],[-5,["Mobilité 10 min, pas de course","Relire le règlement et la liste du matériel","Confirmer le jour et l’heure de départ"]],[-4,["Rappel : 6 km Z2 + 4 × 20 s allure course"]],[-2,["Charger la montre, y mettre la trace GPX","Ouvrir cette appli une fois : elle marche ensuite hors ligne"]],[-1,["Retrait du dossard"+(r.place?" à "+r.place:""),"≈ 480 g de glucides, peu de fibres","Préparer le sac : matériel "+bk+" / "+KITL.length]],[0,["Petit-déjeuner 3 h avant","Arriver 1 h avant le départ"]]];
  h+='<div class="card"><h2>D’ici le jour J</h2><ul class="tl">'+T.map(function(t){var dd=rd+t[0]*DAY, cls=-j>t[0]?"past":-j===t[0]?"now":"";
    return '<li class="'+cls+'"><h2>'+(t[0]?"J"+t[0]:"Jour J")+'<span>'+(cls==="now"?"aujourd’hui":fmtD(dd))+'</span></h2>'+t[1].map(function(x,ii){return todoBtn(r.id+":t"+t[0]+"-"+ii,esc(x));}).join("")+'</li>';}).join("")+'</ul></div>';
  return h+kitCard(r);
}
function kitCard(r){
  var kit=kitOf(r), bk=Object.keys(kit).filter(function(x){return kit[x];}).length;
  return '<div class="card"><h2>Matériel obligatoire</h2><div class="sb num small" style="margin-bottom:6px"><span>'+bk+' / '+KITL.length+' prêts</span><span class="muted">'+(r.builtin?'règlement 2025, à revérifier':'liste type, vérifie le règlement')+'</span></div><div class="bar"><i style="width:'+Math.round(bk/KITL.length*100)+'%"></i></div><details id="kitd"><summary>Voir la liste</summary><div class="in">'+KITL.map(function(x,i){return todoBtn(String(i),esc(x),kit);}).join("")+'</div></details></div>';
}
function cpTable(r,m){return '<table class="tbl num"><tr><th>Point</th><th>Km</th><th>Passage</th></tr>'+m.cps.map(function(c){return '<tr><td>'+esc(c.n)+'</td><td>'+kmS(c.km)+'</td><td><b>'+hm(m.cumMin(c.km))+'</b><br><span class="muted xs">vers '+tod(r,m.cumMin(c.km))+'</span></td></tr>';}).join("")+'</table>';}

// --- jour J ---
function vRaceDay(r,pl){
  var m=pl.m, h=header(fmtL(todayUTC()),"Jour J")+banners(), R0=D.race&&D.race.rid===r.id?D.race:null, running=R0&&R0.t0&&!R0.done;
  if(D.results[r.id])return h+resultsHTML(r,m,true);
  h+='<div class="card hero"><span class="eyebrow">'+esc(r.name)+(r.place?' · '+esc(r.place):'')+' · départ '+esc(r.time)+'</span><h2>'+(running?"Tu es en course.":"C’est aujourd’hui.")+'</h2><div class="facts num"><span>'+kmS(m.L)+' km</span><span>+'+nb(m.dp)+' m</span><span>objectif '+hm(m.goal)+'</span></div>'+
     '<div class="why">Départ prudent, mange avant d’avoir faim, garde des jambes pour la fin.</div>'+
     '<button class="btn" data-race="'+r.id+'" style="min-height:64px;font-size:18px">'+I.play+(running?' Reprendre · '+hms((Date.now()-R0.t0)/1000):' Lancer le mode Course')+'</button><p class="sub">Fonctionne sans réseau. L’écran reste allumé.</p></div>';
  h+='<div class="card"><h2>Ce matin</h2>'+["Petit-déjeuner pris (3 h avant)","Dossard épinglé, puce vérifiée","Gels dans les poches avant","Montre : trace lancée, GPS fixé"].map(function(x,i){return todoBtn(r.id+":rd"+i,x);}).join("")+'</div>';
  return h+'<div class="card"><h2>Tes repères</h2>'+cpTable(r,m)+'</div>';
}
// --- après ---
function vAfter(r,pl){return header(fmtL(todayUTC())+" · "+jx(r),D.results[r.id]?"Bilan de course":"Après la course")+banners()+resultsHTML(r,pl.m,false);}
function resultsHTML(r,m,today){
  var h="", Rr=D.results[r.id], editing=!Rr||editRes, nC=m.cps.length;
  if(Rr&&Rr.splits&&Rr.splits.length){
    var S=Rr.splits, fin=S[S.length-1], full=S.length===nC, d=fin-m.goal;
    h+='<div class="card"><span class="eyebrow">'+esc(r.name)+' · terminé</span><div class="count" style="margin-top:6px;flex-wrap:wrap"><b class="num" style="font-size:52px">'+hmc(fin)+'</b><span class="chip '+(d<=0?"ok":d<=10?"warn":"off")+'">'+sgn(d)+' sur l’objectif</span></div>'+(full||nC===1?'':'<p class="small muted" style="margin:8px 0 0">Ajoute tes temps aux ravitos pour voir le détail section par section.</p>')+'</div>';
    if(full&&nC>1){
      var prev=0,prevT=0,worst=-1,wv=-1e9;
      var rows=m.cps.map(function(c,i){var plan=m.cumMin(c.km)-m.cumMin(prev),real=S[i]-prevT,diff=real-plan; if(diff>wv){wv=diff;worst=i;} var x={plan:plan,real:real,diff:diff,s:m.sect[i]}; prev=c.km; prevT=S[i]; return x;});
      var mx=Math.max.apply(null,rows.map(function(x){return Math.max(x.plan,x.real);}));
      h+='<div class="card"><h2>Section par section</h2>'+rows.map(function(x,i){return '<div style="padding:8px 0;border-top:'+(i?'1px solid var(--line)':'0')+'"><div class="sb small"><b>'+esc(x.s.n)+'</b><span class="chip '+(x.diff<=0.5?"ok":x.diff<=3?"warn":"off")+'">'+sgn(x.diff)+'</span></div>'+
        '<div style="margin-top:6px;display:grid;gap:3px"><div class="bar" style="height:6px;background:none"><i style="width:'+(x.plan/mx*100)+'%;background:var(--line)"></i></div><div class="bar" style="height:6px;background:none"><i style="width:'+(x.real/mx*100)+'%"></i></div></div>'+
        '<div class="small muted num" style="margin-top:4px">prévu '+hm(x.plan)+' · réel '+hm(x.real)+' · +'+x.s.up+' / −'+x.s.dn+' m</div></div>';}).join("")+'<div class="legend"><span><i style="background:var(--line)"></i>Prévu</span><span><i style="background:var(--brand)"></i>Réel</span></div></div>';
      var ws=m.sect[worst];
      h+='<div class="card"><h2>Là où ça a basculé</h2><p style="margin:0">'+(wv>2?'Tu as perdu le plus de temps sur la section '+esc(ws.n)+' ('+sgn(wv)+').'+(ws.dn>250?' Beaucoup de descente sur cette section : pour la prochaine course, plus de descentes techniques en phase spécifique.':ws.up>300?' Beaucoup de montée : plus de côtes enchaînées en phase spécifique.':''):'Course très régulière : aucune section ne s’écarte de plus de 2 min du plan.')+'</p></div>';
    }
    if(!editing)h+='<button class="btn sm" data-act="editres" style="margin:0 auto 12px">'+(full?'Corriger mes temps':'Ajouter mes temps de passage')+'</button>';
  }
  if(editing){var S2=(Rr&&Rr.splits)||[];
    h+='<div class="card"><h2>'+(Rr?"Mes temps":"Ton temps")+'</h2><p class="small muted">Temps depuis le départ, en heures:minutes. Remplis tout, ou seulement l’arrivée.</p>'+
      m.cps.map(function(c,i){var v=S2.length===nC?S2[i]:(i===nC-1&&S2.length===1?S2[0]:null); return '<div class="fields" style="margin:4px 0"><label class="field">'+(i<nC-1?esc(c.n)+' · km '+kmS(c.km):'Arrivée · '+kmS(c.km)+' km')+'<input id="rs'+i+'" inputmode="numeric" placeholder="'+hmi(m.cumMin(c.km))+'" value="'+(v==null?"":hmi(v))+'"></label></div>';}).join("")+
      '<div class="row" style="margin-top:8px"><button class="btn primary" data-act="saveres" data-r="'+r.id+'">Enregistrer</button>'+(Rr?'<button class="btn" data-act="canceres">Annuler</button>':'')+'</div></div>';}
  h+='<div class="card"><h2>Récupération</h2>'+[["J+1 à J+3","Marche, mobilité douce, pas de course."],["J+4 à J+7","Footings de 30 min en zone 1-2 si les jambes sont bonnes."],["J+8","Retour au club, sans séance dure."]].map(function(x){return '<div class="ex"><span><b>'+x[0]+'</b></span><span style="max-width:62%">'+x[1]+'</span></div>';}).join("")+'</div>';
  if(!today)h+='<button class="btn primary" data-go="course">Choisir ta prochaine course</button>';
  return h;
}

function tcls(s){var t=(s.type||"")+" "+(s.name||""); if(s.race||/^Course/i.test(s.type||""))return "r"; if(/long/i.test(t))return "l"; if(/fraction|fartlek|seuil|tempo|côte|cote|vma|interv|rapide|allure|30\/30/i.test(t))return "q"; return "e";}
function wdays(r,wk,mode){var w=wk.n,L=DL,o="";
  for(var i=0;i<7;i++){var dw=i, ss=wk.s.filter(function(x){return +x.dow===dw;}), s=ss[0], on=s&&D.done[sk(r,w,s.k)], c=s?tcls(s):"o";
    if(mode==="dot")o+='<i class="dd '+c+(on?" on":"")+'" title="'+DOW[dw]+(s?" · "+esc(s.type):" · repos")+'"></i>';
    else {var dr=s&&!on&&!s.race&&!s.club&&!s.bid&&!isClubSession(s)&&s.type!=="Course B"; o+='<span class="dc '+c+(on?" on":"")+(dr?" mv":"")+'"'+(dr?' draggable="true" data-wd="'+w+':'+s.k+'"':'')+' data-wt="'+w+':'+(s?s.k:"d"+dw)+'" title="'+DOW[dw]+' · '+(s?esc(s.type):"repos")+'"><em>'+L[i]+'</em>'+(s?'<span class="ti">'+tico(s)+'</span><b>'+(s.km?kmS(s.km)+" km":"—")+'</b>':'<span class="ti">'+tico(null)+'</span>')+'</span>';}}
  return o;}
// --- Plan ---
function vPlan(){
  var r=activeRace(); if(!r)return header("Ton plan","Le plan")+'<div class="card empty"><p class="muted">Ajoute une course A pour avoir un plan.</p><button class="btn primary" data-act="addrace">+ Ajouter une course</button></div>';
  var pl=planOf(r), cw=nowWeek(pl), ti=planIdx(pl), t=totals(pl), ne=Object.keys(D.edits[r.id]||{}).length;
  var h=header(pl.n+" semaine"+(pl.n>1?"s":"")+" · "+fmtS(pl.start)+" → "+fmtS(pl.end),"Le plan");
  var cols={Base:"#a9cdb8",Construction:"#6fa587","Spécifique":"#2f5d46",Affûtage:"#e2a72e"}, PH=[];
  pl.weeks.forEach(function(wk){if(!PH.length||PH[PH.length-1][0]!==wk.ph)PH.push([wk.ph,0]); PH[PH.length-1][1]++;});
  var inPlan=ti>=0&&ti<pl.n*7; planCurW=inPlan?cw:0;
  var curPh=ti<0?pl.weeks[0].ph:ti>=pl.n*7?pl.weeks[pl.n-1].ph:pl.weeks[cw-1].ph, phOpen=openPh===null?curPh:openPh;
  // première carte : course, phases, avancement
  h+='<div class="card"><div class="sb"><b style="font-family:var(--display);font-size:18px">'+esc(r.name)+'</b><span class="chip">'+fmtD(pl.end)+'</span></div><div class="phases">'+PH.map(function(p){var K=pl.weeks.filter(function(x){return x.ph===p[0];}).map(function(x){return P(pl,x.n).km;}), a=Math.round(Math.min.apply(null,K)), z=Math.round(Math.max.apply(null,K)); return '<div tabindex="0" data-tip="'+p[0]+' · '+p[1]+' sem. · '+(a===z?a:a+'–'+z)+' km/sem." style="flex:'+p[1]+';background:'+cols[p[0]]+'"></div>';}).join("")+'</div><div class="phlab">'+PH.map(function(p){return '<span'+(p[0]===curPh&&inPlan?' class="on"':'')+'>'+p[0]+'</span>';}).join("")+'</div>'+
    '<div class="lc" role="img" aria-label="Kilomètres par semaine">'+(function(){var K=pl.weeks.map(function(q){return P(pl,q.n).km;}), M=Math.max.apply(null,K.concat([1])); return pl.weeks.map(function(q,i){return '<i class="'+(q.n===cw&&inPlan?"cur":"")+'" style="height:'+Math.max(6,Math.round(K[i]/M*100))+'%;background:'+cols[q.ph]+'" title="S'+q.n+' · '+K[i]+' km"></i>';}).join("");})()+'</div>'+
    '<div class="sb small num" style="margin-top:12px"><span>'+t.d+' / '+t.t+' séances faites</span><span class="muted">'+(t.t?Math.round(t.d/t.t*100):0)+' %</span></div><div class="bar" style="margin-top:6px"><i style="width:'+(t.t?t.d/t.t*100:0)+'%"></i></div>'+
    (ne?'<p class="small" style="margin:10px 0 0">'+ne+' séance'+(ne>1?'s':'')+' modifiée'+(ne>1?'s':'')+' par toi. <button class="rm-ghost" style="color:var(--brand);min-height:0;padding:0" data-act="resetedits">Tout rétablir</button></p>':'')+'</div>';
  if(inPlan){var cwk=P(pl,cw);
    h+='<div class="card cwk"><div class="sb"><span class="eyebrow">Cette semaine · S'+cw+' · '+cwk.ph+'</span><b class="num">'+cwk.km+' km</b></div><div class="cwd">'+[0,1,2,3,4,5,6].map(function(dw){var ss=cwk.s.filter(function(x){return +x.dow===dw;}), s=ss[0], on=s&&D.done[sk(r,cw,s.k)]; return '<button class="cd '+(s?tcls(s):"o")+(on?" on":"")+'" data-goto="'+cw+'-'+dw+'"><em>'+DOWC[dw]+'</em><span class="ti">'+tico(s)+'</span><b>'+(s?(s.km?kmS(s.km)+" km":"—"):"Repos")+'</b></button>';}).join("")+'</div></div>';}
  var mx=1; pl.weeks.forEach(function(wk){mx=Math.max(mx,wk.km);});
  var ow=openWk===null?planCurW:openWk;
  h+='<div class="card phs">';
  PH.forEach(function(p0){
    var name=p0[0], ws=pl.weeks.filter(function(x){return x.ph===name;}), w1=ws[0].n, w2=ws[ws.length-1].n, km=0, dn=0, tt=0, open=phOpen===name;
    ws.forEach(function(x){var wk=P(pl,x.n); km+=wk.km; dn+=weekDone(r,wk); tt+=nSess(wk);});
    h+='<div class="ph'+(open?" open":"")+'"><button class="phh" data-ph="'+esc(name)+'" aria-expanded="'+open+'"><span class="phd" style="background:'+cols[name]+'"></span><span class="pht"><b>'+name+(name===curPh&&inPlan?' <span class="chip">en cours</span>':'')+'</b><small class="num">'+(w1===w2?'Semaine '+w1:'Semaines '+w1+' à '+w2)+'</small></span><span class="phk num">'+nb(Math.round(km))+' km<small>'+dn+'/'+tt+' faites</small></span><span class="chev" aria-hidden="true">'+""+'</span></button>';
    if(open)ws.forEach(function(w0){var wk=P(pl,w0.n), w=wk.n, isCur=w===cw&&inPlan, rw=w===pl.n;
      var ed=wk.s.some(function(s){return s.edited;});
      h+='<button class="wk'+(isCur?" cur":wk.start+7*DAY<=todayUTC()?" past":" fut")+(wk.rec?" rec":"")+'" data-wk="'+w+'" aria-expanded="'+(ow===w)+'"><span class="n">'+w+'</span><span><span class="d">'+fmtS(wk.start)+' – '+fmtS(wk.start+6*DAY)+(wk.rec?' · allégée':'')+(wk.hasB?' · course B':'')+(wk.adjLabel?' · <b style="color:var(--warn)">'+esc(wk.adjLabel)+'</b>':'')+(ed?'<span class="ed">modifiée</span>':'')+(isCur?' · <b style="color:var(--brand)">en cours</b>':'')+'</span><span class="wdots">'+wdays(r,wk,"dot")+'</span><span class="wgrid">'+wdays(r,wk,"cell")+'</span><div class="b" style="width:'+(rw?20:Math.max(4,wk.km/mx*100))+'%">'+(function(){if(rw)return ""; var q=weekTot(r,wk,6); return q.ak>0&&wk.km>0?'<i style="width:'+Math.min(100,q.ak/wk.km*100)+'%"></i>':"";})()+'</div></span><span class="k num">'+(rw?'Course':wk.km+' km')+'<small>'+weekDone(r,wk)+'/'+nSess(wk)+' faites</small></span></button>';
      if(ow===w)h+='<div class="wkx">'+wk.s.map(function(s){var on=!!D.done[sk(r,w,s.k)]; return '<div class="sesrow"><button class="ses" data-goto="'+w+'-'+s.dow+'"><span class="ck'+(on?" on":"")+'">'+(on?I.check:"")+'</span><span class="dw">'+DOW[s.dow]+'</span><span class="ty">'+esc(s.type==="Course B"?"Course B · "+s.name:s.type)+(s.edited?'<span class="ed">'+(s.added?"ajoutée":"modifiée")+'</span>':'')+'</span><span class="num muted">'+(s.km?kmS(s.km)+' km':'')+(s.dp?' · +'+nb(s.dp):'')+'</span></button>'+(s.race?'':'<button class="pen" data-edit="'+w+'-'+s.k+'" aria-label="Modifier '+esc(s.type)+'">'+I.pen+'</button>')+'</div>';}).join("")+[0,1,2,3,4,5,6].map(function(dw){var e=D.extra&&D.extra[iso(wk.start+dw*DAY)]; return e?'<div class="sesrow"><button class="ses" data-goto="'+w+'-'+dw+'"><span class="ck on">'+I.check+'</span><span class="dw">'+DOW[dw]+'</span><span class="ty">Sortie hors plan</span><span class="num muted">'+kmS(e.km)+' km'+(e.dp?' · +'+nb(e.dp):'')+'</span></button></div>':"";}).join("")+
        '<button class="addses" data-act="addses" data-w="'+w+'">+ Ajouter une séance</button><button class="addses" data-act="availwk" data-w="'+w+'">'+(wk.avail?'Mes jours de cette semaine ✓':'Indispo cette semaine ?')+'</button>'+(wk.note?'<p class="small muted" style="margin:8px 0 0">'+esc(wk.note)+'</p>':'')+'</div>';
    });
    h+='</div>';
  });
  return h+'</div>';
}

// --- Mes courses ---
function raceRow(r,a,f){var past=daysTo(r)<0, res=D.results[r.id], fin=res&&res.splits&&res.splits[res.splits.length-1], m=model(r);
  return '<button class="race'+(r.prio==="B"?" b":"")+(past?" past":"")+'" data-opencourse="'+r.id+'"><span class="tag">'+r.prio+'</span><span style="flex:1;min-width:0"><b class="rn">'+esc(r.name)+'</b><br><span class="small muted">'+fmtD(dms(r.date))+' · '+kmS(m.L)+' km · +'+nb(m.dp)+' m</span></span>'+(fin?'<span class="chip ok">'+hmc(fin)+'</span>':a&&r.id===a.id?'<span class="chip">objectif</span>':past?'':'<span class="chip" style="background:none">'+jx(r)+'</span>')+'<span class="chev" aria-hidden="true">›</span></button>';}
function vCourse(){
  var a=activeRace(), f=focusRace(), h;
  if(CV!=="detail"||!f){
    h=header("Ta saison","Mes courses");
    var all=races(), up=all.filter(function(r){return daysTo(r)>=0;}), pa=all.filter(function(r){return daysTo(r)<0;}).reverse();
    if(CT!=="up"&&CT!=="past")CT=up.length||!pa.length?"up":"past";
    h+='<div class="wm-seg fm-sub" role="tablist" aria-label="Courses">'+[["up","À venir",up.length],["past","Passées",pa.length]].map(function(x){return '<button role="tab" data-ctab="'+x[0]+'" aria-selected="'+(CT===x[0])+'">'+x[1]+' <span class="cnt">'+x[2]+'</span></button>';}).join("")+'</div>';
    var L=CT==="up"?up:pa;
    h+='<div role="tabpanel">'+(L.length?L.map(function(r){return raceRow(r,a,f);}).join(""):'<p class="muted small" style="margin:8px 4px 16px">'+(CT==="up"?"Aucune course à venir. Ajoute ta prochaine course ci-dessous.":"Aucune course passée pour l’instant.")+'</p>')+'</div>';
    return h+'<button class="race add" data-act="addrace">+ Ajouter une course (trace GPX)</button>';
  }
  h='<button class="back" data-act="courselist">'+I.back+'Mes courses</button><div class="top"><div><span class="eyebrow">Course '+f.prio+' · '+fmtD(dms(f.date))+'</span><h1>'+esc(f.name)+'</h1></div></div>';
  if(!f)return h;
  var m=model(f);
  if(f.prio==="A"&&a&&f.id!==a.id)h+='<div class="banner">Ce n’est pas ton plan en cours (tu suis '+esc(a.name)+'). <button class="btn sm primary" data-act="activate" data-r="'+f.id+'" style="margin-top:8px">Suivre le plan de '+esc(f.name)+'</button></div>';
  if(f.prio==="B"){var apl=a&&planOf(a), inA=apl&&dms(f.date)<apl.end&&dms(f.date)>=apl.start; h+='<div class="banner">Course B'+(inA?' : intégrée au plan de '+esc(a.name)+' le '+fmtD(dms(f.date))+', avec la veille et le lendemain allégés.':' : en dehors de ton plan en cours.')+'</div>';}
  var gref=estGoal(m.L,m.dp), gmin=Math.max(20,Math.round(Math.min(gref*0.6,m.goal)/5)*5), gmax=Math.round(Math.max(gref*1.5,m.goal)/5)*5;
  var est=estNow(f), auto=goalAuto(f);
  h+='<div class="course-detail-dashboard"><div class="course-metrics">';
  h+='<div class="sd-t"><span class="sd-ic">'+sv('<path d="M3 12h18M12 3v18"/>')+'</span><span class="sd-tx"><b>'+kmS(m.L)+' km</b><small>Distance</small></span></div>';
  h+='<div class="sd-t"><span class="sd-ic">'+sv('<path d="M3 20l6-10 4 6 3-4 5 8z"/>')+'</span><span class="sd-tx"><b>+'+nb(m.dp)+' m</b><small>Dénivelé positif</small></span></div>';
  h+='<div class="sd-t"><span class="sd-ic">'+sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')+'</span><span class="sd-tx"><b>'+hm(m.goal)+'</b><small>Objectif chrono</small></span></div>';
  h+='<div class="sd-t"><span class="sd-ic">'+sv('<path d="M4 17l6-6 4 4 6-8"/>')+'</span><span class="sd-tx"><b>'+mmss(m.goal*60/m.L)+'/km</b><small>Allure moyenne</small></span></div></div>';
  h+='<div class="card course-objective"><h2>Objectif</h2><div class="goal"><b class="num" id="goalv">'+hm(m.goal)+'</b><input type="range" id="goal" min="'+gmin+'" max="'+gmax+'" step="5" value="'+m.goal+'" aria-label="Objectif de temps"></div><p class="small muted" style="margin:0" id="goalnote">'+(auto?'Estimation actuelle · '+esc(est.src)+'. Tu peux la changer.':'Modifié par toi · estimation actuelle '+hm(est.min)+' ('+esc(est.src)+') <button class="btn sm" data-act="goalauto" style="margin-left:6px">Utiliser l’estimation</button>')+'</p></div>';
  h+='<div class="card course-chart-card"><h2>Le parcours</h2>'+profileSVG(m,{id:"profsvg",diff:true})+(m.prof?'<div id="profinfo" class="profinfo muted">Touche le profil : km, altitude, D+ et passage visé.</div><div class="legend"><span><i style="background:var(--brand)"></i>Profil</span>'+(m.traps.length?'<span><i style="background:var(--off)"></i>'+m.trapTxt+'</span>':'')+(m.cps.length>1?'<span>R = ravito</span>':'')+'</div>':'<p class="small muted" style="margin:6px 0 0">Ajoute la trace GPX (Modifier la course) pour voir le profil, les montées et les descentes.</p>')+'</div>';
  h+=diffCard(m).replace('<div class="card">','<div class="card course-panel">')+aidCard(m).replace('<div class="card">','<div class="card course-panel">');
  var near=daysTo(f)>=0&&daysTo(f)<=21; // course proche : les deux blocs s’ouvrent seuls ; sinon repliés, choix mémorisé
  function fo(key,ttl,sub,id,html){var o=FOLD[key]!=null?FOLD[key]:near; return '<details class="card fold course-panel" data-fold="'+key+'"'+(o?" open":"")+'><summary><h2>'+ttl+'</h2><span class="small muted">'+sub+'</span></summary><div style="padding:0 16px 16px" id="'+id+'">'+html+'</div></details>';}
  h+=fo("pass","Estimation actuelle",near?"":"toucher pour ouvrir","passwrap",passHTML(f,m));
  h+=fo("strat","Stratégie",near?"":"toucher pour ouvrir","stratwrap",stratHTML(m));
  return h+'</div><div class="row course-actions" style="margin-bottom:12px"><button class="btn" data-act="editrace" data-r="'+f.id+'">'+I.pen+' Modifier la course</button><button class="btn" data-race="'+f.id+'" data-practice="1">'+I.play+' Essayer le mode Course</button></div>';
}
function diffCard(m){
  var body='';
  if(!m.prof)body='<p class="small muted" style="margin:0">Ajoute la trace GPX pour voir le profil, les montées et les descentes techniques.</p><button class="btn sm" data-act="editrace" data-r="'+m.r.id+'" style="margin-top:10px">'+I.pen+' Ajouter la trace</button>';
  else if(!m.diff.length)body='<p class="small muted" style="margin:0">Pas de montée ou de descente marquée sur ce parcours.</p>';
  else body=m.diff.map(function(d,i){return '<div class="dfrow"><span class="dfn'+(d.hard?' hard':'')+'">'+(i+1)+'</span><span><b>'+(d.up?'Montée':'Descente')+(d.hard?(d.up?' raide':' technique'):'')+'</b><small>km '+kmS(d.a)+' → '+kmS(d.b)+' · '+kmS(Math.round((d.b-d.a)*100)/100)+' km</small></span><em>'+(d.up?'+':'−')+d.g+' m<small>'+d.p+' %</small></em></div>';}).join("");
  return '<details class="card fold course-panel"><summary><h2>Difficultés</h2><span class="small muted">'+(m.prof?m.diff.length+' segments':'Détails')+'</span></summary><div class="course-accordion-content">'+body+'</div></details>';
}
function aidCard(m){
  var C=m.cps.slice(0,-1), body;
  if(!C.length)body='<p class="small muted" style="margin:0">Aucun ravitaillement renseigné.</p>';
  else body=C.map(function(c,i){var nx=m.cps[i+1], sec=nx&&{a:c.km,b:nx.km,up:m.dplus(c.km,nx.km),dn:m.dminus(c.km,nx.km)}; return '<div class="dfrow"><span class="dfn aid">R'+(i+1)+'</span><span><b>'+esc(c.n)+'</b><small>km '+kmS(c.km)+(m.prof?' · '+Math.round(m.elevAt(c.km))+' m':'')+' · vers '+tod(m.r,m.cumMin(c.km))+'</small></span><em>'+(sec?'→ '+kmS(Math.round((sec.b-sec.a)*10)/10)+' km<small>+'+sec.up+' / −'+sec.dn+'</small>':'')+'</em></div>';}).join("");
  return '<details class="card fold course-panel"><summary><h2>Ravitaillements</h2><span class="small muted">'+C.length+' point'+(C.length>1?'s':'')+'</span></summary><div class="course-accordion-content">'+body+'</div></details>';
}
function passHTML(r,m){
  var h='<p class="small" style="margin:0 0 8px">Allure moyenne : <b>'+mmss(m.goal*60/m.L)+'/km</b>, soit <b>'+mmss(m.eff)+' par km-effort</b>.</p><table class="tbl num"><tr><th>Section</th><th>D+ / D−</th><th>Passage</th></tr>';
  m.sect.forEach(function(x){var t1=m.cumMin(x.b), dm=t1-m.cumMin(x.a); h+='<tr><td>'+esc(x.n)+'<br><span class="muted xs">'+kmS(x.b-x.a)+' km · '+mmss(dm*60/(x.b-x.a))+'/km</span></td><td>+'+x.up+' / −'+x.dn+'</td><td><b>'+hm(t1)+'</b><br><span class="muted xs">vers '+tod(r,t1)+'</span></td></tr>';});
  var K=[]; for(var k=5;k<m.L-0.5;k+=5)K.push(k); K.push(m.L);
  return h+'</table><details style="margin-top:6px"><summary>Passages tous les 5 km</summary><div class="in"><table class="tbl num"><tr><th>Km</th><th>Passage</th><th>Allure moy.</th></tr>'+K.map(function(q){var mm=m.cumMin(q); return '<tr><td>'+(q===m.L?"Arrivée":q)+'</td><td>'+hm(mm)+'</td><td>'+mmss(mm*60/q)+'/km</td></tr>';}).join("")+'</table></div></details><p class="muted xs" style="margin:6px 0 0">Heures calculées pour un départ à '+esc(r.time)+'.</p>';
}
function stratHTML(m){return m.strat.map(function(g){return '<div class="strat"><b>'+esc(g[0])+'</b><span class="muted small">cible au km '+kmS(Math.min(g[2],m.L))+' : '+hm(m.cumMin(g[2]))+'</span><p class="small">'+esc(g[1])+'</p></div>';}).join("");}

// --- Réglages ---
function sitem(ic,t,sub,right,attr,cls){return '<button class="sitem'+(cls?" "+cls:"")+'"'+(attr||"")+'><span class="ico">'+I[ic]+'</span><span class="tx"><b>'+t+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</span>'+(right==null?'<span class="chev">›</span>':right)+'</button>';}
function srow(ic,t,sub,ctrl){return '<div class="sitem"><span class="ico">'+I[ic]+'</span><span class="tx"><b>'+t+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</span>'+ctrl+'</div>';}
function swItem(ic,t,sub,key,on){return '<div class="sitem" role="switch" tabindex="0" aria-checked="'+!!on+'" data-sw="'+key+'" style="cursor:pointer"><span class="ico">'+I[ic]+'</span><span class="tx"><b>'+t+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</span><span class="sw" data-on="'+!!on+'" aria-hidden="true"></span></div>';}
function group(t,inner){return '<div class="sgroup"><span class="eyebrow">'+t+'</span><div class="slist">'+inner+'</div></div>';}
function selMin(id,list,val){return '<select id="'+id+'" aria-label="'+(id==="gelmin"?"Fréquence du rappel de gel":"Fréquence du rappel d’eau")+'">'+list.map(function(v){return '<option value="'+v+'"'+(val===v?" selected":"")+'>'+(v?"toutes les "+v+" min":"désactivé")+'</option>';}).join("")+'</select>';}
// ---------- Trophées : records de segments et de distances (Strava), étapes calculées sur tes sorties ----------
var TRF="", TRSEEN="", TRFROM=false, TRPG=0;
function pz2(n){return n<10?"0"+n:""+n;}
function mmss(t){t=Math.round(t); var h=Math.floor(t/3600), m=Math.floor(t%3600/60), s=t%60; return h?h+":"+pz2(m)+":"+pz2(s):m+":"+pz2(s);}
function dshort(iso){return fmtD(dms(iso)).replace(/^\S+\s/,"");}
function isoToday(){return new Date(todayUTC()).toISOString().slice(0,10);}
function isoAgo(n){return new Date(todayUTC()-n*864e5).toISOString().slice(0,10);}
var BEN={"400m":"400 m","1/2 mile":"800 m","1k":"1 km","1 mile":"1 mile","2 mile":"2 miles","5k":"5 km","10k":"10 km","15k":"15 km","10 mile":"10 miles","20k":"20 km","half-marathon":"Semi-marathon","30k":"30 km","marathon":"Marathon"};
function medal(tier,glyph,sz){ // icônes plates façon Strava : coupe avec le rang pour les records, pictogrammes verts pour les étapes
  var body;
  if(tier==="vt")body=glyph==="loop"?'<path fill="none" stroke="var(--c1)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="M31.5 14.5A12 12 0 0 0 9.6 15.8M8.5 25.5a12 12 0 0 0 21.9-1.3M32 7.5v7.2h-7.2M8 32.5v-7.2h7.2"/>':'<path d="M4.5 32.5L15.8 12l6.4 10.4 4.1-5.6 9.2 15.7z" style="fill:var(--c1)"/><path d="M15.8 12l3.6 5.9-3.6-1.6-3.6 1.6z" style="fill:#fff;fill-opacity:.75"/>';
  else body='<path d="M11.4 9.4H7.5c-.4 4.7 1.4 8 5.5 9.5M28.6 9.4h3.9c.4 4.7-1.4 8-5.5 9.5" fill="none" stroke-width="2.6" stroke-linecap="round" style="stroke:var(--c2)"/><path d="M10.6 5h18.8v8.5c0 5.4-3.8 9-9.4 9s-9.4-3.6-9.4-9z" style="fill:var(--c1)"/><rect x="17.5" y="22" width="5" height="5.8" style="fill:var(--c2)"/><rect x="11.5" y="27" width="17" height="5.8" rx="2.2" style="fill:var(--c2)"/><path d="M14.3 8.6v5.6" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/><text x="20.6" y="18.2" text-anchor="middle" font-size="12.5" font-weight="800" style="fill:#2a2418;font-family:var(--display)">'+(tier==="or"?1:tier==="ar"?2:3)+'</text>';
  return '<span class="md t-'+tier+(sz?" "+sz:"")+'" aria-hidden="true"><svg viewBox="0 0 40 40">'+body+'</svg></span>';
}
function trophies(){
  var T=[], seg={}, city={}, ago=isoAgo(90), best=null, bd=null, kmM=0, dpM=0, kmR=null, dpR=null;
  HIST.forEach(function(r){
    (r.sg||[]).forEach(function(e){
      var o=seg[e.i]||(seg[e.i]={id:e.i,n:e.n,c:e.c,ef:[]}); o.ef.push({d:r.date,t:e.t,p:e.p,k:e.k});
      var tier=e.p===1?"or":e.p===2?"ar":e.p===3?"br":"";
      if(tier)T.push({kind:"rec",tier:tier,g:"bolt",name:e.n,sub:(e.c?e.c+" · ":"")+mmss(e.t),rank:e.p,d:r.date,seg:e.i,time:Number(e.t)||0,recordKey:"segment:"+String(e.i)});
      if(e.c&&((e.p>0&&e.p<=3)||(e.k>0&&e.k<=10))){var ck=e.c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""), c=city[ck]||(city[ck]={n:e.c,all:0,or:0,v:{}}); c.all++; if(e.p===1)c.or++; c.v[e.c]=(c.v[e.c]||0)+1; if(c.v[e.c]>c.v[c.n])c.n=e.c;}
    });
    (r.be||[]).forEach(function(b){var tier=b.p===1?"or":b.p===2?"ar":b.p===3?"br":""; if(tier){var bestName=BEN[String(b.n).toLowerCase()]||b.n; T.push({kind:"rec",tier:tier,g:"bolt",name:bestName,sub:mmss(b.t),rank:b.p,d:r.date,time:Number(b.t)||0,recordKey:"distance:"+String(b.n).toLowerCase()});}});
    if(!best||r.km>best.km)best=r; if(!bd||r.dp>bd.dp)bd=r;
    [10,15,20,25,30,35,40].forEach(function(k){if(r.km>=k&&(k>kmM||(k===kmM&&r.date<kmR.date))){kmM=k;kmR=r;}});
    [500,1000,1500,2000].forEach(function(k){if(r.dp>=k&&(k>dpM||(k===dpM&&r.date<dpR.date))){dpM=k;dpR=r;}});
  });
  if(best&&best.km>=5)T.push({kind:"step",tier:"vt",g:"peak",name:"Plus longue sortie",sub:kmS(best.km)+" km · D+ "+nb(best.dp),d:best.date});
  if(bd&&bd.dp>=200)T.push({kind:"step",tier:"vt",g:"peak",name:"Plus gros D+ en une sortie",sub:"+"+nb(bd.dp)+" m · "+kmS(bd.km)+" km",d:bd.date});
  if(kmR&&kmM>=20&&kmR!==best)T.push({kind:"step",tier:"vt",g:"peak",name:"Première sortie de "+kmM+" km",sub:kmS(kmR.km)+" km",d:kmR.date});
  if(dpR&&dpM>=1000&&dpR!==bd)T.push({kind:"step",tier:"vt",g:"peak",name:"Premiers "+nb(dpM)+" m de D+",sub:"En une sortie · "+kmS(dpR.km)+" km",d:dpR.date});
  var hab=null; Object.keys(seg).forEach(function(k){var o=seg[k], n=o.ef.filter(function(e){return e.d>=ago;}).length; if(n>=4&&(!hab||n>hab.n))hab={o:o,n:n};});
  if(hab)T.push({kind:"step",tier:"vt",g:"loop",name:"Habituée · "+hab.o.n,sub:hab.n+" passages en 90 jours",d:hab.o.ef[hab.o.ef.length-1].d,seg:hab.o.id});
  var uq={}; T=T.filter(function(m){if(m.kind!=="rec"){return true;} var k=m.recordKey||((m.seg||m.name)+"|"+m.d), o=uq[k]; if(o){if(m.time<o.time||(m.time===o.time&&m.rank<o.rank)){o.rank=m.rank;o.tier=m.tier;o.sub=m.sub;o.d=m.d;o.time=m.time;} return false;} uq[k]=m; return true;});
  T.sort(function(a,b){if(a.kind==="rec"&&b.kind==="rec")return a.time-b.time||a.rank-b.rank||(a.d<b.d?1:a.d>b.d?-1:0); if(a.kind==="rec")return -1; if(b.kind==="rec")return 1; return a.d<b.d?1:a.d>b.d?-1:0;});
  var lieux=Object.keys(city).map(function(k){return city[k];}).sort(function(a,b){return b.all-a.all||b.or-a.or;}).slice(0,3);
  return {list:T,seg:seg,lieux:lieux};
}
function medalBadge(selD){ // pastille de médailles dans le bilan du jour : touche = écran Trophées sur cette sortie
  var iso=new Date(selD).toISOString().slice(0,10), T=trophies().list.filter(function(m){return m.d===iso;}); if(!T.length)return "";
  return '<button class="mbadge" data-tro="'+iso+'" aria-label="'+T.length+(T.length>1?" médailles":" médaille")+' ce jour-là, voir les trophées">'+T.slice(0,3).map(function(m){return medal(m.tier,m.g,"s");}).join("")+'<b>'+T.length+'</b></button>';
}
function openTro(focus){TRPG=0; TRSEEN=D.tseen||isoAgo(3); D.tseen=isoToday(); save(); TRF=focus||""; TRFROM=!!focus; if(tab!=="settings"){prevTab=tab;tab="settings";} SSUB="trophees"; render(); window.scrollTo(0,0);}
function vTroph(){
  var R=trophies(), T=R.list, seen=TRSEEN||isoAgo(3), cnt={or:0,ar:0,br:0}, yr=isoToday().slice(0,4), mo=[0,0,0,0,0,0,0,0,0,0,0,0], wk=isoAgo(7), nWk=0, nNew=0;
  T.forEach(function(m){if(m.kind==="rec"){cnt[m.tier]++; if(m.d.slice(0,4)===yr)mo[+m.d.slice(5,7)-1]++;} if(m.d>=wk)nWk++; if(m.d>seen)nNew++;});
  function row(m){var nw=m.d>seen, tag=m.seg?'button':'div';
    return '<'+tag+' class="sitem'+(nw||m.d===TRF?" hl":"")+'"'+(m.seg?' data-seg="'+esc(m.seg)+'"':'')+'>'+medal(m.tier,m.g)+'<span class="tx"><b>'+esc(m.name)+'</b><small>'+esc(m.sub)+'</small></span>'+(nw?'<span class="tro-pill">Nouveau</span>':'<span class="val">'+esc(dshort(m.d))+'</span>')+'</'+tag+'>';}
  var h=(TRFROM?'<button class="back" data-go="back">'+I.back+'Aujourd’hui</button>':'<button class="back" data-ssub="">'+I.back+'Réglages</button>');
  h+='<div class="tro-hero"><span class="eyebrow">Mes trophées</span><div class="tro-big"><b>'+T.length+'</b><span>médaille'+(T.length>1?"s":"")+'</span></div><p>'+(nWk?"+"+nWk+" cette semaine":"Aucune cette semaine")+(nNew?" · "+nNew+" nouvelle"+(nNew>1?"s":""):"")+'</p><div class="tro-tiers">'+[["or","Or"],["ar","Argent"],["br","Bronze"]].map(function(x){return '<div>'+medal(x[0],"")+'<b>'+cnt[x[0]]+'</b><small>'+x[1]+'</small></div>';}).join("")+'</div></div>';
  var f=TRF?T.filter(function(m){return m.d===TRF;}):[];
  if(f.length)h+=group("Sortie du "+esc(dshort(TRF))+" · "+f.length+(f.length>1?" médailles":" médaille"),f.map(row).join(""));
  if(R.lieux.length){var ord=R.lieux.length>=3?[1,0,2]:R.lieux.map(function(_,i){return i;}), tr=["or","ar","br"];
    h+='<div class="tro-card"><span class="eyebrow">Podium de tes villes</span><p class="small muted" style="margin:4px 0 0">Les villes où tu as battu le plus de records sur tes segments.</p><div class="podium">'+ord.map(function(i){var c=R.lieux[i];return '<div class="pc p'+(i+1)+'">'+medal(tr[i],"","l")+'<span class="cn">'+esc(c.n)+'</span><small>'+c.all+' record'+(c.all>1?"s":"")+'</small><i><em>'+(i+1)+'</em></i></div>';}).join("")+'</div></div>';}
  var mx=Math.max.apply(null,mo.concat(1)), nowM=+isoToday().slice(5,7), ML="JFMAMJJASOND";
  if(T.some(function(m){return m.kind==="rec";}))h+='<div class="tro-card"><span class="eyebrow">Records par mois · '+yr+'</span><div class="tro-bars" role="img" aria-label="Records par mois : '+mo.slice(0,nowM).map(function(n,i){return MON[i]+" "+n;}).join(", ")+'">'+mo.slice(0,nowM).map(function(n,i){return '<div><span class="n">'+(n||"")+'</span><i class="'+(i===nowM-1?"cur":"")+'" style="height:'+Math.max(3,Math.round(n/mx*64))+'px"></i><span class="m">'+ML[i]+'</span></div>';}).join("")+'</div></div>';
  var rec=T.filter(function(m){return m.kind==="rec"&&m.d!==TRF;}), st=T.filter(function(m){return m.kind==="step"&&m.d!==TRF;});
  if(st.length)h+='<div class="tro-card nopad"><span class="eyebrow" style="padding:16px 16px 0">Mes étapes · '+st.length+'</span><div class="tro-st" tabindex="0" role="group" aria-label="Mes étapes, à faire défiler">'+st.map(function(m){var tg=m.seg?'button':'div'; return '<'+tg+' class="stp"'+(m.seg?' data-seg="'+esc(m.seg)+'"':'')+'>'+medal(m.tier,m.g)+'<b>'+esc(m.name)+'</b><small>'+esc(m.sub)+'</small><em>'+esc(dshort(m.d))+'</em></'+tg+'>';}).join("")+'</div><div class="tro-dots" aria-hidden="true">'+st.map(function(_,i){return '<i'+(i?'':' class="on"')+'></i>';}).join("")+'</div></div>';
  rec.sort(function(x,y){return x.time-y.time||x.rank-y.rank||(x.d<y.d?1:x.d>y.d?-1:0);});
  var PG=5, np=Math.max(1,Math.ceil(rec.length/PG)); if(TRPG>=np)TRPG=np-1; if(TRPG<0)TRPG=0;
  h+=group("Records · meilleurs temps d’abord",rec.length?rec.slice(TRPG*PG,TRPG*PG+PG).map(row).join("")+'<div class="tro-pg"><button data-trpg="-1" aria-label="5 records précédents"'+(TRPG?"":" disabled")+'>'+I.back+'</button><span>'+(TRPG*PG+1)+"–"+Math.min(rec.length,TRPG*PG+PG)+' sur '+rec.length+'</span><button data-trpg="1" aria-label="5 records suivants"'+(TRPG<np-1?"":" disabled")+'><span class="rt">'+I.back+'</span></button></div>':'<div class="sitem"><span class="tx"><b>Pas encore de record</b><small>Tes records de segments et de distances arrivent avec la prochaine synchro Strava, puis à chaque nouvelle sortie.</small></span></div>');
  return '<section class="settings-page settings-trophies"><div class="settings-page-content settings-trophies-content">'+h+'<p class="foot">Or, argent, bronze : tes meilleurs temps sur tes segments et distances, d’après Strava. Les étapes sont calculées sur tes sorties.</p></div></section>';
}
function segSheet(id){
  var o=trophies().seg[id]; if(!o)return; var ef=o.ef.slice().sort(function(a,b){return a.d<b.d?1:-1;}), bt=Math.min.apply(null,ef.map(function(e){return e.t;})), bd=ef.filter(function(e){return e.t===bt;})[0];
  openSheet('<h2>'+esc(o.n)+'</h2><p class="small muted">'+(o.c?esc(o.c)+" · ":"")+ef.length+(ef.length>1?" passages":" passage")+'</p><p style="margin:10px 0 4px"><span class="eyebrow">Ton record</span></p><p style="font:700 28px var(--display);margin:0 0 10px">'+mmss(bt)+' <span class="small muted" style="font:600 13px var(--mono)">le '+esc(dshort(bd.d))+'</span></p><div class="slist" style="margin-bottom:14px">'+ef.slice(0,8).map(function(e,i){var prv=ef[i+1], dl=prv?e.t-prv.t:0; return '<div class="sitem" style="min-height:48px"><span class="tx"><b>'+esc(dshort(e.d))+'</b></span><span class="val" style="color:var(--ink);font-weight:600">'+mmss(e.t)+'</span>'+(prv?'<span class="val" style="min-width:56px;text-align:right;color:'+(dl<0?'var(--ok)':'var(--muted)')+'">'+(dl<0?"−":"+")+Math.abs(dl)+' s</span>':'')+'</div>';}).join("")+'</div>');
}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
document.addEventListener("scroll",function(e){var t=e.target; if(!t.classList||!t.classList.contains("tro-st"))return; var w=t.children[0]?t.children[0].offsetWidth+10:150, i=Math.round(t.scrollLeft/w), d=t.parentNode.querySelectorAll(".tro-dots i"); for(var k=0;k<d.length;k++)d[k].classList.toggle("on",k===i);},true);
var SSUB=null;

function prefClubSessionRowsHtml(sessions){
  var byDay={}; (sessions||[]).forEach(function(s){if(s&&Number.isInteger(+s.day))byDay[+s.day]=s;});
  var types=[["Fractionné / piste",8],["Footing collectif",8],["Sortie longue",14],["Côtes",8],["Sortie trail",10],["Renforcement",0],["Autre",8]];
  return DOWL.map(function(name,i){
    var s=byDay[i]||{}, selected=!!byDay[i], type=s.type||"Fractionné / piste", km=s.estimated_km!=null?s.estimated_km:(types.filter(function(t){return t[0]===type;})[0]||types[0])[1];
    return '<div class="pref-club-day"><label class="pref-check"><input type="checkbox" data-pref-club-day value="'+i+'" '+(selected?'checked':'')+'><span>'+name.charAt(0).toUpperCase()+name.slice(1)+'</span></label>'+
      '<div class="pref-club-fields" data-pref-club-fields="'+i+'" '+(selected?'':'hidden')+'><label class="field">Type d’entraînement<select data-pref-club-type="'+i+'">'+types.map(function(t){return '<option value="'+t[0]+'" '+(type===t[0]?'selected':'')+'>'+t[0]+'</option>';}).join('')+'</select></label>'+
      '<label class="field">Distance estimée (km)<input data-pref-club-km="'+i+'" type="number" min="0" max="100" step="0.5" inputmode="decimal" value="'+esc(km)+'"></label></div></div>';
  }).join("");
}
function prefDaysHtml(selected,kind){
  return DOWL.map(function(name,i){return '<label class="pref-day"><input type="checkbox" data-pref-day="'+kind+'" value="'+i+'" '+(selected.indexOf(i)>=0?'checked':'')+'><span>'+name.slice(0,3)+'</span></label>';}).join("");
}
function clubEstimate(type){
  return {"Fractionné / piste":8,"Footing collectif":8,"Sortie longue":14,"Côtes":8,"Sortie trail":10,"Renforcement":0,"Autre":8}[type]||0;
}
function openTrainingPrefs(first){
  var p=TRAIN_PREF||{has_club:false,club_days:[],club_sessions:[],sessions_per_week:4,training_days:[0,1,2,3,5,6],rest_days:[4],onboarding_completed:false};
  var sessions=p.club_sessions||((p.club_days||[]).map(function(day){return {day:+day,type:"Fractionné / piste",estimated_km:8};}));
  var athlete=p.athlete_profile||{};
  var h='<h2>'+(first?'Ton profil de coureur':'Mes disponibilités et mon profil')+'</h2><p class="small muted">Quelques repères pour construire un plan adapté à ton expérience et à ta charge actuelle.</p>'+
  '<p class="eyebrow">Ta pratique</p><label class="field">Discipline<select id="athDiscipline">'+[['route','Course sur route'],['trail','Trail'],['mixte','Route et trail']].map(function(x){return '<option value="'+x[0]+'" '+((athlete.discipline||'mixte')===x[0]?'selected':'')+'>'+x[1]+'</option>';}).join('')+'</select></label>'+
  '<label class="field">Ton expérience<select id="athExperience">'+[['debutant','Débutant(e)'],['reprise','Reprise après une pause'],['regulier','Pratique régulière'],['confirme','Coureur(se) expérimenté(e)']].map(function(x){return '<option value="'+x[0]+'" '+((athlete.experience||'regulier')===x[0]?'selected':'')+'>'+x[1]+'</option>';}).join('')+'</select></label>'+
  '<label class="field">FC max, bpm (facultatif)<input id="athHr" type="number" min="150" max="220" step="1" value="'+(athlete.hr_max==null?'':Number(athlete.hr_max))+'" placeholder="'+(calibrate().hrMax?'Estimée : '+calibrate().hrMax:'Ex. 190')+'"></label><label class="field">Volume actuel (km/semaine)<input id="athKm" type="number" min="0" max="200" step="1" required value="'+(athlete.weekly_km==null?'':Number(athlete.weekly_km))+'" placeholder="Ex. 25"></label><label class="field">Sorties par semaine<input id="athRuns" type="number" min="0" max="14" step="1" value="'+(athlete.runs_per_week==null?'':Number(athlete.runs_per_week))+'" placeholder="Ex. 3" required></label>'+
  '<p class="small muted">Indique la moyenne des 4 dernières semaines. Si tu débutes ou reprends, indique ton volume actuel, même s’il est faible.</p>'+
  '<h2>'+(first?'Ton organisation d’entraînement':'Mes disponibilités')+'</h2><p class="small muted">Tes entraînements collectifs sont obligatoires : ils seront intégrés au planning et remplaceront la séance prévue le même jour.</p>'+
  '<label class="pref-check"><input id="prefClub" type="checkbox" '+(p.has_club?'checked':'')+'> Je participe à des entraînements collectifs</label>'+
  '<div id="prefClubConfig" '+(p.has_club?'':'hidden')+'><p class="eyebrow">Tes jours d’entraînement collectif</p><div class="pref-club-list">'+prefClubSessionRowsHtml(sessions)+'</div></div>'+
  '<label class="field">Nombre de séances souhaitées<select id="prefCount">'+[2,3,4,5,6,7].map(function(n){return '<option value="'+n+'" '+(n===+p.sessions_per_week?'selected':'')+'>'+n+' séances par semaine</option>';}).join('')+'</select></label>'+
  '<p class="eyebrow">Jours où tu peux t’entraîner</p><div class="pref-days">'+prefDaysHtml((p.training_days||[]).map(Number),"train")+'</div>'+
  '<p class="small muted">Les jours non sélectionnés deviennent tes jours de repos. Les entraînements collectifs sont des séances à part entière. Les distances proposées sont modifiables.</p>'+
  '<p class="small" id="prefError" role="alert" style="color:var(--bad)"></p><button class="btn primary" data-sact="saveprefs" style="width:100%">Enregistrer mes disponibilités</button>';
  openSheet(h,{kind:"prefs",first:!!first});
  var club=$("prefClub"),config=$("prefClubConfig");
  club.addEventListener("change",function(){config.hidden=!club.checked;});
  $("sheetBody").addEventListener("change",function(e){
    var day=e.target.closest("[data-pref-club-day]");
    if(day){var fields=$("sheetBody").querySelector('[data-pref-club-fields="'+day.value+'"]');if(fields)fields.hidden=!day.checked;return;}
    var type=e.target.closest("[data-pref-club-type]");
    if(type){var km=$("sheetBody").querySelector('[data-pref-club-km="'+type.dataset.prefClubType+'"]');if(km)km.value=clubEstimate(type.value);}
  });
}function vSettings(){
  var th=D.set.theme, G=window.GARMIN&&GARMIN.data&&GARMIN.data(), gOld=(G&&G.last)?Math.round(todayUTC()/864e5)-dayN(G.last):null, foot='<p class="foot">Plan trail · données gardées sur ce téléphone</p>';
  function gSorties(){return group(STRAVA?"Strava":"Sorties",(STRAVA?sitem("sync","Synchroniser maintenant",stravaSub(),null,' data-act="sync"',D.sync.gh==="ko"?"danger":""):"")+sitem("up","Importer .zip Garmin","Sommeil, VFC et activités.",null,' data-act="gimport"'));}
  function gCourse(){return group("Mode Course",srow("gel","Rappel de gel","Vibration et alerte à l’écran",selMin("gelmin",[0,25,30,35,40,45],D.set.gel))+srow("drop","Rappel d’eau","Petite vibration",selMin("watermin",[0,10,15,20,30],D.set.water))+
    swItem("pin","GPS auto","Te situe sur la trace dès l’ouverture","gps",D.set.gps!==false)+
    swItem("vib","Vibration au ravito","Android seulement : l’iPhone ne vibre pas depuis le web","vib",D.set.vib)+
    (D.race?sitem("trash","Réinitialiser le chrono de course",esc((raceById(D.race.rid)||{}).name||"")+" · "+(D.race.done?"terminée":D.race.t0?"chrono lancé":"prêt"),"",' data-act="racereset"',"danger"):""));}
  function gDonnees(){return group("Données",sitem("down","Exporter mes données","Fichier complet : plan, séances, Garmin. "+lastExportTxt(),null,' data-act="export"')+sitem("up","Importer une sauvegarde","Fusionner ou remplacer, avec copie de sécurité avant",null,' data-act="import"')+sitem("down","Copies automatiques","Revenir à une version précédente de ce téléphone",null,' data-act="backups"'));}
  if(SSUB==="trophees")return vTroph();
  if(SSUB){var T={sorties:["Export Garmin","Connectivité et import de tes activités",gSorties],donnees:["Données","Sauvegardes, export et restauration de tes informations",gDonnees],course:["Mode Course","Alertes et options disponibles pendant une course",gCourse]}[SSUB]; if(T)return '<section class="settings-page"><header class="settings-page-head"><button class="back" data-ssub="">'+I.back+'Réglages</button><div><span class="eyebrow">CADENZO · RÉGLAGES</span><h1>'+T[0]+'</h1><p>'+T[1]+'</p></div></header><div class="settings-page-content">'+T[2]()+'</div>'+foot+'</section>';}
  function tile(ic,t,body,o){o=o||{}; return '<'+(o.tag||"div")+' class="sd-t'+(o.w?" sd-w":"")+(o.row?" sd-row":"")+'"'+(o.attr||"")+'><span class="sd-ic">'+sv(ic)+'</span>'+(o.st?'<span class="sd-st '+o.st[0]+'"><i></i>'+o.st[1]+'</span>':'')+'<span class="sd-tx"><b>'+t+'</b>'+(body?'<small>'+body+'</small>':'')+'</span></'+(o.tag||"div")+'>';}
  function tg(key,on,label){return '<div class="sd-tg" role="switch" tabindex="0" aria-checked="'+!!on+'" aria-label="'+label+'" data-sw="'+key+'"><span>'+(on?"Activé":"Désactivé")+'</span><u class="'+(on?"on":"")+'"></u></div>';}
  var sy=D.sync, syOk=!(sy.err||sy.gh==="ko"), h='<button class="back" data-go="back">'+I.back+'Retour</button><h1 style="font-size:30px;margin-bottom:16px">Réglages</h1><div class="sd">';
  h+='<div class="sd-t sd-w sd-hero"><span class="sd-ic">'+sv('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>')+'</span><span class="sd-st"><i style="background:'+(syOk?'var(--ok)':'var(--acc)')+'"></i>'+(syOk?"À jour":"À vérifier")+'</span><span class="sd-tx"><b>'+(STRAVA?"Strava":"Sorties")+'</b><small>'+(STRAVA?(sy.t?"Dernière synchro "+ago(sy.t):"Jamais synchronisé"):"Importe un CSV pour ranger tes sorties")+'</small></span>'+(STRAVA?'<button class="sd-btn" data-act="sync">Synchroniser maintenant</button>':'<button class="sd-btn" data-act="csv">Importer un CSV</button>')+'</div>';
  var TR=trophies().list, nNew=TR.filter(function(m){return m.d>(D.tseen||isoAgo(3));}).length;
  h+='<button class="sd-t sd-w sd-row" data-ssub="trophees" style="min-height:0"><span class="sd-ic" style="background:color-mix(in srgb,var(--sun) 22%,var(--card));color:var(--ink)">'+sv('<circle cx="12" cy="10" r="6"/><path d="M8.5 15L7 22l5-3 5 3-1.5-7"/>')+'</span><span class="sd-tx"><b>Trophées</b><small>'+(TR.length?TR.length+(TR.length>1?" médailles":" médaille"):"Records et étapes")+'</small></span>'+(nNew?'<span class="sd-st"><i style="background:var(--acc)"></i>'+nNew+(nNew>1?" nouvelles":" nouvelle")+'</span>':'')+'</button>';
  h+=tile('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',"Export Garmin",(G&&G.last)?"Import du "+fmtD(dayN(G.last)*864e5).replace(/^\S+\s/,""):"Aucun import",{tag:"button",attr:' data-ssub="sorties"',st:[(gOld==null||gOld>9)?"w":"",gOld==null?"—":gOld+" j"]});
  h+=tile('<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',"Données",lastExportTxt().replace(/\.$/,"").replace("Dernier export ","Export "),{tag:"button",attr:' data-ssub="donnees"'});
  h+='<button type="button" class="sd-t sd-w sd-row training-summary" data-prefopen="1"><span class="sd-ic">'+sv('<path d="M3 5h18M6 3v4M18 3v4M5 10h14M5 15h8"/>')+'</span><span class="sd-tx"><b>Organisation d’entraînement</b><small>'+(TRAIN_PREF&&TRAIN_PREF.onboarding_completed?TRAIN_PREF.sessions_per_week+' séances · '+((TRAIN_PREF.club_sessions||[]).length||((TRAIN_PREF.club_days||[]).length))+' entraînements collectifs':'À définir lors de ta première connexion')+'</small></span><span class="chev">›</span></button>';
  h+='<div class="sd-t"><span class="sd-ic">'+sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>')+'</span><span class="sd-tx"><b>Apparence</b></span><div class="sd-seg" role="radiogroup" aria-label="Thème">'+[["auto","Auto"],["light","Clair"],["dark","Sombre"]].map(function(o){return '<button role="radio" data-theme="'+o[0]+'" aria-checked="'+(th===o[0])+'">'+o[1]+'</button>';}).join("")+'</div></div>';
  h+='<div class="sd-t"><span class="sd-ic">'+sv('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4"/>')+'</span><span class="sd-tx"><b>Check-in du lundi</b></span>'+tg("checkin",D.set.checkin,"Check-in du lundi")+'</div>';
  h+=tile('<path d="M2 20l6-10 4 6 3-4 7 8z"/><path d="M15 12V4l4 2-4 2"/>',"Mode Course",(D.set.gel?"Gel "+D.set.gel+" min":"Gel off")+" · "+(D.set.water?"Eau "+D.set.water+" min":"Eau off"),{tag:"button",w:1,row:1,attr:' data-ssub="course"'});
  h+=tile('<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',"Renfo et mobilité","7 renfo · 6 mobilité",{tag:"button",w:1,row:1,attr:' data-sheet="guide"'});
  h+=tile('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',GS?(GS.err?"Synchro à vérifier":"Synchro entre appareils"):"Mêmes données partout",GS?(GS.err?esc(GS.err):(GS.t?"Active · "+ago(GS.t):"En attente de la première synchro")):"Téléphone et ordinateur, chiffré, sans compte",{tag:"button",w:1,row:1,attr:' data-act="'+(GS?"gmanage":"gsetup")+'"',st:GS?[GS.err?"w":"",""]:null});
  h+='</div><div class="sd-dz"><button data-act="reset">'+(resetArmed?"Toucher encore pour tout effacer":"Tout effacer")+'</button></div>'+foot;
  return h;
}
function ago(t){var m=Math.round((Date.now()-t)/60000); if(m<1)return "à l’instant"; if(m<60)return "il y a "+m+" min"; var h=Math.round(m/60); return h<24?"il y a "+h+" h":"il y a "+Math.round(h/24)+" j";}
function inTime(t){var m=Math.max(1,Math.ceil((t-Date.now())/60000));if(m<60)return "dans "+m+" min";var h=Math.ceil(m/60);return h<24?"dans "+h+" h":"demain";}

// ---------- feuilles ----------
var SH=null;
var SHOPEN=null;
function openSheet(html,state){ if($("sheet").hidden)SHOPEN=document.activeElement; SH=state||{}; $("sheetBody").innerHTML=html; $("sheet").hidden=false; document.body.style.overflow="hidden"; var si=$("sheet").querySelector(".sheet-in"); si.scrollTop=0; si.setAttribute("tabindex","-1"); try{si.focus({preventScroll:true});}catch(e){}}
function closeSheet(){var was=!$("sheet").hidden; $("sheet").hidden=true; document.body.style.overflow=""; SH=null; pendingGpx=null; if(was&&SHOPEN&&document.contains(SHOPEN)){try{SHOPEN.focus({preventScroll:true});}catch(e){}} SHOPEN=null;}
document.addEventListener("keydown",function(e){ if(e.key!=="Tab"||$("sheet").hidden)return; // le focus reste dans la feuille ouverte
  var f=[].slice.call($("sheet").querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')).filter(function(x){return !x.disabled&&x.offsetParent!==null;}); if(!f.length)return;
  var first=f[0], last=f[f.length-1], ae=document.activeElement, inside=$("sheet").contains(ae)&&ae!==$("sheet").querySelector(".sheet-in");
  if(!inside){e.preventDefault(); (e.shiftKey?last:first).focus(); return;}
  if(e.shiftKey&&ae===first){e.preventDefault(); last.focus();} else if(!e.shiftKey&&ae===last){e.preventDefault(); first.focus();}});
$("sheet").addEventListener("click",function(e){if(e.target.closest("[data-close]")){closeSheet();return;} var typeTrigger=e.target.closest("#eTypeTrigger"); if(typeTrigger){var typePanel=$("eTypeOptions"),open=typePanel.hidden;typePanel.hidden=!open;typeTrigger.setAttribute("aria-expanded",String(open));return;} var typeChoice=e.target.closest("[data-session-type]"); if(typeChoice){var chosen=typeChoice.dataset.sessionType,select=$("eType"),trigger=$("eTypeTrigger");select.value=chosen;trigger.querySelector(".type-trigger-icon").innerHTML=tico({type:chosen});trigger.querySelector(".type-trigger-label").textContent=chosen;$("eTypeOptions").hidden=true;trigger.setAttribute("aria-expanded","false");[].forEach.call($("eTypeOptions").querySelectorAll("[data-session-type]"),function(option){var active=option.dataset.sessionType===chosen;option.classList.toggle("is-selected",active);option.setAttribute("aria-selected",String(active));});return;} var b=e.target.closest("button"); if(!b)return;
  if(b.dataset.ngo){var g=b.dataset.ngo; closeSheet(); if(g.indexOf("goto:")===0){var q=g.slice(5).split("-"); cur=+q[0]; sel=+q[1]; browsing=true; tab="today"; prevTab="today"; render();} else {browsing=false; setTab("today");} return;}

  if(b.dataset.sact==="saveprefs"){
    var hasClub=$("prefClub").checked;
    var training=Array.from(document.querySelectorAll('[data-pref-day="train"]:checked')).map(function(x){return +x.value;});
    var clubSessions=hasClub?Array.from(document.querySelectorAll("[data-pref-club-day]:checked")).map(function(x){
      var day=+x.value,type=$("sheetBody").querySelector('[data-pref-club-type="'+day+'"]').value,raw=$("sheetBody").querySelector('[data-pref-club-km="'+day+'"]').value,km=raw===""?0:Number(raw);
      return {day:day,type:type,estimated_km:km};
    }):[];
    var clubDays=clubSessions.map(function(s){return s.day;});
    var count=+$("prefCount").value, err=$("prefError");
    if(training.length<count){err.textContent="Sélectionne au moins autant de jours que de séances souhaitées.";return;}
    if(count<clubSessions.length){err.textContent="Le nombre de séances souhaitées doit inclure tous tes entraînements collectifs obligatoires ("+clubSessions.length+").";return;}
    if(clubDays.some(function(d){return training.indexOf(d)<0;})){err.textContent="Ajoute les jours de tes entraînements collectifs à tes disponibilités.";return;}
    if(clubSessions.some(function(s){return !isFinite(s.estimated_km)||s.estimated_km<0||s.estimated_km>100;})){err.textContent="Vérifie les distances estimées de tes entraînements.";return;}
    var rest=[0,1,2,3,4,5,6].filter(function(d){return training.indexOf(d)<0;});
    var rawKm=$("athKm").value,rawRuns=$("athRuns").value,weeklyKm=rawKm===""?null:Number(rawKm),runs=rawRuns===""?null:Number(rawRuns);
    if(weeklyKm===null||runs===null){err.textContent="Renseigne ton volume moyen et ton nombre de sorties pour calibrer le plan.";return;}
    if((weeklyKm!==null&&(!isFinite(weeklyKm)||weeklyKm<0||weeklyKm>200))||(runs!==null&&(!isFinite(runs)||runs<0||runs>14))){err.textContent="Vérifie ton volume hebdomadaire et ton nombre de sorties.";return;}
    var hrRaw=$("athHr")?Number($("athHr").value):0, athleteProfile={discipline:$("athDiscipline").value,experience:$("athExperience").value,weekly_km:weeklyKm,runs_per_week:runs};
    if(hrRaw>=150&&hrRaw<=220)athleteProfile.hr_max=Math.round(hrRaw);
    var next={has_club:hasClub,club_name:null,club_days:clubDays,club_sessions:clubSessions,athlete_profile:athleteProfile,sessions_per_week:count,training_days:training,rest_days:rest,onboarding_completed:true};
    b.disabled=true;window.CadenzoAuth.saveTrainingPreferences(next).then(function(saved){TRAIN_PREF=saved;window.CADENZO_TRAINING_PREFS=saved;PC={};closeSheet();render(true);toast("Tes disponibilités sont enregistrées.");if(!D.races.length)setTimeout(function(){if(!SH)editRace(null);},250);}).catch(function(e){b.disabled=false;err.textContent="Enregistrement impossible : "+(e.message||"réessaie.");});
    return;
  }
  if(b.dataset.tog!=null){b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true");return;}
  if(b.dataset.pick){b.parentNode.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",x===b);}); if(SH)SH[b.parentNode.dataset.group]=b.dataset.pick; return;}
  if(b.dataset.sact)sheetAct(b.dataset.sact,b);});

document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("sheet").hidden)closeSheet();});
document.addEventListener("click",function(e){var b=e.target.closest("[data-wo]"); if(!b||!window.WORKOUT)return; e.preventDefault(); var v=b.dataset.wo.split(":"); WORKOUT.start(v[0],v[1]||null,{RENFO:RENFO,MOB:MOB,MOBS:MOBS,MOBFOR:MOBFOR,closeSheet:closeSheet});});
function showInfo(key){
  var p=key.split(":"), h="";
  if(p[0]==="renfo"){var R0=RENFO[p[1]]; h='<h2>'+esc(R0.name)+'</h2><p class="small muted">'+esc(R0.tours)+'</p>'+woBtns(p[1])+exHTML(R0.ex)+(function(){var M=mobOf(p[1]); return '<h4 style="font-family:var(--display);margin:14px 0 4px">Mobilité après la séance · '+esc(M.name)+'</h4><p class="muted small">'+esc(M.goal)+'</p>'+exHTML(M.ex);})();}
  else if(p[0]==="loops"){var r=activeRace(), pl=planOf(r), q=p[1].split("-"), s=sessByKey(P(pl,+q[0]),q[1]); if(!s)return;
    h='<h2>Où courir près de chez toi</h2><p class="small muted">Les boucles les plus proches de '+kmS(s.km)+' km'+(s.dp>=100?' et +'+s.dp+' m':'')+'.</p>'+bestLoops(s).map(loopHTML).join("")+(s.km>16.5?'<p class="small muted" style="margin-top:8px">Pour atteindre '+kmS(s.km)+' km, enchaîne deux boucles voisines, ou ajoute des allers-retours de côtes de 500 m (+73 m).</p>':'')+'<p class="muted xs" style="margin-top:8px">Distances et dénivelés tels que publiés par chaque site. Vérifie le tracé avant de partir.</p>';}
  else if(key==="guide")h='<h2>Renfo et mobilité</h2><p class="muted small">Touche un exercice pour voir le dessin en deux étapes, la position de départ, l’exécution et les erreurs à éviter.</p><h4 style="font-family:var(--display);margin:12px 0 4px">Mobilité · 6 séances</h4>'+["hanches","chevilles","ischios","genoux","dos","complet"].map(function(k){var M=MOBS[k]; return '<details><summary>'+I.leaf+' '+esc(M.name)+' · '+woMin("mob",k)+' min</summary><div class="in"><p class="muted small">'+esc(M.goal)+'</p>'+woBtns(null,0,k)+exHTML(M.ex)+'</div></details>';}).join("")+'<h4 style="font-family:var(--display);margin:14px 0 4px">Renforcement · 7 séances</h4>'+["A1","A2","B1","B2","C1","C2","D"].map(function(k){var R0=RENFO[k]; return '<details><summary>'+I.dumb+' '+esc(R0.name)+' · '+woMin("renfo",k)+' min</summary><div class="in"><p class="muted small">'+esc(R0.tours)+'</p>'+woBtns(k,1)+exHTML(R0.ex)+'</div></details>';}).join("");
  openSheet(h);
}
// ---------- montre ----------
function wktName(s,d){return s.type+" "+fmtS(d);}
function hrTxt(h){return h?h[0]+"-"+h[1]+" bpm":"";}
function durTxt(d){return d.open?"jusqu’à Tour":d.d?(d.d>=1000?kmS(d.d/1000)+" km":d.d+" m"):d.t>=60?Math.round(d.t/60)+" min":d.t+" s";}
function stepLi(x){return '<li><span>'+durTxt(x.dur)+'</span><span>'+esc(x.name)+(x.hr?' · '+hrTxt(x.hr):'')+'</span></li>';}
function wktFiles(r,pl,wk,only){var out=[]; wk.s.forEach(function(s){if(only&&s.k!==only)return; var st=FIT.wktOf(s); if(!st)return; var d=sessDate(pl,wk.n,s);
  out.push({name:FIT.slug(r.name)+"-"+iso(d)+"-"+FIT.slug(s.type)+".fit",data:FIT.encode(wktName(s,d),st)});}); return out;}
function watchSheet(w,k){
  var r=activeRace(), pl=planOf(r), wk=P(pl,w), s=sessByKey(wk,k), st=s&&FIT.wktOf(s); if(!st)return;
  var nW=wk.s.filter(function(x){return FIT.wktOf(x);}).length, d=sessDate(pl,w,s);
  var h='<h2>Envoyer à la montre</h2><p class="small muted" style="margin:-4px 0 10px">« '+esc(wktName(s,d))+' » arrive dans les entraînements de ta montre. Elle te guide étape par étape et vibre à chaque changement.</p><ul class="steps">';
  st.forEach(function(x){if(x.rep)h+='<li><span>'+x.rep+' ×</span><span>'+x.steps.map(function(y){return durTxt(y.dur)+' '+esc(y.name.toLowerCase())+(y.hr?' ('+hrTxt(y.hr)+')':'');}).join(' puis ')+'</span></li>'; else h+=stepLi(x);});
  h+='</ul><button class="btn primary" data-sact="fitone" style="margin-top:12px">'+I.down+' Télécharger la séance</button>';
  if(nW>1)h+='<button class="btn" data-sact="fitweek" style="margin-top:8px">'+I.down+' Toute la semaine '+w+' · '+nW+' séances (.zip)</button>';
  h+='<details style="margin-top:12px"><summary>'+I.help+' Copier sur la montre</summary><div class="in"><ol class="small" style="margin:0;padding-left:18px"><li>Branche la montre au Mac et ouvre OpenMTP.</li><li>Copie le fichier .fit dans <b>GARMIN/NewFiles</b> (pour la semaine, double-clique d’abord le .zip pour avoir les .fit).</li><li>Débranche : la montre importe les séances. Tu les trouves dans <b>Entraînement › Entraînements</b>. Lance la séance, puis démarre l’activité.</li></ol><p class="muted xs" style="margin:8px 0 0">Depuis l’iPhone, le fichier part dans Fichiers : il faut passer par le Mac pour le copier sur la montre. Les étapes « jusqu’à Tour » attendent un appui sur le bouton Tour.</p></div></details>';
  openSheet(h,{kind:"watch",w:w,k:k,rid:r.id});
}
function availSheet(w){
  var r=activeRace(), pl=planOf(r), wk=pl.weeks[w-1], E=D.edits[r.id]||{}, cur=wk.avail||wk.s.map(function(x){return x.dow;}), t=todayUTC();
  var h='<h2>Mes jours cette semaine</h2><p class="small muted" style="margin:-4px 0 12px">Semaine '+w+' · '+fmtS(wk.start)+' – '+fmtS(wk.start+6*DAY)+' · Choisis les jours où tu peux t’entraîner : le plan est remis à plat pour cette semaine seulement.</p><div class="avail">';
  for(var d=0;d<7;d++){var past=wk.start+d*DAY<t; h+='<button type="button" class="av" data-tog="'+d+'" aria-pressed="'+(cur.indexOf(d)>=0)+'"'+(past?' disabled':'')+'><b>'+DOWC[d]+'</b><span>'+new Date(wk.start+d*DAY).getUTCDate()+'</span></button>';}
  h+='</div><button class="btn primary" data-sact="saveavail">Appliquer à cette semaine</button>'+(E[w+"-avail"]?'<button class="btn sm" data-sact="resetavail" style="margin-top:8px;width:100%">Rétablir mes jours habituels</button>':'')+'<p class="muted xs" style="margin:10px 0 0">Les séances de club et les courses gardent leur jour. Les autres semaines ne changent pas.</p>';
  openSheet(h,{kind:"avail",rid:r.id,w:w});
}
function firstFreeDow(wk){var used={}; wk.s.forEach(function(s){used[s.dow]=1;}); for(var i=0;i<7;i++)if(!used[i])return i; return 0;}
function editSession(w,k,dow){
  var r=activeRace(), pl=planOf(r), wk=pl.weeks[w-1], s=k?sessByKey(wk,k):null, isNew=!s;
  var base=s||{dow:dow!=null?dow:firstFreeDow(wk),type:"Footing",km:6,dp:0,txt:""};
  var h='<h2>'+(isNew?"Nouvelle séance":"Modifier la séance")+'</h2><p class="small muted" style="margin:-4px 0 10px">'+esc(r.name)+' · semaine '+w+' · '+fmtS(wk.start)+' – '+fmtS(wk.start+6*DAY)+'</p>';
  var editTypes=TYPELIST.concat(TYPELIST.indexOf(base.type)<0?[base.type]:[]), selectedType=base.type;
  h+='<div class="fields"><label class="field">Jour<select id="eDow">'+DOWL.map(function(d,i){return '<option value="'+i+'"'+(i===base.dow?" selected":"")+'>'+d+' '+new Date(wk.start+i*DAY).getUTCDate()+'</option>';}).join("")+'</select></label><div class="field type-field"><span>Type</span><select id="eType" class="type-native" aria-hidden="true" tabindex="-1">'+editTypes.map(function(t){return '<option'+(t===selectedType?" selected":"")+'>'+esc(t)+'</option>';}).join("")+'</select><button type="button" class="type-trigger" id="eTypeTrigger" aria-haspopup="listbox" aria-expanded="false"><span class="type-trigger-icon">'+tico({type:selectedType})+'</span><span class="type-trigger-label">'+esc(selectedType)+'</span><span class="type-trigger-chevron">⌄</span></button><div class="type-options" id="eTypeOptions" role="listbox" aria-label="Choisir le type de séance" hidden>'+editTypes.map(function(t){return '<button type="button" class="type-option'+(t===selectedType?' is-selected':'')+'" role="option" aria-selected="'+(t===selectedType)+'" data-session-type="'+esc(t)+'"><span class="type-option-icon">'+tico({type:t})+'</span><span>'+esc(t)+'</span></button>';}).join("")+'</div></div></div>';
  h+='<div class="fields"><label class="field">Km<input id="eKm" inputmode="decimal" value="'+(base.km?kmS(base.km):"0")+'"></label><label class="field">D+ (m)<input id="eDp" inputmode="numeric" value="'+(base.dp||0)+'"></label></div>';
  h+='<button class="btn primary" data-sact="saveses">Enregistrer</button>';
  if(!isNew)h+='<div class="row" style="margin-top:8px">'+(s.edited&&!s.added?'<button class="btn sm" data-sact="restoreses">Rétablir l’original</button>':'')+'<button class="btn sm danger" data-sact="delses">Supprimer la séance</button></div>';
  h+='<p class="muted xs" style="margin:10px 0 0">Seule cette séance change. Le coach compare tes sorties à ta version.</p>';
  openSheet(h,{kind:"ses",rid:r.id,w:w,k:k||null,added:!!(s&&s.added)});
}
var pendingGpx=null;
function editRace(id){
  var r=id?raceById(id):null, isNew=!r;
  r=r||{name:"",date:"",time:"08:00",km:"",dp:"",goal:0,prio:"A",cps:[],start:nextMonday()};
  var b=!!r.builtin;
  var h='<h2>'+(isNew?"Créer ton plan":"Modifier "+esc(r.name))+'</h2>';
  if(isNew&&!D.races.length)h+='<p class="small muted" style="margin:-4px 0 14px">Renseigne ta course objectif. Ton plan sera construit selon sa date, sa distance, son dénivelé et tes propres sorties Strava.</p>';
  if(isNew&&typeof PRESETS!=="undefined")h+='<span class="eyebrow" style="margin-bottom:6px">Courses prêtes</span>'+PRESETS.map(function(p){var has=D.races.some(function(x){return x.preset===p.key;}); return '<button class="link" data-sact="preset:'+p.key+'"'+(has?' disabled style="opacity:.5"':'')+'><span class="ico">'+I.flag+'</span><span class="tx"><b>'+esc(p.name)+'</b><small>'+kmS(p.km)+' km · +'+nb(p.dp)+' m · '+esc(p.place)+(has?' · déjà ajoutée':(p.prio==="B"?' · course B':'')+(p.prof?' · trace et conseils inclus':' · sans trace'))+'</small></span><span class="chev">›</span></button>';}).join("")+'<span class="eyebrow" style="margin:14px 0 6px">Ou une autre course</span>';
  if(!b)h+='<div class="radio2" data-group="prio"><button data-pick="A" aria-pressed="'+(r.prio==="A")+'"><b>Course A · objectif</b><span>L’appli te prépare un plan jusqu’au jour J</span></button><button data-pick="B" aria-pressed="'+(r.prio==="B")+'"><b>Course B · préparation</b><span>Glissée dans le plan de ta course A</span></button></div>';
  h+='<button class="btn sm" data-sact="gpx" style="margin-bottom:10px;width:100%">'+I.up+' <span id="gpxlab">'+(r.prof||r.gpx?"Remplacer la trace GPX":"Importer la trace GPX")+'</span></button>';
  h+='<label class="field" style="margin-bottom:8px">Nom<input id="rName" value="'+esc(r.name)+'" placeholder="Trail des Calanques"'+(b?" disabled":"")+'></label>';
  h+='<div class="fields"><label class="field">Date'+(b?'<select id="rDate"><option value="2027-05-08"'+(r.date==="2027-05-08"?" selected":"")+'>sam. 8 mai 2027</option><option value="2027-05-09"'+(r.date==="2027-05-09"?" selected":"")+'>dim. 9 mai 2027</option></select>':'<input type="date" id="rDate" value="'+esc(r.date)+'">')+'</label><label class="field">Départ<input type="time" id="rTime" value="'+esc(r.time||"08:00")+'"></label></div>';
  h+='<div class="fields"><label class="field">Distance (km)<input id="rKm" inputmode="decimal" value="'+(r.km?kmS(r.km):"")+'"'+(b?" disabled":"")+'></label><label class="field">D+ (m)<input id="rDp" inputmode="numeric" value="'+(r.dp===""?"":r.dp)+'"'+(b?" disabled":"")+'></label><label class="field">Objectif<input id="rGoal" placeholder="auto" value="'+(r.goal?hmi(r.goal):"")+'"></label></div>';
  if(!b)h+='<div class="fields"><label class="field">Lieu<input id="rPlace" value="'+esc(r.place||"")+'" placeholder="facultatif"></label><label class="field">Début du plan (A)<input type="date" id="rStart" value="'+esc(r.start||"")+'"></label></div><label class="field" style="margin-bottom:10px">Ravitos ou points de passage, un par ligne : km nom<textarea id="rCps" placeholder="12 Col du Pin&#10;24,5 Village">'+esc((r.cps||[]).map(function(c){return kmS(c.km)+" "+c.n;}).join("\n"))+'</textarea></label>';
  h+='<p class="muted xs" id="gpxinfo" style="margin:0 0 10px">'+(r.prof?"Trace chargée : profil, montées et descentes calculés.":r.gpx?"Trace chargée pour le GPS.":b?"Facultatif : la trace permet au GPS du mode Course de te situer.":"Sans trace : profil plat et D+ réparti régulièrement.")+'</p>';
  h+='<button class="btn primary" data-sact="saverace">'+(isNew?"Ajouter":"Enregistrer")+'</button>';
  if(!isNew)h+='<button class="btn sm danger" data-sact="delrace" style="margin:8px auto 0">Supprimer la course</button>';
  pendingGpx=null; openSheet(h,{kind:"race",id:r.id||null,prio:r.prio,builtin:b});
}
function applyState(ns,garmin,mode,reason){
  var cur=JSON.stringify(D);
  return SAFE.snap(reason,cur).then(function(rec){
    if(!rec&&!confirm("La copie de sécurité n’a pas pu être faite sur ce téléphone. Continuer quand même ?"))return false;
    D=mode==="merge"?assignState(blank(),SAFE.merge(D,ns).state):assignState(blank(),ns);
    
    if(garmin&&(mode==="replace"||!localStorage.getItem(userKey("cadenzo-garmin")))){try{localStorage.setItem(userKey("cadenzo-garmin"),JSON.stringify(garmin));}catch(e){toast("Données Garmin trop volumineuses : non importées.");}}
    MC={}; PC={}; applyTheme(); if(!save())return false; goNow(); return true;});
}
function lastExportTxt(){var t=0; try{t=+localStorage.getItem(userKey("cadenzo-lastexport"))||0;}catch(e){} return t?"Dernier export "+ago(t)+".":"Jamais exporté.";}
function openBackups(){
  openSheet('<h2>Copies automatiques</h2><p class="small muted">Chargement…</p>',{});
  Promise.all([SAFE.list(),SAFE.persisted()]).then(function(r){var a=r[0], pe=r[1]; if(SH==null)return;
    var why={auto:"Automatique",manuel:"Manuelle","avant import":"Avant un import","avant restauration":"Avant une restauration",illisible:"Données illisibles"};
    $("sheetBody").innerHTML='<h2>Copies automatiques</h2><p class="small muted">Gardées dans ce téléphone, jamais envoyées ailleurs. Une copie est faite toutes les 6 h d’utilisation, avant chaque import et avant chaque restauration. Le navigateur peut les effacer si tu supprimes les données du site : exporte aussi un fichier de temps en temps.</p>'+
      '<p class="small muted">Stockage protégé par le navigateur : <b>'+(pe?"oui":"non")+'</b>.</p>'+
      '<div class="row"><button class="btn primary" data-sact="snapnow">Faire une copie maintenant</button></div>'+
      (a.length?'<div class="bklist">'+a.map(function(x){return '<div class="bk"><div><b>'+(why[x.reason]||esc(x.reason))+'</b><small>'+new Date(x.id).toLocaleString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})+' · '+Math.max(1,Math.round(x.size/1024))+' Ko</small></div><button class="btn ghost" data-sact="restore" data-id="'+x.id+'">Restaurer</button></div>';}).join("")+'</div>':'<p class="muted">Aucune copie pour l’instant.</p>');
  });
}
function sheetAct(a,b){
  if(!SH)return; var U=snapU();
  if(a==="gstart"){gStart();return;} if(a==="gcode"){gJoin();return;}
  if(a==="gnow"){b.disabled=true; gsync("manuel",true).then(function(){gManageSheet();});return;}
  if(a==="gshow"){$("gcodebox").hidden=false; $("gcodeta").value=CSYNC.makeCode(GS); $("gcodeta").focus(); $("gcodeta").select(); return;}
  if(a==="gcopy"){var ta=$("gcodeta"); ta.select(); try{navigator.clipboard.writeText(ta.value).then(function(){toast("Code copié.");},function(){document.execCommand("copy"); toast("Code copié.");});}catch(e){document.execCommand("copy"); toast("Code copié.");} return;}
  if(a==="gout"){if(!confirm("Déconnecter cet appareil ? Tes données restent ici et dans le dépôt GitHub."))return; GS=null; try{localStorage.removeItem(GKEY);}catch(e){} closeSheet(); toast("Appareil déconnecté."); render(true); return;}
  if(a==="impmerge"||a==="impreplace"){var im=SH.imp; if(!im)return; var mode=a==="impmerge"?"merge":"replace";
    if(mode==="replace"&&!confirm("Remplacer les données de ce téléphone par celles du fichier ?"))return;
    applyState(im.state,im.garmin,mode,"avant import").then(function(ok){ if(!ok)return; closeSheet(); toast(mode==="merge"?"Sauvegarde fusionnée.":"Sauvegarde importée."); if(im.garmin&&mode==="replace")location.reload(); else render();}); return;}
  if(a==="snapnow"){SAFE.snap("manuel",JSON.stringify(D)).then(function(r){toast(r?"Copie faite.":"Copie impossible sur ce téléphone."); openBackups();}); return;}
  if(a==="restore"){var id=+b.dataset.id; SAFE.get(id).then(function(rec){ if(!rec){toast("Copie introuvable."); return;}
      var o; try{o=JSON.parse(rec.data);}catch(e){toast("Cette copie est illisible."); return;}
      var st=o; if(o&&o.v!==3&&o.done&&o.set)st=migrate(o,blank()); var v=SAFE.validate(st); if(!v.ok){toast("Cette copie est invalide."); return;}
      if(!confirm("Revenir à la copie du "+new Date(rec.id).toLocaleString("fr-FR",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})+" ? L’état actuel est copié avant."))return;
      applyState(v.state,null,"replace","avant restauration").then(function(ok){if(ok){closeSheet(); toast("Copie restaurée."); render();}});}); return;}
  if(a==="fitone"||a==="fitweek"){var r=raceById(SH.rid), pl=planOf(r), wk=P(pl,SH.w), F=wktFiles(r,pl,wk,a==="fitone"?SH.k:null); if(!F.length)return;
    if(F.length===1)FIT.download(new Blob([F[0].data],{type:"application/octet-stream"}),F[0].name); else FIT.download(FIT.zip(F),FIT.slug(r.name)+"-semaine-"+SH.w+".zip");
    toast(F.length>1?F.length+" séances prêtes : copie-les dans GARMIN/NewFiles.":"Séance prête : copie-la dans GARMIN/NewFiles."); return;}
  if(a==="savemanual"){var km=num($("mKm").value), dp=num($("mDp").value)||0, t=parseDur($("mT").value); if(!(km>0)){toast("Indique au moins les kilomètres.");return;}
    D.actual[SH.key]={km:Math.round(km*100)/100,dp:Math.round(dp),t:Math.round(t),src:"manual"}; D.done[SH.key]=1; if(D.undone)delete D.undone[SH.key]; save(); closeSheet(); toast("Chiffres enregistrés.",U); render(true); return;}
  if(a==="delmanual"){delete D.actual[SH.key]; save(); closeSheet(); render(true); toast("Chiffres retirés.",U); return;}
  if(a==="saveavail"||a==="resetavail"){
    var ra=raceById(SH.rid), Ea=D.edits[ra.id]||(D.edits[ra.id]={}), wa=SH.w, ka=wa+"-avail";
    if(a==="resetavail")delete Ea[ka];
    else{var days=[].slice.call(document.querySelectorAll('#sheet .av[aria-pressed="true"]')).map(function(x){return +x.dataset.tog;}); if(!days.length){toast("Choisis au moins un jour.");return;} Ea[ka]={days:days};}
    save(); PC={}; closeSheet(); toast(a==="resetavail"?"Jours habituels rétablis.":"Semaine adaptée à tes jours.",U); render(true); return;}
  if(a==="saveses"||a==="delses"||a==="restoreses"){
    var r=raceById(SH.rid), E=D.edits[r.id]||(D.edits[r.id]={}), w=SH.w, ek=w+"-"+SH.k;
    if(a==="restoreses"){delete E[ek]; var mvr=E[w+"-mv"]; if(mvr){delete mvr[SH.k]; if(!Object.keys(mvr).length)delete E[w+"-mv"];} save(); closeSheet(); toast("Séance d’origine rétablie.",U); render(true); return;}
    if(a==="delses"){if(SH.added)delete E[ek]; else E[ek]={del:true}; delete D.done[sk(r,w,SH.k)]; delete D.actual[sk(r,w,SH.k)]; save(); closeSheet(); toast("Séance supprimée.",U); render(true); return;}
    var baseSess=SH.k?sessByKey(planOf(r).weeks[w-1],SH.k):null, type=$("eType").value, km=num($("eKm").value)||0, o={dow:+$("eDow").value,type:type,km:Math.round(km*10)/10,dp:Math.round(num($("eDp").value)||0),txt:baseSess&&baseSess.txt||"",tag:tagOf(type)};
    if(SH.k&&!SH.added){var keep=E[ek]; delete E[ek]; PC={}; var orig=sessByKey(planOf(r).weeks[w-1],SH.k); PC={};
      if(orig){var diff={}; ["dow","type","km","dp","txt"].forEach(function(f){if(o[f]!==orig[f])diff[f]=o[f];}); if(diff.type){diff.tag=o.tag;}
        if(diff.dow!=null){var mk=w+"-mv", MV2=Object.assign({},E[mk]||{}); var oth=planOf(r).weeks[w-1].s.filter(function(x){return x.k!==SH.k&&+x.dow===+diff.dow;})[0]; if(oth&&!oth.race&&!oth.club&&!oth.bid&&oth.type!=="Course B"&&!D.done[sk(r,w,oth.k)])MV2[oth.k]=orig.dow; MV2[SH.k]=diff.dow; E[mk]=MV2; delete diff.dow;} // même mécanisme que le glisser-déposer : les jours du profil ne l'écrasent pas
        if(Object.keys(diff).length)E[ek]=diff;} else if(keep)E[ek]=keep;}
    else E[w+"-"+(SH.k||("x"+Date.now().toString(36)))]=o;
    save(); closeSheet(); toast("Séance enregistrée.",U); render(true); return;
  }
  if(a==="gpx"){$("fileGpxRace").click(); return;}
  if(a.indexOf("preset:")===0){var pr=PRESETS.filter(function(x){return x.key===a.slice(7);})[0]; if(!pr)return;
    var nr=JSON.parse(JSON.stringify(pr)); nr.id=uid(); nr.preset=pr.key; delete nr.key; nr.prio=pr.prio||SH.prio||"A"; nr.start=nextMonday(); var nt=nr.note; delete nr.note;
    D.races.push(nr); D.focus=nr.id; if(tab==="course")CV="detail"; var ca=activeRace(); if(nr.prio==="A"&&(!ca||daysTo(ca)<0))D.active=nr.id;
    MC={}; PC={}; save(); closeSheet(); toast(nr.name+" ajoutée. "+nt); goNow(); render(true); editRace(nr.id); return;}
  if(a==="saverace"){
    var isB=SH.builtin, r0=SH.id?raceById(SH.id):null;
    var name=isB?r0.name:$("rName").value.trim(), date=$("rDate").value, time=$("rTime").value||"08:00", rkm=isB?r0.km:num($("rKm").value), rdp=isB?r0.dp:Math.round(num($("rDp").value)||0), gv=$("rGoal").value.trim(), goal=gv?Math.round(parseDur(gv)/60):0;
    if(!name){toast("Donne un nom à la course.");return;} if(!isoOk(date)){toast("Choisis la date de la course.");return;} if(!(rkm>0)){toast("Indique la distance.");return;}
    if(gv&&!(goal>10)){toast("Objectif au format h:mm, par exemple 3:30.");return;}
    var rr=r0||{id:uid()}; rr.name=name; rr.date=date; rr.time=time; rr.km=Math.round(rkm*100)/100; rr.dp=rdp; rr.goal=goal||0; rr.gm=!!goal;
    if(!isB){rr.prio=SH.prio||"A"; rr.place=$("rPlace").value.trim(); var st=$("rStart").value; rr.start=isoOk(st)?st:nextMonday();
      rr.cps=$("rCps").value.split("\n").map(function(l){var mm=/^\s*(\d+(?:[.,]\d+)?)\s*(?:km)?\s*[:\-–·]?\s*(.*)$/.exec(l); return mm?{km:num(mm[1]),n:mm[2].trim()}:null;}).filter(function(c){return c&&c.km>0&&c.km<rr.km;});}
    if(pendingGpx){rr.gpx={name:pendingGpx.name,total:pendingGpx.total,pts:scalePts(pendingGpx.pts,pendingGpx.total,rr.km)}; if(!isB&&pendingGpx.prof)rr.prof=pendingGpx.prof.map(function(p){return [Math.round(p[0]*rr.km/pendingGpx.total*100)/100,p[1]];});}
    var msg="Course mise à jour.";
    if(!r0){D.races.push(rr); D.focus=rr.id; if(tab==="course")CV="detail";
      if(rr.prio==="A"){var cur_=activeRace(); if(!cur_||daysTo(cur_)<0||(dms(rr.date)<dms(cur_.date)&&daysTo(rr)>=0)){D.active=rr.id; msg="Course ajoutée : ton plan est prêt.";} else msg="Course ajoutée. Touche « Suivre le plan » pour basculer dessus.";}
      else msg="Course B ajoutée : elle est glissée dans ton plan.";}
    MC={}; PC={}; save(); closeSheet(); toast(msg); goNow(); render(true); return;
  }
  if(a==="delrace"){
    var x=raceById(SH.id); if(!x)return; if(!confirm("Supprimer "+x.name+" ? Son plan, ses séances cochées et tes modifications seront perdus."))return;
    D.races=D.races.filter(function(y){return y.id!==x.id;}); delete D.edits[x.id]; delete D.results[x.id]; delete D.kit[x.id];
    ["done","actual","ci","adj","todo"].forEach(function(f){Object.keys(D[f]).forEach(function(k){if(k.indexOf(x.id+":")===0)delete D[f][k];});});
    if(D.race&&D.race.rid===x.id)D.race=null; if(D.active===x.id)D.active=null; if(D.focus===x.id)D.focus=null; CV="list"; activeRace(); focusRace();
    MC={}; PC={}; save(); closeSheet(); toast("Course supprimée."); goNow(); render(true);
  }
}
function manualSheet(w,k){
  var r=activeRace(), pl=planOf(r), s=sessByKey(P(pl,w),k); if(!s)return; var key=sk(r,w,k), ac=D.actual[key];
  openSheet('<h2>Mes chiffres</h2><p class="small muted" style="margin:-4px 0 10px">'+esc(s.type)+' · '+fmtL(sessDate(pl,w,s))+' · prévu '+kmS(s.km)+' km'+(s.dp?' · +'+s.dp+' m':'')+'</p><div class="fields"><label class="field">Km<input inputmode="decimal" id="mKm" value="'+(ac?kmS(ac.km):"")+'" placeholder="'+kmS(s.km)+'"></label><label class="field">D+ (m)<input inputmode="numeric" id="mDp" value="'+(ac&&ac.dp?ac.dp:"")+'" placeholder="'+(s.dp||0)+'"></label><label class="field">Durée<input id="mT" value="'+(ac&&ac.t?hmi(ac.t/60):"")+'" placeholder="1:05"></label></div><button class="btn primary" data-sact="savemanual">Enregistrer</button>'+(ac?'<button class="btn sm danger" data-sact="delmanual" style="margin:8px auto 0">Effacer mes chiffres</button>':''),{kind:"manual",key:key});
}

// ---------- thème ----------
var MQ=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
function sysDark(){return !!(MQ&&MQ.matches);}
function isDark(){return D.set.theme==="dark"||(D.set.theme==="auto"&&sysDark());}
function applyTheme(){
  if(D.set.theme==="auto")document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme",D.set.theme);
  var mt=document.querySelector('meta[name="theme-color"]'); if(mt)mt.setAttribute("content",!$("rm").hidden?"#141917":isDark()?"#141917":"#f3f4f0");
}
applyTheme();
if(MQ&&MQ.addEventListener)MQ.addEventListener("change",function(){applyTheme(); if(tab==="settings")render(true);});

// ---------- rendu ----------
function sideFoot(){var el=$("sideFoot"); if(!el)return; var nm=window.CADENZO_PROFILE_NAME||"Mon compte", ph=window.CADENZO_PROFILE_PICTURE, sy=D.sync||{};
  var st=sy.err?(sy.err==="limite Strava temporaire"?"Strava limité":"Synchro en échec"):(sy.t?"Strava à jour":"Strava connecté");
  el.innerHTML='<div class="sf-user">'+(ph?'<img src="'+esc(ph)+'" alt="" referrerpolicy="no-referrer" onerror="this.hidden=true">':'<span class="sf-ph" aria-hidden="true">'+esc(nm.charAt(0).toUpperCase())+'</span>')+'<span class="sf-tx"><b>'+esc(nm)+'</b><small><i class="'+(sy.err?"ko":"ok")+'"></i>'+esc(st)+'</small></span></div><button class="sf-out" type="button" data-account-logout aria-label="Se déconnecter">'+I.logout+'<span>Se déconnecter</span></button>';}
function render(keep){
  var y=window.scrollY, v;
  if(tab==="today")v=vToday(); else if(tab==="plan")v=vPlan(); else if(tab==="course")v=vCourse(); else if(tab==="forme")v=vForme(); else v=vSettings();
  if(tab==="today"||(tab==="forme"&&FSUB!=="garmin"))v+=syncNote();
  $("view").innerHTML=v; sideFoot();
  document.querySelectorAll("#tabs button").forEach(function(b){b.setAttribute("aria-current",b.dataset.t===tab?"page":"false");});
  if(tab==="course"){var f=focusRace(); if(f){var g=$("goal");
    if(g){g.addEventListener("input",function(){f.goal=+g.value; f.gm=true; var mm=model(f); $("goalv").textContent=hm(mm.goal); $("passwrap").innerHTML=passHTML(f,mm); $("stratwrap").innerHTML=stratHTML(mm);}); g.addEventListener("change",function(){save(); render(true);});}
    bindProfile(model(f));}}
  window.scrollTo(0,keep?y:0);
}
document.addEventListener("toggle",function(e){var d=e.target; if(d&&d.dataset&&d.dataset.fold)FOLD[d.dataset.fold]=d.open;},true);
function setTab(t){SSUB=null; if(t!=="settings")prevTab=t; if(t==="course")CV="list"; tab=t; resetArmed=false; editRes=false; if(t==="today"&&!browsing)goNow(); render(); if(t==="plan"){var ce=document.querySelector(".wk.cur"); if(ce)ce.scrollIntoView({block:"center"});}}


// ---------- Forme : volume + forme/fraîcheur (depuis toutes les sorties Strava lues) ----------
var HIST=[]; try{HIST=JSON.parse(localStorage.getItem(userKey("thp40hist"))||"[]")||[];}catch(e){HIST=[];}
var VP="week";
var HRREST=55, HRMAX=196;
function histSave(a){HIST=a; try{localStorage.setItem(userKey("thp40hist"),JSON.stringify(a));}catch(e){}}
function dayN(s){return Math.round(dms(s)/864e5);}
function weekStart(n){return n-((n+3)%7);} // n = jours depuis 1970 ; 1er janv. 1970 = jeudi
function runLoad(r){ // charge d’entraînement (TRIMP de Banister, version femme) ; sans FC : estimation
  var min=(r.t||0)/60, x=r.hr>0?Math.max(0,Math.min(1,(r.hr-HRREST)/(HRMAX-HRREST))):0.62+Math.min(r.dp||0,1500)/6000;
  if(!r.hr)min+= (r.dp||0)/12;
  return min*x*0.86*Math.exp(1.67*x);
}
function formeSeries(){
  if(!HIST.length)return null;
  var first=dayN(HIST[0].date), last=Math.round(todayUTC()/864e5), L={}, est=0;
  HIST.forEach(function(r){var d=dayN(r.date); L[d]=(L[d]||0)+runLoad(r); if(!r.hr)est++;});
  var ctl=0, atl=0, out=[], kc=1-Math.exp(-1/42), ka=1-Math.exp(-1/7);
  for(var d=first;d<=last;d++){var l=L[d]||0; ctl+=(l-ctl)*kc; atl+=(l-atl)*ka; out.push({d:d,f:ctl,a:atl,z:ctl-atl});}
  return {pts:out,est:est,n:HIST.length};
}
function pcStat(p){return p>=0?"+"+Math.round(p)+" %":"−"+Math.abs(Math.round(p))+" %";}
function periodRange(n0){ // n0 = aujourd’hui (jours) ; renvoie [début, début précédent, fin précédente]
  var d=new Date(n0*864e5), y=d.getUTCFullYear(), m=d.getUTCMonth(), st, ps, pe;
  if(VP==="week"){st=weekStart(n0); ps=st-7; pe=ps+(n0-st);}
  else if(VP==="month"){st=Math.round(Date.UTC(y,m,1)/864e5); ps=Math.round(Date.UTC(y,m-1,1)/864e5); pe=ps+(n0-st);}
  else {st=Math.round(Date.UTC(y,0,1)/864e5); ps=Math.round(Date.UTC(y-1,0,1)/864e5); pe=ps+(n0-st);}
  return [st,ps,pe];
}
function sumRuns(a,b){var o={km:0,dp:0,t:0,n:0}; HIST.forEach(function(r){var d=dayN(r.date); if(d>=a&&d<=b){o.km+=r.km;o.dp+=r.dp;o.t+=r.t;o.n++;}}); return o;}
// Forme : deux sous-onglets, Strava (sorties récentes, ci-dessous) et Garmin (export ponctuel, analyse dans garmin.js)
var FSUB="strava", GBUSY="";
// ---------- Suivi : cap vers la course, dénivelé, allures, bilans ----------
var MOREOPEN=false;
function wkSums(n0,count){ // semaines (lundi) se terminant par la semaine de n0, plus ancienne d’abord
  var w0=weekStart(n0), o=[]; for(var i=count-1;i>=0;i--){var a=w0-7*i, c=sumRuns(a,a+6); c.a=a; o.push(c);} return o;
}
function plannedLoad(pl,x){var ed=estDur(pl.m,x); if(!ed)return 0; return runLoad({t:ed,dp:x.dp||0,hr:x.tag==="q"?156:x.tag==="l"?146:140});}
function projSeries(r,full){ // forme / fatigue / fraîcheur prévues jusqu’à la veille d’une course, si tu fais le plan
  var act=activeRace(); r=r||act; if(!r||!HIST.length)return null; var S=formeSeries(); if(!S)return null;
  var today=Math.round(todayUTC()/864e5), endD=Math.round(dms(r.date)/864e5); if(endD<=today)return null;
  var L={}, pls=[]; if(act)pls.push(planOf(act)); if(r.prio==="A"&&(!act||r.id!==act.id))pls.push(planOf(r));
  pls.forEach(function(pl,ix){ if(ix>0)Object.keys(L).forEach(function(d){if(+d>=Math.round(pl.weeks[0].start/864e5))delete L[d];});
    pl.weeks.forEach(function(w0){var wk=P(pl,w0.n); wk.s.forEach(function(x){if(x.race||x.type==="Course B")return; var d=Math.round(sessDate(pl,wk.n,x)/864e5); L[d]=(L[d]||0)+plannedLoad(pl,x);});});});
  var pts=S.pts, iso0=new Date(today*864e5).toISOString().slice(0,10), ran=HIST.some(function(q){return q.date===iso0;});
  var base=pts[pts.length-1], start=today+1;
  if(!ran&&pts.length>1){base=pts[pts.length-2]; start=today;}
  // réalisme : part de la charge du plan que tu réalises vraiment (mesuré sur les jours écoulés, ramené vers 85 % quand on a peu de recul)
  var P0=pls[0], p0d=P0?Math.round(P0.weeks[0].start/864e5):today, sa=0, sp=0, n=0, d2, i2;
  if(P0&&today>p0d){ var A={}; HIST.forEach(function(q){var dd=dayN(q.date); A[dd]=(A[dd]||0)+runLoad(q);});
    var PL={}; P0.weeks.forEach(function(w0){var wk=P(P0,w0.n); wk.s.forEach(function(x){if(x.race||x.type==="Course B")return; var dd=Math.round(sessDate(P0,wk.n,x)/864e5); PL[dd]=(PL[dd]||0)+plannedLoad(P0,x);});});
    for(d2=p0d;d2<today;d2++){sp+=PL[d2]||0; sa+=A[d2]||0; n++;} }
  var ratio=sp>0?sa/sp:null, W0=n/(n+7), kk=ratio==null?0.9:Math.max(0.6,Math.min(1,ratio*W0+0.9*(1-W0))); // jamais plus que le plan : on ne projette pas plus de 100 %
  if(full)kk=1;
  var kc=1-Math.exp(-1/42), ka=1-Math.exp(-1/7), f=base.f, a=base.a, out=[];
  for(var d=start;d<=endD;d++){var l=d<endD?(L[d]||0)*(d>=today?kk:1):0; f+=(l-f)*kc; a+=(l-a)*ka; out.push({d:d,f:f,a:a,z:f-a});}
  return {pts:pts,prj:out,today:today,endD:endD,race:r,pl:pls[pls.length-1],k:kk,ratio:ratio,n:n};
}
// ---------- Projection : vue « Semaines » (barres) et vue « Fraîcheur » (courbe), avec l’export Garmin quand il est là ----------
function pjToggle(){return '<div class="wm-seg fm-sub" role="tablist" aria-label="Affichage">'+[["sem","Semaines"],["fra","Forme et fraîcheur"]].map(function(x){return '<button type="button" role="tab" data-pjv="'+x[0]+'" aria-selected="'+(PJV===x[0])+'">'+x[1]+'</button>';}).join("")+'</div>';}
function gRec(a,b){ // moyennes Garmin sur les jours n = a..b (VFC, sommeil, repos) ; null si rien
  var G=window.GARMIN&&GARMIN.data&&GARMIN.data(); if(!G)return null; var h=[],sl=[],rh=[],band=null,n,r;
  for(n=a;n<=b;n++){r=G.days[new Date(n*864e5).toISOString().slice(0,10)]; if(!r)continue; if(r.hrv>0)h.push(r.hrv); if(r.sl>0)sl.push(r.sl); if(r.rhr>0)rh.push(r.rhr); if(r.hrvb)band=r.hrvb;}
  function av(x){return x.length?x.reduce(function(u,v){return u+v;},0)/x.length:null;}
  if(!h.length&&!sl.length)return null; var o={hrv:av(h),sl:av(sl),rhr:av(rh),band:band}; o.low=!!(o.hrv&&band&&o.hrv<band[0]); o.short=!!(o.sl&&o.sl<6.5*3600); return o;
}
function garminLine(){ // une phrase sur les 7 derniers jours Garmin importés
  var G=window.GARMIN&&GARMIN.data&&GARMIN.data(); if(!G||!G.last)return ""; var ln=dayN(G.last), r=gRec(ln-6,ln); if(!r)return "";
  var old=Math.round(todayUTC()/864e5)-ln, bits=[];
  if(r.hrv)bits.push("VFC "+Math.round(r.hrv)+(r.band?" ("+r.band[0]+"–"+r.band[1]+")":""));
  if(r.sl)bits.push("sommeil "+Math.floor(r.sl/3600)+" h "+String(Math.round(r.sl%3600/60)).padStart(2,"0"));
  if(r.rhr)bits.push("FC repos "+Math.round(r.rhr));
  var warn=r.low?"VFC basse : fraîcheur probablement plus basse.":r.short?"Sommeil court : ménage-toi.":"";
  return '<p class="small" style="margin:10px 0 0"><b>Garmin</b> · '+bits.join(" · ")+(warn?' — '+warn:'')+(old>9?' <span class="muted">(export ancien)</span>':'')+'</p>';
}
var PHO={"Base":.14,"Construction":.3,"Spécifique":.5,"Affûtage":.9};
function semBody(P2,isA){
  var pl=P2.pl, today=P2.today, ws=pl.weeks, W=340,H=190,l0=6,r0=6,pt=24,pb=56, nw=ws.length, bw=(W-l0-r0)/nw, rows=[], mx=1, curI=-1, sa=0, sp=0, np=0, hasG=false;
  ws.forEach(function(w0,i){var wk=P(pl,w0.n), s0=Math.round(w0.start/864e5), c=sumRuns(s0,s0+6), a=c.km+c.dp/100, p=wk.km+wk.dp/100, st=s0+6<today?"past":s0<=today?"cur":"fut", gr=st==="fut"?null:gRec(s0,s0+6);
    if(st==="cur")curI=i; if(st==="past"){sa+=a;sp+=p;np++;} if(gr)hasG=true; mx=Math.max(mx,a,p); rows.push({n:w0.n,s:s0,a:a,p:p,km:wk.km,dp:wk.dp,ph:wk.ph,st:st,g:gr});});
  var pk=rows.reduce(function(m,q){return q.p>m.p?q:m;},rows[0]), ratio=sp>0?sa/sp:null, vd;
  if(today<rows[0].s)vd=["off","Le plan n’a pas démarré","Début le "+fmtD(rows[0].s*864e5)+"."];
  else if(ratio==null)vd=["off","Première semaine en cours","Verdict dès la fin de la semaine."];
  else{var tx=Math.round(ratio*100)+" % du prévu ("+np+" sem. terminée"+(np>1?"s":"")+")"; vd=ratio>=1.08?["ok","Au-dessus du plan",tx]:ratio>=.85?["ok","Dans le plan",tx]:["warn","En retard sur le plan",tx+". Reprends le plan là où il en est."];}
  var Y=function(v){return pt+(H-pt-pb)*(1-v/(mx*1.08));}, base=H-pb;
  var g='<svg viewBox="0 0 '+W+' '+H+'" class="fm-svg" role="img" aria-label="Charge de chaque semaine du plan : ce que tu as fait contre ce qui est prévu, jusqu’à la course.">';
  rows.forEach(function(q,i){var x=l0+i*bw+1.2, w=bw-2.4;
    g+='<rect x="'+x.toFixed(1)+'" y="'+Y(q.p).toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+(base-Y(q.p)).toFixed(1)+'" rx="2.5" '+(q.st==="past"?'fill="none" stroke="var(--brand)" stroke-width="1.2" stroke-dasharray="2 2"':'fill="var(--brand)" fill-opacity=".18"')+'/>';
    if(q.st!=="fut"&&q.a>0)g+='<rect x="'+x.toFixed(1)+'" y="'+Y(q.a).toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+(base-Y(q.a)).toFixed(1)+'" rx="2.5" fill="var(--brand)"/>';
    if(q.g)g+='<circle cx="'+(x+w/2).toFixed(1)+'" cy="'+(base+9)+'" r="3.2" fill="'+(q.g.low||q.g.short?"var(--acc)":"var(--brand)")+'"/>';});
  if(curI>=0){var xc=l0+curI*bw; g+='<rect x="'+(xc-.5).toFixed(1)+'" y="'+(pt-6)+'" width="'+(bw+1).toFixed(1)+'" height="'+(base-pt+6)+'" rx="4" fill="none" stroke="var(--acc)" stroke-width="1.6"/><text x="'+Math.min(W-34,Math.max(34,xc+bw/2)).toFixed(1)+'" y="11" text-anchor="middle" font-size="10" font-weight="700" style="fill:var(--acc-ink)">Aujourd’hui</text>';}
  g+='<line x1="'+l0+'" x2="'+(W-r0)+'" y1="'+base+'" y2="'+base+'" stroke="var(--line)"/>';
  var segs=[]; rows.forEach(function(q,i){if(segs.length&&segs[segs.length-1].ph===q.ph)segs[segs.length-1].e=i+1; else segs.push({ph:q.ph,s:i,e:i+1});});
  segs.forEach(function(sg){var x1=l0+sg.s*bw+1, x2=l0+sg.e*bw-1, ph0=base+18; g+='<rect x="'+x1.toFixed(1)+'" y="'+ph0+'" width="'+(x2-x1).toFixed(1)+'" height="15" rx="4" fill="var(--brand)" opacity="'+(PHO[sg.ph]||.2)+'"/>';
    if(x2-x1>40)g+='<text x="'+((x1+x2)/2).toFixed(1)+'" y="'+(ph0+11)+'" text-anchor="middle" font-size="9" font-weight="700" style="fill:'+(sg.ph==="Affûtage"?"var(--card,#fff)":"var(--ink)")+'">'+esc(sg.ph)+'</text>';});
  var ip=rows.indexOf(pk); g+='<text x="'+(l0+ip*bw+bw/2).toFixed(1)+'" y="'+(Y(pk.p)-5).toFixed(1)+'" text-anchor="middle" font-size="9.5" font-weight="700" style="fill:var(--brand)">pic</text>';
  g+='<text x="'+l0+'" y="'+(H-3)+'" font-size="9.5" style="fill:var(--muted)">'+fmtD(rows[0].s*864e5)+'</text><text x="'+(W-r0)+'" y="'+(H-3)+'" text-anchor="end" font-size="9.5" font-weight="700" style="fill:var(--acc-ink)">⚑ '+fmtD(dms(P2.race.date))+'</text></svg>';
  var h='<div class="chip '+vd[0]+'">'+vd[1]+'</div><p class="small" style="margin:8px 0 10px">'+vd[2]+'</p>'+g;
  h+='<div class="pj-key small"><div><i class="k-f" style="background:var(--brand);opacity:1"></i><p>Fait</p></div><div><i class="k-f" style="border:1.4px dashed var(--brand);background:none;opacity:1"></i><p>Prévu, semaine passée</p></div><div><i class="k-f" style="background:var(--brand);opacity:.25"></i><p>À venir</p></div>'+(hasG?'<div><i class="k-f" style="background:var(--acc);opacity:1;width:10px;border-radius:50%"></i><p>VFC ou sommeil bas</p></div>':'')+'</div>'+garminLine();
  return h;
}
// Forme / fatigue / fraîcheur (Banister) : contenu de l’onglet « Forme et fraîcheur » de la projection,
// ou carte seule quand aucune course à venir n’a de projection.
function fitBody(card){
  var h="";
  var S=formeSeries(), pts=S.pts, z=pts[pts.length-1], N=Math.min(pts.length,60), view=pts.slice(pts.length-N);
  var st=z.z>15?["Très frais","ok","Tu es reposée : bon moment pour une séance de qualité ou une course."]:z.z>5?["Frais","ok","Tu récupères bien, tu peux charger un peu."]:z.z>=-10?["Équilibré","ok","Charge et récupération sont en phase."]:z.z>=-25?["Chargée","warn","Tu accumules de la fatigue : garde les séances faciles vraiment faciles."]:["Surcharge","bad","Fatigue très élevée : allège les prochains jours."];
  h+='<div class="card fm"><h2>Forme et fraîcheur</h2><div class="fm-top num"><div><span>Forme</span><b style="color:var(--brand)">'+Math.round(z.f)+'</b></div><div><span>Fatigue</span><b style="color:var(--acc-ink)">'+Math.round(z.a)+'</b></div><div><span>Fraîcheur</span><b style="color:var(--down)">'+(z.z>=0?"+":"−")+Math.abs(Math.round(z.z))+'</b></div></div>'+
    '<div class="chip '+st[1]+'">'+st[0]+'</div><p class="small" style="margin:8px 0 8px">'+st[2]+'</p>'+formeSynth(z,pts);
  var W=320, H=150, pl=30, pr=8, pt=8, pb=20, lo=0, hi=0; view.forEach(function(q){lo=Math.min(lo,q.z);hi=Math.max(hi,q.f,q.a,q.z);});
  var span=hi-lo||1; lo-=span*.06; hi+=span*.06; span=hi-lo;
  function X(k){return pl+(W-pl-pr)*k/Math.max(1,N-1);} function Y(v){return pt+(H-pt-pb)*(1-(v-lo)/span);}
  function path(f){return view.map(function(q,k){return (k?"L":"M")+X(k).toFixed(1)+" "+Y(q[f]).toFixed(1);}).join("");}
  var g='<svg viewBox="0 0 '+W+' '+H+'" class="fm-svg" role="img" aria-label="Courbes de forme, fatigue et fraîcheur sur '+N+' jours">';
  var step=Math.max(10,Math.ceil(span/4/10)*10), t0=Math.ceil(lo/step)*step;
  for(var tv=t0;tv<=hi;tv+=step)g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(tv).toFixed(1)+'" y2="'+Y(tv).toFixed(1)+'" stroke="var(--line)" stroke-width="'+(tv===0?1.4:.6)+'"'+(tv===0?' stroke-dasharray="2 3"':'')+'/><text x="'+(pl-5)+'" y="'+(Y(tv)+3).toFixed(1)+'" text-anchor="end" font-size="9" fill="var(--muted)">'+tv+'</text>';
  g+='<path d="'+path("f")+'" fill="none" stroke="var(--brand)" stroke-width="2.2" stroke-linejoin="round"/><path d="'+path("a")+'" fill="none" stroke="var(--acc)" stroke-width="1.8" stroke-dasharray="5 3"/><path d="'+path("z")+'" fill="none" stroke="var(--down)" stroke-width="1.8"/>';
  [0,Math.floor((N-1)/2),N-1].forEach(function(k,j){var dd=new Date(view[k].d*864e5); g+='<text x="'+X(k).toFixed(1)+'" y="'+(H-5)+'" text-anchor="'+(j===0?"start":j===2?"end":"middle")+'" font-size="9" fill="var(--muted)">'+dd.getUTCDate()+" "+MON[dd.getUTCMonth()]+'</text>';});
  h+=g+'</svg><p class="small muted" style="margin:8px 0 0"><i class="wm-key" style="background:var(--brand);margin-left:0"></i>forme <i class="wm-key" style="background:var(--acc);margin-left:10px"></i>fatigue <i class="wm-key" style="background:var(--down);margin-left:10px"></i>fraîcheur</p>'+
    '<p class="small muted" style="margin:8px 0 0">Calcul estimé à partir de la durée et de la fréquence cardiaque de tes sorties (formule de Banister, 42 j / 7 j)'+(S.est?' ; '+S.est+' sortie'+(S.est>1?'s':'')+' sans fréquence cardiaque estimée'+(S.est>1?'s':'')+' d’après la durée et le D+':'')+'. Ce n’est pas la valeur Strava ni Garmin.</p></div>';
  return card?h:h.replace('<div class="card fm"><h2>Forme et fraîcheur</h2>',"").replace(/<\/div>$/,""); // dans la projection : sans carte ni titre
}
function capCard(r,tabs){
  var P2=projSeries(r); if(!P2||!P2.prj.length)return "";
  var pts=P2.pts, prj=P2.prj, last=pts[pts.length-1], end=prj[prj.length-2]||prj[prj.length-1], // état le matin de la course = après la charge de la veille
   pk=prj.reduce(function(m,q){return q.f>m.f?q:m;},prj[0]);
  var days=P2.endD-P2.today; if(pk.f<last.f)pk=last;
  var isA=P2.race.prio==="A", rz=end.f>0?end.z/end.f:0, m0=model(P2.race), verdict=!isA?(end.z>=-10?["ok","Jambes correctes","Course de préparation : pas d’affûtage prévu, tu y arrives avec "+(end.z>=5?"de la fraîcheur.":"un peu de fatigue, c’est normal.")]:["warn","Jambes chargées","Tu y arrives fatiguée : cours-la tranquille, c’est une course de préparation."]):rz>=.08&&rz<=.3?["ok","Dans la cible","Tu arriverais reposée et en forme : c’est l’objectif de l’affûtage."]:rz<.08?["warn","Pas assez reposée","Le plan te laisse encore de la fatigue le jour J : l’affûtage devra être plus net."]:["warn","Très reposée","Tu risques de perdre un peu de forme : garde quelques séances vives pendant l’affûtage."];
  var h='<div class="card fm">'+(tabs?'<h2>Projection vers tes courses</h2>'+tabs:'<h2>'+esc(P2.race.name)+'</h2>')+'';
  h+=pjToggle(); return h+(PJV==='sem'?semBody(P2,isA):fitBody(false))+'</div>';
}
function dpCard(){
  var r=activeRace(), n0=Math.round(todayUTC()/864e5), W=wkSums(n0,12), cur=W[W.length-1], mx=1, rk=r&&r.km>0?r.dp/r.km:0;
  W.forEach(function(x){mx=Math.max(mx,x.dp);});
  var last4=W.slice(-4), k4=0,d4=0; last4.forEach(function(x){k4+=x.km;d4+=x.dp;}); var den=k4>0?d4/k4:0;
  var rec=W.reduce(function(m,x){return x.dp>m.dp?x:m;},W[0]), rd=new Date(rec.a*864e5);
  var msg=!rk?"":den<rk*0.6?"Tu t’entraînes sur un terrain nettement plus plat que ta course : ajoute du dénivelé sur ta sortie longue.":den<rk*0.85?"Tu t’approches du profil de ta course : continue à monter sur les sorties longues.":"Ton dénivelé par kilomètre est à la hauteur de ta course.";
  var h='<details class="card fold"><summary><h2>Dénivelé</h2><span class="num">+'+nb(cur.dp)+' m cette sem.</span></summary><div class="fm-tiles num"><div><span>Cette semaine</span><b>+'+nb(cur.dp)+'<small> m</small></b></div><div><span>D+ par km · 4 sem.</span><b>'+Math.round(den)+'<small> m/km</small></b></div><div><span>'+(r?esc(r.name):"Course")+'</span><b>'+(rk?Math.round(rk):"–")+'<small> m/km</small></b></div></div>';
  h+='<p class="small" style="margin:10px 0 6px">'+msg+'</p><p class="small muted num" style="margin:0 0 6px">D+ par semaine · max '+nb(mx)+' m (semaine du '+rd.getUTCDate()+"/"+(rd.getUTCMonth()+1)+')</p><div class="wm-bars fm-bars" style="grid-template-columns:repeat(12,1fr)" role="img" aria-label="Dénivelé par semaine">';
  W.forEach(function(x,k){var dd=new Date(x.a*864e5); h+='<div class="wm-col'+(k===11?" today":"")+'"><div class="wm-plot">'+(x.dp?'<i class="a" style="height:'+Math.max(4,x.dp/mx*100)+'%"></i>':'<i class="rest"></i>')+'</div><b class="fm-l">'+((k%3===0||k===11)?dd.getUTCDate()+"/"+(dd.getUTCMonth()+1):"")+'</b></div>';});
  return h+'</div><p class="small muted" style="margin:10px 0 0">La descente n’est pas mesurée à part : sur des boucles, elle est à peu près égale au D+. Le temps passé en côte n’est pas disponible dans les données lues.</p></details>';
}
function paceCard(){ // allure en endurance à fréquence cardiaque comparable, mois par mois
  var M={}; HIST.forEach(function(q){ if(!(q.hr>=125&&q.hr<=155)||q.km<5||q.dp/q.km>28||!q.t)return; var k=q.date.slice(0,7); (M[k]||(M[k]={k:k,n:0,km:0,t:0,h:0}));
    var o=M[k]; o.n++; o.km+=q.km; o.t+=q.t; o.h+=q.hr*q.km;});
  var ks=Object.keys(M).sort().slice(-6).map(function(k){var o=M[k]; return {k:k,n:o.n,pace:o.t/o.km,hr:o.h/o.km};}).filter(function(o){return o.n>=2;});
  var h='<details class="card fold"><summary><h2>Allure en endurance</h2><span class="num">'+(ks.length>1?mmss(ks[ks.length-1].pace)+' /km':'à venir')+'</span></summary><p class="small muted" style="margin:2px 0 8px">Sorties de 5 km et plus, assez plates, à 125–155 bpm : le meilleur signe de progrès.</p>';
  if(ks.length<2)return h+'<p class="small" style="margin:0">Il faut au moins 2 sorties de ce type sur 2 mois différents pour voir ta progression.</p></details>';
  var c=ks[ks.length-1], p=ks[ks.length-2], eq=p.pace*(c.hr/p.hr), diff=eq-c.pace; // >0 : plus rapide à même FC
  h+='<table class="rtab num"><thead><tr><th>Mois</th><th>Allure</th><th>FC</th><th>Sorties</th></tr></thead><tbody>'+ks.slice().reverse().map(function(o){var d=new Date(o.k+"-01T00:00:00Z"); return '<tr><td>'+MON[d.getUTCMonth()]+'</td><td>'+mmss(o.pace)+' /km</td><td>'+Math.round(o.hr)+' bpm</td><td>'+o.n+'</td></tr>';}).join("")+'</tbody></table>';
  var a=Math.abs(Math.round(diff)), txt=a<=2?"À fréquence cardiaque comparable, ton allure est stable par rapport au mois précédent.":diff>0?"À fréquence cardiaque comparable, tu cours environ <b>"+a+" s/km plus vite</b> que le mois précédent.":"À fréquence cardiaque comparable, tu cours environ <b>"+a+" s/km plus lentement</b> que le mois précédent : fatigue, chaleur ou terrain plus dur peuvent l’expliquer.";
  return h+'<p class="small" style="margin:10px 0 0">'+txt+'</p><p class="small muted" style="margin:6px 0 0">Estimation : la vitesse est corrigée de l’écart de fréquence cardiaque moyenne entre les deux mois.</p></details>';
}
function pvBars(pl,x,ac){ // prévu contre réalisé, en une seconde
  if(x.type&&x.type.indexOf("Club")===0)return ""; // séance du club : rien à comparer avec le plan
  var ed=estDur(pl.m,x), pp=x.km&&ed?ed/x.km:0, ap=ac.t&&ac.km?ac.t/ac.km:0, R=[];
  function row(l,r,txt,noPlan){var w=Math.max(2,Math.min(150,r*100)); return '<div class="pv"><span>'+l+'</span><div class="tr"><i style="width:'+(w/1.5)+'%"></i>'+(noPlan?'':'<u style="left:'+(100/1.5)+'%"></u>')+'</div><b class="num">'+txt+'</b></div>';}
  if(x.km>0)R.push(row("Distance",ac.km/x.km,Math.round(ac.km/x.km*100)+" %"));
  if(x.dp>0)R.push(row("Dénivelé",(ac.dp||0)/x.dp,Math.round((ac.dp||0)/x.dp*100)+" %")); else if(ac.dp>150)R.push(row("Dénivelé",1.5,"+"+nb(ac.dp)+" m",true)); // rien de prévu : pas de trait
  if(pp&&ap){var rr=pp/ap; R.push(row("Allure",rr,mmss(ap)+" /km"));}
  return R.length?'<details class="pvs" open><summary class="small muted" style="cursor:pointer;min-height:32px;list-style:none">Prévu contre réalisé</summary>'+R.join("")+'<p class="small muted" style="margin:2px 0 0">Le trait marque le prévu (100 %).</p></details>':"";
}
function weekEndCard(r,pl,ti){
  var w=nowWeek(pl), td=ti-(w-1)*7, hr=new Date().getHours(), tw=(td===0&&w>1)?w-1:0; if(!tw)return "";
  var wk=P(pl,tw), t=weekTot(r,wk,6), dn=weekDone(r,wk), ns=nSess(wk), pc=t.pk>0?Math.round(t.ak/t.pk*100):0;
  var badge=t.pk<=0?null:pc>=90&&pc<=115?["ok","Semaine réussie"]:pc>115?["warn","Semaine chargée"]:pc>=75?["warn","Un peu en dessous"]:["off","Semaine allégée"];
  var h='<div class="card week-end-card"><div class="verdict"><h2>Bilan de ta semaine '+tw+'</h2>'+(badge?'<span class="chip '+badge[0]+'">'+badge[1]+'</span>':'')+'</div><div class="stats num"><div class="stat"><b>'+kmS(Math.round(t.ak*10)/10)+'</b><span>km<i class=\"pvu\">prévu <i class=\"nw\">'+kmS(Math.round(t.pk*10)/10)+'</i></i></span></div><div class="stat"><b>+'+nb(t.ad)+'</b><span>m<i class=\"pvu\">prévu <i class=\"nw\">'+nb(t.pd)+'</i></i></span></div><div class="stat"><b>'+dn+'/'+ns+'</b><span>séances faites</span></div></div>';
  try{var S=formeSeries(); if(S&&S.pts.length>8){var q=S.pts[S.pts.length-1], q0=S.pts[S.pts.length-8], df=Math.round(q.f-q0.f), dz=Math.round(q.z);
    h+='<p class="small" style="margin:10px 0 0">'+(Math.abs(df)<1?'Forme stable sur la semaine':'Forme '+(df>0?'+':'−')+Math.abs(df)+' sur la semaine')+' · fraîcheur '+(dz>=0?'+':'−')+Math.abs(dz)+'.</p>';}}catch(e){}
  var nx=tw<pl.n?P(pl,tw+1):null;
  if(nx){var key=nx.s.filter(function(x){return !x.race&&x.km>0&&(x.tag==="q"||x.tag==="l");}).map(function(x){return DOWL[x.dow]+" : "+esc(x.type.toLowerCase())+" "+kmS(x.km)+" km";});
    h+='<h3 class="sub" style="margin:14px 0 4px">Semaine prochaine · '+esc(nx.ph)+'</h3><p class="small" style="margin:0 0 4px">'+kmS(nx.km)+' km · +'+nb(nx.dp)+' m prévus.'+(key.length?' À retenir : '+key.join(" ; ")+'.':'')+'</p>';
    var a=null; try{a=adjFor(pl,tw+1);}catch(e){} if(a)h+='<p class="small" style="margin:6px 0 0"><b>Le coach :</b> '+esc(a.lead+" "+a.prop)+'</p>';}
  return h+'</div>';
}
document.addEventListener("toggle",function(e){var t=e.target; if(t&&t.classList&&t.classList.contains("more"))MOREOPEN=t.open;},true);
function vForme(){
  var h=header("Ton suivi","Forme")+'<div class="wm-seg fm-sub" role="tablist" aria-label="Source">'+
    [["strava","Strava"],["garmin","Garmin"]].map(function(x){return '<button role="tab" data-fsub="'+x[0]+'" aria-selected="'+(FSUB===x[0])+'">'+x[1]+'</button>';}).join("")+'</div>';
  if(FSUB==="garmin"){var r=activeRace(); return h+(window.GARMIN?GARMIN.html({busy:GBUSY,race:r?{name:r.name,km:+r.km||0,dp:+r.dp||0,goal:goalOf(r)}:null}):'<div class="card"><p class="small muted" style="margin:0">Module Garmin non chargé : recharge la page.</p></div>');}
  return h+vFormeStrava();
}
// Synthèse en clair : traduit forme / fatigue / fraîcheur en une phrase et une consigne liée à la prochaine séance du plan.
function formeSynth(z,pts){
  var d7=pts.length>7?Math.round(z.z-pts[pts.length-8].z):0, r=activeRace(), pl=r&&planOf(r), ns=null, nm="", dj=null;
  if(pl){var ti=planIdx(pl); if(ti>=0&&ti<pl.n*7){var cw=nowWeek(pl), wk=P(pl,cw), td=ti%7; wk.s.slice().sort(function(a,b){return a.dow-b.dow;}).forEach(function(x){if(!ns&&x.dow>=td&&!x.race&&x.km>0&&!D.done[sk(r,cw,x.k)]&&!D.actual[sk(r,cw,x.k)])ns=x;}); if(ns)nm=(ns.dow===td?"aujourd’hui":DOWL[ns.dow])+", "+ns.type.split(" · ")[0].toLowerCase()+" de "+kmS(ns.km)+" km";} dj=daysTo(r);}
  var hard=ns&&ns.tag==="q", reco;
  if(dj!==null&&dj>=0&&dj<=7)reco="Course dans "+dj+" jour"+(dj>1?"s":"")+" : ne cherche plus à gagner en forme, garde les jambes fraîches.";
  else if(z.z<-25)reco=(ns?"Pour "+nm+" : ":"")+"fais-la en footing très facile de 30 à 40 min, ou repose-toi. Reprends les séances dures quand la fraîcheur repasse au-dessus de −10.";
  else if(z.z<-10)reco=(ns?"Pour "+nm+" : ":"")+"reste à l’allure facile (zone 2), sans rallonger. Dors un peu plus.";
  else if(z.z<=5)reco=ns?"Prochaine séance, "+nm+" : fais-la comme prévu.":"Rien à changer : continue comme prévu.";
  else reco=ns&&hard?"Bon moment, "+nm+" : tu peux la faire à fond, sans la raccourcir.":ns?"Tu es fraîche : "+nm+", tu peux la faire en entier, sans la raccourcir.":"Tu es fraîche : si tu en as envie, c’est le moment d’une séance de qualité.";
  var tr=d7>=8?"Ta fraîcheur a gagné "+d7+" points en 7 jours.":d7<=-8?"Ta fraîcheur a perdu "+Math.abs(d7)+" points en 7 jours.":"Ta fraîcheur est stable sur 7 jours.";
  return '<div class="synth"><b>En clair</b><p class="small" style="margin:4px 0 0">'+tr+' <b>À faire :</b> '+esc(reco)+'</p><details style="margin-top:6px"><summary class="small">C’est quoi ces chiffres ?</summary><div class="in"><p class="small muted" style="margin:6px 0 0"><b>Forme</b> : ce que tes dernières semaines ont construit. <b>Fatigue</b> : ce que tu as accumulé ces derniers jours. <b>Fraîcheur</b> = forme − fatigue : positive, tu es reposée ; très négative, il faut lever le pied.</p></div></details></div>';
}
var PJ="", PJV="sem";
function projBlock(){
  var up=races().filter(function(r){return daysTo(r)>0&&projSeries(r);});
  if(!up.length)return "";
  if(!up.some(function(r){return r.id===PJ;}))PJ=up[0].id;
  var tabs='<div class="pj-tabs" role="tablist" aria-label="Course">'+up.map(function(r){return '<button type="button" role="tab" data-pj="'+r.id+'" aria-selected="'+(r.id===PJ)+'"><span class="tg">'+r.prio+'</span>'+esc(r.name)+'</button>';}).join("")+'</div>';
  return capCard(raceById(PJ),tabs);
}
function vFormeStrava(){
  var h="", n0=Math.round(todayUTC()/864e5);
  if(!HIST.length){
    return h+'<div class="card"><h2>Pas encore de sorties</h2><p class="small muted" style="margin:0">Ouvre l’onglet Aujourd’hui et lance « Synchroniser Strava » pour charger ton historique. Ce suivi se remplit ensuite tout seul.</p></div>';
  }
  var R=periodRange(n0), c=sumRuns(R[0],n0), p=sumRuns(R[1],R[2]);
  var pace=c.km>0?c.t/c.km:0, vs=p.km>0?(c.km-p.km)/p.km*100:null;
  h+='<div class="card wm"><div class="wm-top"><h2>Volume</h2><div class="wm-seg" role="group" aria-label="Période">'+
    [["week","Semaine"],["month","Mois"],["year","Année"]].map(function(x){return '<button data-vp="'+x[0]+'" aria-pressed="'+(VP===x[0])+'">'+x[1]+'</button>';}).join("")+'</div></div>';
  var T=[[kmS(Math.round(c.km*10)/10)+'<small> km</small>',"Distance"],[String(c.n),"Sorties"],[c.t?dur(c.t):"–","Temps"],["+"+nb(c.dp)+'<small> m</small>',"D+"],
    [pace?Math.floor(pace/60)+"’"+pz(Math.round(pace%60))+'<small> /km</small>':"–","Allure moy."],[vs==null?"–":pcStat(vs),"Vs période préc."]];
  h+='<div class="fm-tiles num">'+T.map(function(x){return '<div><span>'+x[1]+'</span><b>'+x[0]+'</b></div>';}).join("")+'</div>';
  // histogramme
  var B=[], i, mx=1, title;
  if(VP==="year"){title="Kilomètres par mois"; var d0=new Date(n0*864e5), y=d0.getUTCFullYear(), m=d0.getUTCMonth();
    for(i=11;i>=0;i--){var a=Math.round(Date.UTC(y,m-i,1)/864e5), b=Math.round(Date.UTC(y,m-i+1,1)/864e5)-1, o=sumRuns(a,b); B.push({v:o.km,l:MON[new Date(a*864e5).getUTCMonth()].slice(0,1).toUpperCase(),cur:i===0});}}
  else {title="Kilomètres par semaine"; var w0=weekStart(n0);
    for(i=11;i>=0;i--){var a2=w0-7*i, o2=sumRuns(a2,a2+6), dd=new Date(a2*864e5); B.push({v:o2.km,l:dd.getUTCDate()+"/"+(dd.getUTCMonth()+1),cur:i===0});}}
  B.forEach(function(x){mx=Math.max(mx,x.v);});
  h+='<h3 class="sub" style="margin:16px 0 2px">'+title+'</h3><p class="small muted num" style="margin:0 0 6px">max '+kmS(Math.round(mx))+' km</p><div class="wm-bars fm-bars" style="grid-template-columns:repeat('+B.length+',1fr)" role="img" aria-label="'+title+'">';
  B.forEach(function(x,k){h+='<div class="wm-col'+(x.cur?" today":"")+'"><div class="wm-plot">'+(x.v?'<i class="a" style="height:'+Math.max(4,x.v/mx*100)+'%"></i>':'<i class="rest"></i>')+'</div><b class="fm-l">'+((VP==="year"||k%3===0||x.cur)?x.l:"")+'</b></div>';});
  h+='</div></div>';
  var hv=h; h="";
  var pj=projBlock();
  return hv+(pj||fitBody(true))+dpCard();
}

// ---------- interactions ----------
// barre d’onglets : un peu plus petite quand on descend, normale quand on remonte
(function(){var nav=$("tabs"), last=window.scrollY||0;
  function mini(on){nav.classList.toggle("mini",on);}
  window.addEventListener("scroll",function(){var y=window.scrollY||0, d=y-last; if(y<40)mini(false); else if(d>8)mini(true); else if(d<-8)mini(false); if(Math.abs(d)>8||y<40)last=y;},{passive:true});
})();
$("tabs").addEventListener("click",function(e){var b=e.target.closest("button[data-t]"); if(!b)return; if(b.dataset.t==="today")browsing=false; setTab(b.dataset.t);});
$("view").addEventListener("click",function(e){
  var swi=e.target.closest("[data-sw]"); if(swi){toggleSw(swi.dataset.sw); return;}
  var b=e.target.closest("button"); if(!b)return; var ds=b.dataset;
  if(ds.ctt){CTS.open=!CTS.open; ctSave(); render(true); return;}
  if(ds.ctn){var cl=cotesList();CTS.off=cl&&cl.items&&cl.items.length?(CTS.off+1)%cl.items.length:0;ctSave();render(true);return;}

  if(ds.ctq){
    if(ds.ctq==="open"){CTS.fix=true;render(true);return;}
    if(ds.ctq==="gps"){CTS.fix=false;CTS.pos=null;ctLocate();return;}
    var q=($("ctq")&&$("ctq").value||"").trim(); if(q.length<2){toast("Écris une ville ou un lieu.");return;}
    toast("Recherche du lieu…");
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+encodeURIComponent(q),{headers:{"Accept-Language":"fr"}}).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){
      var p=j&&j[0]; if(!p||!Number.isFinite(+p.lat)||!Number.isFinite(+p.lon)){toast("Lieu introuvable. Essaie un nom de ville.");return;}
      CTS.fix=false;CTS.pos={la:+p.lat,ln:+p.lon,t:Date.now(),a:0,manual:true};CTS.l="";CTS.city="";ctSave();ctHere();
    }).catch(function(){toast("Recherche impossible. Réessaie.");});
    return;}
  if(ds.ctg){ctLocate(); return;}
  if(ds.trpg){TRPG+=+ds.trpg; render(true); return;}
  if(ds.tro!==undefined){openTro(ds.tro); return;}
  if(ds.seg){segSheet(ds.seg); return;}
  if(ds.ssub!==undefined){if(ds.ssub==="trophees"){openTro("");return;} SSUB=ds.ssub||null; render(); window.scrollTo(0,0); return;}
  if(ds.go){if(ds.go==="settings"){prevTab=tab;tab="settings";SSUB=null;render();} else if(ds.go==="back")setTab(prevTab||"today"); else if(ds.go==="today-race"){browsing=false;setTab("today");} else setTab(ds.go); return;}
  if(ds.prefopen){openTrainingPrefs(false);return;}
  if(ds.theme){D.set.theme=ds.theme; applyTheme(); save(); render(true); return;}
  if(ds.wm){WM=ds.wm; render(true); return;}
  if(ds.vp){VP=ds.vp; render(true); return;}
  if(ds.fsub){FSUB=ds.fsub; render(true); return;}
  if(ds.pj){PJ=ds.pj; render(true); return;}
  if(ds.pjv){PJV=ds.pjv; render(true); return;}
  if(ds.day!=null){sel=+ds.day; render(true); return;}
  if(ds.done){var U0=snapU(), was=!!D.done[ds.done]; D.undone=D.undone||{}; if(D.done[ds.done]){delete D.done[ds.done]; D.undone[ds.done]=1;} else{D.done[ds.done]=1; delete D.undone[ds.done]; vib(30);} save(); render(true); toast(was?"Séance décochée.":"Séance validée.",U0); return;}
  if(ds.ci){var r=activeRace(), kk=r.id+":"+cur, U2=snapU(), o=D.ci[kk]||(D.ci[kk]={}), hadAdj=!!D.adj[kk]; o[ds.ci]=o[ds.ci]===+ds.v?0:+ds.v; if(hadAdj)delete D.adj[kk]; save(); render(true); toast(hadAdj?"Réponse enregistrée. Proposition recalculée.":"Réponse enregistrée.",U2); return;}
  if(ds.rb){var rk=activeRace().id+":"+ds.w+":rb"; if(ds.rb==="on")delete D.adj[rk]; else D.adj[rk]="off"; save(); render(true); return;}
  if(ds.adj){var U1=snapU(), ak=activeRace().id+":"+ds.w; if(ds.adj==="reset")delete D.adj[ak]; else D.adj[ak]=ds.adj; save(); render(true); toast(ds.adj==="reset"?"Ajustement retiré.":"Ajustement appliqué.",U1); return;}
  if(ds.todo!=null){var st=ds.store==="kit"?kitOf(activeRace()):D.todo; st[ds.todo]=!st[ds.todo]; if(!st[ds.todo])delete st[ds.todo]; save(); var kd=$("kitd"),op=kd&&kd.open; render(true); if(op&&$("kitd"))$("kitd").open=true; return;}
  if(ds.ph!=null){openPh=(openPh===null?(function(){var r1=activeRace(),p1=r1&&planOf(r1),t1=p1?planIdx(p1):-1; return !p1?"":t1<0?p1.weeks[0].ph:t1>=p1.n*7?p1.weeks[p1.n-1].ph:p1.weeks[nowWeek(p1)-1].ph;})():openPh)===ds.ph?ds.ph:ds.ph; render(true); return;}
  if(ds.wk){var w=+ds.wk, ow0=openWk===null?(planCurW||0):openWk; openWk=ow0===w?0:w; render(true); return;}
  if(ds.wnav){var r0=activeRace(), p0=planOf(r0); if(!p0)return; cur=Math.max(1,Math.min(p0.n,cur+(+ds.wnav))); if(cur===nowWeek(p0)&&planIdx(p0)>=0)goNow(); else{browsing=true; var w0=p0.weeks[cur-1]; if(!sessAt(w0,sel)&&w0.s.length)sel=w0.s[0].dow;} render(); return;}
  if(ds.goto){var p=ds.goto.split("-"); cur=+p[0]; sel=+p[1]; browsing=true; tab="today"; prevTab="today"; render(); return;}
  if(ds.swap){var sq=ds.swap.split("|"); swapDays(+sq[0],sq[1],sq[2]); return;}
  if(ds.edit){var q=ds.edit.split("-"); editSession(+q[0],q[1]); return;}
  if(ds.sheet){showInfo(ds.sheet); return;}
  if(ds.opencourse){D.focus=ds.opencourse; CV="detail"; save(); render(); window.scrollTo(0,0); return;}
  if(ds.ctab){CT=ds.ctab; render(true); return;}
  if(ds.act==="courselist"){CV="list"; render(); window.scrollTo(0,0); return;}
  if(ds.race){openRace(ds.race,!!ds.practice); return;}
  if(ds.act)act(ds.act,b);
});
$("view").addEventListener("keydown",function(e){var swi=e.target.closest&&e.target.closest("[data-sw]"); if(swi&&(e.key===" "||e.key==="Enter")){e.preventDefault(); toggleSw(swi.dataset.sw);}});
$("view").addEventListener("change",function(e){
  var id=e.target.id, v=e.target.value;
  if(id==="gelmin"){D.set.gel=+v; save();} else if(id==="watermin"){D.set.water=+v; save();}

});
function toggleSw(k){D.set[k]=k==="gps"?D.set[k]===false:!D.set[k]; save(); render(true);}
function act(a,b){
  var ds=b.dataset;
  if(a==="goalauto"){var fr=focusRace(); if(fr){fr.gm=false; fr.goal=0; save(); render(true);} return;}
  if(a==="sync")sync(true);
  else if(a==="now"){goNow(); render();}
  else if(a==="watch")watchSheet(+ds.w,ds.k);
  else if(a==="weekplan"){openWk=+ds.w; try{openPh=planOf(activeRace()).weeks[+ds.w-1].ph;}catch(e){} setTab("plan"); var el=document.querySelector('[data-wk="'+ds.w+'"]'); if(el)el.scrollIntoView({block:"start"});}
  else if(a==="notifs")openNotifs();
  else if(a==="availwk")availSheet(+ds.w);
  else if(a==="addses")editSession(+ds.w,null,ds.d!=null?+ds.d:null);
  else if(a==="manual")manualSheet(+ds.w,ds.k);
  else if(a==="addrace")editRace(null);
  else if(a==="editrace")editRace(ds.r);
  else if(a==="activate"){D.active=ds.r; save(); goNow(); toast("Tu suis maintenant le plan de "+raceById(ds.r).name+"."); render(true);}
  else if(a==="resetedits"){var r=activeRace(); if(!confirm("Rétablir toutes les séances d’origine du plan "+r.name+" ?"))return; var U2=snapU(); delete D.edits[r.id]; save(); render(true); toast("Séances d’origine rétablies.",U2);}
  else if(a==="import")$("fileJson").click();
  else if(a==="export")exportData();
  else if(a==="gsetup")gSetupSheet();
  else if(a==="gmanage")gManageSheet();
  else if(a==="backups")openBackups();
  else if(a==="gimport"){if(!GBUSY)$("fileGarmin").click();}
  else if(a==="gclear"){if(!confirm("Effacer l’export Garmin de ce téléphone ?"))return; GARMIN.clear(); render(true);}
  else if(a==="reset"){if(!resetArmed){resetArmed=true; render(true); setTimeout(function(){if(resetArmed){resetArmed=false; if(tab==="settings")render(true);}},5000); return;}
    var keep={set:D.set,races:D.races,active:D.active,focus:D.focus}; D=blank(); Object.assign(D,keep); resetArmed=false; MC={}; PC={}; save(); toast("Données effacées. Tes courses sont gardées."); goNow(); render(true);}
  else if(a==="racereset"){if(!confirm("Réinitialiser le chrono de course ? Les temps pointés seront perdus (sauf ceux déjà gardés dans le bilan)."))return; D.race=null; save(); render(true);}
  else if(a==="editres"){editRes=true; render(true);}
  else if(a==="canceres"){editRes=false; render(true);}
  else if(a==="saveres"){
    var r1=raceById(ds.r), m=model(r1), n=m.cps.length, sp=[];
    for(var i=0;i<n;i++){var v=$("rs"+i).value.trim(); sp.push(v?parseDur(v)/60:null);}
    if(sp[n-1]==null||!(sp[n-1]>5)){toast("Indique au moins ton temps d’arrivée (ex. 4:52).");return;}
    var c=sp.filter(function(x){return x!=null;}).length;
    if(c===n&&!sp.every(function(x,j){return !j||x>sp[j-1];})){toast("Les temps doivent augmenter d’un ravito à l’autre.");return;}
    if(c>1&&c<n){toast("Remplis tous les temps, ou seulement l’arrivée.");return;}
    D.results[r1.id]={splits:c===n?sp:[sp[n-1]],goal:m.goal,manual:true}; editRes=false; save(); toast("Temps enregistrés."); render(true);}
}

// ---------- toast ----------
var toastT=null;
$("toast").addEventListener("click",function(e){if(e.target.closest(".toast-undo"))undoNow();});
// Nombres : chaque nombre (avec son unité) devient un bloc insécable en police à chasse fixe. Un nombre ne se coupe jamais en fin de ligne.
var NUMRE=/\d{1,2}[\u00a0\u202f ]?h[\u00a0\u202f ]?\d{2}|[+\u2212-]?(?:\d{1,3}(?:[\u00a0\u202f]\d{3})+|\d{1,3}(?: \d{3})+(?!\d)|\d+)(?:[,.:]\d+)*(?:[\u00a0\u202f ]?(?:km\/h|km|min|bpm|kg|°C|[hms%])(?![A-Za-z\u00c0-\u00ff]))?/g;
var NUMSKIP="script,style,svg,input,textarea,select,option,title,.num-t,.wo-big,[data-nonum]";
function numify(root){
  if(!root||root.nodeType!==1&&root.nodeType!==11)return;
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null), nodes=[], n;
  while((n=w.nextNode())){var pe=n.parentNode; if(!pe||pe.nodeType!==1||!/\d/.test(n.nodeValue))continue; if(pe.closest(NUMSKIP)||pe.classList.contains("num-t"))continue; nodes.push(n);}
  nodes.forEach(function(t){var v=t.nodeValue, last=0, m, f=null; NUMRE.lastIndex=0;
    while((m=NUMRE.exec(v))){ if(!f)f=document.createDocumentFragment(); if(m.index>last)f.appendChild(document.createTextNode(v.slice(last,m.index)));
      var sp=document.createElement("span"); sp.className="num-t"; sp.textContent=m[0].replace(/ /g,"\u00a0"); f.appendChild(sp); last=m.index+m[0].length; if(m[0]==="")NUMRE.lastIndex++; }
    if(f){ if(last<v.length)f.appendChild(document.createTextNode(v.slice(last))); t.parentNode.replaceChild(f,t); }});
}
window.NUMIFY=numify;
(function(){ var q=[], tm=0, mo=new MutationObserver(function(ms){ ms.forEach(function(r){[].forEach.call(r.addedNodes,function(a){ if(a.nodeType===1&&!a.classList.contains("num-t"))q.push(a); else if(a.nodeType===3&&a.parentNode)q.push(a.parentNode);});}); if(tm)return; tm=requestAnimationFrame(function(){tm=0; mo.disconnect(); var l=q; q=[]; l.forEach(function(e){if(document.contains(e))numify(e);}); mo.observe(document.body,{childList:true,subtree:true});});});
  mo.observe(document.body,{childList:true,subtree:true}); numify(document.body); })();
var UNDO=null, UNDO_KEYS=["done","undone","actual","edits","adj","ci"];
function snapU(){var o={}; UNDO_KEYS.forEach(function(k){o[k]=JSON.stringify(D[k]||{});}); return o;}
function undoNow(){ if(!UNDO)return; var u=UNDO; UNDO=null; UNDO_KEYS.forEach(function(k){D[k]=JSON.parse(u[k]);}); MC={}; PC={}; save(); $("toast").hidden=true; render(true); toast("Annulé."); }
function toast(m,undo){var t=$("toast"), ms=undo?6000:3200; UNDO=undo||null; var ok=!!undo||/ajout|enregistr|appliqu|mise? à jour|retir|supprim|rétabli|restaur|copi|synchronis/i.test(m);
  t.innerHTML=(ok?'<span class="t-ic" aria-hidden="true">'+I.check+'</span>':'')+'<span class="t-msg">'+esc(m)+'</span>'+(undo?'<button type="button" class="toast-undo">Annuler</button>':'')+'<i class="t-bar" aria-hidden="true" style="animation-duration:'+ms+'ms"></i>';
  t.hidden=false; clearTimeout(toastT); toastT=setTimeout(function(){t.hidden=true; UNDO=null;},ms);}

// ---------- Strava (coupé, gardé pour plus tard) ----------

// Mise à jour : à chaque retour dans l’appli, on compare avec la version publiée et on recharge toute seule (sauf pendant une course ou une feuille ouverte)
var syncing=false;
function sync(manual){
  if(!STRAVA||syncing||!window.CadenzoAuth)return;
  if(D.sync.retryAt&&Date.now()<D.sync.retryAt){if(manual)toast("Strava est temporairement limité. La prochaine tentative sera automatique.");return;}
  syncing=true;
  window.CadenzoAuth.sync().then(function(j){
    var source=(j.runs||[]).filter(function(r){return r&&isoOk(String(r.date))&&+r.km>0;});
    var runs=source.map(function(r){return {date:r.date,km:+r.km,dp:Math.round(+r.dp||0),t:Math.round(+r.t||0),src:"strava"};});
    histSave(source.map(function(r){return {date:r.date,km:+r.km,dp:Math.round(+r.dp||0),t:Math.round(+r.t||0),hr:+r.hr||0,id:r.id||0,sg:Array.isArray(r.sg)?r.sg:null,be:Array.isArray(r.be)?r.be:[]};}));
    D.sync.t=Date.now(); D.sync.v=runV(); D.sync.upd=j.updated||""; D.sync.err=""; D.sync.retryAt=0;
    if(Array.isArray(j.cotes)){
       var shared=[],seenShared={}; j.cotes.forEach(function(x){if(x&&x.i&&!seenShared[x.i]){shared.push(x);seenShared[x.i]=1;}});
       COTES["strava-cache"]={nom:CTS.city||"Autour de toi",items:shared,updated:j.updated||new Date().toISOString()};
       var totalShared=shared.length;
       if(totalShared<=1)CTS.off=0;
       else CTS.off=Math.min(Math.max(0,+CTS.off||0),totalShared-1);
       ctSave();
       try{localStorage.setItem(userKey("cadenzo-cotes"),JSON.stringify(COTES));}catch(e){}
     }
    var n=applyActs(runs);
    if(manual)toast(runs.length+" sorties du compte connecté · "+n+" séances du plan");
  }).catch(function(e){
    var m=String(e&&e.message||e);
    if(e&&e.code==="STRAVA_RATE_LIMIT"){D.sync.retryAt=Date.now()+Math.max(60,+e.retryAfter||900)*1000;D.sync.err="limite Strava temporaire";D.sync.rateLimited=true;}
    else D.sync.err=/401|session/i.test(m)?"session expirée":/failed to fetch|network|load failed/i.test(m)?"pas de réseau":m.slice(0,55);
    if(manual)toast(e&&e.code==="STRAVA_RATE_LIMIT"?"Limite Strava atteinte. Reprise automatique après le délai indiqué.":"Synchro Strava impossible : "+D.sync.err);
  }).then(function(){syncing=false;save();render(true);});
}
function ghCheck(){} // L’ancienne synchronisation GitHub publique n’est plus utilisée.
function stravaSub(){
  var s=D.sync;
  if(s.err==="limite Strava temporaire"&&s.retryAt>Date.now())return "Limite temporaire Strava · reprise "+inTime(s.retryAt);
  if(s.err)return "Dernière synchro ratée ("+esc(s.err)+"), nouvel essai automatique";
  return s.t?"Dernière synchro du compte connecté "+ago(s.t):"Compte Strava connecté · pas encore synchronisé";
}
// Fraîcheur des données Strava : heure à laquelle GitHub a lu Strava (sinon date du fichier). Au-delà d’1 h, rappel discret.
function stravaAge(){var s=D.sync, t=s.upd?Date.parse(s.upd):s.t; return t&&!isNaN(t)?t:0;}
function syncNote(){
  if(!STRAVA)return ""; var s=D.sync, t=stravaAge();
  // Une limite API Strava est une pause temporaire, pas une panne de l'application.
  // On conserve la reprise automatique sans afficher de bandeau rouge persistant.
  if(s.err==="limite Strava temporaire"||s.rateLimited)return "";
  var old=!t||Date.now()-t>3600*1000||!!s.err;
  var txt=s.err?"Dernière synchro ratée ("+esc(s.err)+"). Tes dernières sorties peuvent manquer.":!t?"Strava : pas encore de synchronisation.":old?"Dernières données Strava : "+ago(t)+". Une sortie récente peut manquer.":"Strava synchronisé "+ago(t)+".";
  return '<p class="syncnote'+(old?(s.gh==="ko"||s.err?" bad":" old"):"")+'" role="status">'+txt+(old?' <button class="link-btn" data-act="sync">Réessayer</button>':"")+'</p>';
}
var CTRY=0;
function autoSync(){var need=Object.keys(COTES).every(function(k){return !(COTES[k].items||[]).length;})&&Date.now()-CTRY>60000; if(need)CTRY=Date.now();
  if(STRAVA&&!syncing&&!(D.sync.retryAt&&Date.now()<D.sync.retryAt)&&(window.CADENZO_FORCE_SYNC||need||Date.now()-(D.sync.t||0)>5*60*1000||D.sync.v!==runV())){window.CADENZO_FORCE_SYNC=false;sync(false);}}
function applyActs(acts){
  var r=activeRace(); if(!r)return 0; var pl=planOf(r), bd=byDate(pl), byDay={}, n=0;
  acts.forEach(function(a){if(!a.date||!(a.km>0))return; var o=byDay[a.date]||(byDay[a.date]={km:0,dp:0,t:0,src:a.src}); o.km+=a.km; o.dp+=a.dp||0; o.t+=a.t||0;});
  D.extra=D.extra||{};
  Object.keys(byDay).forEach(function(dt){var mm=bd[dt], o0=byDay[dt]; if(!mm){ if(o0.km>=2&&dms(dt)>=pl.start&&dms(dt)<=pl.end)D.extra[dt]={km:Math.round(o0.km*100)/100,dp:Math.round(o0.dp),t:Math.round(o0.t)}; else delete D.extra[dt]; n++; return;} delete D.extra[dt]; if(mm.s.race)return; var o=byDay[dt]; if(o.km<2)return; var k=sk(r,mm.w,mm.s.k);
    if(D.actual[k]&&D.actual[k].src==="manual")return; D.actual[k]={km:Math.round(o.km*100)/100,dp:Math.round(o.dp),t:Math.round(o.t),src:o.src};
    if(mm.s.km&&o.km>=0.6*mm.s.km&&!(D.undone&&D.undone[k]))D.done[k]=1; n++;});
  return n;
}

// ---------- fichiers ----------
function readFile(input,cb){var f=input.files&&input.files[0]; if(!f)return; var rd=new FileReader(); rd.onerror=function(){toast("Lecture du fichier impossible.");}; rd.onload=function(){try{cb(String(rd.result),f);}catch(err){toast("Ce fichier n’a pas pu être lu.");} input.value="";}; rd.readAsText(f);}
$("fileJson").addEventListener("change",function(){readFile(this,function(txt){
  var o; try{o=JSON.parse(txt);}catch(e){toast("Fichier illisible : ce n’est pas du JSON valide. Rien n’a été modifié."); return;}
  var u=SAFE.unwrap(o), st=u.state;
  if(st&&typeof st==="object"&&st.v!==3&&st.done&&st.set)st=migrate(st,blank());
  var v=SAFE.validate(st); if(!v.ok){toast(v.errors[0]+" Rien n’a été modifié."); return;}
  var sm=SAFE.summary(D,v.state), c=SAFE.counts(v.state), add=Object.keys(sm.added).map(function(k){return sm.added[k]+" "+k;}).join(", ");
  openSheet('<h2>Importer une sauvegarde</h2><p class="small muted">'+(u.exported?'Fichier du '+fmtD(Date.parse(u.exported.slice(0,10)+"T00:00:00Z"))+' · ':'')+c.done+' séances faites, '+c.actual+' chiffres réalisés, '+c.races+' course'+(c.races>1?'s':'')+'.</p>'+
    '<p><b>Fusionner</b> garde tout ce qui est sur ce téléphone et ajoute ce qui manque'+(add?' ('+esc(add)+')':' (rien de nouveau)')+'. En cas de doublon, ce téléphone gagne.</p>'+
    '<p><b>Remplacer</b> met les données du fichier à la place de celles de ce téléphone.</p>'+
    (v.dropped?'<p class="small muted">'+v.dropped+' entrée'+(v.dropped>1?'s':'')+' invalide'+(v.dropped>1?'s':'')+' ignorée'+(v.dropped>1?'s':'')+'.</p>':'')+
    '<p class="small muted">Une copie de sécurité de l’état actuel est faite avant, tu pourras y revenir.</p>'+
    '<div class="row"><button class="btn primary" data-sact="impmerge">Fusionner</button><button class="btn ghost" data-sact="impreplace">Remplacer</button></div>',{imp:{state:v.state,garmin:u.garmin}});
});});
$("fileGarmin").addEventListener("change",function(){
  var inp=this, fl=Array.prototype.slice.call(inp.files||[]); inp.value=""; if(!fl.length||!window.GARMIN)return;
  GBUSY="Lecture de l’export…"; FSUB="garmin"; if(tab==="forme")render(true);
  var lastR=0; GARMIN.importFiles(fl,function(i,n){if(Date.now()-lastR<250&&i<n)return; lastR=Date.now(); GBUSY="Lecture "+i+" / "+n+"…"; if(tab==="forme")render(true);})
    .then(function(g){GBUSY=""; toast("Export Garmin lu : "+g.acts.length+" activités, du "+g.first.split("-").reverse().join("/")+" au "+g.last.split("-").reverse().join("/")+".");})
    .catch(function(e){GBUSY=""; toast(String(e&&e.message||"Export illisible."));})
    .then(function(){if(tab==="forme")render(true);});
});
function parseGpx(txt,fname){
  var doc=new DOMParser().parseFromString(txt,"application/xml"), pts=doc.getElementsByTagName("trkpt"); if(!pts.length)pts=doc.getElementsByTagName("rtept");
  if(pts.length<10)return null;
  var raw=[],cum=0,prev=null;
  for(var i=0;i<pts.length;i++){var la=+pts[i].getAttribute("lat"),lo=+pts[i].getAttribute("lon"); if(isNaN(la)||isNaN(lo))continue; var el=pts[i].getElementsByTagName("ele")[0], e=el?+el.textContent:NaN; if(prev)cum+=distM(prev[0],prev[1],la,lo); raw.push([la,lo,cum,e]); prev=[la,lo];}
  var total=cum/1000; if(total<1)return null;
  var out=[],last=-1e9; raw.forEach(function(p,i){if(p[2]-last>=40||i===raw.length-1){out.push([Math.round(p[0]*1e5)/1e5,Math.round(p[1]*1e5)/1e5,Math.round(p[2])/1000]); last=p[2];}});
  var prof=null, dp=0, hasE=raw.filter(function(p){return !isNaN(p[3]);}).length>raw.length*0.8;
  if(hasE){var step=total>60?0.5:0.25, j=0; prof=[];
    for(var x=0;x<=total+1e-6;x+=step){var a=(x-step/2)*1000,bb=(x+step/2)*1000,s=0,c=0; while(j<raw.length&&raw[j][2]<a)j++; for(var q=j;q<raw.length&&raw[q][2]<=bb;q++)if(!isNaN(raw[q][3])){s+=raw[q][3];c++;} if(c)prof.push([Math.round(x*100)/100,Math.round(s/c)]);}
    var le=raw[raw.length-1][3]; if(prof.length&&prof[prof.length-1][0]<total-0.05&&!isNaN(le))prof.push([Math.round(total*100)/100,Math.round(le)]);
    for(var z=1;z<prof.length;z++){var d=prof[z][1]-prof[z-1][1]; if(d>0)dp+=d;}}
  var wp=[]; Array.prototype.forEach.call(doc.getElementsByTagName("wpt"),function(w){var n=(w.getElementsByTagName("name")[0]||{}).textContent||""; if(!/ravit|aid|food|eau|water|refuge|check|cp\b/i.test(n))return;
    var la=+w.getAttribute("lat"),lo=+w.getAttribute("lon"),bi=-1,bd=1e9; raw.forEach(function(p,i){var d=Math.abs(p[0]-la)+Math.abs(p[1]-lo); if(d<bd){bd=d;bi=i;}}); if(bi<0||distM(raw[bi][0],raw[bi][1],la,lo)>400)return;
    var km=Math.round(raw[bi][2]/10)/100; if(km>0.3&&km<total-0.3&&!wp.some(function(x){return Math.abs(x.km-km)<0.3;}))wp.push({km:km,n:n.trim().slice(0,40)});}); wp.sort(function(a,b){return a.km-b.km;});
  var nm=doc.getElementsByTagName("name")[0];
  return {name:(nm&&nm.textContent.trim().slice(0,60))||fname.replace(/\.gpx$/i,""),total:total,pts:out,prof:prof,dp:Math.round(dp),wpts:wp};
}
function scalePts(pts,total,km){var f=km/total; return pts.map(function(p){return [p[0],p[1],Math.round(p[2]*f*1000)/1000];});}
$("fileGpxRace").addEventListener("change",function(){readFile(this,function(txt,f){
  var g=parseGpx(txt,f.name); if(!g){toast("Aucune trace trouvée dans ce fichier.");return;}
  pendingGpx=g; var n=$("rName"), k=$("rKm"), d=$("rDp");
  if(n&&!n.disabled&&!n.value)n.value=g.name; if(k&&!k.disabled&&!k.value)k.value=kmS(g.total); if(d&&!d.disabled&&!d.value&&g.dp)d.value=Math.round(g.dp/10)*10;
  var gi=$("gpxinfo"); if(gi)gi.textContent="Trace lue : "+kmS(g.total)+" km"+(g.prof?", environ +"+nb(g.dp)+" m (GPS). Profil, montées et descentes seront calculés.":", sans altitude : utilisée pour le GPS seulement.");
  var gl=$("gpxlab"); if(gl)gl.textContent="Trace chargée · remplacer";
  var cp=$("rCps"); if(cp&&g.wpts&&g.wpts.length&&!cp.value.trim()){cp.value=g.wpts.map(function(w){return kmS(w.km)+" "+w.n;}).join("\n"); if(gi)gi.textContent+=" "+g.wpts.length+" ravitaillement"+(g.wpts.length>1?"s":"")+" repéré"+(g.wpts.length>1?"s":"")+" dans le fichier.";}
});});
function distM(a,b,c,d){var R=6371000,toR=Math.PI/180,x=(d-b)*toR*Math.cos((a+c)/2*toR),y=(c-a)*toR; return Math.sqrt(x*x+y*y)*R;}
function exportData(){
  var g=null; try{g=JSON.parse(localStorage.getItem(userKey("cadenzo-garmin"))||"null");}catch(e){}
  var txt=JSON.stringify(SAFE.wrap(D,g),null,1), name="cadenzo-sauvegarde-"+iso(realToday())+".json";
  try{localStorage.setItem(userKey("cadenzo-lastexport"),String(Date.now()));}catch(e){}
  var f=null; try{f=new File([txt],name,{type:"application/json"});}catch(e){}
  if(f&&navigator.canShare&&navigator.canShare({files:[f]})&&navigator.share){navigator.share({files:[f],title:"Sauvegarde Cadenzo"}).catch(function(err){if(err&&err.name!=="AbortError")dl();}); return;}
  dl(); function dl(){var blob=new Blob([txt],{type:"application/json"}), a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},500); toast("Sauvegarde exportée.");}
}

// ---------- mode Course ----------
var RS=null, RM=null, RR=null, rmTimer=null, wake=null, gpsWatch=null, holdT=null, undoArmed=false, cpArmed=false;
function newRS(rid,pr){return {rid:rid,t0:null,splits:[],gels:0,lastGel:null,lastWater:null,gelAlerted:null,done:false,practice:!!pr,gpsKm:null,gpsT:0,shift:0};}
function openRace(rid,pr){
  RR=raceById(rid); if(!RR)return; RM=model(RR);
  if(pr){if(!D.practice||D.practice.done||D.practice.rid!==rid)D.practice=newRS(rid,true); RS=D.practice;}
  else{if(D.race&&D.race.rid!==rid){if(D.race.t0&&!D.race.done&&!confirm("Un chrono est en cours pour "+((raceById(D.race.rid)||{}).name||"une autre course")+". Le remplacer ?"))return; D.race=null;} if(!D.race)D.race=newRS(rid,false); RS=D.race;}
  if(RS.t0&&!RS.done&&nowMs()-RS.t0>36*36e5){if(pr)RS=D.practice=newRS(rid,true); else RS=D.race=newRS(rid,false);} // chrono oublié depuis plus de 36 h : on repart de zéro
  save(); $("rm").hidden=false; document.body.style.overflow="hidden"; applyTheme(); rmRender(); clearInterval(rmTimer); rmTimer=setInterval(rmTick,1000); askWake(); if(D.set.gps!==false&&RR.gpx&&gpsWatch==null)startGps();
  try{history.pushState({rm:1},"");}catch(e){}
}
function closeRace(){if(RS&&!RS.done&&RS.t0){if(RS.practice)D.practice=null; else D.race=null; save();} $("rm").hidden=true; document.body.style.overflow=""; clearInterval(rmTimer); stopGps(); try{wake&&wake.release();}catch(e){} wake=null; RS=null; applyTheme(); render(true);}
function closeRaceNav(){closeRace(); try{if(history.state&&history.state.rm)history.back();}catch(x){}}
window.addEventListener("popstate",function(){if($("rm").hidden)return; if(RS&&!RS.practice&&!RS.done&&RS.t0){try{history.pushState({rm:1},"");}catch(e){} toast("Course en cours : maintiens Quitter pour fermer."); return;} closeRace();});
function askWake(){try{if(navigator.wakeLock&&!$("rm").hidden)navigator.wakeLock.request("screen").then(function(w){wake=w; var c=$("rmWake"); if(c)c.textContent="Écran allumé";}).catch(function(){});}catch(e){}}
document.addEventListener("visibilitychange",function(){if(document.hidden)return; if(!$("rm").hidden){askWake(); rmTick();} else autoSync();});
function nowMs(){return Date.now()+(RS&&RS.shift?RS.shift:0);}
function vib(p){if(D.set.vib&&navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))try{navigator.vibrate(p);}catch(e){}}
function rmModel(){
  var m=RM, C=m.cps, now=nowMs(), t=(now-RS.t0)/60000, i=RS.splits.length, ni=Math.min(i,C.length-1);
  var lastDelta=i?RS.splits[i-1]-m.cumMin(C[i-1].km):0, lo=i?C[i-1].km:0, hi=C[ni].km-0.1;
  var est=Math.max(lo,Math.min(m.kmAt(t-lastDelta),hi)), gpsOk=RS.gpsKm!=null&&Date.now()-RS.gpsT<180000, pos=gpsOk?Math.max(lo,Math.min(RS.gpsKm,m.L)):est;
  var delta=gpsOk&&pos>0.5?t-m.cumMin(pos):lastDelta, nx=C[ni], gelBase=RS.lastGel||RS.t0;
  return {t:t,i:i,pos:pos,gpsOk:gpsOk,delta:delta,nx:nx,last:ni===C.length-1,left:Math.max(0,nx.km-pos),up:m.dplus(pos,nx.km),target:m.cumMin(nx.km),eta:m.cumMin(nx.km)+delta,proj:m.goal+delta,adv:(m.adv.filter(function(a){return a[0]>pos;})[0]||m.adv[m.adv.length-1])[1],gelLeft:D.set.gel?D.set.gel-(now-gelBase)/60000:null,gelBase:gelBase};
}
function dcls(d){return d<=0?"ahead":d<=8?"late":"bad";}
function rmRender(){
  var el=$("rmIn"), pr=RS.practice, m=RM, r=RR, C=m.cps; undoArmed=false; cpArmed=false;
  if(RS.done){var fin=RS.splits[RS.splits.length-1], d=fin-m.goal;
    el.innerHTML='<div class="rm-top"><span>'+(pr?"Essai":esc(r.name))+' · terminé</span></div><div class="rm-spacer"></div><div class="rm-big"><span class="eyebrow" style="color:#93A39A">Arrivée</span><div class="clock" style="font-size:80px">'+hmc(fin)+'</div><span class="delta '+dcls(d)+'">'+sgn(d)+'</span><p style="margin:16px 0 0">'+(pr?"Essai terminé. Rien n’est gardé dans ton bilan.":"Bravo. Bois, mange, marche un peu.<br>Le bilan détaillé t’attend dans l’appli.")+'</p></div><div class="rm-spacer"></div>'+(pr?'':'<button class="rm-go" data-rm="bilan">Voir le bilan</button>')+'<button class="rm-ghost" data-rm="undo">Annuler l’arrivée</button><button class="rm-quit" data-rm="close">Fermer</button>'; return;}
  if(!RS.t0){var isDay=!pr&&daysTo(r)===0, since=(Date.now()-raceStartTs(r))/60000;
    el.innerHTML='<div class="rm-top"><span class="chips"><span class="chip">'+(pr?"Essai · ":"")+esc(r.name)+'</span><span class="chip" id="rmWake">'+(wake?"Écran allumé":"Écran : garde-le allumé")+'</span></span><span>objectif '+hm(m.goal)+'</span></div><div class="rm-spacer"></div><div class="rm-big"><span class="eyebrow" style="color:#93A39A">'+(isDay&&since<0?"Départ dans":"Prête ?")+'</span><div class="clock" id="rmCount">'+(isDay&&since<0?hms(-since*60):"0:00:00")+'</div><p>'+(pr?"Lance le chrono au début de ta sortie. Touche « J’y suis » à chaque point pour voir l’écran évoluer.":"Touche « Départ » au coup de pistolet. Le chrono continue même si tu fermes l’appli.")+'</p></div><div class="rm-spacer"></div><div class="rm-prof">'+profileSVG(m,{dark:true,pos:0,h:96,top:20,small:true})+'</div>'+
      syncPanel()+'<button class="rm-go" data-rm="start">Départ<small>appuie en même temps sur Start de la montre</small></button>'+(isDay&&since>0&&since<300?'<button class="rm-go" style="background:#1B2620;color:#F1F5F2;min-height:60px;font-size:18px" data-rm="startoff">Départ donné à '+esc(r.time)+'<small>il y a '+Math.round(since)+' min</small></button>':'')+(syncUI?'':'<button class="rm-ghost" data-rm="syncopen">La montre tourne déjà ? Caler sur son chrono</button>')+'<button class="rm-quit" data-rm="close">Fermer</button>'; return;}
  var i=RS.splits.length, last=i>=C.length-1;
  el.innerHTML='<div class="rm-top" id="rmTop"></div><div class="clock" id="rmClock"></div><div id="rmLive" style="display:flex;flex-direction:column;gap:10px"></div><div class="rm-spacer"></div>'+
    '<div class="rm-row"><button data-rm="gel" id="rmGel">Gel pris<small id="rmGelSub"></small></button><button data-rm="gps" id="rmGps" class="'+(gpsWatch!=null?"on":"")+'">'+(gpsWatch!=null?"GPS actif":"Me situer")+'<small id="rmGpsSub">'+(gpsWatch!=null?"toucher pour couper":r.gpx?"GPS sur la trace":"sans trace GPX")+'</small></button></div>'+
    (pr?'<div class="rm-row"><button data-rm="ff">+10 min<small>avancer l’essai</small></button></div>':'')+
    syncPanel()+'<button class="rm-go" data-rm="cp">'+(last?"Je franchis l’arrivée":"J’y suis")+'<small>'+(last?kmS(m.L)+" km":esc(C[i].n)+" · km "+kmS(C[i].km))+'</small></button>'+
    (i?'<button class="rm-ghost" data-rm="undo" id="rmUndo">Annuler le dernier pointage ('+esc(C[i-1].n)+')</button>':'')+
    (syncUI?'':'<button class="rm-ghost" data-rm="syncopen">Caler le chrono sur la montre</button>')+'<button class="rm-quit" data-rm="quit"><i></i>Maintenir pour quitter · le chrono continue</button>';
  rmTick();
}
var syncUI=false;
function syncPanel(){return syncUI?'<div class="rm-card"><span class="eyebrow">Chrono de la montre</span><div class="rm-sync"><input id="rmSyncIn" inputmode="numeric" placeholder="ex. 12:40" autocomplete="off" aria-label="Temps de la montre"><button data-rm="syncgo">Caler</button></div><p class="rm-hint">Tape un temps un peu en avance sur la montre, puis touche « Caler » quand elle l’affiche.</p><button class="rm-ghost" data-rm="syncx" style="min-height:36px">Annuler</button></div>':'';}
function parseClock(v){v=String(v||"").trim(); var p; if(/[:h.]/.test(v))p=v.split(/[:h.]/).map(Number); else{var d=v.replace(/\D/g,""); if(!d)return null; p=d.length<=2?[+d,0]:d.length<=4?[+d.slice(0,-2),+d.slice(-2)]:[+d.slice(0,-4),+d.slice(-4,-2),+d.slice(-2)];}
  if(p.some(isNaN)||p.length>3)return null; while(p.length<3)p.unshift(0); if(p[1]>59||p[2]>59)return null; return p[0]*3600+p[1]*60+p[2];}
function rmTick(){
  if(!RS)return;
  if(!RS.t0){var c=$("rmCount"); if(c&&!RS.practice&&daysTo(RR)===0){var s=(raceStartTs(RR)-Date.now())/1000; if(s>0)c.textContent=hms(s); else if(c.textContent!=="0:00:00")rmRender();} return;}
  if(RS.done)return;
  var m=rmModel();
  if(m.gelLeft!=null&&m.gelLeft<=0&&RS.gelAlerted!==m.gelBase){RS.gelAlerted=m.gelBase; vib([200,100,200,100,200]); save();}
  if(D.set.water){var wb=RS.lastWater||RS.t0; if(nowMs()-wb>=D.set.water*60000){RS.lastWater=nowMs(); vib(150); toast("Bois quelques gorgées."); save();}}
  var top=$("rmTop"); if(!top)return;
  top.innerHTML='<span class="chips"><span class="chip">'+(RS.practice?"Essai":esc(RR.name))+'</span><span class="chip" id="rmWake">'+(wake?"Écran allumé":"Écran : garde-le allumé")+'</span></span><span class="num">km '+kmS(m.pos)+(m.gpsOk?" · GPS":" · estimé")+'</span>';
  var nd=new Date(); $("rmClock").innerHTML=hms(m.t*60)+'<small>temps de course · objectif '+hm(RM.goal)+(RS.practice?'':' · il est '+nd.getHours()+':'+pz(nd.getMinutes()))+'</small>';
  var due=m.gelLeft!=null&&m.gelLeft<=0;
  $("rmLive").innerHTML=(due?'<div class="rm-card alert"><span class="eyebrow">Rappel</span><div class="rm-next">Prends un gel maintenant</div><span>Puis touche « Gel pris ». Bois un peu avec.</span></div>':'')+
    '<div class="rm-card"><span class="eyebrow">'+(m.last?"Dernière section":"Prochain point")+'</span><div class="rm-next">'+esc(m.last?"Arrivée":m.nx.n)+'</div><div class="rm-grid num"><div><b>'+kmS(m.left)+'</b>km</div><div><b>+'+m.up+'</b>m D+</div><div><b>'+hmc(m.eta)+'</b>prévu '+hmc(m.target)+'</div></div></div>'+
    '<div class="rm-card" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><span class="eyebrow">Arrivée estimée</span><div style="font-family:var(--display);font-size:28px;font-weight:800" class="num">'+hm(m.proj)+'</div></div><span class="delta '+dcls(m.delta)+'">'+sgn(m.delta)+'</span></div>'+
    '<div class="rm-card rm-advice">'+esc(m.adv)+'</div><div class="rm-prof">'+profileSVG(RM,{dark:true,pos:m.pos,h:96,top:20,small:true})+'</div>';
  var g=$("rmGel"), gs=$("rmGelSub"); if(g){g.className=due?"due":""; gs.textContent=(RS.gels?RS.gels+" pris · ":"")+(m.gelLeft==null?"rappel coupé":due?"c’est l’heure":"prochain dans "+Math.max(1,Math.ceil(m.gelLeft))+" min");}
}
$("rm").addEventListener("click",function(e){
  var b=e.target.closest("[data-rm]"); if(!b||!RS)return; var a=b.dataset.rm, C=RM.cps;
  if(a==="start"){RS.t0=Date.now(); RS.shift=0; syncUI=false; vib(80); save(); rmRender();}
  else if(a==="syncopen"){syncUI=true; rmRender(); var si=$("rmSyncIn"); if(si)si.focus();}
  else if(a==="syncx"){syncUI=false; rmRender();}
  else if(a==="syncgo"){var sec=parseClock(($("rmSyncIn")||{}).value); if(sec==null){toast("Temps illisible : écris par exemple 12:40 ou 1:05:00.");return;}
    var nt=nowMs()-sec*1000; if(RS.t0){var df=(RS.t0-nt)/60000; RS.splits=RS.splits.map(function(x){return x+df;});} else RS.shift=0;
    RS.t0=nt; syncUI=false; vib(60); save(); toast("Chrono calé sur la montre : "+hms(sec)+"."); rmRender();}
  else if(a==="startoff"){RS.t0=raceStartTs(RR); save(); rmRender();}
  else if(a==="cp"){var t=(nowMs()-RS.t0)/60000, ci=RS.splits.length; if(ci&&t-RS.splits[ci-1]<2){toast("Pointage déjà fait il y a moins de 2 min.");return;}
    if(t<RM.cumMin(C[ci].km)*0.6&&!cpArmed){cpArmed=true; b.firstChild.textContent="Si tôt ? Toucher encore"; setTimeout(function(){if(RS&&!RS.done&&cpArmed)rmRender();},3000); return;}
    RS.splits.push(t); RS.gpsKm=null; vib([120,60,120]);
    if(RS.splits.length===C.length){RS.done=true; if(!RS.practice)D.results[RS.rid]={splits:RS.splits.slice(),goal:RM.goal};}
    else toast(C[ci].n+" : "+hmc(t)+" ("+sgn(t-RM.cumMin(C[ci].km))+")");
    save(); rmRender();}
  else if(a==="undo"){if(!undoArmed){undoArmed=true; b.textContent="Toucher encore pour annuler"; setTimeout(function(){undoArmed=false; var u=$("rmUndo"); if(u&&RS&&RS.splits.length)u.textContent="Annuler le dernier pointage ("+C[RS.splits.length-1].n+")";},3000); return;}
    RS.splits.pop(); if(RS.done){RS.done=false; if(!RS.practice)delete D.results[RS.rid];} save(); rmRender();}
  else if(a==="gel"){RS.gels++; RS.lastGel=nowMs(); vib(40); save(); rmTick();}
  else if(a==="gps"){if(gpsWatch!=null){stopGps(); rmRender(); return;} startGps();}
  else if(a==="ff"){RS.shift=(RS.shift||0)+600000; rmTick();}
  else if(a==="close")closeRaceNav();
  else if(a==="bilan"){var rid=RS.rid, rb=raceById(rid); closeRaceNav(); if(rb.prio==="A")D.active=rid; else D.focus=rid; browsing=false; save(); setTab(rb.prio==="B"?"course":"today"); if(rb.prio==="B"){CV="detail"; render();}}
});
$("rm").addEventListener("pointerdown",function(e){var b=e.target.closest('[data-rm="quit"]'); if(!b)return; b.classList.add("hold"); holdT=setTimeout(function(){b.classList.remove("hold"); closeRaceNav();},950);});
["pointerup","pointerleave","pointercancel"].forEach(function(ev){$("rm").addEventListener(ev,function(){clearTimeout(holdT); var q=document.querySelector(".rm-quit.hold"); if(q)q.classList.remove("hold");});});
function startGps(){
  if(!navigator.geolocation){toast("Pas de GPS sur cet appareil.");return;}
  if(!RR.gpx){toast("Ajoute la trace GPX de la course (Mes courses > Modifier) pour te situer au GPS.");return;}
  gpsWatch=navigator.geolocation.watchPosition(onPos,function(err){toast(err.code===1?"Localisation refusée.":"GPS indisponible pour l’instant."); stopGps(); if(RS)rmRender();},{enableHighAccuracy:true,maximumAge:15000,timeout:30000});
  rmRender(); toast("Recherche du GPS…");
}
function stopGps(){if(gpsWatch!=null){try{navigator.geolocation.clearWatch(gpsWatch);}catch(e){}} gpsWatch=null;}
function onPos(p){
  if(!RS||!RR.gpx)return; var la=p.coords.latitude, lo=p.coords.longitude, est=rmModel().pos, best=null, bd=1e9, pts=RR.gpx.pts;
  pts.forEach(function(q){if(q[2]<est-3||q[2]>est+8)return; var d=distM(la,lo,q[0],q[1]); if(d<bd){bd=d;best=q;}});
  if(!best||bd>400)pts.forEach(function(q){var d=distM(la,lo,q[0],q[1]); if(d<bd){bd=d;best=q;}});
  var sub=$("rmGpsSub");
  if(best&&bd<=400){RS.gpsKm=best[2]; RS.gpsT=Date.now(); if(sub)sub.textContent="km "+kmS(best[2])+" · ±"+Math.round(p.coords.accuracy)+" m"; rmTick();}
  else if(sub)sub.textContent="hors de la trace ("+kmS(bd/1000)+" km)";
}

// ---------- démarrage ----------
// reclasse tout de suite les sorties déjà lues avec la logique de cette version (sorties hors plan comprises)
try{if(HIST.length){applyActs(HIST.map(function(q){return {date:q.date,km:q.km,dp:q.dp,t:q.t,src:"strava"};}));}}catch(e){}
save(); goNow(); render();
if(window.CADENZO_TRAINING_PREFS_LOADED&&(!TRAIN_PREF||TRAIN_PREF.onboarding_completed!==true)&&navigator.onLine!==false&&!window.CADENZO_ONBOARDING_SHOWN){window.CADENZO_ONBOARDING_SHOWN=true;setTimeout(function(){if(!TRAIN_PREF||TRAIN_PREF.onboarding_completed!==true)openTrainingPrefs(true);},300);}
if(!D.races.length)setTimeout(function(){if(!D.races.length&&!SH)editRace(null);},500);
if(D.race&&D.race.t0&&!D.race.done&&raceById(D.race.rid)&&daysTo(raceById(D.race.rid))===0)openRace(D.race.rid,false);
setTimeout(autoSync,400);
setInterval(function(){if(!document.hidden)autoSync();},5*60*1000); // appli ouverte : relit Strava toute seule
var lastDay=todayUTC();
setInterval(function(){if(!$("rm").hidden||!$("sheet").hidden)return; var t=todayUTC(); if(t!==lastDay){lastDay=t; PC={}; goNow(); render(true);}},60000);
// ---------- mise à jour automatique de l’appli (raccourci de l’écran d’accueil) ----------
var updating=false;
function runV(){var sc=document.querySelector('script[src*="app.js"]'), m=sc&&/[?&]v=(\d+)/.exec(sc.getAttribute("src")||""); return m?+m[1]:0;}
function checkUpdate(){
  var cur=runV(); if(updating||!cur||navigator.onLine===false)return;
  if($("rm")&&!$("rm").hidden)return;                       // jamais pendant le chrono de course
  var ae=document.activeElement; if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return; // pas pendant une saisie
  fetch("auth.js?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.text():"";}).then(function(t){ // auth.js charge app.js?v=N : c’est lui qui porte la version
    var m=/app\.js\?v=(\d+)/.exec(t), nv=m?+m[1]:0; if(!nv||nv<=cur)return;
    try{if(sessionStorage.getItem(userKey("thp40upd"))===String(nv))return; sessionStorage.setItem(userKey("thp40upd"),String(nv));}catch(e){}
    updating=true; var go=function(){location.reload();};
    Promise.all([("caches" in window)?caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k);}));}):0,
      navigator.serviceWorker?navigator.serviceWorker.getRegistration().then(function(g){return g&&g.update();}):0]).then(go,go);
  }).catch(function(){});
}

// ---------- synchro entre appareils (données chiffrées, sans compte ; voir csync.js) ----------
var GKEY=userKey("cadenzo-gsync"), GS=null, GBUSY2=false, GT=null, ADOPT=false, GTRY=0;
// Sécurité multi-comptes : aucune ancienne liaison globale n’est importée automatiquement.
try{var g0=JSON.parse(localStorage.getItem(GKEY)||"null"); if(g0&&g0.id&&g0.key&&g0.sb)GS=g0;}catch(e){} // sans .sb : ancienne liaison jsonblob, à refaire
function gsave(){try{localStorage.setItem(GKEY,JSON.stringify(GS));}catch(e){}}
function normShared(st){var c=JSON.parse(JSON.stringify(st)), v=SAFE.validate(c); return CSYNC.shared(v.ok?v.state:c);}
function gsyncSoon(){ if(!GS||ADOPT||!window.CSYNC)return; clearTimeout(GT); GT=setTimeout(function(){gsync("auto");},4000); }
function gAdopt(target){ // applique l’état partagé en gardant ce qui est propre à cet appareil (thème, chrono de course, onglet…)
  var keep={sync:D.sync,race:D.race,practice:D.practice,focus:D.focus,rev:D.rev};
  var snapP=window.SAFE?SAFE.snap("avant synchro",JSON.stringify(D)):Promise.resolve();
  var nd=Object.assign({},target,keep); nd.set=Object.assign({},D.set,target.set||{});
  ADOPT=true; try{ D=assignState(blank(),nd); MC={}; PC={}; if(!raceById(D.focus))D.focus=D.active; save(); } finally{ADOPT=false;}
  return snapP;
}
function gsync(why,manual){
  if(!GS||!GS.id||!window.CSYNC||!window.SAFE||!(window.crypto&&crypto.subtle))return Promise.resolve();
  if(GBUSY2)return Promise.resolve(); if(navigator.onLine===false)return Promise.resolve();
  GBUSY2=true; GTRY=0; var changed=false;
  function push(L,parent){var doc=CSYNC.wrapDoc(L,GS.dev,parent), lh=CSYNC.hashOf(L);
    return CSYNC.putRemote(GS,doc).then(function(){return CSYNC.getRemote(GS);}).then(function(chk){ // relecture : une écriture croisée d’un autre appareil est détectée
      var cv=chk.doc&&chk.doc.state&&SAFE.validate(chk.doc.state); if(!cv||!cv.ok||CSYNC.hashOf(CSYNC.shared(cv.state))!==lh)throw Object.assign(new Error("écriture croisée"),{code:"conflict"});
      GS.last=lh; });}
  function once(){
    return CSYNC.getRemote(GS).then(function(rem){
      var L=normShared(D), R=null, parent="";
      var st=rem.doc&&rem.doc.app==="cadenzo"&&rem.doc.state, v=st&&SAFE.validate(st);
      if(!v||!v.ok)throw Object.assign(new Error("Le fichier en ligne n’est pas une sauvegarde Cadenzo valide : rien n’a été modifié."),{code:"data"});
      R=CSYNC.shared(v.state);
      var d=CSYNC.decide(L,R,GS.last,CSYNC.hashOf,rem.doc.parent||"");
      if(d.act==="same"){GS.last=d.lh; return;}
      if(d.act==="push")return push(L,CSYNC.hashOf(R));
      var target=d.act==="pull"?R:CSYNC.shared(SAFE.merge(L,R).state);
      changed=true;
      return gAdopt(target).then(function(){ var T=normShared(D); if(d.act==="pull"){GS.last=CSYNC.hashOf(T); return;} return push(T,CSYNC.hashOf(R)); });
    }).catch(function(e){
      if(e&&e.code==="conflict"&&GTRY++<2)return once(); throw e; });
  }
  return once().then(function(){GS.t=Date.now(); GS.err=""; gsave(); if(changed)toast("Données mises à jour depuis ton autre appareil.");
    else if(manual)toast("Synchronisé.");}).catch(function(e){
    var offline=e&&e.name==="TypeError", m=offline?"Pas de connexion : nouvel essai plus tard.":(e&&e.message)||"Échec de la synchro";
    GS.err=offline||(e&&e.code==="net")?"":m; gsave(); if(manual)toast(m);
  }).then(function(){GBUSY2=false; if(changed||tab==="settings")render(true);});
}
function gDevice(){var u=navigator.userAgent||""; return /iPhone|iPad/.test(u)?"iPhone":/Android/.test(u)?"Android":"ordinateur";}
function gSetupSheet(msg){
  openSheet('<h2>Mêmes données partout</h2><p class="small muted">Tes données sont <b>chiffrées sur ton appareil</b> avant d’être déposées en ligne : le service de stockage ne voit qu’un fichier illisible. Le code de liaison contient la clé : c’est lui seul qui permet de les lire.</p>'+
  '<details open><summary>Premier appareil</summary><div class="in"><p class="small muted">Active la synchro ici, puis copie le code pour ton autre appareil.</p><button class="btn primary" data-sact="gstart" style="width:100%">Activer la synchro</button></div></details>'+
  '<details><summary>Deuxième appareil</summary><div class="in"><p class="small muted">Colle ici le code de liaison affiché sur le premier appareil (Réglages › Synchro › Afficher le code).</p>'+
  '<div class="fields"><label class="field">Code de liaison<input id="gcodein" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="cdz3.…"></label></div>'+
  '<button class="btn primary" data-sact="gcode" style="width:100%">Lier cet appareil</button></div></details>'+
  '<p class="small" id="gerr" role="alert" style="color:var(--bad);margin-top:10px">'+esc(msg||"")+'</p>');
}
function gManageSheet(showCode){
  openSheet('<h2>Synchro entre appareils</h2><p class="small muted">Cet appareil : '+esc(GS.dev||"?")+'.<br>'+(GS.err?'<span style="color:var(--bad)">'+esc(GS.err)+'</span>':GS.t?'Dernière synchro '+ago(GS.t)+'.':'En attente de la première synchro.')+'</p>'+
  '<p class="small muted">Ça se synchronise tout seul à l’ouverture de l’appli et quelques secondes après chaque modification. Le thème, le chrono de course et l’onglet ouvert restent propres à chaque appareil.</p>'+
  '<button class="btn primary" data-sact="gnow" style="width:100%;margin:8px 0">Synchroniser maintenant</button>'+
  '<button class="btn ghost" data-sact="gshow" style="width:100%;margin:0 0 8px">Afficher le code de liaison (autre appareil)</button>'+
  '<div id="gcodebox"'+(showCode?'':' hidden')+'><p class="small muted">Copie ce code et colle-le sur ton autre appareil. Ne le partage avec personne : il permet de lire tes données.</p><textarea id="gcodeta" readonly rows="4" aria-label="Code de liaison" style="width:100%;font-family:var(--mono);font-size:12px">'+(showCode?esc(CSYNC.makeCode(GS)):'')+'</textarea><button class="btn ghost" data-sact="gcopy" style="width:100%;margin-top:6px">Copier</button></div>'+
  '<button class="btn ghost" data-sact="gout" style="width:100%;margin-top:8px;color:var(--bad)">Déconnecter cet appareil</button>');
}
function gStart(){
  var err=$("gerr"); function say(m){if(err)err.textContent=m;}
  if(!(window.crypto&&crypto.subtle)){say("Le chiffrement n’est pas disponible ici (ouvre l’appli en https)."); return;}
  var cfg=CSYNC.newConfig(); cfg.dev=gDevice(); cfg.t=0; cfg.err=""; say("Activation…");
  var L=normShared(D); cfg.last=CSYNC.hashOf(L);
  CSYNC.create(cfg,CSYNC.wrapDoc(L,cfg.dev,"")).then(function(){GS=cfg; gsave(); gManageSheet(true); render(true); toast("Synchro activée. Copie le code pour ton autre appareil.");})
   .catch(function(e){say(e&&e.name==="TypeError"?"Impossible de joindre le service de stockage (réseau ou blocage du navigateur).":(e&&e.message)||"Échec");});
}
function gJoin(){
  var err=$("gerr"); function say(m){if(err)err.textContent=m;}
  var p=CSYNC.parseCode($("gcodein").value); if(!p){say("Code de liaison invalide : copie-le en entier depuis l’autre appareil."); return;}
  var cfg={id:p.id,key:p.key,sb:1,dev:gDevice(),last:"",t:0,err:""}; say("Liaison…");
  CSYNC.getRemote(cfg).then(function(){GS=cfg; gsave(); closeSheet(); toast("Appareil lié. Première synchro…"); return gsync("liaison",true).then(function(){render(true);});})
   .catch(function(e){say(e&&e.name==="TypeError"?"Impossible de joindre le service de stockage.":(e&&e.message)||"Échec");});
}
document.addEventListener("visibilitychange",function(){if(!document.hidden)gsync("retour");});
window.addEventListener("online",function(){gsync("en ligne");});
setTimeout(function(){gsync("ouverture");},2200); setInterval(function(){if(!document.hidden)gsync("minuteur");},120000);
window.addEventListener("storage",function(e){ if(e.key!==KEY||!e.newValue||e.newValue===SEEN)return; // autre fenêtre : fusion sans perte
  try{var v=SAFE.validate(JSON.parse(e.newValue)); if(!v.ok)return; D=assignState(blank(),SAFE.merge(D,v.state).state); MC={}; PC={}; SEEN=e.newValue; if(save())render(true);}catch(x){}});
if(window.SAFE){SAFE.persist(); setTimeout(function(){snapSoon(JSON.stringify(D));},1500);
  if(LOADNOTE){var bad=""; try{bad=localStorage.getItem(KEY+".bad")||"";}catch(e){} if(bad)SAFE.snap("illisible",bad);
    setTimeout(function(){toast(LOADNOTE==="prev"?"Données abîmées : version précédente récupérée. Voir Réglages › Copies automatiques.":"Données illisibles, copie gardée. Réglages › Copies automatiques pour restaurer.");},800);}}
setTimeout(checkUpdate,1500); setInterval(checkUpdate,10*60*1000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)checkUpdate();});
})();
