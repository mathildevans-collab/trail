// Plan THP40 · v3 · plusieurs courses, un plan par course A, séances modifiables
(function(){
"use strict";
var $=function(id){return document.getElementById(id);};

// ---------- constantes ----------
var KEY="thp40v3", OLDKEY="thp40v2";
var STRAVA=true;    // sorties lues dans activities.json, écrit toutes les 2 h par l’Action GitHub « Strava sync »
var REPO="mathildevans-collab/trail", DEF_JSON="https://raw.githubusercontent.com/"+REPO+"/main/activities.json";
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
function nutOfTag(tag){return tag==="q"?"quality":tag==="l"?"long":"easy";}

// ---------- état ----------
function thpRace(){return {id:"thp40",name:"THP40",full:"Trail de Haute Provence",place:"Forcalquier",date:"2027-05-08",time:"08:00",km:38.8,dp:1279,goal:295,prio:"A",builtin:true,start:"2026-11-09"};}
function blank(){return {v:3,races:[thpRace()],active:"thp40",focus:"thp40",done:{},actual:{},ci:{},adj:{},edits:{},cycle:{on:false,start:"",len:28},kit:{},todo:{},
  set:{theme:"auto",json:DEF_JSON,gel:35,water:15,vib:true,checkin:true,fake:""},race:null,practice:null,results:{},sync:{t:0,upd:"",err:"",gh:""}};}
var OBJ={set:1,cycle:1,sync:1};
function assignState(n,o){for(var k in n){if(o[k]==null)continue; if(OBJ[k]&&typeof o[k]==="object")Object.assign(n[k],o[k]); else n[k]=o[k];} return n;}
function load(){
  var r=null; try{r=JSON.parse(localStorage.getItem(KEY)||"null");}catch(e){}
  if(r&&typeof r==="object")return assignState(blank(),r);
  try{var old=JSON.parse(localStorage.getItem(OLDKEY)||"null"); if(old&&typeof old==="object")return migrate(old,blank());}catch(e){}
  try{var v1=JSON.parse(localStorage.getItem("thp40-state")||"null"); if(v1&&typeof v1==="object"){var kit=null; try{kit=JSON.parse(localStorage.getItem("thp40-kit")||"null");}catch(e){} if(kit&&typeof kit==="object")v1.kit=kit; return migrate(v1,blank());}}catch(e){}
  return blank();
}
function migrate(o,n){
  var t=n.races[0], s=o.set||{};
  if(s.goal)t.goal=s.goal; if(isoOk(s.raceDate))t.date=s.raceDate; if(s.raceTime)t.time=s.raceTime;
  ["theme","gel","water","vib","checkin"].forEach(function(k){if(s[k]!=null)n.set[k]=s[k];});
  Object.keys(o.done||{}).forEach(function(k){n.done["thp40:"+k]=1;});
  Object.keys(o.actual||{}).forEach(function(k){var a=o.actual[k]; if(a&&a.src!=="strava")n.actual["thp40:"+k]=a;});
  Object.keys(o.adj||{}).forEach(function(k){n.adj["thp40:"+k]=o.adj[k];});
  Object.keys(o.ci||{}).forEach(function(k){n.ci["thp40:"+k]=o.ci[k];});
  if(o.cycle)n.cycle=o.cycle; if(o.kit)n.kit={thp40:o.kit};
  Object.keys(o.todo||{}).forEach(function(k){n.todo["thp40:"+k]=o.todo[k];});
  if(o.result)n.results.thp40=o.result; if(o.gpx)t.gpx=o.gpx;
  return n;
}
var D=load(), VER=0;
function save(){VER++; try{localStorage.setItem(KEY,JSON.stringify(D));}catch(e){toast("Mémoire du téléphone pleine : données non enregistrées.");}}

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
function nb(x){return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
function hm(m){m=Math.round(m); var h=Math.floor(m/60); return h+" h "+pz(m-h*60);}
function hmc(m){m=Math.round(m); var h=Math.floor(m/60); return h+"h"+pz(m-h*60);}
function hmi(m){m=Math.round(m); var h=Math.floor(m/60); return h+":"+pz(m-h*60);}
function hms(s){s=Math.max(0,Math.floor(s)); return Math.floor(s/3600)+":"+pz(Math.floor(s/60)%60)+":"+pz(s%60);}
function dur(sec){var h=Math.floor(sec/3600), m=Math.round((sec%3600)/60); if(m===60){h++;m=0;} return h>0?h+" h "+pz(m):m+" min";}
function mmss(x){x=Math.round(x); var m=Math.floor(x/60); return m+":"+pz(x-m*60);}
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
function goalOf(r){return +r.goal||estGoal(+r.km||10,+r.dp||0);}

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
  m.kmAt=function(min){if(min<=0)return 0; var lo=0,hi=m.L; for(var k=0;k<32;k++){var x=(lo+hi)/2; if(m.cumMin(x)<min)lo=x; else hi=x;} return lo;};
  MC[r.id]={key:key,m:m}; return m;
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
function sess(o){o.k=o.k||KEYS[o.dow]; o.nut=o.nut||nutOfTag(o.tag); return o;}
function wedOf(km,code,w){return sess({dow:2,tag:"e",type:"Endurance + renfo",km:km,dp:0,nut:"easy",pace:"6:00 à 6:25/km",pacel:"Allure facile",renfo:code,steps:[[km+" km","Zone 2, 135-150 bpm"],["20-25 min",RENFO[code].name+" à la maison"]],txt:km+" km en zone 2 (135 à 150 bpm) "+WEDV[(w-1)%4]+", puis 20 à 25 min de renforcement à la maison ("+RENFO[code].name+")."});}
function thuOf(light){return sess({dow:3,tag:"q",type:"Club · piste",km:light?7:9,dp:0,nut:"quality",txt:"Séance du club, rien de prévu par le plan : fais ce que propose ton coach du club"+(light?", en version allégée (échauffement et moitié du volume)":"")+"."});}
function longSteps(km){return km>=14?[[km+" km","Zone 2, marche active dans les côtes"],["Pendant","40 à 60 g de glucides par heure"]]:[[km+" km","Zone 2, allure conversation"]];}
function raceWeek(r,m){
  var rd=dowOf(dms(r.date)), S=[];
  if(rd>1)S.push(sess({dow:1,tag:"q",type:"Rappel",km:6,dp:0,nut:"quality",steps:[["6 km","Zone 2"],["4 × 20 s","À allure course"]],txt:"6 km en Z2, puis 4 × 20 s à allure course."}));
  if(rd>2)S.push(sess({dow:2,tag:"e",type:"Footing",km:4,dp:0,txt:"4 km très faciles. Prépare ton sac, ta tenue et ton ravitaillement."}));
  if(rd>3)S.push(sess({dow:3,tag:"e",type:"Club allégé",km:5,dp:0,txt:"Au club : échauffement et lignes droites seulement, pas de séance dure."}));
  if(rd-1>=0&&!S.some(function(s){return s.dow===rd-1;}))S.push(sess({dow:rd-1,tag:"e",type:"Activation",km:3,dp:0,nut:"b2b",txt:"15 min très faciles et 3 lignes droites. Prépare tout ce soir, couche-toi tôt."}));
  S.push(sess({k:"race",dow:rd,tag:"l",type:"Jour J",km:m.L,dp:m.dp,nut:"race",race:true,txt:r.name+" : "+kmS(m.L)+" km, +"+nb(m.dp)+" m, objectif "+hm(m.goal)+". Départ à "+r.time+"."}));
  if(rd<6)S.push(sess({dow:rd+1,tag:"e",type:"Récupération",km:0,dp:0,nut:"rest",txt:"Marche de 30 min et étirements doux."}));
  return S;
}
function thpWeek(w,r,m){
  if(w===26)return {ph:"Affûtage",rec:false,s:raceWeek(r,m),note:NOTES[26]};
  var ph=w<=8?"Base":w<=16?"Construction":w<=23?"Spécifique":"Affûtage", rec=!!REC[w];
  var d=R[w-1], sk_=d[3], sd=d[4], uk=Math.max(15,d[5]), ud=Math.max(500,d[6]);
  if(ph!=="Base"){if(sk_>=18)sd=Math.min(sd,Math.round(sk_*36)); if(uk>=18)ud=Math.min(ud,Math.round(uk*36));}
  var t=TS[w-1], b2b=w===14||w===18||w===21, code=w>=24?"D":(w<=8?"A":w<=16?"B":"C")+(w%2===1?"1":"2");
  var S=[sess(Object.assign({dow:1},tuesdayOf(t[0],t[1],ph))),wedOf(d[1],code,w),thuOf(rec),
    sess({dow:5,tag:"l",type:"Sortie longue",km:sk_,dp:sd,nut:b2b?"b2b":"long",steps:longSteps(sk_),txt:sk_+" km de trail, +"+sd+" m. "+SAT_T[w-1]}),
    sess({dow:6,tag:"l",type:b2b?"Jour 2 du bloc":"Sortie club · dimanche",km:uk,dp:ud,nut:"long",club:true,steps:longSteps(uk),txt:"Sortie du club, minimum 15 km, 2 h et +500 m. Prévu aujourd’hui : "+uk+" km, +"+ud+" m. "+SUN_T[w-1]})];
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
  var sd=Math.round(sk_*g*0.85/10)*10, ud=ph==="Affûtage"?Math.round(uk*g*0.6/10)*10:Math.max(500,Math.round(uk*g*0.75/10)*10);
  var wed=rec?7:Math.round(6+3*f), code=renfoOf(ph,w);
  var S=[sess(Object.assign({dow:1},tu)),wedOf(wed,code,w),thuOf(rec||ph==="Affûtage"),
    sess({dow:5,tag:"l",type:"Sortie longue",km:sk_,dp:sd,steps:longSteps(sk_),txt:sk_+" km de trail, +"+sd+" m. "+(rec?"Sortie facile pour récupérer.":SATG[ph])}),
    sess({dow:6,tag:"l",type:"Sortie club · dimanche",km:uk,dp:ud,club:ph!=="Affûtage",steps:longSteps(uk),txt:(ph==="Affûtage"?"Sortie facile, "+uk+" km, +"+ud+" m.":"Sortie du club, minimum 15 km, 2 h et +500 m. Prévu aujourd’hui : "+uk+" km, +"+ud+" m.")+(ph==="Spécifique"&&!rec?" Les 20 dernières minutes à allure course (environ "+mmss(rpace(m,uk,ud))+"/km sur ce relief).":"")})];
  return {ph:ph,rec:rec,s:S,note:note};
}
var PC={};
function planOf(r){
  if(!r)return null;
  var key=VER+"|"+todayUTC()+"|"+r.date+"|"+r.start+"|"+r.km+"|"+r.dp+"|"+goalOf(r);
  if(PC[r.id]&&PC[r.id].key===key)return PC[r.id].p;
  var m=model(r), rws=mondayOf(dms(r.date)), start=r.builtin?dms(r.start):mondayOf(dms(isoOk(r.start)?r.start:nextMonday()));
  if(start>rws)start=rws;
  var n=r.builtin?26:Math.max(1,Math.round((rws-start)/WEEK)+1), taper=n>=14?2:n>=8?1:0, weeks=[];
  for(var w=1;w<=n;w++){var b=r.builtin?thpWeek(w,r,m):genWeek(w,n,taper,r,m); weeks.push({n:w,ph:b.ph,rec:b.rec,s:b.s,note:b.note||"",start:start+(w-1)*WEEK});}
  // courses B dans la période du plan
  D.races.forEach(function(b){if(b.prio!=="B")return; var t=dms(b.date); if(t<start||t>=dms(r.date))return;
    var wk=weeks[Math.floor((t-start)/WEEK)], dw=dowOf(t), bm=model(b);
    wk.s=wk.s.filter(function(s){return s.dow!==dw;}).map(function(s){
      if(s.dow===dw-1&&s.km)return sess({k:s.k,dow:s.dow,tag:"e",type:"Activation",km:3,dp:0,nut:"b2b",txt:"Veille de course : 15 min très faciles et 3 lignes droites."});
      if(s.dow===dw+1&&s.km)return sess({k:s.k,dow:s.dow,tag:"e",type:"Récupération",km:Math.min(6,s.km),dp:0,nut:"rest",txt:"Lendemain de course : footing très facile en zone 1, ou marche."});
      return s;});
    wk.s.push(sess({k:KEYS[dw],dow:dw,tag:"l",type:"Course B",name:b.name,bid:b.id,km:bm.L,dp:bm.dp,nut:"race",txt:b.name+" : "+kmS(bm.L)+" km, +"+nb(bm.dp)+" m. Course de préparation : teste ton allure, ton ravitaillement et ton matériel."+(dms(r.date)-t<21*DAY?" À moins de 3 semaines de l’objectif : ne la cours pas à fond.":"")}));
    wk.hasB=true;});
  // modifications faites à la main
  var E=D.edits[r.id]||{};
  weeks.forEach(function(wk){
    wk.s=wk.s.map(function(s){var o=E[wk.n+"-"+s.k]; if(!o)return s; if(o.del)return null; var c=Object.assign({},s,o,{edited:true}); if((o.type&&o.type!==s.type)||(o.km!=null&&o.km!==s.km)){c.steps=null; c.pace=null;} if(o.type&&o.type!==s.type&&o.type!=="Endurance + renfo")c.renfo=null; return c;}).filter(Boolean);
    Object.keys(E).forEach(function(k){var mm=/^(\d+)-(x\w+)$/.exec(k); if(mm&&+mm[1]===wk.n&&!E[k].del)wk.s.push(Object.assign({k:mm[2],added:true,edited:true},E[k]));});
    wk.s.sort(function(a,b){return a.dow-b.dow;});
    wk.km=0; wk.dp=0; wk.s.forEach(function(s){if(!s.race){wk.km+=s.km||0; wk.dp+=s.dp||0;}}); wk.km=Math.round(wk.km); wk.dp=Math.round(wk.dp);
  });
  var p={r:r,m:m,start:start,n:n,weeks:weeks,end:dms(r.date)};
  PC[r.id]={key:key,p:p}; return p;
}
function sk(r,w,k){return r.id+":"+w+"-"+k;}
function sessDate(pl,w,s){return pl.start+((w-1)*7+s.dow)*DAY;}
function sessByKey(wk,k){if(!wk)return null; for(var i=0;i<wk.s.length;i++)if(wk.s[i].k===k)return wk.s[i]; return null;}
function sessAt(wk,dow){if(!wk)return null; for(var i=0;i<wk.s.length;i++)if(wk.s[i].dow===dow)return wk.s[i]; return null;}
function planIdx(pl){return Math.floor((todayUTC()-pl.start)/DAY);}
function nowWeek(pl){var i=planIdx(pl); return i<0?1:Math.min(pl.n,Math.floor(i/7)+1);}
function weekDone(r,wk){var c=0; wk.s.forEach(function(s){if(D.done[sk(r,wk.n,s.k)])c++;}); return c;}
function nSess(wk){return wk.s.filter(function(s){return !s.race;}).length;}
function totals(pl){var t=0,d=0; pl.weeks.forEach(function(wk){t+=nSess(wk); d+=weekDone(pl.r,wk);}); return {t:t,d:d};}
function estDur(m,s){if(s.bid){var br=raceById(s.bid); return br?goalOf(br)*60:0;} if(!s.km||s.race)return 0; return (s.km+(s.dp||0)/100)*m.eff*(s.tag==="q"?1:1.12);}
function byDate(pl){var o={}; pl.weeks.forEach(function(wk){wk.s.forEach(function(s){o[iso(sessDate(pl,wk.n,s))]={w:wk.n,s:s};});}); return o;}

// ---------- coach ----------
var BADGE=[["ok","En cible"],["warn","À ajuster"],["off","Hors cible"]];
function review(m,s,ac){
  var L=[],lvl=0,fast=false; function bump(n){if(n>lvl)lvl=n;}
  if(s.type.indexOf("Club")===0){L.push("Séance du club enregistrée. Elle compte dans ta semaine, rien à comparer avec le plan."); return {lvl:0,lines:L,fast:false};}
  if(s.race||s.type==="Course B"){L.push("Course enregistrée : "+kmS(ac.km)+" km"+(ac.t?" en "+dur(ac.t):"")+"."); return {lvl:0,lines:L,fast:false};}
  if(s.km>0){var r=ac.km/s.km;
    if(r>1.15){bump(1);L.push("Plus long que prévu : "+kmS(ac.km)+" km pour "+kmS(s.km)+" prévus. Garde de la fraîcheur pour la suite.");}
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
  else if((ok&&pc<75)||(ok&&pc<90&&(heavy||bad))||(heavy&&bad)){mode="light"; lead=cap(volTxt+(volTxt&&ciTxt?" et ":"")+ciTxt+"."); prop="Je te propose une semaine allégée (−18 %).";
    effx=["Mardi, mercredi, samedi : −18 % en distance et en dénivelé"+(sat?" (samedi "+kmS(sat.km)+" → "+kmS(sat.km*LIGHT)+" km)":"")+".","Dimanche (club) : jamais sous le minimum du club.","Jeudi : club, inchangé."];}
  else if(ok&&st.fast>=2){mode="z2"; lead=st.fast+" sorties faciles trop rapides la semaine dernière."; prop="Cette semaine, Zone 2 stricte."; effx=["Sorties faciles et longues : sous 150 bpm, même si ça paraît lent.","Marche dès que la FC dépasse 150 bpm dans les côtes.","Le volume ne change pas."];}
  else if(ok||hasCi){mode="normal"; lead=cap(volTxt+(volTxt&&hasCi?", ":"")+(hasCi?"ton check-in est bon":"")+"."); prop="On garde le plan normal."; effx=["Aucun changement cette semaine."];}
  if(!mode)return null;
  return {mode:mode,lead:lead,prop:prop,reasons:reasons,eff:effx};
}
function P(pl,w){
  var wk=pl.weeks[w-1]; if(!wk||w<2||D.adj[pl.r.id+":"+w]!=="on")return wk;
  var a=adjFor(pl,w); if(!a||(a.mode!=="light"&&a.mode!=="micro"))return wk;
  var f=a.mode==="light"?LIGHT:MICRO, lab=a.mode==="light"?"Allégée −18 %":"Micro-récup. −12 %";
  var S=wk.s.map(function(s){var c=Object.assign({},s); if(s.type.indexOf("Club")===0||s.race||s.type==="Course B")return c; c.km=Math.round(s.km*f*10)/10; c.dp=Math.round(s.dp*f); c.adjusted=true; c.steps=null;
    if(s.club){c.km=Math.max(15,c.km); c.dp=Math.max(500,c.dp);} c.txt=s.txt+" Version allégée : vise "+kmS(c.km)+" km"+(c.dp?" et +"+c.dp+" m":"")+"."; return c;});
  if(a.mode==="micro")S=S.map(function(s){return s.dow===1&&s.tag==="q"?sess({k:s.k,dow:1,tag:"e",type:"Progressif",km:7,dp:100,adjusted:true,steps:[["40 min","De la zone 1-2 à la zone 3 basse"]],txt:"Micro-récupération : 40 min en progressif. Pas de séance de qualité aujourd’hui."}):s;});
  return Object.assign({},wk,{s:S,adjLabel:lab});
}
function cycleDay(t){var c=D.cycle; if(!c.on||!isoOk(c.start))return 0; var d=Math.floor((t-dms(c.start))/DAY); if(d<0)return 0; return (d%(c.len||28))+1;}
function inPeriod(t){var c=cycleDay(t); return c>=1&&c<=5;}
function cycleBanner(t,s){
  if(!inPeriod(t))return ""; var opt="";
  if(s&&s.tag==="q"&&s.type.indexOf("Club")<0)opt=" Option : une version allégée aujourd’hui (quelques répétitions de moins, ou un tempo raccourci de 10 min).";
  else if(s&&s.tag==="l"&&s.km&&!s.race)opt=" Option : réduire cette sortie de 10 à 15 %, soit environ "+kmS(s.km*0.87)+" km.";
  return '<div class="banner">Tu es en phase menstruelle. C’est normal de se sentir un peu moins forte ou plus fatiguée. Tu peux garder le plan, ou baisser légèrement l’intensité.'+opt+'</div>';
}

// ---------- icônes ----------
function sv(p,w){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';}
var I={
 gear:sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
 check:sv('<path d="M5 12l5 5 9-10"/>',3), play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
 back:sv('<path d="M15 5l-7 7 7 7"/>',2.4), sync:sv('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
 heart:sv('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'), cycle:sv('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'),
 bell:sv('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'), flag:sv('<path d="M5 21V4h11l-2 4 2 4H5"/>'),
 gel:sv('<path d="M9 3h6v4l2 3v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9l2-3z"/>'), drop:sv('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
 vib:sv('<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 8v8M20 8v8"/>'), up:sv('<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>'),
 down:sv('<path d="M12 3v12M7 10l5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>'), trash:sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
 help:sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01"/>'), dumb:sv('<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>'),
 leaf:sv('<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19l7-7"/>'), pin:sv('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
 watch:sv('<rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2l1.5 1"/>'), pen:sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'), list:sv('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>')
};

// ---------- petits blocs ----------
function header(eyebrow,title){return '<div class="top"><div><span class="eyebrow">'+eyebrow+'</span><h2>'+title+'</h2></div><button class="ibtn" data-go="settings" aria-label="Réglages">'+I.gear+'</button></div>';}
function todoBtn(key,label,store){var st=store||D.todo, on=!!st[key]; return '<button class="todo" data-todo="'+esc(key)+'"'+(store?' data-store="kit"':'')+' aria-pressed="'+on+'"><span class="box">'+(on?I.check:"")+'</span><span class="t">'+label+'</span></button>';}
function exHTML(list){return list.map(function(e){return '<div class="ex"><span>'+esc(e[0])+'</span><span>'+esc(e[1])+'</span></div>';}).join("");}
function nutHTML(k){var n=NUT[k]; if(!n)return ""; var h='<dl class="nut"><dt>'+esc(n.t)+'</dt><dd>Glucides ≈ '+n.c+' g sur la journée ('+n.cg+'). Protéines ≈ '+n.p+' g, en 4 prises de 25 à 30 g.</dd>';
  if(n.pre)h+='<dt>Avant</dt><dd>'+esc(n.pre)+'</dd>'; if(n.dur)h+='<dt>Pendant</dt><dd>'+esc(n.dur)+'</dd>'; if(n.post)h+='<dt>Après</dt><dd>'+esc(n.post)+'</dd>'; return h+'<dt>Astuce</dt><dd>'+esc(n.tip)+'</dd></dl>';}
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
var tab="today", cur=1, sel=1, browsing=false, openWk=null, prevTab="today", resetArmed=false, editRes=false;
function goNow(){browsing=false; var r=activeRace(), pl=planOf(r); if(!pl)return; var i=planIdx(pl); cur=nowWeek(pl);
  if(i>=0&&i<pl.n*7)sel=i%7; else{var wk=pl.weeks[cur-1]; sel=wk&&wk.s.length?wk.s[0].dow:1;}}

// ---------- Aujourd’hui ----------
function vToday(){
  var r=activeRace();
  if(!r)return header(fmtL(todayUTC()),"Aujourd’hui")+banners()+'<div class="card empty"><h3>Aucune course au programme</h3><p class="muted">Ajoute une course objectif : l’appli te prépare un plan jusqu’au jour J.</p><button class="btn primary" data-act="addrace">+ Ajouter une course</button></div>';
  var pl=planOf(r), ph=phaseOf(r);
  if(browsing||ph==="prep")return vPrep(r,pl);
  if(ph==="taper")return vTaper(r,pl);
  if(ph==="race")return vRaceDay(r,pl);
  return vAfter(r,pl);
}
function vPrep(r,pl){
  var ti=planIdx(pl), tw=ti>=0?Math.floor(ti/7)+1:0, td=ti>=0?ti%7:-1;
  if(cur>pl.n)cur=pl.n; if(cur<1)cur=1;
  var wk=P(pl,cur), selD=pl.start+((cur-1)*7+sel)*DAY, isToday=selD===todayUTC();
  var h=header(fmtL(todayUTC())+" · "+jx(r),isToday?"Aujourd’hui":fmtL(selD))+banners();
  if(ti<0&&!browsing)h+='<div class="banner">Ton plan '+esc(r.name)+' démarre le '+fmtL(pl.start).toLowerCase()+', dans '+(-ti)+' jour'+(-ti>1?"s":"")+'.</div>';
  var nw=nowWeek(pl);
  h+='<div class="wnav"><button data-wnav="-1" aria-label="Semaine précédente"'+(cur<=1?" disabled":"")+'>‹</button><div><b>Semaine '+cur+'<small> / '+pl.n+'</small></b><span>'+fmtS(wk.start)+' – '+fmtS(wk.start+6*DAY)+' · '+esc(wk.ph)+'</span></div><button data-wnav="1" aria-label="Semaine suivante"'+(cur>=pl.n?" disabled":"")+'>›</button></div>';
  if(browsing&&cur!==nw)h+='<div class="banner mini"><span>'+(cur<nw?'Semaine passée':'Semaine à venir')+'</span><button data-act="now">Aujourd’hui</button></div>';
  h+='<div class="strip" role="group" aria-label="Jours de la semaine">';
  for(var i=0;i<7;i++){var s0=sessAt(wk,i), dn=s0&&D.done[sk(r,cur,s0.k)], tdy=cur===tw&&i===td;
    h+='<button class="day'+(s0?" has":"")+(dn?" done":"")+(tdy?" today":"")+'" data-day="'+i+'" aria-pressed="'+(sel===i)+'" aria-label="'+DOWL[i]+(s0?", "+esc(s0.type):", repos")+(dn?", faite":"")+'"><span>'+DL[i]+'</span><b>'+new Date(pl.start+((cur-1)*7+i)*DAY).getUTCDate()+'</b><i></i></button>';}
  h+='</div>';
  var s=sessAt(wk,sel);
  h+=cycleBanner(selD,s);
  var showM=cur===tw&&sel===td;
  h+=s?sessionHero(r,pl,wk,s):restCard(wk,sel);
  h+=bilanCard(r,pl);
  h+=weekCard(r,pl,wk,s,showM);
  h+=checkinCard(r,pl,cur);
  return h;
}
function sessionHero(r,pl,wk,s){
  var k=sk(r,wk.n,s.k), dn=!!D.done[k], z=zoneOf(s.type).split(" · ")[0], ed=estDur(pl.m,s), ac=D.actual[k], isB=s.type==="Course B";
  var h='<div class="card hero"><div class="sb"><span class="eyebrow">Semaine '+wk.n+' · '+wk.ph+(wk.rec?' · allégée':'')+'</span>'+(s.race?'':'<button class="hedit" data-edit="'+wk.n+'-'+s.k+'">Modifier</button>')+'</div><h2>'+esc(isB?s.name:s.type)+'</h2>';
  var tags=[]; if(isB)tags.push("Course B"); if(s.adjusted&&wk.adjLabel)tags.push(wk.adjLabel); if(s.edited)tags.push(s.added?"Ajoutée par toi":"Modifiée par toi"); if(s.club)tags.push("Club : 15 km, 2 h, +500 m min.");
  if(tags.length)h+='<div class="tagline">'+tags.map(function(t){return '<span class="chip">'+esc(t)+'</span>';}).join("")+'</div>';
  h+='<div class="facts num">'+(s.km?'<span>'+kmS(s.km)+' km</span>':'')+(s.dp?'<span>+'+nb(s.dp)+' m</span>':'')+(z?'<span>'+esc(z)+'</span>':'')+(ed&&s.type.indexOf("Club")<0?'<span>≈ '+dur(ed)+'</span>':'')+'</div>';
  if(WHY[s.type])h+='<div class="why"><b>Pourquoi :</b> '+esc(WHY[s.type])+'</div>';
  if(s.steps&&s.steps.length)h+='<ul class="steps">'+s.steps.map(function(x){return '<li><span>'+esc(x[0])+'</span><span>'+esc(x[1])+'</span></li>';}).join("")+'</ul>'+(s.txt?'<details><summary>Consignes complètes</summary><div class="in"><p>'+esc(s.txt)+'</p></div></details>':'');
  else if(s.txt)h+='<p>'+esc(s.txt)+'</p>';
  var a=adjFor(pl,wk.n); if(a&&a.mode==="z2"&&(s.tag==="e"||s.tag==="l"))h+='<p><b>Zone 2 stricte cette semaine :</b> reste sous 150 bpm.</p>';
  if(s.race)return h+'<button class="btn" data-go="today-race">'+I.play+' Voir le jour J</button></div>';
  if(isB)h+='<button class="btn" data-race="'+s.bid+'">'+I.play+' Lancer le mode Course</button>';
  h+='<button class="btn'+(dn?" isdone":"")+'" data-done="'+k+'"'+(isB?' style="margin-top:8px"':'')+'>'+I.check+(dn?' Faite · toucher pour annuler':' C’est fait')+'</button>';
  h+='<p class="sub">'+(ac?'Tes chiffres : '+kmS(ac.km)+' km'+(ac.dp?' · +'+ac.dp+' m':'')+(ac.t?' · '+dur(ac.t):'')+'. <button data-act="manual" data-w="'+wk.n+'" data-k="'+s.k+'">Corriger</button>':STRAVA?'Le bilan arrive tout seul quand Strava reçoit ta sortie.':'<button data-act="manual" data-w="'+wk.n+'" data-k="'+s.k+'">Ajoute tes chiffres</button> pour avoir le bilan du coach.')+'</p>';
  return h+'</div>';
}
function restCard(wk,dow){return '<div class="card"><div class="sb"><span class="eyebrow">Semaine '+wk.n+' · '+wk.ph+'</span><button class="btn sm" data-act="addses" data-w="'+wk.n+'" data-d="'+dow+'" style="min-height:36px">+ Séance</button></div><h3 style="font-size:26px;margin:6px 0 8px">Repos</h3><p>Pas de course aujourd’hui. Dix minutes de mobilité suffisent.</p><details><summary>'+I.leaf+' Routine de mobilité</summary><div class="in">'+exHTML(MOB)+'</div></details></div>';}
function bilanCard(r,pl){
  var t=todayUTC(), best=null;
  pl.weeks.forEach(function(wk){wk.s.forEach(function(s){var d=sessDate(pl,wk.n,s), ac=D.actual[sk(r,wk.n,s.k)]; if(ac&&d<=t&&t-d<=10*DAY&&(!best||d>best.d))best={d:d,s:s,ac:ac};});});
  if(!best)return "";
  var rv=review(pl.m,best.s,best.ac), b=BADGE[rv.lvl], ac=best.ac, s=best.s;
  return '<div class="card"><div class="verdict"><h3>'+(best.d===t?"Bilan du jour":"Bilan de "+DOWL[dowOf(best.d)])+'</h3><span class="chip '+b[0]+'">'+b[1]+'</span></div><div class="stats num"><div class="stat"><b>'+kmS(ac.km)+'</b><span>km · prévu '+kmS(s.km)+'</span></div><div class="stat"><b>+'+nb(ac.dp||0)+'</b><span>m · prévu '+nb(s.dp||0)+'</span></div><div class="stat"><b>'+(ac.t?mmss(ac.t/ac.km):"–")+'</b><span>/km'+(ac.t?" · "+dur(ac.t):"")+'</span></div></div><p class="small" style="margin:10px 0 0">'+esc(rv.lines.join(" "))+'</p></div>';
}
function weekTot(r,wk,upto){
  var pk=0,ak=0,pd=0,ad=0,ek=0,ed=0;
  wk.s.forEach(function(x){if(x.race)return; pk+=x.km||0; pd+=x.dp||0; if(x.dow<=upto){ek+=x.km||0; ed+=x.dp||0;} var ac=D.actual[sk(r,wk.n,x.k)]; if(ac){ak+=ac.km; ad+=ac.dp||0;} else if(D.done[sk(r,wk.n,x.k)]){ak+=x.km||0; ad+=x.dp||0;}});
  return {pk:pk,ak:ak,pd:pd,ad:ad,ek:ek,ed:ed};
}
var WM="km";
// Résumé façon Strava : chiffres de la semaine + histogramme semaine par semaine (prévu en clair, réalisé en couleur)
function weekMeter(r,pl,wk,td){
  var t=weekTot(r,wk,td), isKm=WM==="km", tt=0;
  wk.s.forEach(function(x){var ac=D.actual[sk(r,wk.n,x.k)]; if(ac)tt+=ac.t||0;});
  var n0=Math.max(1,Math.min(wk.n-5,pl.n-7)), n1=Math.min(pl.n,n0+7), W=[], mx=1, i, o;
  for(i=n0;i<=n1;i++){o=weekTot(r,P(pl,i),6); W.push({n:i,pl:isKm?o.pk:o.pd,ac:isKm?o.ak:o.ad}); mx=Math.max(mx,isKm?o.pk:o.pd,isKm?o.ak:o.ad);}
  var h='<div class="card wm"><div class="wm-top"><h3>Cette semaine</h3><div class="wm-seg" role="group" aria-label="Afficher">'+
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
  var h=noMeter?'<div class="card"><div>':'<div class="card"><h3>Ta semaine</h3><div class="sb num small" style="margin-bottom:6px"><span>'+kmS(ak)+' / '+kmS(pk)+' km</span><span class="muted">'+nb(ad)+' / '+nb(pd)+' m D+</span></div><div class="bar"><i style="width:'+Math.min(100,pk?ak/pk*100:0)+'%"></i></div><div style="margin-top:8px">';
  var t=todayUTC(), rf=null; wk.s.forEach(function(x){if(x.renfo&&!rf&&sessDate(pl,wk.n,x)>=t)rf=x;}); if(!rf)wk.s.forEach(function(x){if(x.renfo&&!rf)rf=x;});
  if(rf){var R0=RENFO[rf.renfo], dd=Math.round((sessDate(pl,wk.n,rf)-t)/DAY), parts=R0.name.split(" · "); h+='<button class="link" data-sheet="renfo:'+rf.renfo+'"><span class="ico">'+I.dumb+'</span><span class="tx"><b>'+esc(parts[0])+' '+(dd===0?"aujourd’hui":dd===1?"demain":DOWL[rf.dow])+'</b><small>'+esc(parts[1]||"")+' · 25 min · une chaise</small></span><span class="chev">›</span></button>';}
  var nk=s?s.nut:"rest"; if(!NUT[nk])nk="easy";
  h+='<button class="link" data-sheet="nut:'+nk+'"><span class="ico">'+I.leaf+'</span><span class="tx"><b>Nutrition du jour</b><small>'+esc(NUT[nk].t)+' · ≈ '+NUT[nk].c+' g de glucides</small></span><span class="chev">›</span></button>';
  if(window.FIT&&FIT.wktOf(s))h+='<button class="link" data-act="watch" data-w="'+wk.n+'" data-k="'+s.k+'"><span class="ico">'+I.watch+'</span><span class="tx"><b>Envoyer à la montre</b><small>'+esc(s.type)+' en entraînement guidé · fichier .FIT</small></span><span class="chev">›</span></button>';
  if(bestLoops(s).length)h+='<button class="link" data-sheet="loops:'+wk.n+'-'+s.k+'"><span class="ico">'+I.pin+'</span><span class="tx"><b>Où courir près de chez toi</b><small>Boucles proches de '+kmS(s.km)+' km</small></span><span class="chev">›</span></button>';
  h+='<button class="link" data-act="weekplan" data-w="'+wk.n+'"><span class="ico">'+I.list+'</span><span class="tx"><b>Toute la semaine</b><small>'+weekDone(r,wk)+' / '+nSess(wk)+' séances faites · modifier</small></span><span class="chev">›</span></button>';
  return h+'</div>'+(wk.note?'<p class="small muted" style="margin:10px 0 0"><b style="color:var(--ink)">Le mot du coach :</b> '+esc(wk.note)+'</p>':'')+'</div>';
}
function checkinCard(r,pl,w){
  if(!D.set.checkin)return ""; var ti=planIdx(pl); if(ti<0||w!==nowWeek(pl)||w<2||pl.weeks[w-1].ph==="Affûtage")return "";
  var c=ciOf(r,w), a=adjFor(pl,w), st=D.adj[r.id+":"+w];
  function scale(k,l,lo,hi){var h='<div class="ci-row"><span>'+l+'</span><div class="scale">'; for(var i=1;i<=5;i++)h+='<button data-ci="'+k+'" data-v="'+i+'" aria-pressed="'+(c[k]===i)+'">'+i+'</button>'; return h+'</div><div class="scalelab"><span>'+lo+'</span><span>'+hi+'</span></div></div>';}
  var h='<div class="card"><h3>Check-in du lundi</h3><p class="small muted" style="margin:0 0 10px">10 secondes. Le coach ajuste la semaine avec tes réponses.</p>'+scale("f","Fatigue","fraîche","épuisée")+scale("s","Sommeil","mauvais","excellent");
  if(a){var dec=a.mode==="light"||a.mode==="micro", B={normal:["ok","Semaine maintenue"],light:["warn","Semaine allégée proposée"],z2:["warn","Zone 2 stricte"],micro:["warn","Micro-récupération proposée"]}[a.mode];
    if(dec&&st==="on")B=["warn",a.mode==="light"?"Semaine allégée":"Micro-récupération"]; if(dec&&st==="off")B=["ok","Plan normal gardé"];
    h+='<p class="small" style="margin:6px 0 0"><span class="chip '+B[0]+'">'+B[1]+'</span></p><p class="small" style="margin:8px 0 0">'+esc(a.lead+" "+a.prop)+'</p>';
    if(dec&&st!=="on"&&st!=="off")h+='<div class="row" style="margin-top:8px"><button class="btn primary sm" data-adj="on" data-w="'+w+'">Appliquer</button><button class="btn sm" data-adj="off" data-w="'+w+'">Garder le plan</button></div>';
    else if(dec)h+='<div class="row" style="margin-top:8px"><button class="btn sm" data-adj="'+(st==="on"?"off":"reset")+'" data-w="'+w+'">'+(st==="on"?"Annuler l’ajustement":"Revoir la proposition")+'</button></div>';
    h+='<details style="margin-top:6px"><summary class="small">Pourquoi</summary><div class="in"><ul class="pts">'+a.reasons.map(function(x){return '<li><b>'+esc(x.k)+'</b> · '+esc(x.v)+'<br><span class="muted">'+esc(x.r)+'</span></li>';}).join("")+'</ul><h4>Ce que ça change</h4><ul class="pts">'+a.eff.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul></div></details>';}
  return h+'</div>';
}

// --- semaine de course ---
function kitOf(r){return D.kit[r.id]||(D.kit[r.id]={});}
function vTaper(r,pl){
  var j=daysTo(r), rd=dms(r.date), kit=kitOf(r), bk=Object.keys(kit).filter(function(x){return kit[x];}).length;
  var h=header(fmtL(todayUTC())+" · semaine de course","Affûtage")+banners();
  h+='<div class="card"><div class="count"><b class="num">J-'+j+'</b><span><b style="font-family:var(--display);font-size:20px">'+esc(r.name)+'</b><br><span class="muted small">'+fmtD(rd)+' · '+esc(r.time)+(r.place?' · '+esc(r.place):'')+'</span></span></div><p class="small" style="margin:10px 0 0">Volume au plus bas, même intensité. Les jambes doivent se sentir légères le jour J.</p></div>';
  var T=[[-7,["Sortie test avec la tenue complète","Valider gels et sac sur 1 h 30"]],[-5,["Mobilité 10 min, pas de course","Relire le règlement et la liste du matériel","Confirmer le jour et l’heure de départ"]],[-4,["Rappel : 6 km Z2 + 4 × 20 s allure course"]],[-2,["Charger la montre, y mettre la trace GPX","Ouvrir cette appli une fois : elle marche ensuite hors ligne"]],[-1,["Retrait du dossard"+(r.place?" à "+r.place:""),"≈ 480 g de glucides, peu de fibres","Préparer le sac : matériel "+bk+" / "+KITL.length]],[0,["Petit-déjeuner 3 h avant","Arriver 1 h avant le départ"]]];
  h+='<div class="card"><h3>D’ici le jour J</h3><ul class="tl">'+T.map(function(t){var dd=rd+t[0]*DAY, cls=-j>t[0]?"past":-j===t[0]?"now":"";
    return '<li class="'+cls+'"><h4>'+(t[0]?"J"+t[0]:"Jour J")+'<span>'+(cls==="now"?"aujourd’hui":fmtD(dd))+'</span></h4>'+t[1].map(function(x,ii){return todoBtn(r.id+":t"+t[0]+"-"+ii,esc(x));}).join("")+'</li>';}).join("")+'</ul></div>';
  return h+kitCard(r);
}
function kitCard(r){
  var kit=kitOf(r), bk=Object.keys(kit).filter(function(x){return kit[x];}).length;
  return '<div class="card"><h3>Matériel obligatoire</h3><div class="sb num small" style="margin-bottom:6px"><span>'+bk+' / '+KITL.length+' prêts</span><span class="muted">'+(r.builtin?'règlement 2025, à revérifier':'liste type, vérifie le règlement')+'</span></div><div class="bar"><i style="width:'+Math.round(bk/KITL.length*100)+'%"></i></div><details id="kitd"><summary>Voir la liste</summary><div class="in">'+KITL.map(function(x,i){return todoBtn(String(i),esc(x),kit);}).join("")+'</div></details></div>';
}
function cpTable(r,m){return '<table class="tbl num"><tr><th>Point</th><th>Km</th><th>Passage</th></tr>'+m.cps.map(function(c){return '<tr><td>'+esc(c.n)+'</td><td>'+kmS(c.km)+'</td><td><b>'+hm(m.cumMin(c.km))+'</b><br><span class="muted xs">vers '+tod(r,m.cumMin(c.km))+'</span></td></tr>';}).join("")+'</table>';}

// --- jour J ---
function vRaceDay(r,pl){
  var m=pl.m, h=header(fmtL(todayUTC()),"Jour J")+banners(), R0=D.race&&D.race.rid===r.id?D.race:null, running=R0&&R0.t0&&!R0.done;
  if(D.results[r.id])return h+resultsHTML(r,m,true);
  h+='<div class="card hero"><span class="eyebrow">'+esc(r.name)+(r.place?' · '+esc(r.place):'')+' · départ '+esc(r.time)+'</span><h2>'+(running?"Tu es en course.":"C’est aujourd’hui.")+'</h2><div class="facts num"><span>'+kmS(m.L)+' km</span><span>+'+nb(m.dp)+' m</span><span>objectif '+hm(m.goal)+'</span></div>'+
     '<div class="why">Départ prudent, mange avant d’avoir faim, garde des jambes pour la fin.</div>'+
     '<button class="btn" data-race="'+r.id+'" style="min-height:64px;font-size:18px">'+I.play+(running?' Reprendre · '+hms((Date.now()-R0.t0)/1000):' Lancer le mode Course')+'</button><p class="sub">Fonctionne sans réseau. L’écran reste allumé.</p></div>';
  h+='<div class="card"><h3>Ce matin</h3>'+["Petit-déjeuner pris (3 h avant)","Dossard épinglé, puce vérifiée","Gels dans les poches avant","Montre : trace lancée, GPS fixé"].map(function(x,i){return todoBtn(r.id+":rd"+i,x);}).join("")+'</div>';
  return h+'<div class="card"><h3>Tes repères</h3>'+cpTable(r,m)+'</div>';
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
      h+='<div class="card"><h3>Section par section</h3>'+rows.map(function(x,i){return '<div style="padding:8px 0;border-top:'+(i?'1px solid var(--line)':'0')+'"><div class="sb small"><b>'+esc(x.s.n)+'</b><span class="chip '+(x.diff<=0.5?"ok":x.diff<=3?"warn":"off")+'">'+sgn(x.diff)+'</span></div>'+
        '<div style="margin-top:6px;display:grid;gap:3px"><div class="bar" style="height:6px;background:none"><i style="width:'+(x.plan/mx*100)+'%;background:var(--line)"></i></div><div class="bar" style="height:6px;background:none"><i style="width:'+(x.real/mx*100)+'%"></i></div></div>'+
        '<div class="small muted num" style="margin-top:4px">prévu '+hm(x.plan)+' · réel '+hm(x.real)+' · +'+x.s.up+' / −'+x.s.dn+' m</div></div>';}).join("")+'<div class="legend"><span><i style="background:var(--line)"></i>Prévu</span><span><i style="background:var(--brand)"></i>Réel</span></div></div>';
      var ws=m.sect[worst];
      h+='<div class="card"><h3>Là où ça a basculé</h3><p style="margin:0">'+(wv>2?'Tu as perdu le plus de temps sur la section '+esc(ws.n)+' ('+sgn(wv)+').'+(ws.dn>250?' Beaucoup de descente sur cette section : pour la prochaine course, plus de descentes techniques en phase spécifique.':ws.up>300?' Beaucoup de montée : plus de côtes enchaînées en phase spécifique.':''):'Course très régulière : aucune section ne s’écarte de plus de 2 min du plan.')+'</p></div>';
    }
    if(!editing)h+='<button class="btn sm" data-act="editres" style="margin:0 auto 12px">'+(full?'Corriger mes temps':'Ajouter mes temps de passage')+'</button>';
  }
  if(editing){var S2=(Rr&&Rr.splits)||[];
    h+='<div class="card"><h3>'+(Rr?"Mes temps":"Ton temps")+'</h3><p class="small muted">Temps depuis le départ, en heures:minutes. Remplis tout, ou seulement l’arrivée.</p>'+
      m.cps.map(function(c,i){var v=S2.length===nC?S2[i]:(i===nC-1&&S2.length===1?S2[0]:null); return '<div class="fields" style="margin:4px 0"><label class="field">'+(i<nC-1?esc(c.n)+' · km '+kmS(c.km):'Arrivée · '+kmS(c.km)+' km')+'<input id="rs'+i+'" inputmode="numeric" placeholder="'+hmi(m.cumMin(c.km))+'" value="'+(v==null?"":hmi(v))+'"></label></div>';}).join("")+
      '<div class="row" style="margin-top:8px"><button class="btn primary" data-act="saveres" data-r="'+r.id+'">Enregistrer</button>'+(Rr?'<button class="btn" data-act="canceres">Annuler</button>':'')+'</div></div>';}
  h+='<div class="card"><h3>Récupération</h3>'+[["J+1 à J+3","Marche, mobilité douce, pas de course."],["J+4 à J+7","Footings de 30 min en zone 1-2 si les jambes sont bonnes."],["J+8","Retour au club, sans séance dure."]].map(function(x){return '<div class="ex"><span><b>'+x[0]+'</b></span><span style="max-width:62%">'+x[1]+'</span></div>';}).join("")+'</div>';
  if(!today)h+='<button class="btn primary" data-go="course">Choisir ta prochaine course</button>';
  return h;
}

// --- Plan ---
function vPlan(){
  var r=activeRace(); if(!r)return header("Ton plan","Le plan")+'<div class="card empty"><p class="muted">Ajoute une course A pour avoir un plan.</p><button class="btn primary" data-act="addrace">+ Ajouter une course</button></div>';
  var pl=planOf(r), cw=nowWeek(pl), ti=planIdx(pl), t=totals(pl), ne=Object.keys(D.edits[r.id]||{}).length;
  var h=header(pl.n+" semaine"+(pl.n>1?"s":"")+" · "+fmtS(pl.start)+" → "+fmtS(pl.end),"Le plan");
  var cols={Base:"#a9cdb8",Construction:"#6fa587","Spécifique":"#2f5d46",Affûtage:"#e2a72e"}, PH=[];
  pl.weeks.forEach(function(wk){if(!PH.length||PH[PH.length-1][0]!==wk.ph)PH.push([wk.ph,0]); PH[PH.length-1][1]++;});
  h+='<div class="card"><div class="sb"><b style="font-family:var(--display);font-size:18px">'+esc(r.name)+'</b><span class="chip">'+fmtD(pl.end)+'</span></div><div class="phases">'+PH.map(function(p){return '<div style="flex:'+p[1]+';background:'+cols[p[0]]+'"></div>';}).join("")+'</div><div class="phlab">'+PH.map(function(p){return '<span>'+p[0]+'</span>';}).join("")+'</div>'+
    '<p class="small" style="margin:10px 0 6px">'+(ti<0?'Le plan démarre le '+fmtL(pl.start).toLowerCase()+'.':ti>=pl.n*7?'Plan terminé. Bravo.':'Tu es en semaine <b>'+cw+'</b>, phase <b>'+pl.weeks[cw-1].ph.toLowerCase()+'</b>.')+'</p><div class="sb small num"><span>'+t.d+' / '+t.t+' séances faites</span><span class="muted">'+(t.t?Math.round(t.d/t.t*100):0)+' %</span></div><div class="bar" style="margin-top:6px"><i style="width:'+(t.t?t.d/t.t*100:0)+'%"></i></div>'+
    (ne?'<p class="small" style="margin:10px 0 0">'+ne+' séance'+(ne>1?'s':'')+' modifiée'+(ne>1?'s':'')+' par toi. <button class="rm-ghost" style="color:var(--brand);min-height:0;padding:0" data-act="resetedits">Tout rétablir</button></p>':'<p class="muted xs" style="margin:10px 0 0">Touche une semaine pour l’ouvrir. Le crayon modifie une séance.</p>')+'</div>';
  var mx=1; pl.weeks.forEach(function(wk){mx=Math.max(mx,wk.km);});
  h+='<div class="card" style="padding-top:6px">'; var last="";
  pl.weeks.forEach(function(w0){var wk=P(pl,w0.n), w=wk.n, isCur=w===cw&&ti>=0&&ti<pl.n*7, rw=w===pl.n;
    if(wk.ph!==last){h+='<span class="eyebrow" style="padding:12px 0 4px">'+wk.ph+'</span>';last=wk.ph;}
    var ed=wk.s.some(function(s){return s.edited;});
    h+='<button class="wk'+(isCur?" cur":"")+(wk.rec?" rec":"")+'" data-wk="'+w+'" aria-expanded="'+(openWk===w)+'"><span class="n">'+w+'</span><span><span class="d">'+fmtS(wk.start)+' – '+fmtS(wk.start+6*DAY)+(wk.rec?' · allégée':'')+(wk.hasB?' · course B':'')+(wk.adjLabel?' · <b style="color:var(--warn)">'+esc(wk.adjLabel)+'</b>':'')+(ed?'<span class="ed">modifiée</span>':'')+(isCur?' · <b style="color:var(--brand)">en cours</b>':'')+'</span><div class="b" style="width:'+(rw?20:Math.max(4,wk.km/mx*100))+'%"></div></span><span class="k num">'+(rw?'Course':wk.km+' km')+'<small>'+weekDone(r,wk)+'/'+nSess(wk)+' faites</small></span></button>';
    if(openWk===w)h+='<div class="wkx">'+wk.s.map(function(s){var on=!!D.done[sk(r,w,s.k)]; return '<div class="sesrow"><button class="ses" data-goto="'+w+'-'+s.dow+'"><span class="ck'+(on?" on":"")+'">'+(on?I.check:"")+'</span><span class="dw">'+DOW[s.dow]+'</span><span class="ty">'+esc(s.type==="Course B"?"Course B · "+s.name:s.type)+(s.edited?'<span class="ed">'+(s.added?"ajoutée":"modifiée")+'</span>':'')+'</span><span class="num muted">'+(s.km?kmS(s.km)+' km':'')+(s.dp?' · +'+nb(s.dp):'')+'</span></button>'+(s.race?'':'<button class="pen" data-edit="'+w+'-'+s.k+'" aria-label="Modifier '+esc(s.type)+'">'+I.pen+'</button>')+'</div>';}).join("")+
      '<button class="addses" data-act="addses" data-w="'+w+'">+ Ajouter une séance</button>'+(wk.note?'<p class="small muted" style="margin:8px 0 0">'+esc(wk.note)+'</p>':'')+'</div>';
  });
  return h+'</div>';
}

// --- Mes courses ---
function vCourse(){
  var a=activeRace(), f=focusRace(), h=header("Ta saison","Mes courses");
  races().forEach(function(r){var past=daysTo(r)<0, res=D.results[r.id], fin=res&&res.splits&&res.splits[res.splits.length-1], m=model(r);
    h+='<button class="race'+(r.prio==="B"?" b":"")+(f&&r.id===f.id?" sel":"")+(past?" past":"")+'" data-focus="'+r.id+'"><span class="tag">'+r.prio+'</span><span style="flex:1;min-width:0"><b style="font-family:var(--display);font-size:19px">'+esc(r.name)+'</b><br><span class="small muted">'+fmtD(dms(r.date))+' · '+kmS(m.L)+' km · +'+nb(m.dp)+' m</span></span>'+(fin?'<span class="chip ok">'+hmc(fin)+'</span>':a&&r.id===a.id?'<span class="chip">objectif</span>':past?'':'<span class="chip" style="background:none">'+jx(r)+'</span>')+'</button>';});
  h+='<button class="race add" data-act="addrace">+ Ajouter une course (trace GPX)</button>';
  if(!f)return h;
  var m=model(f);
  if(f.prio==="A"&&a&&f.id!==a.id)h+='<div class="banner">Ce n’est pas ton plan en cours (tu suis '+esc(a.name)+'). <button class="btn sm primary" data-act="activate" data-r="'+f.id+'" style="margin-top:8px">Suivre le plan de '+esc(f.name)+'</button></div>';
  if(f.prio==="B"){var apl=a&&planOf(a), inA=apl&&dms(f.date)<apl.end&&dms(f.date)>=apl.start; h+='<div class="banner">Course B'+(inA?' : intégrée au plan de '+esc(a.name)+' le '+fmtD(dms(f.date))+', avec la veille et le lendemain allégés.':' : en dehors de ton plan en cours.')+'</div>';}
  var gmin=Math.max(20,Math.round(m.goal*0.6/5)*5), gmax=Math.round(m.goal*1.5/5)*5;
  h+='<div class="card"><h3>Objectif</h3><div class="goal"><b class="num" id="goalv">'+hm(m.goal)+'</b><input type="range" id="goal" min="'+gmin+'" max="'+gmax+'" step="5" value="'+m.goal+'" aria-label="Objectif de temps"></div><p class="small muted" style="margin:0">Temps de passage, allures et mode Course suivent cet objectif.</p></div>';
  h+='<div class="card"><h3>Le parcours</h3>'+profileSVG(m,{id:"profsvg"})+(m.prof?'<div id="profinfo" class="profinfo muted">Touche le profil : km, altitude, D+ et passage visé.</div><div class="legend"><span><i style="background:var(--brand)"></i>Profil</span>'+(m.traps.length?'<span><i style="background:var(--off)"></i>'+m.trapTxt+'</span>':'')+(m.cps.length>1?'<span>R = ravito</span>':'')+'</div>':'<p class="small muted" style="margin:6px 0 0">Ajoute la trace GPX (Modifier la course) pour voir le profil, les montées et les descentes.</p>')+'</div>';
  h+='<div class="card"><h3>Temps de passage</h3><div id="passwrap">'+passHTML(f,m)+'</div></div>';
  h+='<div class="card"><h3>Stratégie</h3><div id="stratwrap">'+stratHTML(m)+'</div></div>';
  return h+'<div class="row" style="margin-bottom:12px"><button class="btn" data-act="editrace" data-r="'+f.id+'">'+I.pen+' Modifier la course</button><button class="btn" data-race="'+f.id+'" data-practice="1">'+I.play+' Essayer le mode Course</button></div>';
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
function swItem(ic,t,sub,key,on){return '<div class="sitem" role="switch" tabindex="0" aria-checked="'+!!on+'" data-sw="'+key+'" style="cursor:pointer"><span class="ico">'+I[ic]+'</span><span class="tx"><b>'+t+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</span><span class="sw" aria-checked="'+!!on+'"></span></div>';}
function group(t,inner){return '<div class="sgroup"><span class="eyebrow">'+t+'</span><div class="slist">'+inner+'</div></div>';}
function selMin(id,list,val){return '<select id="'+id+'">'+list.map(function(v){return '<option value="'+v+'"'+(val===v?" selected":"")+'>'+(v?"toutes les "+v+" min":"désactivé")+'</option>';}).join("")+'</select>';}
function vSettings(){
  var th=D.set.theme, a=activeRace();
  var h='<button class="back" data-go="back">'+I.back+'Retour</button><h2 style="font-size:30px;margin-bottom:16px">Réglages</h2>';
  h+=group("Apparence",'<div class="spad"><div class="opts" role="radiogroup" aria-label="Thème" style="margin:0">'+[["auto","Auto"],["light","Clair"],["dark","Sombre"]].map(function(o){return '<button role="radio" data-theme="'+o[0]+'" aria-pressed="'+(th===o[0])+'" aria-checked="'+(th===o[0])+'">'+o[1]+'</button>';}).join("")+'</div><p class="muted xs" style="margin:8px 0 0">'+(th==="auto"?"Suit le téléphone (en ce moment : "+(sysDark()?"sombre":"clair")+").":"Choisi à la main.")+'</p></div>');
  h+=group(STRAVA?"Strava":"Sorties",(STRAVA?sitem("sync","Synchroniser maintenant",stravaSub(),null,' data-act="sync"',D.sync.gh==="ko"?"danger":""):"")+sitem("up","Importer un CSV","Export Garmin Connect ou Strava (activities.csv). Les sorties sont rangées dans ton plan.",null,' data-act="csv"'));
  h+=group("Profil",sitem("heart","Zones de fréquence cardiaque","Z2 135-150 · Z3 153-167 · Z4 169-180 bpm",null,' data-sheet="zones"')+sitem("dumb","Renfo et mobilité","Les 7 programmes, à la maison",null,' data-sheet="guide"')+sitem("flag","Course principale",a?esc(a.name)+" · "+fmtD(dms(a.date))+" · objectif "+hm(goalOf(a)):"aucune",null,' data-go="course"'));
  h+=group("Coach",swItem("cycle","Suivi du cycle","Adapte les conseils pendant les règles","cycle",D.cycle.on)+
    (D.cycle.on?'<div class="spad"><div class="fields"><label class="field">Début des dernières règles<input type="date" id="cydate" value="'+esc(D.cycle.start||"")+'"></label><label class="field">Durée du cycle<select id="cylen">'+(function(){var o="";for(var i=21;i<=38;i++)o+='<option value="'+i+'"'+((D.cycle.len||28)===i?" selected":"")+'>'+i+' jours</option>';return o;})()+'</select></label></div><p class="muted xs" style="margin:0">Mets la date à jour à chaque cycle. Ces données restent sur ce téléphone.</p></div>':'')+
    swItem("bell","Check-in du lundi","Fatigue et sommeil pour ajuster la semaine","checkin",D.set.checkin)+
    sitem("help","Comment le coach juge","Distance 90 à 115 %, D+ au-dessus de 75 %, allure des sorties faciles",null,' data-sheet="judge"'));
  h+=group("Mode Course",srow("gel","Rappel de gel","Vibration et alerte à l’écran",selMin("gelmin",[0,25,30,35,40,45],D.set.gel))+srow("drop","Rappel d’eau","Petite vibration",selMin("watermin",[0,10,15,20,30],D.set.water))+
    swItem("vib","Vibration au ravito","Android seulement : l’iPhone ne vibre pas depuis le web","vib",D.set.vib)+
    (D.race?sitem("trash","Réinitialiser le chrono de course",esc((raceById(D.race.rid)||{}).name||"")+" · "+(D.race.done?"terminée":D.race.t0?"chrono lancé":"prêt"),"",' data-act="racereset"',"danger"):""));
  if(a){var ad=dms(a.date), cf=fakeDate(), pst=planOf(a).start, opts=[["Préparer",Math.max(pst+8*DAY+DAY,Math.min(realToday(),ad-30*DAY))],["Affûter",ad-4*DAY],["Courir",ad],["Récupérer",ad+DAY]];
    h+=group("Date simulée",'<div class="spad"><div class="seg">'+opts.map(function(x){var j=Math.round((ad-x[1])/DAY); return '<button data-fake="'+iso(x[1])+'" aria-pressed="'+(cf===iso(x[1]))+'"><b>'+x[0]+'</b><span>'+fmtD(x[1])+' · '+(j>0?"J-"+j:j===0?"jour J":"J+"+(-j))+'</span></button>';}).join("")+'</div><div class="fields" style="margin-top:10px"><label class="field">Autre date<input type="date" id="fake" value="'+esc(D.set.fake||"")+'"></label></div><button class="btn sm" data-act="unfake"'+(D.set.fake?"":" disabled")+'>Revenir à la vraie date</button></div>');}
  h+=group("Montre",sitem("watch","Préparer la montre","Toutes tes courses à venir pour l’écran de suivi en direct",null,' data-act="watchexp"'));
  h+=group("Données",sitem("down","Exporter mes données","Courses, séances, check-ins, temps de course",null,' data-act="export"')+sitem("up","Importer une sauvegarde","Remplace les données de ce téléphone",null,' data-act="import"')+
    sitem("trash",resetArmed?"Toucher encore pour tout effacer":"Tout effacer","Séances cochées, chiffres, check-ins, modifications du plan (les courses restent)","",' data-act="reset"',"danger"));
  return h+'<p class="foot">Plan trail · v3 · données gardées sur ce téléphone</p>';
}
function ago(t){var m=Math.round((Date.now()-t)/60000); if(m<1)return "à l’instant"; if(m<60)return "il y a "+m+" min"; var h=Math.round(m/60); return h<24?"il y a "+h+" h":"il y a "+Math.round(h/24)+" j";}

// ---------- feuilles ----------
var SH=null;
function openSheet(html,state){SH=state||{}; $("sheetBody").innerHTML=html; $("sheet").hidden=false; document.body.style.overflow="hidden"; $("sheet").querySelector(".sheet-in").scrollTop=0;}
function closeSheet(){$("sheet").hidden=true; document.body.style.overflow=""; SH=null; pendingGpx=null;}
$("sheet").addEventListener("click",function(e){if(e.target.closest("[data-close]")){closeSheet();return;} var b=e.target.closest("button"); if(!b)return;
  if(b.dataset.pick){b.parentNode.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",x===b);}); if(SH)SH[b.parentNode.dataset.group]=b.dataset.pick; return;}
  if(b.dataset.sact)sheetAct(b.dataset.sact,b);});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("sheet").hidden)closeSheet();});
function showInfo(key){
  var p=key.split(":"), h="";
  if(p[0]==="renfo"){var R0=RENFO[p[1]]; h='<h3>'+esc(R0.name)+'</h3><p class="small muted">'+esc(R0.tours)+'</p>'+exHTML(R0.ex)+'<h4 style="font-family:var(--display);margin:14px 0 4px">Mobilité après la séance</h4>'+exHTML(MOB.slice(0,4));}
  else if(p[0]==="nut")h='<h3>Nutrition du jour</h3>'+nutHTML(p[1]);
  else if(p[0]==="loops"){var r=activeRace(), pl=planOf(r), q=p[1].split("-"), s=sessByKey(P(pl,+q[0]),q[1]); if(!s)return;
    h='<h3>Où courir près de chez toi</h3><p class="small muted">Les boucles les plus proches de '+kmS(s.km)+' km'+(s.dp>=100?' et +'+s.dp+' m':'')+'.</p>'+bestLoops(s).map(loopHTML).join("")+(s.km>16.5?'<p class="small muted" style="margin-top:8px">Pour atteindre '+kmS(s.km)+' km, enchaîne deux boucles voisines, ou ajoute des allers-retours de côtes de 500 m (+73 m).</p>':'')+'<p class="muted xs" style="margin-top:8px">Distances et dénivelés tels que publiés par chaque site. Vérifie le tracé avant de partir.</p>';}
  else if(key==="zones")h='<h3>Zones de fréquence cardiaque</h3><table class="tbl num"><tr><th>Zone</th><th>bpm</th><th>Usage</th></tr><tr><td>Z1</td><td>&lt; 127</td><td>Récupération</td></tr><tr><td>Z2</td><td>135-150</td><td>Endurance, sorties longues</td></tr><tr><td>Z3</td><td>153-167</td><td>Allure course, tempo</td></tr><tr><td>Z4</td><td>169-180</td><td>Seuil, côtes</td></tr><tr><td>Z5</td><td>&gt; 180</td><td>Court et très dur</td></tr></table><p class="muted xs" style="margin:8px 0 0">Basées sur une FC max de 196 bpm.</p>';
  else if(key==="guide")h='<h3>Renfo et mobilité</h3><details open><summary>'+I.leaf+' Mobilité · 10 min</summary><div class="in">'+exHTML(MOB)+'</div></details>'+["A1","A2","B1","B2","C1","C2","D"].map(function(k){var R0=RENFO[k]; return '<details><summary>'+I.dumb+' '+esc(R0.name)+'</summary><div class="in"><p class="muted small">'+esc(R0.tours)+'</p>'+exHTML(R0.ex)+'</div></details>';}).join("");
  else if(key==="judge")h='<h3>Comment le coach juge</h3><ul class="pts"><li>Distance : en cible entre 90 et 115 % du prévu.</li><li>Dénivelé : en cible au-dessus de 75 % du prévu.</li><li>Sorties faciles : trop rapides si l’allure par km-effort (1 km + 100 m de D+) dépasse celle de l’objectif.</li><li>Séance du club : enregistrée, jamais jugée.</li><li>Chaque semaine : volume, sorties trop rapides et check-in donnent une proposition d’ajustement, que tu acceptes ou non.</li><li>Quand tu modifies une séance, le coach compare tes chiffres à ta version.</li></ul>';
  openSheet(h);
}
// ---------- montre ----------
function watchRace(r){
  var m=model(r), L=m.L, i, k, d=new Date(dms(r.date)), out={name:r.name.split(" · ").pop().slice(0,18),date:+r.date.replace(/-/g,""),time:r.time||"",km:Math.round(L*100)/100,dp:Math.round(m.dp),goal:Math.round(m.goal)};
  out.pass=[]; var st=L>20?1:0.5; for(k=st;k<L-0.05;k+=st)out.pass.push([Math.round(k*10)/10,Math.round(m.cumMin(k)*10)/10]); out.pass.push([Math.round(L*10)/10,Math.round(m.goal*10)/10]);
  var P=m.prof?m.prof.slice():[[0,0],[L,0]], prof=[];
  if(m.prof){var step=Math.max(0.1,L/120), next=0; P.forEach(function(p,j){if(p[0]>=next-1e-9||j===P.length-1){prof.push(p); next=p[0]+step;}});}
  else prof=[[0,0],[L,0]];
  var up=0; out.prof=prof.map(function(p,j){if(m.prof){if(j)up+=Math.max(0,p[1]-prof[j-1][1]);} return [Math.round(p[0]*10)/10,Math.round(p[1])];});
  var raw=0, cum=[0]; for(i=1;i<out.prof.length;i++){raw+=Math.max(0,out.prof[i][1]-out.prof[i-1][1]); cum.push(raw);}
  out.up=m.prof&&raw>0?cum.map(function(v){return Math.round(v*m.dp/raw);}):[0,Math.round(m.dp)];
  if(!m.prof)out.prof=[[0,0],[Math.round(L*10)/10,0]];
  out.aids=m.cps.slice(0,-1).map(function(c){var n=c.n.split(/[,(]/)[0].trim(); if(n.length>16)n=n.slice(0,16).replace(/\s+\S*$/,""); return [Math.round(c.km*10)/10,n];});
  out.climbs=m.prof?segs(m,1).map(function(c){return [Math.round(c.a*10)/10,Math.round(c.b*10)/10,c.g,c.p];}):[];
  out.traps=(m.traps||[]).map(function(t,ti){if(r.builtin)return [t[0],t[1],["Descente -13 %","Montée +12 %"][ti]||"Piège"];var dz=m.elevAt(t[1])-m.elevAt(t[0]), g=Math.round(Math.abs(dz)/((t[1]-t[0])*10)); return [Math.round(t[0]*10)/10,Math.round(t[1]*10)/10,(dz<0?"Descente -":"Montée +")+g+" %"];});
  return out;
}
function watchExport(){
  var R=D.races.filter(function(r){return daysTo(r)>=0;}).sort(function(a,b){return a.date<b.date?-1:1;});
  if(!R.length){toast("Aucune course à venir.");return;}
  var J={app:"trail",made:new Date().toISOString(),gel:D.set.gel||0,water:D.set.water||0,races:R.map(watchRace)};
  FIT.download(new Blob([JSON.stringify(J)],{type:"application/json"}),"courses-montre.json");
  openSheet('<h3>Préparer la montre</h3><p class="small muted" style="margin:-4px 0 10px">Le fichier <b>courses-montre.json</b> contient '+R.length+' course'+(R.length>1?'s':'')+' : '+R.map(function(r){return esc(r.name);}).join(", ")+'. Le jour d’une course, l’écran de suivi de la montre la choisit tout seul.</p><ol class="small" style="margin:0;padding-left:18px"><li>Sur le Mac, dans le Terminal :<br><code>~/Documents/Projects/"Claude Code"/trail-montre/montre.sh</code><br>Le script prend le fichier dans Téléchargements et fabrique <b>Trail.prg</b>.</li><li>Branche la montre, ouvre OpenMTP et copie <b>bin/Trail.prg</b> dans <b>GARMIN/APPS</b>. Supprime l’ancien THP40.prg s’il y est encore.</li><li>Sur la montre, l’écran garde sa place dans l’activité Trail. S’il a disparu : Trail › Réglages › Écrans de données › Ajouter › Champs Connect IQ › <b>Trail</b>.</li><li>Refais-le quand tu ajoutes une course, changes un objectif ou les rappels gel/eau.</li></ol>');
}
function wktName(s,d){return s.type+" "+fmtS(d);}
function hrTxt(h){return h?h[0]+"-"+h[1]+" bpm":"";}
function durTxt(d){return d.open?"jusqu’à Tour":d.d?(d.d>=1000?kmS(d.d/1000)+" km":d.d+" m"):d.t>=60?Math.round(d.t/60)+" min":d.t+" s";}
function stepLi(x){return '<li><span>'+durTxt(x.dur)+'</span><span>'+esc(x.name)+(x.hr?' · '+hrTxt(x.hr):'')+'</span></li>';}
function wktFiles(r,pl,wk,only){var out=[]; wk.s.forEach(function(s){if(only&&s.k!==only)return; var st=FIT.wktOf(s); if(!st)return; var d=sessDate(pl,wk.n,s);
  out.push({name:FIT.slug(r.name)+"-"+iso(d)+"-"+FIT.slug(s.type)+".fit",data:FIT.encode(wktName(s,d),st)});}); return out;}
function watchSheet(w,k){
  var r=activeRace(), pl=planOf(r), wk=P(pl,w), s=sessByKey(wk,k), st=s&&FIT.wktOf(s); if(!st)return;
  var nW=wk.s.filter(function(x){return FIT.wktOf(x);}).length, d=sessDate(pl,w,s);
  var h='<h3>Envoyer à la montre</h3><p class="small muted" style="margin:-4px 0 10px">« '+esc(wktName(s,d))+' » arrive dans les entraînements de ta montre. Elle te guide étape par étape et vibre à chaque changement.</p><ul class="steps">';
  st.forEach(function(x){if(x.rep)h+='<li><span>'+x.rep+' ×</span><span>'+x.steps.map(function(y){return durTxt(y.dur)+' '+esc(y.name.toLowerCase())+(y.hr?' ('+hrTxt(y.hr)+')':'');}).join(' puis ')+'</span></li>'; else h+=stepLi(x);});
  h+='</ul><button class="btn primary" data-sact="fitone" style="margin-top:12px">'+I.down+' Télécharger la séance</button>';
  if(nW>1)h+='<button class="btn" data-sact="fitweek" style="margin-top:8px">'+I.down+' Toute la semaine '+w+' · '+nW+' séances (.zip)</button>';
  h+='<details style="margin-top:12px"><summary>'+I.help+' Copier sur la montre</summary><div class="in"><ol class="small" style="margin:0;padding-left:18px"><li>Branche la montre au Mac et ouvre OpenMTP.</li><li>Copie le fichier .fit dans <b>GARMIN/NewFiles</b> (pour la semaine, double-clique d’abord le .zip pour avoir les .fit).</li><li>Débranche : la montre importe les séances. Tu les trouves dans <b>Entraînement › Entraînements</b>. Lance la séance, puis démarre l’activité.</li></ol><p class="muted xs" style="margin:8px 0 0">Depuis l’iPhone, le fichier part dans Fichiers : il faut passer par le Mac pour le copier sur la montre. Les étapes « jusqu’à Tour » attendent un appui sur le bouton Tour.</p></div></details>';
  openSheet(h,{kind:"watch",w:w,k:k,rid:r.id});
}
function firstFreeDow(wk){var used={}; wk.s.forEach(function(s){used[s.dow]=1;}); for(var i=0;i<7;i++)if(!used[i])return i; return 0;}
function editSession(w,k,dow){
  var r=activeRace(), pl=planOf(r), wk=pl.weeks[w-1], s=k?sessByKey(wk,k):null, isNew=!s;
  var base=s||{dow:dow!=null?dow:firstFreeDow(wk),type:"Footing",km:6,dp:0,txt:""};
  var h='<h3>'+(isNew?"Nouvelle séance":"Modifier la séance")+'</h3><p class="small muted" style="margin:-4px 0 10px">'+esc(r.name)+' · semaine '+w+' · '+fmtS(wk.start)+' – '+fmtS(wk.start+6*DAY)+'</p>';
  h+='<div class="fields"><label class="field">Jour<select id="eDow">'+DOWL.map(function(d,i){return '<option value="'+i+'"'+(i===base.dow?" selected":"")+'>'+d+' '+new Date(wk.start+i*DAY).getUTCDate()+'</option>';}).join("")+'</select></label><label class="field">Type<select id="eType">'+TYPELIST.concat(TYPELIST.indexOf(base.type)<0?[base.type]:[]).map(function(t){return '<option'+(t===base.type?" selected":"")+'>'+esc(t)+'</option>';}).join("")+'</select></label></div>';
  h+='<div class="fields"><label class="field">Km<input id="eKm" inputmode="decimal" value="'+(base.km?kmS(base.km):"0")+'"></label><label class="field">D+ (m)<input id="eDp" inputmode="numeric" value="'+(base.dp||0)+'"></label></div>';
  h+='<label class="field" style="margin-bottom:12px">Consignes<textarea id="eTxt">'+esc(base.txt||"")+'</textarea></label><button class="btn primary" data-sact="saveses">Enregistrer</button>';
  if(!isNew)h+='<div class="row" style="margin-top:8px">'+(s.edited&&!s.added?'<button class="btn sm" data-sact="restoreses">Rétablir l’original</button>':'')+'<button class="btn sm danger" data-sact="delses">Supprimer la séance</button></div>';
  h+='<p class="muted xs" style="margin:10px 0 0">Seule cette séance change. Le coach compare tes sorties à ta version.</p>';
  openSheet(h,{kind:"ses",rid:r.id,w:w,k:k||null,added:!!(s&&s.added)});
}
var pendingGpx=null;
function editRace(id){
  var r=id?raceById(id):null, isNew=!r;
  r=r||{name:"",date:"",time:"08:00",km:"",dp:"",goal:0,prio:"A",cps:[],start:nextMonday()};
  var b=!!r.builtin;
  var h='<h3>'+(isNew?"Ajouter une course":"Modifier "+esc(r.name))+'</h3>';
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
function sheetAct(a){
  if(!SH)return;
  if(a==="fitone"||a==="fitweek"){var r=raceById(SH.rid), pl=planOf(r), wk=P(pl,SH.w), F=wktFiles(r,pl,wk,a==="fitone"?SH.k:null); if(!F.length)return;
    if(F.length===1)FIT.download(new Blob([F[0].data],{type:"application/octet-stream"}),F[0].name); else FIT.download(FIT.zip(F),FIT.slug(r.name)+"-semaine-"+SH.w+".zip");
    toast(F.length>1?F.length+" séances prêtes : copie-les dans GARMIN/NewFiles.":"Séance prête : copie-la dans GARMIN/NewFiles."); return;}
  if(a==="savemanual"){var km=num($("mKm").value), dp=num($("mDp").value)||0, t=parseDur($("mT").value); if(!(km>0)){toast("Indique au moins les kilomètres.");return;}
    D.actual[SH.key]={km:Math.round(km*100)/100,dp:Math.round(dp),t:Math.round(t),src:"manual"}; D.done[SH.key]=1; save(); closeSheet(); toast("Chiffres enregistrés."); render(true); return;}
  if(a==="delmanual"){delete D.actual[SH.key]; save(); closeSheet(); render(true); return;}
  if(a==="saveses"||a==="delses"||a==="restoreses"){
    var r=raceById(SH.rid), E=D.edits[r.id]||(D.edits[r.id]={}), w=SH.w, ek=w+"-"+SH.k;
    if(a==="restoreses"){delete E[ek]; save(); closeSheet(); toast("Séance d’origine rétablie."); render(true); return;}
    if(a==="delses"){if(SH.added)delete E[ek]; else E[ek]={del:true}; delete D.done[sk(r,w,SH.k)]; delete D.actual[sk(r,w,SH.k)]; save(); closeSheet(); toast("Séance supprimée."); render(true); return;}
    var type=$("eType").value, km=num($("eKm").value)||0, o={dow:+$("eDow").value,type:type,km:Math.round(km*10)/10,dp:Math.round(num($("eDp").value)||0),txt:$("eTxt").value.trim(),tag:tagOf(type)};
    o.nut=type==="Récupération"?"rest":nutOfTag(o.tag);
    if(SH.k&&!SH.added){var keep=E[ek]; delete E[ek]; PC={}; var orig=sessByKey(planOf(r).weeks[w-1],SH.k); PC={};
      if(orig){var diff={}; ["dow","type","km","dp","txt"].forEach(function(f){if(o[f]!==orig[f])diff[f]=o[f];}); if(diff.type){diff.tag=o.tag; diff.nut=o.nut;} if(Object.keys(diff).length)E[ek]=diff;} else if(keep)E[ek]=keep;}
    else E[w+"-"+(SH.k||("x"+Date.now().toString(36)))]=o;
    save(); closeSheet(); toast("Séance enregistrée."); render(true); return;
  }
  if(a==="gpx"){$("fileGpxRace").click(); return;}
  if(a.indexOf("preset:")===0){var pr=PRESETS.filter(function(x){return x.key===a.slice(7);})[0]; if(!pr)return;
    var nr=JSON.parse(JSON.stringify(pr)); nr.id=uid(); nr.preset=pr.key; delete nr.key; nr.prio=pr.prio||SH.prio||"A"; nr.start=nextMonday(); var nt=nr.note; delete nr.note;
    D.races.push(nr); D.focus=nr.id; var ca=activeRace(); if(nr.prio==="A"&&(!ca||daysTo(ca)<0))D.active=nr.id;
    MC={}; PC={}; save(); closeSheet(); toast(nr.name+" ajoutée. "+nt); goNow(); render(true); editRace(nr.id); return;}
  if(a==="saverace"){
    var isB=SH.builtin, r0=SH.id?raceById(SH.id):null;
    var name=isB?r0.name:$("rName").value.trim(), date=$("rDate").value, time=$("rTime").value||"08:00", rkm=isB?r0.km:num($("rKm").value), rdp=isB?r0.dp:Math.round(num($("rDp").value)||0), gv=$("rGoal").value.trim(), goal=gv?Math.round(parseDur(gv)/60):0;
    if(!name){toast("Donne un nom à la course.");return;} if(!isoOk(date)){toast("Choisis la date de la course.");return;} if(!(rkm>0)){toast("Indique la distance.");return;}
    if(gv&&!(goal>10)){toast("Objectif au format h:mm, par exemple 3:30.");return;}
    var rr=r0||{id:uid()}; rr.name=name; rr.date=date; rr.time=time; rr.km=Math.round(rkm*100)/100; rr.dp=rdp; rr.goal=goal||0;
    if(!isB){rr.prio=SH.prio||"A"; rr.place=$("rPlace").value.trim(); var st=$("rStart").value; rr.start=isoOk(st)?st:nextMonday();
      rr.cps=$("rCps").value.split("\n").map(function(l){var mm=/^\s*(\d+(?:[.,]\d+)?)\s*(?:km)?\s*[:\-–·]?\s*(.*)$/.exec(l); return mm?{km:num(mm[1]),n:mm[2].trim()}:null;}).filter(function(c){return c&&c.km>0&&c.km<rr.km;});}
    if(pendingGpx){rr.gpx={name:pendingGpx.name,total:pendingGpx.total,pts:scalePts(pendingGpx.pts,pendingGpx.total,rr.km)}; if(!isB&&pendingGpx.prof)rr.prof=pendingGpx.prof.map(function(p){return [Math.round(p[0]*rr.km/pendingGpx.total*100)/100,p[1]];});}
    var msg="Course mise à jour.";
    if(!r0){D.races.push(rr); D.focus=rr.id;
      if(rr.prio==="A"){var cur_=activeRace(); if(!cur_||daysTo(cur_)<0||(dms(rr.date)<dms(cur_.date)&&daysTo(rr)>=0)){D.active=rr.id; msg="Course ajoutée : ton plan est prêt.";} else msg="Course ajoutée. Touche « Suivre le plan » pour basculer dessus.";}
      else msg="Course B ajoutée : elle est glissée dans ton plan.";}
    MC={}; PC={}; save(); closeSheet(); toast(msg); goNow(); render(true); return;
  }
  if(a==="delrace"){
    var x=raceById(SH.id); if(!x)return; if(!confirm("Supprimer "+x.name+" ? Son plan, ses séances cochées et tes modifications seront perdus."))return;
    D.races=D.races.filter(function(y){return y.id!==x.id;}); delete D.edits[x.id]; delete D.results[x.id]; delete D.kit[x.id];
    ["done","actual","ci","adj","todo"].forEach(function(f){Object.keys(D[f]).forEach(function(k){if(k.indexOf(x.id+":")===0)delete D[f][k];});});
    if(D.race&&D.race.rid===x.id)D.race=null; if(D.active===x.id)D.active=null; if(D.focus===x.id)D.focus=null; activeRace(); focusRace();
    MC={}; PC={}; save(); closeSheet(); toast("Course supprimée."); goNow(); render(true);
  }
}
function manualSheet(w,k){
  var r=activeRace(), pl=planOf(r), s=sessByKey(P(pl,w),k); if(!s)return; var key=sk(r,w,k), ac=D.actual[key];
  openSheet('<h3>Mes chiffres</h3><p class="small muted" style="margin:-4px 0 10px">'+esc(s.type)+' · '+fmtL(sessDate(pl,w,s))+' · prévu '+kmS(s.km)+' km'+(s.dp?' · +'+s.dp+' m':'')+'</p><div class="fields"><label class="field">Km<input inputmode="decimal" id="mKm" value="'+(ac?kmS(ac.km):"")+'" placeholder="'+kmS(s.km)+'"></label><label class="field">D+ (m)<input inputmode="numeric" id="mDp" value="'+(ac&&ac.dp?ac.dp:"")+'" placeholder="'+(s.dp||0)+'"></label><label class="field">Durée<input id="mT" value="'+(ac&&ac.t?hmi(ac.t/60):"")+'" placeholder="1:05"></label></div><button class="btn primary" data-sact="savemanual">Enregistrer</button>'+(ac?'<button class="btn sm danger" data-sact="delmanual" style="margin:8px auto 0">Effacer mes chiffres</button>':''),{kind:"manual",key:key});
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
function render(keep){
  var y=window.scrollY, v;
  if(tab==="today")v=vToday(); else if(tab==="plan")v=vPlan(); else if(tab==="course")v=vCourse(); else if(tab==="forme")v=vForme(); else v=vSettings();
  $("view").innerHTML=v;
  document.querySelectorAll("#tabs button").forEach(function(b){b.setAttribute("aria-current",b.dataset.t===tab?"page":"false");});
  if(tab==="course"){var f=focusRace(); if(f){var g=$("goal");
    if(g){g.addEventListener("input",function(){f.goal=+g.value; var mm=model(f); $("goalv").textContent=hm(mm.goal); $("passwrap").innerHTML=passHTML(f,mm); $("stratwrap").innerHTML=stratHTML(mm);}); g.addEventListener("change",function(){save(); render(true);});}
    bindProfile(model(f));}}
  window.scrollTo(0,keep?y:0);
}
function setTab(t){if(t!=="settings")prevTab=t; tab=t; resetArmed=false; editRes=false; if(t==="today"&&!browsing)goNow(); render();}


// ---------- Forme : volume + forme/fraîcheur (depuis toutes les sorties Strava lues) ----------
var HIST=[]; try{HIST=JSON.parse(localStorage.getItem("thp40hist")||"[]")||[];}catch(e){HIST=[];}
var VP="week";
var HRREST=55, HRMAX=196;
function histSave(a){HIST=a; try{localStorage.setItem("thp40hist",JSON.stringify(a));}catch(e){}}
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
function vForme(){
  var h=header("Ton suivi","Forme")+'<div class="wm-seg fm-sub" role="tablist" aria-label="Source">'+
    [["strava","Strava","récent"],["garmin","Garmin","export montre"]].map(function(x){return '<button role="tab" data-fsub="'+x[0]+'" aria-pressed="'+(FSUB===x[0])+'" aria-selected="'+(FSUB===x[0])+'">'+x[1]+'<small>'+x[2]+'</small></button>';}).join("")+'</div>';
  if(FSUB==="garmin"){var r=activeRace(); return h+(window.GARMIN?GARMIN.html({busy:GBUSY,race:r?{name:r.name,km:+r.km||0,dp:+r.dp||0,goal:goalOf(r)}:null}):'<div class="card"><p class="small muted" style="margin:0">Module Garmin non chargé : recharge la page.</p></div>');}
  return h+vFormeStrava();
}
function vFormeStrava(){
  var h="", n0=Math.round(todayUTC()/864e5);
  if(!HIST.length){
    return h+'<div class="card"><h3>Pas encore de sorties</h3><p class="small muted" style="margin:0">Ouvre l’onglet Aujourd’hui et lance « Synchroniser Strava » pour charger ton historique. Ce suivi se remplit ensuite tout seul.</p></div>';
  }
  var R=periodRange(n0), c=sumRuns(R[0],n0), p=sumRuns(R[1],R[2]);
  var pace=c.km>0?c.t/c.km:0, vs=p.km>0?(c.km-p.km)/p.km*100:null;
  h+='<div class="card wm"><div class="wm-top"><h3>Volume</h3><div class="wm-seg" role="group" aria-label="Période">'+
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
  h+='<h4 style="margin:16px 0 2px">'+title+'</h4><p class="small muted num" style="margin:0 0 6px">max '+kmS(Math.round(mx))+' km</p><div class="wm-bars fm-bars" style="grid-template-columns:repeat('+B.length+',1fr)" role="img" aria-label="'+title+'">';
  B.forEach(function(x,k){h+='<div class="wm-col'+(x.cur?" today":"")+'"><div class="wm-plot">'+(x.v?'<i class="a" style="height:'+Math.max(4,x.v/mx*100)+'%"></i>':'<i class="rest"></i>')+'</div><b class="fm-l">'+((VP==="year"||k%3===0||x.cur)?x.l:"")+'</b></div>';});
  h+='</div></div>';
  // forme / fatigue / fraîcheur
  var S=formeSeries(), pts=S.pts, z=pts[pts.length-1], N=Math.min(pts.length,60), view=pts.slice(pts.length-N);
  var st=z.z>15?["Très frais","ok","Tu es reposée : bon moment pour une séance de qualité ou une course."]:z.z>5?["Frais","ok","Tu récupères bien, tu peux charger un peu."]:z.z>=-10?["Équilibré","ok","Charge et récupération sont en phase."]:z.z>=-25?["Chargée","warn","Tu accumules de la fatigue : garde les séances faciles vraiment faciles."]:["Surcharge","off","Fatigue très élevée : allège les prochains jours."];
  h+='<div class="card fm"><h3>Forme et fraîcheur</h3><div class="fm-top num"><div><span>Forme</span><b style="color:var(--brand)">'+Math.round(z.f)+'</b></div><div><span>Fatigue</span><b style="color:var(--acc-ink)">'+Math.round(z.a)+'</b></div><div><span>Fraîcheur</span><b style="color:var(--down)">'+(z.z>=0?"+":"−")+Math.abs(Math.round(z.z))+'</b></div></div>'+
    '<div class="chip '+st[1]+'">'+st[0]+'</div><p class="small" style="margin:8px 0 12px">'+st[2]+'</p>';
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
  return h;
}

// ---------- interactions ----------
$("tabs").addEventListener("click",function(e){var b=e.target.closest("button[data-t]"); if(!b)return; if(b.dataset.t==="today")browsing=false; setTab(b.dataset.t);});
$("view").addEventListener("click",function(e){
  var swi=e.target.closest("[data-sw]"); if(swi){toggleSw(swi.dataset.sw); return;}
  var b=e.target.closest("button"); if(!b)return; var ds=b.dataset;
  if(ds.go){if(ds.go==="settings"){prevTab=tab;tab="settings";render();} else if(ds.go==="back")setTab(prevTab||"today"); else if(ds.go==="today-race"){browsing=false;setTab("today");} else setTab(ds.go); return;}
  if(ds.theme){D.set.theme=ds.theme; applyTheme(); save(); render(true); return;}
  if(ds.wm){WM=ds.wm; render(true); return;}
  if(ds.vp){VP=ds.vp; render(true); return;}
  if(ds.fsub){FSUB=ds.fsub; render(true); return;}
  if(ds.day!=null){sel=+ds.day; render(true); return;}
  if(ds.done){if(D.done[ds.done])delete D.done[ds.done]; else{D.done[ds.done]=1; vib(30);} save(); render(true); return;}
  if(ds.ci){var r=activeRace(), kk=r.id+":"+cur, o=D.ci[kk]||(D.ci[kk]={}); o[ds.ci]=o[ds.ci]===+ds.v?0:+ds.v; save(); render(true); return;}
  if(ds.adj){var ak=activeRace().id+":"+ds.w; if(ds.adj==="reset")delete D.adj[ak]; else D.adj[ak]=ds.adj; save(); render(true); return;}
  if(ds.todo!=null){var st=ds.store==="kit"?kitOf(activeRace()):D.todo; st[ds.todo]=!st[ds.todo]; if(!st[ds.todo])delete st[ds.todo]; save(); var kd=$("kitd"),op=kd&&kd.open; render(true); if(op&&$("kitd"))$("kitd").open=true; return;}
  if(ds.wk){var w=+ds.wk; openWk=openWk===w?null:w; render(true); return;}
  if(ds.wnav){var r0=activeRace(), p0=planOf(r0); if(!p0)return; cur=Math.max(1,Math.min(p0.n,cur+(+ds.wnav))); if(cur===nowWeek(p0)&&planIdx(p0)>=0)goNow(); else{browsing=true; var w0=p0.weeks[cur-1]; if(!sessAt(w0,sel)&&w0.s.length)sel=w0.s[0].dow;} render(); return;}
  if(ds.goto){var p=ds.goto.split("-"); cur=+p[0]; sel=+p[1]; browsing=true; tab="today"; prevTab="today"; render(); return;}
  if(ds.edit){var q=ds.edit.split("-"); editSession(+q[0],q[1]); return;}
  if(ds.sheet){showInfo(ds.sheet); return;}
  if(ds.focus){D.focus=ds.focus; save(); render(true); return;}
  if(ds.race){openRace(ds.race,!!ds.practice); return;}
  if(ds.fake){D.set.fake=ds.fake; save(); goNow(); toast("Date simulée : "+fmtL(todayUTC()).toLowerCase()); setTab("today"); return;}
  if(ds.act)act(ds.act,b);
});
$("view").addEventListener("keydown",function(e){var swi=e.target.closest&&e.target.closest("[data-sw]"); if(swi&&(e.key===" "||e.key==="Enter")){e.preventDefault(); toggleSw(swi.dataset.sw);}});
$("view").addEventListener("change",function(e){
  var id=e.target.id, v=e.target.value;
  if(id==="gelmin"){D.set.gel=+v; save();} else if(id==="watermin"){D.set.water=+v; save();}
  else if(id==="cydate"){D.cycle.start=v; save(); render(true);} else if(id==="cylen"){D.cycle.len=+v; save(); render(true);}
  else if(id==="fake"&&isoOk(v)){D.set.fake=v; save(); goNow(); toast("Date simulée : "+fmtL(todayUTC()).toLowerCase()); render(true);}
});
function toggleSw(k){if(k==="cycle")D.cycle.on=!D.cycle.on; else D.set[k]=!D.set[k]; save(); render(true);}
function act(a,b){
  var ds=b.dataset;
  if(a==="sync")sync(true);
  else if(a==="now"){goNow(); render();}
  else if(a==="watch")watchSheet(+ds.w,ds.k);
  else if(a==="weekplan"){openWk=+ds.w; setTab("plan"); var el=document.querySelector('[data-wk="'+ds.w+'"]'); if(el)el.scrollIntoView({block:"start"});}
  else if(a==="addses")editSession(+ds.w,null,ds.d!=null?+ds.d:null);
  else if(a==="manual")manualSheet(+ds.w,ds.k);
  else if(a==="addrace")editRace(null);
  else if(a==="editrace")editRace(ds.r);
  else if(a==="activate"){D.active=ds.r; save(); goNow(); toast("Tu suis maintenant le plan de "+raceById(ds.r).name+"."); render(true);}
  else if(a==="resetedits"){var r=activeRace(); if(!confirm("Rétablir toutes les séances d’origine du plan "+r.name+" ?"))return; delete D.edits[r.id]; save(); render(true);}
  else if(a==="csv")$("fileCsv").click();
  else if(a==="import")$("fileJson").click();
  else if(a==="export")exportData();
  else if(a==="gimport"){if(!GBUSY)$("fileGarmin").click();}
  else if(a==="gclear"){if(!confirm("Effacer l’export Garmin de ce téléphone ?"))return; GARMIN.clear(); render(true);}
  else if(a==="watchexp")watchExport();
  else if(a==="reset"){if(!resetArmed){resetArmed=true; render(true); setTimeout(function(){if(resetArmed){resetArmed=false; if(tab==="settings")render(true);}},5000); return;}
    var keep={set:D.set,races:D.races,active:D.active,focus:D.focus}; D=blank(); Object.assign(D,keep); resetArmed=false; MC={}; PC={}; save(); toast("Données effacées. Tes courses sont gardées."); goNow(); render(true);}
  else if(a==="racereset"){if(!confirm("Réinitialiser le chrono de course ? Les temps pointés seront perdus (sauf ceux déjà gardés dans le bilan)."))return; D.race=null; save(); render(true);}
  else if(a==="unfake"){D.set.fake=""; save(); goNow(); toast("Retour à la vraie date."); render(true);}
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
function toast(m){var t=$("toast"); t.textContent=m; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(function(){t.hidden=true;},3200);}

// ---------- Strava (coupé, gardé pour plus tard) ----------
var syncing=false;
function sync(manual){
  if(!STRAVA||syncing)return; syncing=true;
  var urls=[D.set.json||DEF_JSON]; if(urls[0]!==DEF_JSON)urls.push(DEF_JSON); if(/github\.io$/.test(location.hostname))urls.push("activities.json");
  function get(i){return fetch(urls[i]+"?t="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("erreur "+r.status); return r.json();}).then(function(j){if(!j||!Array.isArray(j.runs))throw new Error("fichier illisible"); return j;}).catch(function(e){if(i+1<urls.length)return get(i+1); throw e;});}
  ghCheck();
  get(0).then(function(j){
    var runs=(j.runs||[]).filter(function(r){return r&&isoOk(String(r.date))&&+r.km>0;}).map(function(r){return {date:r.date,km:+r.km,dp:Math.round(+r.dp||0),t:Math.round(+r.t||0),src:"strava"};});
    histSave((j.runs||[]).filter(function(r){return r&&isoOk(String(r.date))&&+r.km>0;}).map(function(r){return {date:r.date,km:+r.km,dp:Math.round(+r.dp||0),t:Math.round(+r.t||0),hr:+r.hr||0};}));
    D.sync.t=Date.now(); D.sync.upd=j.updated||""; D.sync.err=""; var n=applyActs(runs); if(manual)toast(runs.length+" sorties lues · "+n+" séances du plan");
  }).catch(function(e){D.sync.err=String(e.message||e); if(manual)toast("Synchro impossible.");}).then(function(){syncing=false; save(); render(true);});
}
// état de la dernière exécution de l’Action « Strava sync » (API publique GitHub, sans jeton)
function ghCheck(){
  fetch("https://api.github.com/repos/"+REPO+"/actions/workflows/strava-sync.yml/runs?per_page=5&status=completed",{cache:"no-store"}).then(function(r){if(!r.ok)throw 0; return r.json();}).then(function(j){
    var runs=(j.workflow_runs||[]).filter(function(r){return r.conclusion==="success"||r.conclusion==="failure";}); if(!runs.length)return;
    var ok=runs.filter(function(r){return r.conclusion==="success";})[0], ko=runs[0].conclusion==="failure"&&runs[1]&&runs[1].conclusion==="failure";
    D.sync.gh=ko?"ko":"ok"; D.sync.ght=ok?Date.parse(ok.updated_at)||0:0; save(); render(true);
  }).catch(function(){});
}
function stravaSub(){
  var s=D.sync, bits=[];
  if(s.gh==="ko")return "La lecture de Strava échoue sur GitHub : relance « Strava setup » (voir le README du dépôt).";
  if(s.err)bits.push("Dernier essai raté ("+esc(s.err)+"), nouvel essai à la prochaine ouverture");
  else bits.push(s.t?"Dernière synchro "+ago(s.t):"Jamais synchronisé");
  if(s.gh==="ok"&&s.ght)bits.push("Strava lu par GitHub "+ago(s.ght));
  return bits.join(" · ");
}
function autoSync(){if(STRAVA&&!syncing&&Date.now()-(D.sync.t||0)>10*60*1000)sync(false);}
function applyActs(acts){
  var r=activeRace(); if(!r)return 0; var pl=planOf(r), bd=byDate(pl), byDay={}, n=0;
  acts.forEach(function(a){if(!a.date||!(a.km>0))return; var o=byDay[a.date]||(byDay[a.date]={km:0,dp:0,t:0,src:a.src}); o.km+=a.km; o.dp+=a.dp||0; o.t+=a.t||0;});
  Object.keys(byDay).forEach(function(dt){var mm=bd[dt]; if(!mm||mm.s.race)return; var o=byDay[dt]; if(o.km<2)return; var k=sk(r,mm.w,mm.s.k);
    if(D.actual[k]&&D.actual[k].src==="manual")return; D.actual[k]={km:Math.round(o.km*100)/100,dp:Math.round(o.dp),t:Math.round(o.t),src:o.src};
    if(mm.s.km&&o.km>=0.6*mm.s.km)D.done[k]=1; n++;});
  return n;
}

// ---------- fichiers ----------
function readFile(input,cb){var f=input.files&&input.files[0]; if(!f)return; var rd=new FileReader(); rd.onerror=function(){toast("Lecture du fichier impossible.");}; rd.onload=function(){try{cb(String(rd.result),f);}catch(err){toast("Ce fichier n’a pas pu être lu.");} input.value="";}; rd.readAsText(f);}
function parseCsv(t){var first=t.split("\n")[0], sep=first.split(";").length>first.split(",").length?";":",", rows=[],row=[],f="",q=false,i,c;
  for(i=0;i<t.length;i++){c=t[i]; if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;} else if(c==='"')q=true; else if(c===sep){row.push(f);f="";}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++; row.push(f);f=""; if(row.length>1||row[0]!=="")rows.push(row); row=[];} else f+=c;}
  if(f!==""||row.length){row.push(f);rows.push(row);} return rows;}
$("fileCsv").addEventListener("change",function(){readFile(this,function(txt){
  var rows=parseCsv(txt.replace(/^﻿/,"")); if(rows.length<2){toast("Fichier vide.");return;}
  var H=rows[0].map(function(x){return x.toLowerCase().trim();}), ix=function(n){for(var a=0;a<n.length;a++){var j=H.indexOf(n[a]); if(j>=0)return j;} return -1;};
  var iD=ix(["date","activity date","date de l'activité","date de l’activité"]), iK=ix(["distance"]), iA=ix(["ascension totale","elevation gain","dénivelé positif"]), iT=ix(["type d'activité","type d’activité","activity type","type"]), iM=ix(["temps de déplacement","moving time","durée","duration","temps"]);
  if(iD<0||iK<0){toast("Colonnes Date et Distance introuvables.");return;}
  var acts=[];
  rows.slice(1).forEach(function(r){var ty=iT>=0?(r[iT]||"").toLowerCase():"course"; if(!/course|trail|run/.test(ty))return;
    var ds=(r[iD]||"").trim(), dt=null; if(/^\d{4}-\d{2}-\d{2}/.test(ds))dt=ds.slice(0,10); else{var pd=new Date(ds); if(!isNaN(pd))dt=pd.getFullYear()+"-"+pz(pd.getMonth()+1)+"-"+pz(pd.getDate());}
    var km=num(r[iK]); if(km>1000)km=km/1000; if(!dt||!(km>0))return;
    acts.push({date:dt,km:km,dp:iA>=0?(num(r[iA])||0):0,t:iM>=0?parseDur(r[iM]):0,src:"csv"});});
  var n=applyActs(acts); save(); toast(acts.length+" sorties lues, "+n+" rangées dans ton plan."); render(true);
});});
$("fileJson").addEventListener("change",function(){readFile(this,function(txt){
  var o=JSON.parse(txt); if(!o||typeof o!=="object"||!o.done||!o.set){toast("Ce n’est pas une sauvegarde Plan trail.");return;}
  if(!confirm("Remplacer les données de ce téléphone par cette sauvegarde ?"))return;
  D=o.v===3?assignState(blank(),o):migrate(o,blank()); MC={}; PC={}; applyTheme(); save(); goNow(); toast("Sauvegarde importée."); render();
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
  var nm=doc.getElementsByTagName("name")[0];
  return {name:(nm&&nm.textContent.trim().slice(0,60))||fname.replace(/\.gpx$/i,""),total:total,pts:out,prof:prof,dp:Math.round(dp)};
}
function scalePts(pts,total,km){var f=km/total; return pts.map(function(p){return [p[0],p[1],Math.round(p[2]*f*1000)/1000];});}
$("fileGpxRace").addEventListener("change",function(){readFile(this,function(txt,f){
  var g=parseGpx(txt,f.name); if(!g){toast("Aucune trace trouvée dans ce fichier.");return;}
  pendingGpx=g; var n=$("rName"), k=$("rKm"), d=$("rDp");
  if(n&&!n.disabled&&!n.value)n.value=g.name; if(k&&!k.disabled&&!k.value)k.value=kmS(g.total); if(d&&!d.disabled&&!d.value&&g.dp)d.value=Math.round(g.dp/10)*10;
  var gi=$("gpxinfo"); if(gi)gi.textContent="Trace lue : "+kmS(g.total)+" km"+(g.prof?", environ +"+nb(g.dp)+" m (GPS). Profil, montées et descentes seront calculés.":", sans altitude : utilisée pour le GPS seulement.");
  var gl=$("gpxlab"); if(gl)gl.textContent="Trace chargée · remplacer";
});});
function distM(a,b,c,d){var R=6371000,toR=Math.PI/180,x=(d-b)*toR*Math.cos((a+c)/2*toR),y=(c-a)*toR; return Math.sqrt(x*x+y*y)*R;}
function exportData(){var blob=new Blob([JSON.stringify(D,null,1)],{type:"application/json"}), a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="plan-trail-"+iso(realToday())+".json"; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},500);}

// ---------- mode Course ----------
var RS=null, RM=null, RR=null, rmTimer=null, wake=null, gpsWatch=null, holdT=null, undoArmed=false, cpArmed=false;
function newRS(rid,pr){return {rid:rid,t0:null,splits:[],gels:0,lastGel:null,lastWater:null,gelAlerted:null,done:false,practice:!!pr,gpsKm:null,gpsT:0,shift:0};}
function openRace(rid,pr){
  RR=raceById(rid); if(!RR)return; RM=model(RR);
  if(pr){if(!D.practice||D.practice.done||D.practice.rid!==rid)D.practice=newRS(rid,true); RS=D.practice;}
  else{if(D.race&&D.race.rid!==rid){if(D.race.t0&&!D.race.done&&!confirm("Un chrono est en cours pour "+((raceById(D.race.rid)||{}).name||"une autre course")+". Le remplacer ?"))return; D.race=null;} if(!D.race)D.race=newRS(rid,false); RS=D.race;}
  save(); $("rm").hidden=false; document.body.style.overflow="hidden"; applyTheme(); rmRender(); clearInterval(rmTimer); rmTimer=setInterval(rmTick,1000); askWake();
  try{history.pushState({rm:1},"");}catch(e){}
}
function closeRace(){$("rm").hidden=true; document.body.style.overflow=""; clearInterval(rmTimer); stopGps(); try{wake&&wake.release();}catch(e){} wake=null; RS=null; applyTheme(); render(true);}
function closeRaceNav(){closeRace(); try{if(history.state&&history.state.rm)history.back();}catch(x){}}
window.addEventListener("popstate",function(){if(!$("rm").hidden)closeRace();});
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
  else if(a==="bilan"){var rid=RS.rid, rb=raceById(rid); closeRaceNav(); if(rb.prio==="A")D.active=rid; else D.focus=rid; browsing=false; save(); setTab(rb.prio==="B"?"course":"today");}
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
save(); goNow(); render();
if(D.race&&D.race.t0&&!D.race.done&&raceById(D.race.rid)&&daysTo(raceById(D.race.rid))===0)openRace(D.race.rid,false);
setTimeout(autoSync,400);
var lastDay=todayUTC();
setInterval(function(){if(!$("rm").hidden||!$("sheet").hidden)return; var t=todayUTC(); if(t!==lastDay){lastDay=t; PC={}; goNow(); render(true);}},60000);
})();
