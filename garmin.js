// Cadenzo · Forme › Garmin : lecture d’un export Garmin (.zip complet ou fichiers .json) et analyse.
// Tout reste sur le téléphone : le .zip est lu dans le navigateur, seul un résumé par jour est gardé (localStorage « cadenzo-garmin »).
(function(){
"use strict";
var KEY="cadenzo-garmin";
var G=null; try{G=JSON.parse(localStorage.getItem(KEY)||"null");}catch(e){G=null;}
function store(g){G=g; try{localStorage.setItem(KEY,JSON.stringify(g)); return true;}catch(e){return false;}}

// ---------- petits outils ----------
var MON=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
function isoOk(s){return typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s);}
function dN(s){return Math.round(Date.parse(s+"T00:00:00Z")/864e5);}
function isoMs(ms){return new Date(ms).toISOString().slice(0,10);}
function isoN(n){return isoMs(n*864e5);}
function pz(n){return (n<10?"0":"")+n;}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function f1(x){return String(Math.round(x*10)/10).replace(".",",");}
function nb(x){return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
function hmS(sec){sec=Math.round(sec); var h=Math.floor(sec/3600), m=Math.round((sec%3600)/60); if(m===60){h++;m=0;} return h>0?h+" h "+pz(m):m+" min";}
function clock(sec){sec=Math.round(sec); var h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return (h?h+":"+pz(m):m)+":"+pz(s);}
function pace(sPerKm){var m=Math.floor(sPerKm/60), s=Math.round(sPerKm%60); if(s===60){m++;s=0;} return m+"’"+pz(s);}
function dateL(n){var d=new Date(n*864e5); return d.getUTCDate()+" "+MON[d.getUTCMonth()]+" "+d.getUTCFullYear();}
function dateS(n){var d=new Date(n*864e5); return d.getUTCDate()+" "+MON[d.getUTCMonth()];}
function med(a){if(!a.length)return null; var b=a.slice().sort(function(x,y){return x-y;}), m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2;}
function mean(a){return a.length?a.reduce(function(s,x){return s+x;},0)/a.length:null;}
function pct(x){return (x>=0?"+":"−")+f1(Math.abs(x))+" %";}
function sgn(x,dec){var v=dec?f1(Math.abs(x)):String(Math.round(Math.abs(x))); return (x>=0?"+":"−")+v;}

// ---------- lecture du .zip (sans bibliothèque) ----------
async function zipEntries(file){
  var tl=Math.min(file.size,65557), tail=new DataView(await file.slice(file.size-tl).arrayBuffer()), p=-1, i;
  for(i=tl-22;i>=0;i--)if(tail.getUint32(i,true)===0x06054b50){p=i;break;}
  if(p<0)throw new Error("Ce fichier n’est pas un .zip lisible.");
  var n=tail.getUint16(p+10,true), cdSize=tail.getUint32(p+12,true), cdOff=tail.getUint32(p+16,true);
  if((cdOff===0xffffffff||n===0xffff)&&p>=20&&tail.getUint32(p-20,true)===0x07064b50){ // zip64
    var zo=Number(tail.getBigUint64(p-12,true)), z=new DataView(await file.slice(zo,zo+56).arrayBuffer());
    n=Number(z.getBigUint64(32,true)); cdSize=Number(z.getBigUint64(40,true)); cdOff=Number(z.getBigUint64(48,true));
  }
  var cd=new DataView(await file.slice(cdOff,cdOff+cdSize).arrayBuffer()), dec=new TextDecoder(), out=[], q=0;
  for(var k=0;k<n&&q+46<=cd.byteLength;k++){
    if(cd.getUint32(q,true)!==0x02014b50)break;
    var meth=cd.getUint16(q+10,true), cs=cd.getUint32(q+20,true), us=cd.getUint32(q+24,true), fl=cd.getUint16(q+28,true), xl=cd.getUint16(q+30,true), cl=cd.getUint16(q+32,true), off=cd.getUint32(q+42,true);
    var name=dec.decode(new Uint8Array(cd.buffer,q+46,fl)), e=q+46+fl, end=e+xl;
    while(e+4<=end){var id=cd.getUint16(e,true), sz=cd.getUint16(e+2,true), r=e+4;
      if(id===1){if(us===0xffffffff){us=Number(cd.getBigUint64(r,true));r+=8;} if(cs===0xffffffff){cs=Number(cd.getBigUint64(r,true));r+=8;} if(off===0xffffffff){off=Number(cd.getBigUint64(r,true));}}
      e+=4+sz;}
    out.push({name:name,meth:meth,cs:cs,off:off}); q+=46+fl+xl+cl;
  }
  return out;
}
async function zipText(file,e){
  var h=new DataView(await file.slice(e.off,e.off+30).arrayBuffer()), st=e.off+30+h.getUint16(26,true)+h.getUint16(28,true), b=file.slice(st,st+e.cs);
  if(e.meth===0)return await b.text();
  if(e.meth!==8)throw new Error("Compression non gérée dans le .zip.");
  if(typeof DecompressionStream==="undefined")throw new Error("Ce navigateur ne sait pas ouvrir un .zip : mets iOS à jour, ou dézippe et choisis les fichiers .json.");
  return await new Response(b.stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
}

// ---------- fichiers reconnus ----------
var PAT=[["uds",/UDSFile[^/]*\.json$/i],["hyd",/HydrationLogFile[^/]*\.json$/i],["sleep",/sleepData[^/]*\.json$/i],["health",/healthStatusData[^/]*\.json$/i],
  ["ready",/TrainingReadinessDTO[^/]*\.json$/i],["status",/TrainingHistory[^/]*\.json$/i],["vo2",/MetricsMaxMetData[^/]*\.json$/i],["load",/MetricsAcuteTrainingLoad[^/]*\.json$/i],
  ["pred",/RunRacePredictions[^/]*\.json$/i],["acts",/summarizedActivities[^/]*\.json$/i],["zones",/heartRateZones[^/]*\.json$/i]];
function kindOf(name){for(var i=0;i<PAT.length;i++)if(PAT[i][1].test(name))return PAT[i][0]; return null;}
function arr(x){return Array.isArray(x)?x:x?[x]:[];}
function byTs(a,f){return arr(a).filter(Boolean).sort(function(x,y){return String(x[f]||"")<String(y[f]||"")?-1:1;});}
function day(acc,d){return acc.days[d]||(acc.days[d]={});}
function cdate(v){if(typeof v==="number")return isoMs(v); var s=String(v||"").slice(0,10); return isoOk(s)?s:null;}

function ingest(kind,data,acc){
  if(kind==="uds")arr(data).forEach(function(r){var d=r&&cdate(r.calendarDate); if(!d)return; var o=day(acc,d);
    if(r.restingHeartRate>0)o.rhr=r.restingHeartRate; if(r.totalSteps>0)o.st=r.totalSteps;
    var im=(r.moderateIntensityMinutes||0)+2*(r.vigorousIntensityMinutes||0); if(im>0)o.im=im;
    var s=r.allDayStress&&r.allDayStress.aggregatorList; arr(s).forEach(function(a){if(a.type==="TOTAL"&&a.averageStressLevel>0)o.str=a.averageStressLevel;});
    var bb=r.bodyBattery; if(bb){arr(bb.bodyBatteryStatList).forEach(function(x){if(x.bodyBatteryStatType==="HIGHEST"&&x.statsValue>0)o.bbh=x.statsValue; if(x.bodyBatteryStatType==="LOWEST"&&x.statsValue>=0)o.bbl=x.statsValue;});}
  });
  else if(kind==="sleep")arr(data).forEach(function(r){var d=r&&cdate(r.calendarDate); if(!d)return; var t=(r.deepSleepSeconds||0)+(r.lightSleepSeconds||0)+(r.remSleepSeconds||0); if(t<3600)return;
    var o=day(acc,d); o.sl=t; o.sd=r.deepSleepSeconds||0; o.sr=r.remSleepSeconds||0; o.sa=r.awakeSleepSeconds||0;
    if(r.sleepScores&&r.sleepScores.overallScore>0)o.ss=r.sleepScores.overallScore; if(r.averageRespiration>0)o.rsp=Math.round(r.averageRespiration*10)/10;});
  else if(kind==="health")arr(data).forEach(function(r){var d=r&&cdate(r.calendarDate); if(!d)return; arr(r.metrics).forEach(function(m){
    if(m.type==="HRV"&&m.value>0){var o=day(acc,d); o.hrv=m.value; if(m.baselineLowerLimit>0&&m.baselineUpperLimit>0)o.hrvb=[m.baselineLowerLimit,m.baselineUpperLimit];}});});
  else if(kind==="ready")byTs(data,"timestamp").forEach(function(r){var d=cdate(r.calendarDate); if(d&&r.score>0)day(acc,d).tr=r.score;});
  else if(kind==="status")byTs(data,"timestamp").forEach(function(r){var d=cdate(r.calendarDate); if(d&&r.trainingStatus&&(!r.sport||/RUN|GENERIC/.test(r.sport)||!day(acc,d).ts))day(acc,d).ts=r.trainingStatus;});
  else if(kind==="vo2")byTs(data,"updateTimestamp").forEach(function(r){var d=cdate(r.calendarDate); if(d&&r.vo2MaxValue>0&&(!r.sport||r.sport==="RUNNING"))day(acc,d).vo2=r.vo2MaxValue;});
  else if(kind==="load")byTs(data,"timestamp").forEach(function(r){var d=cdate(r.calendarDate); if(!d)return; var o=day(acc,d);
    if(r.dailyTrainingLoadAcute!=null)o.acu=Math.round(r.dailyTrainingLoadAcute); if(r.dailyTrainingLoadChronic!=null)o.chr=Math.round(r.dailyTrainingLoadChronic);
    if(r.dailyAcuteChronicWorkloadRatio!=null)o.acwr=r.dailyAcuteChronicWorkloadRatio; if(r.acwrStatus)o.as=r.acwrStatus;});
  else if(kind==="pred")byTs(data,"timestamp").forEach(function(r){var d=cdate(r.calendarDate); if(d&&r.raceTimeHalf>0)day(acc,d).p=[r.raceTime5K||0,r.raceTime10K||0,r.raceTimeHalf||0,r.raceTimeMarathon||0];});
  else if(kind==="hyd")arr(data).forEach(function(r){if(r&&r.activityId&&r.estimatedSweatLossInML>0&&r.duration>0)acc.hyd[r.activityId]={ml:r.estimatedSweatLossInML,s:r.duration};});
  else if(kind==="zones"){var z=arr(data), pick=z.filter(function(x){return x.sport==="RUNNING";})[0]||z.filter(function(x){return x.sport==="DEFAULT";})[0]||z[0];
    if(pick&&pick.zone1Floor)acc.zones={f:[pick.zone1Floor,pick.zone2Floor,pick.zone3Floor,pick.zone4Floor,pick.zone5Floor],max:pick.maxHeartRateUsed||0,lt:pick.lactateThresholdHeartRateUsed||0};}
  else if(kind==="acts"){var L=[]; arr(data).forEach(function(x){if(x&&Array.isArray(x.summarizedActivitiesExport))L=L.concat(x.summarizedActivitiesExport); else if(x&&x.activityId)L.push(x);});
    L.forEach(function(a){if(!a||!a.activityId)return; var ms=a.startTimeLocal||a.beginTimestamp||a.startTimeGmt; if(!ms)return;
      var c={id:a.activityId,d:isoMs(ms),ty:String(a.activityType||a.sportType||"").toLowerCase(),km:Math.round((a.distance||0)/1e3)/100,dp:Math.round((a.elevationGain||0)/100),
        t:Math.round((a.movingDuration||a.duration||0)/1000)};
      if(a.avgHr>0)c.hr=Math.round(a.avgHr); if(a.maxHr>0)c.mx=Math.round(a.maxHr);
      var z=[0,1,2,3,4,5].map(function(i){return Math.round((a["hrTimeInZone_"+i]||0)/1000);}); if(z.some(function(v){return v>0;}))c.z=z;
      if(a.aerobicTrainingEffect>0)c.te=Math.round(a.aerobicTrainingEffect*10)/10; if(a.anaerobicTrainingEffect>0)c.an=Math.round(a.anaerobicTrainingEffect*10)/10;
      if(a.trainingEffectLabel)c.lab=a.trainingEffectLabel; if(a.activityTrainingLoad>0)c.load=Math.round(a.activityTrainingLoad);
      var cad=a.avgDoubleCadence||(a.avgRunCadence?a.avgRunCadence*2:0); if(cad>0)c.cad=Math.round(cad);
      if(a.avgGradeAdjustedSpeed>0)c.gas=Math.round(a.avgGradeAdjustedSpeed*1000)/100; // m/s
      if(a.vO2MaxValue>0)c.vo2=a.vO2MaxValue; if(a.workoutRpe>0)c.rpe=a.workoutRpe;
      acc.acts[c.id]=c;});}
}
function finalize(acc){
  var acts=Object.keys(acc.acts).map(function(k){var a=acc.acts[k], h=acc.hyd[a.id]; if(h){a.sw=Math.round(h.ml); a.sws=Math.round(h.s);} return a;}).sort(function(a,b){return a.d<b.d?-1:1;});
  var dates=Object.keys(acc.days).concat(acts.map(function(a){return a.d;})).filter(isoOk).sort();
  if(!dates.length)throw new Error("Aucune donnée exploitable trouvée.");
  // l’export contient parfois des jours « à venir » vides : on s’arrête au dernier jour mesuré
  var last=dates[dates.length-1], today=new Date().toISOString().slice(0,10); if(last>today)last=today;
  return {v:1,imp:Date.now(),files:acc.n,first:dates[0],last:last,days:acc.days,acts:acts,zones:acc.zones||null};
}
async function importFiles(list,prog){
  var acc={days:{},acts:{},hyd:{},zones:null,n:0}, files=Array.prototype.slice.call(list||[]);
  for(var fi=0;fi<files.length;fi++){var f=files[fi];
    if(/\.zip$/i.test(f.name)||/zip/.test(f.type||"")){
      var ents=(await zipEntries(f)).filter(function(e){return kindOf(e.name);});
      if(!ents.length)throw new Error("Aucun fichier Garmin reconnu dans ce .zip (il faut l’export complet du compte).");
      for(var i=0;i<ents.length;i++){if(prog)prog(i+1,ents.length); try{ingest(kindOf(ents[i].name),JSON.parse(await zipText(f,ents[i])),acc); acc.n++;}catch(err){if(/navigateur|Compression/.test(err.message))throw err;}}
    } else {var k=kindOf(f.name); if(!k)continue; if(prog)prog(fi+1,files.length); try{ingest(k,JSON.parse(await f.text()),acc); acc.n++;}catch(err){}}
  }
  if(!acc.n)throw new Error("Aucun fichier Garmin reconnu.");
  var g=finalize(acc); if(!store(g))throw new Error("Mémoire du téléphone pleine : export non gardé."); return g;
}

// ---------- analyse ----------
var STATUS={PRODUCTIVE:"Productif",MAINTAINING:"Maintien",RECOVERY:"Récupération",UNPRODUCTIVE:"Non productif",DETRAINING:"Désentraînement",OVERREACHING:"Surcharge",PEAKING:"Pic de forme",STRAINED:"Tendu",NO_STATUS:"Pas de statut",UNKNOWN:"Inconnu"};
var STATUS_LVL={PRODUCTIVE:"ok",PEAKING:"ok",MAINTAINING:"ok",RECOVERY:"",UNPRODUCTIVE:"warn",DETRAINING:"warn",STRAINED:"warn",OVERREACHING:"off"};
var SPORT={apnea_diving:"Apnée",apnea_hunting:"Chasse sous-marine",open_water_swimming:"Nage en eau libre",lap_swimming:"Natation",strength_training:"Renforcement",cycling:"Vélo",road_biking:"Vélo de route",mountain_biking:"VTT",indoor_cycling:"Vélo d’intérieur",hiking:"Randonnée",walking:"Marche",indoor_cardio:"Cardio",hiit:"HIIT",yoga:"Yoga",pilates:"Pilates",breathwork:"Respiration",resort_skiing_snowboarding_ws:"Ski",backcountry_skiing:"Ski de rando",cross_country_skiing_ws:"Ski de fond",mountaineering:"Alpinisme",rock_climbing:"Escalade",bouldering:"Bloc",indoor_climbing:"Escalade en salle",elliptical:"Elliptique",stair_climbing:"Escaliers",rowing:"Aviron",kayaking:"Kayak",stand_up_paddleboarding:"Paddle",surfing:"Surf",multi_sport:"Multisport",other:"Autre"};
var TE={RECOVERY:"Récupération",AEROBIC_BASE:"Endurance",BASE:"Endurance",TEMPO:"Tempo",LACTATE_THRESHOLD:"Seuil",VO2MAX:"VO2max",ANAEROBIC_CAPACITY:"Anaérobie",SPEED:"Vitesse"};
var ACWR={LOW:["Faible",""],OPTIMAL:["Optimale","ok"],HIGH:["Élevée","warn"],VERY_HIGH:["Très élevée","off"]};
function isRun(a){return /run/.test(a.ty);}

function analyse(g,race){
  var A={}, ref=dN(g.last), days=g.days;
  function win(lo,hi){var o=[]; for(var n=ref-hi+1;n<=ref-lo;n++){var r=days[isoN(n)]; if(r)o.push({n:n,r:r});} return o;}  // [ref-hi+1 ; ref-lo]
  function vals(w,f){return w.filter(function(x){return x.r[f]!=null;}).map(function(x){return x.r[f];});}
  function series(f,from){var o=[]; for(var n=from;n<=ref;n++){var r=days[isoN(n)]; if(r&&r[f]!=null)o.push([n,r[f]]);} return o;}
  A.ref=ref; A.first=dN(g.first); var rd0=new Date(ref*864e5), ms=Math.round(Date.UTC(rd0.getUTCFullYear(),rd0.getUTCMonth(),1)/864e5); A.ms=ms;
  var runs=g.acts.filter(isRun).map(function(a){a.n=dN(a.d); return a;}); A.runs=runs;
  A.nAll=g.acts.length; A.nRun=runs.length;
  var sp={}; g.acts.forEach(function(a){if(dN(a.d)>=ms)sp[a.ty]=(sp[a.ty]||0)+1;}); A.sports=sp;
  function rIn(d0,d1){return runs.filter(function(a){return a.n>ref-d1&&a.n<=ref-d0;});}
  // volume
  var y=rIn(0,365), v={n:y.length,km:0,dp:0,t:0,lk:0,ld:0}; y.forEach(function(a){v.km+=a.km;v.dp+=a.dp;v.t+=a.t; if(a.km>v.lk)v.lk=a.km; if(a.dp>v.ld)v.ld=a.dp;}); A.y=v;
  var months=[], rd=new Date(ref*864e5); for(var i=11;i>=0;i--){var a0=Math.round(Date.UTC(rd.getUTCFullYear(),rd.getUTCMonth()-i,1)/864e5), a1=Math.round(Date.UTC(rd.getUTCFullYear(),rd.getUTCMonth()-i+1,1)/864e5)-1, o={km:0,dp:0,l:MON[new Date(a0*864e5).getUTCMonth()].slice(0,1).toUpperCase()};
    runs.forEach(function(a){if(a.n>=a0&&a.n<=a1){o.km+=a.km;o.dp+=a.dp;}}); months.push(o);} A.months=months;
  var w12=rIn(0,84), k12=0, d12=0, wk=[]; w12.forEach(function(a){k12+=a.km;d12+=a.dp;}); A.dpkm12=k12>0?d12/k12:null; A.km12w=k12/12;
  for(i=0;i<12;i++){var s=0; rIn(i*7,i*7+7).forEach(function(a){s+=a.km;}); wk.push(s);} A.zeroWeeks=wk.filter(function(x){return x<1;}).length;
  A.long8=0; rIn(0,56).forEach(function(a){if(a.km>A.long8)A.long8=a.km;});
  // zones FC
  function zs(L){var z=[0,0,0,0,0,0]; L.forEach(function(a){if(a.z)a.z.forEach(function(v,j){z[j]+=v;});}); var t=z.reduce(function(p,q){return p+q;},0); return t>0?{z:z,t:t,low:(z[0]+z[1]+z[2])/t,mid:z[3]/t,high:(z[4]+z[5])/t}:null;}
  A.z8=zs(rIn(0,56)); A.z14=zs(rIn(0,14)); A.z365=zs(y);
  var lab={}; runs.filter(function(a){return a.n>=ms;}).forEach(function(a){if(a.lab&&TE[a.lab]){var k=TE[a.lab]; lab[k]=(lab[k]||0)+1;}}); A.labels=lab;
  // efficacité aérobie : mètres parcourus par battement (allure ajustée à la pente)
  var eff=runs.filter(function(a){return a.hr>90&&a.t>=1200&&(a.gas>0||(a.km>0&&a.dp/a.km<10));}).map(function(a){var mps=a.gas>0?a.gas:a.km*1000/a.t; return [a.n,mps*60/a.hr];}).filter(function(p){return p[1]>.5&&p[1]<2.5;});
  A.eff=eff.filter(function(p){return p[0]>ref-56;});
  var e1=med(eff.filter(function(p){return p[0]>ref-28;}).map(function(p){return p[1];})), e0=med(eff.filter(function(p){return p[0]>ref-56&&p[0]<=ref-28;}).map(function(p){return p[1];}));
  A.effNow=e1; A.effChg=e1&&e0?(e1-e0)/e0*100:null;
  A.cad=med(rIn(0,56).filter(function(a){return a.cad>100;}).map(function(a){return a.cad;}));
  // VO2max
  var vo=series("vo2",ref-730); if(!vo.length)vo=runs.filter(function(a){return a.vo2;}).map(function(a){return [a.n,a.vo2];});
  var vw=vo.filter(function(p){return p[0]>ref-56;}); A.vo2=vw; if(vo.length){A.vo2Now=vo[vo.length-1][1]; var old=vo.filter(function(p){return p[0]<=ref-56;}); var o0=old.length?old[old.length-1]:(vw.length?vw[0]:vo[0]); A.vo2Old=o0[1]; A.vo2OldN=o0[0];}
  // charge Garmin
  A.acu=series("acu",ref-120); A.chr=series("chr",ref-120);
  var lastLoad=null; for(var n=ref;n>ref-14;n--){var r=days[isoN(n)]; if(r&&r.acu!=null){lastLoad=r; break;}} A.load=lastLoad;
  var stt=null, stc={}; for(n=ref;n>ref-30;n--){r=days[isoN(n)]; if(r&&r.ts){if(!stt)stt=r.ts; stc[r.ts]=(stc[r.ts]||0)+1;}} A.status=stt; A.statusCount=stc;
  // prédictions
  var pr=series("p",ref-400); if(pr.length){A.pred=pr[pr.length-1][1]; A.predN=pr[pr.length-1][0]; var po=pr.filter(function(p){return p[0]<=ref-56;}); if(po.length){A.predOld=po[po.length-1][1]; A.predOldN=po[po.length-1][0];}}
  // projection sur la course suivie
  if(race&&race.km>0){var E=race.km+(race.dp||0)/100; A.race=race; A.E=E;
    if(A.pred&&A.pred[2]>0)A.projPred=A.pred[2]*Math.pow(E/21.0975,1.06);
    var lr=runs.filter(function(a){return a.n>ref-150&&a.km>=12&&a.t>0;}).map(function(a){return a.t*Math.pow(E/(a.km+a.dp/100),1.06);}).sort(function(a,b){return a-b;});
    if(lr.length){A.projRuns=lr.length>=3?lr[1]:lr[0]; A.projN=lr.length;}
    A.raceDpKm=(race.dp||0)/race.km;}
  // récupération
  A.rhr=series("rhr",ref-56); var rh7=vals(win(0,7),"rhr"), rhB=vals(win(14,74),"rhr"), rh30=vals(win(0,30),"rhr"), rh6=vals(win(150,180),"rhr");
  A.rhrNow=mean(rh7); A.rhrBase=med(rhB); A.rhr30=med(rh30); A.rhr6=med(rh6);
  A.hrv=series("hrv",ref-56); var hv7=vals(win(0,7),"hrv"), hvB=vals(win(7,67),"hrv"); A.hrvNow=mean(hv7); A.hrvBase=med(hvB);
  var lastHrv=A.hrv.length?A.hrv[A.hrv.length-1]:null; A.hrvLast=lastHrv; var lb=null; for(n=ref;n>ref-30;n--){r=days[isoN(n)]; if(r&&r.hrvb){lb=r.hrvb; break;}} A.hrvBand=lb;
  var sl=win(0,ref-ms+1).filter(function(x){return x.r.sl;}); A.sleepN=sl.length;
  if(sl.length){var T=0,Dp=0,R=0,sc=[]; sl.forEach(function(x){T+=x.r.sl;Dp+=x.r.sd;R+=x.r.sr; if(x.r.ss)sc.push(x.r.ss);}); A.sleep={avg:T/sl.length,deep:Dp/T,rem:R/T,score:mean(sc),short:sl.filter(function(x){return x.r.sl<7*3600;}).length};}
  var ls=null; for(n=ref;n>=A.first;n--){r=days[isoN(n)]; if(r&&r.sl){ls=n; break;}} A.sleepLast=ls;
  A.sleepSer=sl.map(function(x){return [x.n,x.r.sl/3600];});
  A.bbh=mean(vals(win(0,56),"bbh")); A.str=mean(vals(win(0,56),"str")); A.tr=mean(vals(win(0,56),"tr"));
  var trs=series("tr",ref-56); A.trLast=trs.length?trs[trs.length-1]:null;
  A.steps=mean(vals(win(0,30),"st")); var im=vals(win(0,28),"im"); A.imWeek=im.length?im.reduce(function(p,q){return p+q;},0)/4:null;
  // sueur
  var sw=runs.filter(function(a){return a.sw>0&&a.sws>=1800;}), swl=sw.filter(function(a){return a.sws>=5400;});
  A.sweat=med(sw.map(function(a){return a.sw/(a.sws/3600);})); A.sweatLong=med(swl.map(function(a){return a.sw/(a.sws/3600);})); A.sweatN=sw.length;
  A.zones=g.zones;
  return A;
}

function insights(A){
  var L=[];
  function add(lvl,t,d){L.push({lvl:lvl,t:t,d:d.replace(/\.\./g,".")});}
  if(A.z8&&A.z8.t>3600){var lo=Math.round(A.z8.low*100), hi=Math.round(A.z8.high*100);
    if(A.z8.high>.35)add("warn","Trop d’intensité","Sur 8 semaines, "+hi+" % de ton temps de course est en zone 4-5 et "+lo+" % en zone 1-2. Pour un trail long, vise environ 80 % en zone 1-2 : ralentis les footings, garde l’intensité pour la séance du mardi.");
    else if(A.z8.low>=.7)add("ok","Bonne répartition","Sur 8 semaines, "+lo+" % du temps en zone 1-2 et "+hi+" % en zone 4-5 : c’est la répartition qui fait progresser en endurance.");
    else add("","Répartition moyenne",lo+" % en zone 1-2, "+Math.round(A.z8.mid*100)+" % en zone 3, "+hi+" % en zone 4-5 sur 8 semaines. La zone 3 fatigue sans beaucoup faire progresser : rends l’endurance plus lente.");}
  if(A.rhrNow&&A.rhrBase){var dr=A.rhrNow-A.rhrBase;
    if(dr>=4)add("off","FC de repos en hausse","FC de repos à "+Math.round(A.rhrNow)+" bpm cette semaine contre "+Math.round(A.rhrBase)+" d’habitude (+"+Math.round(dr)+") : signe de fatigue, de stress ou d’un virus. Allège 2-3 jours.");
    else if(A.rhr6&&A.rhr30&&A.rhr30<=A.rhr6-2)add("ok","Cœur plus économe","FC de repos de "+Math.round(A.rhr30)+" bpm ce mois-ci contre "+Math.round(A.rhr6)+" il y a 6 mois : l’endurance progresse.");}
  if(A.hrvNow&&A.hrvBase&&A.hrvNow<A.hrvBase*.88)add("warn","VFC basse","VFC nocturne moyenne "+Math.round(A.hrvNow)+" ms sur 7 jours, contre "+Math.round(A.hrvBase)+" ms d’habitude : récupération incomplète.");
  if(A.effChg!=null){if(A.effChg>=2)add("ok","Plus efficace","À fréquence cardiaque égale, tu vas "+pct(A.effChg).replace("+","")+" plus vite qu’il y a 4 semaines (allure corrigée de la pente).");
    else if(A.effChg<=-3)add("warn","Efficacité en baisse","À fréquence cardiaque égale, tu vas "+f1(-A.effChg)+" % moins vite qu’il y a 4 semaines. Fatigue, chaleur ou manque de footings faciles.");}
  if(A.vo2Now&&A.vo2Old&&A.vo2Now!==A.vo2Old)add(A.vo2Now>A.vo2Old?"ok":"warn","VO2max "+(A.vo2Now>A.vo2Old?"en hausse":"en baisse"),"VO2max estimée "+A.vo2Now+" contre "+A.vo2Old+" le "+dateS(A.vo2OldN)+".");
  if(A.load&&A.load.as&&ACWR[A.load.as]&&A.load.as!=="OPTIMAL"){var c=ACWR[A.load.as];
    add(c[1]||"",A.load.as==="LOW"?"Charge en baisse":"Charge qui monte vite","Charge aiguë "+A.load.acu+" pour une charge chronique de "+A.load.chr+" (ratio "+f1(A.load.acwr)+", "+c[0].toLowerCase()+")."+(A.load.as==="LOW"?" Normal en récupération ; sinon tu perds du fond.":" Au-delà de 1,5 le risque de blessure augmente."));}
  if(A.race&&A.raceDpKm>15&&A.dpkm12!=null&&A.dpkm12<A.raceDpKm*.5)add("warn","Pas assez de dénivelé","Tes 12 dernières semaines font "+Math.round(A.dpkm12)+" m de D+ par km, "+esc(A.race.name)+" en fait "+Math.round(A.raceDpKm)+". Ajoute des côtes et une sortie longue vallonnée par semaine.");
  if(A.race&&A.long8>0&&A.long8<A.race.km*.5)add("","Sortie longue à allonger","Ta plus longue sortie des 8 dernières semaines fait "+f1(A.long8)+" km. Avant "+esc(A.race.name)+", monte progressivement vers "+Math.round(A.race.km*.7)+"-"+Math.round(A.race.km*.8)+" km.");
  if(A.nRun&&A.zeroWeeks>=3)add("warn","Régularité",A.zeroWeeks+" semaines sans course sur les 12 dernières : la régularité compte plus que les grosses semaines.");
  if(A.sleep){if(A.sleep.avg<7*3600)add("warn","Sommeil court",hmS(A.sleep.avg)+" de sommeil en moyenne sur "+A.sleepN+" nuits ce mois-ci, "+A.sleep.short+" nuits sous 7 h. C’est souvent la première cause de stagnation.");}
  else if(A.sleepLast&&A.ref-A.sleepLast>30)add("","Pas de nuits mesurées","Aucune nuit enregistrée depuis le "+dateL(A.sleepLast)+" : porte la montre la nuit pour suivre sommeil, VFC et récupération.");
  else if(!A.sleepLast)add("","Pas de nuits mesurées","L’export ne contient aucune nuit : porte la montre la nuit pour suivre sommeil, VFC et récupération.");
  return L;
}

// ---------- graphiques (SVG) ----------
function chart(o){ // o: {series:[{pts,color,w,dash,dots,area}], x0,x1, ylo,yhi, fmt, band:[lo,hi], H, ref}
  var W=320, H=o.H||140, pl=30, pr=8, pt=8, pb=20, lo=Infinity, hi=-Infinity;
  o.series.forEach(function(s){s.pts.forEach(function(p){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);});});
  if(o.band){lo=Math.min(lo,o.band[0]);hi=Math.max(hi,o.band[1]);} if(o.ref!=null){lo=Math.min(lo,o.ref);hi=Math.max(hi,o.ref);}
  if(o.ylo!=null)lo=Math.min(lo,o.ylo); if(o.yhi!=null)hi=Math.max(hi,o.yhi);
  if(!isFinite(lo))return ""; var span=hi-lo||1; lo-=span*.08; hi+=span*.08; span=hi-lo;
  var x0=o.x0, x1=o.x1; function X(n){return pl+(W-pl-pr)*(n-x0)/Math.max(1,x1-x0);} function Y(v){return pt+(H-pt-pb)*(1-(v-lo)/span);}
  var g='<svg viewBox="0 0 '+W+' '+H+'" class="fm-svg" role="img" aria-label="'+esc(o.label||"")+'">';
  var raw=span/3, mag=Math.pow(10,Math.floor(Math.log10(raw))), step=[1,2,2.5,5,10].map(function(m){return m*mag;}).filter(function(s){return s>=raw;})[0]||raw, fmt=o.fmt||function(v){return String(Math.round(v*100)/100).replace(".",",");};
  for(var tv=Math.ceil(lo/step)*step;tv<=hi;tv+=step)g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(tv).toFixed(1)+'" y2="'+Y(tv).toFixed(1)+'" stroke="var(--line)" stroke-width=".6"/><text x="'+(pl-5)+'" y="'+(Y(tv)+3).toFixed(1)+'" text-anchor="end" font-size="9" fill="var(--muted)">'+fmt(tv)+'</text>';
  if(o.band)g+='<rect x="'+pl+'" width="'+(W-pl-pr)+'" y="'+Y(o.band[1]).toFixed(1)+'" height="'+Math.max(0,Y(o.band[0])-Y(o.band[1])).toFixed(1)+'" fill="var(--brand)" opacity=".12"/>';
  if(o.ref!=null)g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(o.ref).toFixed(1)+'" y2="'+Y(o.ref).toFixed(1)+'" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3"/>';
  o.series.forEach(function(s){if(!s.pts.length)return;
    if(s.dots)s.pts.forEach(function(p){g+='<circle cx="'+X(p[0]).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="'+(s.r||1.8)+'" fill="'+s.color+'" opacity="'+(s.op||.45)+'"/>';});
    else g+='<path d="'+s.pts.map(function(p,k){return (k&&p[0]-s.pts[k-1][0]<=(o.gap||21)?"L":"M")+X(p[0]).toFixed(1)+" "+Y(p[1]).toFixed(1);}).join("")+'" fill="none" stroke="'+s.color+'" stroke-width="'+(s.w||2)+'" stroke-linejoin="round" stroke-linecap="round"'+(s.dash?' stroke-dasharray="'+s.dash+'"':'')+'/>';});
  [x0,Math.round((x0+x1)/2),x1].forEach(function(n,j){g+='<text x="'+X(n).toFixed(1)+'" y="'+(H-5)+'" text-anchor="'+(j===0?"start":j===2?"end":"middle")+'" font-size="9" fill="var(--muted)">'+dateS(n)+'</text>';});
  return g+'</svg>';
}
function roll(pts,k){return pts.map(function(p,i){var a=pts.slice(Math.max(0,i-k+1),i+1).map(function(q){return q[1];}); return [p[0],mean(a)];});}
function monthlyMed(pts){var m={}; pts.forEach(function(p){var d=new Date(p[0]*864e5), k=d.getUTCFullYear()*12+d.getUTCMonth(); (m[k]=m[k]||[]).push(p[1]);});
  return Object.keys(m).sort(function(a,b){return a-b;}).map(function(k){return [Math.round(Date.UTC(Math.floor(k/12),k%12,15)/864e5),med(m[k])];});}
function key(c,t,first){return '<i class="wm-key" style="background:'+c+(first?';margin-left:0':';margin-left:10px')+'"></i>'+t+' ';}
function tiles(T){return '<div class="fm-tiles num">'+T.map(function(x){return '<div><span>'+x[1]+'</span><b>'+x[0]+'</b></div>';}).join("")+'</div>';}
function zbar(z){if(!z)return ""; var c=["var(--down)","var(--down)","var(--brand)","var(--sun)","var(--acc)","var(--off)"], lab=["Z1","Z1","Z2","Z3","Z4","Z5"], parts=[[z.z[0]+z.z[1],0],[z.z[2],2],[z.z[3],3],[z.z[4],4],[z.z[5],5]];
  return '<div class="gz-bar">'+parts.map(function(p){var w=p[0]/z.t*100; return w>0?'<i style="width:'+w.toFixed(1)+'%;background:'+c[p[1]]+'" title="'+lab[p[1]]+'">'+(w>=9?lab[p[1]]+' '+Math.round(w)+'%':'')+'</i>':'';}).join("")+'</div>';}

// ---------- rendu ----------
function empty(busy){
  return '<div class="card"><h2>Analyse de ta montre</h2><p class="small" style="margin:0 0 10px">Importe l’export de ton compte Garmin pour une analyse poussée : intensité réelle de tes sorties, efficacité, VO2max, charge, FC de repos, VFC, sommeil, sudation et projection sur ta course.</p>'+
    '<button class="btn primary" data-act="gimport"'+(busy?' disabled':'')+'>'+(busy?esc(busy):'Importer l’export Garmin')+'</button>'+
    '<p class="small muted" style="margin:10px 0 0">Choisis le .zip reçu de Garmin tel quel, ou les fichiers .json qu’il contient (plusieurs à la fois). Le fichier est lu sur ce téléphone : rien n’est envoyé, seul un résumé par jour est gardé.</p></div>'+
    '<div class="card"><h2>Obtenir l’export</h2><ol class="small g-ol"><li>Sur garmin.com, connecte-toi à ton compte Garmin.</li><li>Va dans Confidentialité, Gestion des données, « Exporter vos données », puis « Demander l’exportation des données ».</li><li>Garmin envoie un lien par mail (de quelques minutes à 48 h). Télécharge le .zip sur le téléphone, puis importe-le ici.</li></ol></div>';
}
function html(ctx){
  ctx=ctx||{}; if(ctx.busy||!G)return empty(ctx.busy);
  var A=analyse(G,ctx.race), h='', i;
  // en-tête
  h+='<div class="card"><div class="g-head"><div><h2>Export Garmin</h2><p class="small muted num" style="margin:0">Du '+dateL(A.first)+' au '+dateL(A.ref)+' · '+A.nRun+' sorties course · importé '+dateS(Math.floor((G.imp-new Date().getTimezoneOffset()*6e4)/864e5))+'</p></div></div>'+
    (A.ref<Math.floor(Date.now()/864e5)-21?'<p class="small" style="margin:8px 0 0"><span class="chip warn">Ancien</span> Cet export date de plus de 3 semaines : demandes-en un nouveau pour une analyse à jour.</p>':'')+
    '<div class="g-actions"><button class="btn sm" data-act="gimport">Importer un nouvel export</button><button class="btn sm danger" data-act="gclear">Effacer</button></div></div>';
  // points clés
  var I=insights(A);
  if(I.length)h+='<div class="card"><h2>Ce qu’il faut retenir</h2><ul class="g-ins">'+I.map(function(x){return '<li class="'+(x.lvl||"info")+'"><b>'+x.t+'</b><span>'+x.d+'</span></li>';}).join("")+'</ul></div>';
  // projection course
  if(A.race&&(A.projPred||A.projRuns)){var goal=A.race.goal*60;
    h+='<div class="card"><h2>Projection '+esc(A.race.name)+'</h2><p class="small muted" style="margin:0 0 10px">'+f1(A.race.km)+' km, +'+nb(A.race.dp)+' m, soit '+f1(A.E)+' km-effort (1 km par 100 m de D+). Objectif '+clock(goal).replace(/:\d\d$/,"")+'.</p>'+
      '<div class="g-proj num">'+(A.projPred?'<div><span>D’après les prédictions Garmin</span><b>'+clock(A.projPred).replace(/:\d\d$/,"")+'</b><em class="'+(A.projPred<=goal+60?"ok":"warn")+'">'+(A.projPred<=goal+60?"dans l’objectif":"+"+hmS(A.projPred-goal)+" sur l’objectif")+'</em></div>':'')+
      (A.projRuns?'<div><span>D’après tes sorties longues</span><b>'+clock(A.projRuns).replace(/:\d\d$/,"")+'</b><em class="'+(A.projRuns<=goal+60?"ok":"warn")+'">'+(A.projRuns<=goal+60?"dans l’objectif":"+"+hmS(A.projRuns-goal)+" sur l’objectif")+'</em></div>':'')+'</div>'+
      '<p class="small muted" style="margin:10px 0 0">Formule de Riegel sur le semi prédit par la montre'+(A.projRuns?', et sur tes '+A.projN+' sorties de plus de 12 km des 5 derniers mois (2e meilleure)':'')+'. Indicatif : le terrain technique, la chaleur et les ravitos ajoutent souvent 5 à 10 %.</p></div>';}
  // course à pied
  var y=A.y;
  if(!A.nAll)h+='<div class="card"><h2>Course à pied</h2><p class="small muted" style="margin:0">Pas d’activités dans les fichiers importés. Elles sont dans le fichier « summarizedActivities » de l’export : importe le .zip complet pour avoir l’analyse des sorties, de l’intensité et de l’efficacité.</p></div>';
  else{
  var mx=1; A.months.forEach(function(m){mx=Math.max(mx,m.km);});
  h+='<div class="card"><h2>Course à pied · 12 mois</h2><h3 class="sub" style="margin:6px 0 6px">Kilomètres par mois</h3><div class="wm-bars fm-bars" style="grid-template-columns:repeat(12,1fr)" role="img" aria-label="Kilomètres par mois">';
  A.months.forEach(function(m,k){h+='<div class="wm-col'+(k===11?" today":"")+'"><div class="wm-plot">'+(m.km?'<i class="a" style="height:'+Math.max(4,m.km/mx*100)+'%"></i>':'<i class="rest"></i>')+'</div><b class="fm-l">'+m.l+'</b></div>';});
  h+='</div><p class="small muted num" style="margin:8px 0 0">Maximum : '+Math.round(mx)+' km.</p></div>';}
  // intensité
  if(A.z8||A.z14){h+='<div class="card"><h2>Intensité réelle</h2><p class="small muted" style="margin:0 0 10px">Temps passé dans chaque zone de fréquence cardiaque'+(A.zones?' (zones de la montre : Z2 dès '+A.zones.f[1]+', Z4 dès '+A.zones.f[3]+' bpm, max '+A.zones.max+')':'')+'.</p>'+
    (A.z8?'<p class="small" style="margin:0 0 4px"><b>8 dernières semaines</b></p>'+zbar(A.z8):'')+(A.z14?'<p class="small" style="margin:10px 0 4px"><b>2 dernières semaines</b></p>'+zbar(A.z14):'')+
    '<p class="small muted" style="margin:10px 0 0">Repère pour le trail : environ 80 % du temps en Z1-Z2, le reste surtout en Z4-Z5 lors des séances de qualité.</p>';
    var lk=Object.keys(A.labels); if(lk.length)h+='<h3 class="sub" style="margin:14px 0 6px">Effet principal des sorties (mois en cours)</h3><div class="g-chips">'+lk.sort(function(a,b){return A.labels[b]-A.labels[a];}).map(function(k){return '<span class="chip">'+k+' · '+A.labels[k]+'</span>';}).join("")+'</div>';
    h+='</div>';}
  // efficacité
  if(A.eff.length>=3){var ep=A.eff, mm=roll(ep,3);
    h+='<div class="card"><h2>Efficacité aérobie</h2><div class="fm-top num"><div><span>Actuelle</span><b style="color:var(--brand)">'+(A.effNow?String(Math.round(A.effNow*100)/100).replace(".",","):"–")+'</b></div><div><span>Vs 4 sem.</span><b>'+(A.effChg==null?"–":(A.effChg>=0?"+":"−")+Math.abs(Math.round(A.effChg))+'<small style="font-size:18px"> %</small>')+'</b></div><div><span>Cadence</span><b>'+(A.cad?Math.round(A.cad):"–")+'</b></div></div>'+
      chart({series:[{pts:ep,color:"var(--muted)",dots:true},{pts:mm,color:"var(--brand)",w:2.4}],gap:45,x0:A.ref-56,x1:A.ref,label:"Mètres par battement de cœur, 8 semaines"})+
      '<p class="small muted" style="margin:8px 0 0">'+key("var(--brand)","moyenne de 3 sorties",1)+key("var(--muted)","une sortie")+'<br>Mètres parcourus par battement de cœur, à l’allure corrigée de la pente : plus c’est haut, plus ton moteur est efficace. Cadence en pas par minute (8 dernières semaines).</p></div>';}
  // VO2max + prédictions
  if(A.vo2Now||A.pred){h+='<div class="card"><h2>VO2max et prédictions</h2>';
    if(A.vo2Now){h+='<div class="fm-top num"><div><span>VO2max</span><b style="color:var(--brand)">'+A.vo2Now+'</b></div><div><span>Il y a 8 sem.</span><b>'+A.vo2Old+'</b></div><div><span>Écart</span><b>'+sgn(A.vo2Now-A.vo2Old)+'</b></div></div>';
      if(A.vo2.length>=2)h+=chart({series:[{pts:A.vo2,color:"var(--brand)",w:2.4}],gap:9999,x0:A.ref-56,x1:A.ref,fmt:function(v){return String(Math.round(v));},label:"VO2max"});}
    if(A.pred){var nm=["5 km","10 km","Semi","Marathon"]; h+='<table class="g-tab num"><thead><tr><th><span class="sr">Distance</span></th><th>Prédit</th><th>Allure</th>'+(A.predOld?'<th>Il y a 8 sem.</th>':'')+'</tr></thead><tbody>'+
      A.pred.map(function(t,k){if(!t)return ""; var d=[5,10,21.0975,42.195][k]; return '<tr><td>'+nm[k]+'</td><td><b>'+clock(t)+'</b></td><td>'+pace(t/d)+'</td>'+(A.predOld?'<td>'+(A.predOld[k]?(t<=A.predOld[k]?'<span class="g-up">−':'<span class="g-dn">+')+clock(Math.abs(t-A.predOld[k]))+'</span>':'–')+'</td>':'')+'</tr>';}).join("")+'</tbody></table><p class="small muted" style="margin:6px 0 0">Prédictions route de la montre au '+dateS(A.predN)+'.</p>';}
    h+='</div>';}
  // charge Garmin
  if(A.acu.length>=7){var ld=A.load, st=A.status;
    h+='<div class="card"><h2>Charge Garmin</h2><div class="fm-top num"><div><span>Aiguë</span><b style="color:var(--acc-ink)">'+(ld?ld.acu:"–")+'</b></div><div><span>Chronique</span><b style="color:var(--brand)">'+(ld&&ld.chr!=null?ld.chr:"–")+'</b></div><div><span>Ratio</span><b>'+(ld&&ld.acwr!=null?f1(ld.acwr):"–")+'</b></div></div>'+
      (ld&&ld.as&&ACWR[ld.as]?'<span class="chip '+ACWR[ld.as][1]+'">Charge '+ACWR[ld.as][0].toLowerCase()+'</span> ':'')+(st?'<span class="chip '+(STATUS_LVL[st]||"")+'">Statut : '+(STATUS[st]||st)+'</span>':'')+
      '<div style="margin-top:10px">'+chart({series:[{pts:A.chr,color:"var(--brand)",w:2.4},{pts:A.acu,color:"var(--acc)",w:1.8,dash:"5 3"}],x0:A.ref-120,x1:A.ref,ylo:0,fmt:function(v){return String(Math.round(v));},label:"Charge aiguë et chronique, 4 mois"})+'</div>'+
      '<p class="small muted" style="margin:8px 0 0">'+key("var(--brand)","chronique (4 sem.)",1)+key("var(--acc)","aiguë (7 j)")+'<br>Ratio aiguë/chronique : 0,8 à 1,3 = progression sûre ; au-delà de 1,5 = risque de blessure.';
    var sc=Object.keys(A.statusCount); if(sc.length)h+=' Statut sur 30 jours : '+sc.sort(function(a,b){return A.statusCount[b]-A.statusCount[a];}).map(function(k){return (STATUS[k]||k).toLowerCase()+' '+A.statusCount[k]+' j';}).join(", ")+'.';
    h+='</p></div>';}
  // récupération
  if(A.rhr.length>=7||A.hrv.length||A.sleepLast){h+='<div class="card"><h2>Récupération</h2><div class="fm-top num"><div><span>FC repos</span><b style="color:var(--brand)">'+(A.rhrNow?Math.round(A.rhrNow):"–")+'</b></div><div><span>VFC nuit</span><b>'+(A.hrvNow?Math.round(A.hrvNow):"–")+'</b></div><div><span>Disponibilité</span><b>'+(A.tr?Math.round(A.tr):"–")+'</b></div></div>';
    if(A.rhr.length>=7){h+='<h3 class="sub" style="margin:6px 0 4px">FC de repos (bpm)</h3>'+chart({series:[{pts:A.rhr,color:"var(--muted)",dots:true,r:1.3,op:.35},{pts:roll(A.rhr,7),color:"var(--brand)",w:2.2}],x0:A.ref-56,x1:A.ref,fmt:function(v){return String(Math.round(v));},label:"Fréquence cardiaque de repos"})+
      '<p class="small muted" style="margin:6px 0 0">Moyenne 7 jours. Habituelle : '+(A.rhrBase?Math.round(A.rhrBase)+' bpm':'–')+'. Une hausse de 4-5 bpm sur plusieurs jours signale fatigue, maladie ou manque de sommeil.</p>';}
    if(A.hrv.length>=7){h+='<h3 class="sub" style="margin:14px 0 4px">VFC nocturne (ms)</h3>'+chart({series:[{pts:A.hrv,color:"var(--muted)",dots:true,r:1.3,op:.35},{pts:roll(A.hrv,7),color:"var(--down)",w:2.2}],x0:A.ref-56,x1:A.ref,band:A.hrvBand,fmt:function(v){return String(Math.round(v));},label:"Variabilité de la fréquence cardiaque"})+
      '<p class="small muted" style="margin:6px 0 0">Moyenne 7 jours'+(A.hrvBand?', bande verte = ta plage normale selon Garmin':'')+'. Plus haute = mieux récupérée.</p>';}
    h+=tiles([[A.bbh?Math.round(A.bbh):"–","Body Battery max"],[A.str?Math.round(A.str):"–","Stress moyen"],[A.trLast?A.trLast[1]:"–","Dispo. dernière"]]).replace('fm-tiles','fm-tiles g-mt');
    h+='<p class="small muted" style="margin:6px 0 0">Moyennes des 8 dernières semaines. Disponibilité à l’entraînement sur 100.</p></div>';}
  // sommeil
  h+='<div class="card"><h2>Sommeil · mois en cours</h2>';
  if(A.sleep){h+=tiles([[hmS(A.sleep.avg),"Durée moy."],[A.sleep.score?Math.round(A.sleep.score):"–","Score"],[A.sleep.short+'<small> / '+A.sleepN+'</small>',"Nuits &lt; 7 h"],[Math.round(A.sleep.deep*100)+'<small> %</small>',"Profond"],[Math.round(A.sleep.rem*100)+'<small> %</small>',"Paradoxal"],[String(A.sleepN),"Nuits mesurées"]]);
    if(A.sleepSer.length>=4)h+='<h3 class="sub" style="margin:14px 0 4px">Heures par nuit, mois en cours</h3>'+chart({series:[{pts:A.sleepSer,color:"var(--muted)",dots:true,r:1.6,op:.5},{pts:roll(A.sleepSer,3),color:"var(--down)",w:2.2}],x0:A.ms,x1:A.ref,ref:8,gap:4,fmt:function(v){return f1(v);},label:"Sommeil du mois"})+'<p class="small muted" style="margin:6px 0 0">Pointillés : 8 h. En période de charge, vise 8 h et plus.</p>';}
  else h+='<p class="small muted" style="margin:0">'+(A.sleepLast?'Aucune nuit mesurée ce mois-ci (dernière le '+dateL(A.sleepLast)+').':'Aucune nuit dans l’export.')+' Porte la montre la nuit pour suivre sommeil et VFC.</p>';
  h+='</div>';
  // hydratation + quotidien
  var hy=A.sweat;
  h+='<div class="card"><h2>Sudation et quotidien</h2>'+tiles([[hy?nb(hy)+'<small> ml/h</small>':"–","Sueur en course"],[A.steps?nb(A.steps):"–","Pas par jour"],[A.imWeek!=null?nb(A.imWeek)+'<small> min</small>':"–","Intensité / sem."]]);
  if(hy){var base=A.sweatLong||hy; h+='<p class="small" style="margin:8px 0 0">Pertes estimées par la montre sur '+A.sweatN+' sorties'+(A.sweatLong?' ('+nb(A.sweatLong)+' ml/h sur celles de plus de 1 h 30)':'')+'. En course longue, bois environ <b>'+nb(Math.round(base*.6/50)*50)+' à '+nb(Math.round(base*.8/50)*50)+' ml par heure</b> (60-80 % des pertes), plus s’il fait chaud. Teste-le en sortie longue.</p>';}
  h+='<p class="small muted" style="margin:8px 0 0">Minutes d’intensité au sens de l’OMS (les minutes vigoureuses comptent double) : objectif 150 par semaine, largement dépassé en préparation trail.</p></div>';
  // autres sports
  var sk=Object.keys(A.sports).filter(function(k){return !/run/.test(k);}); if(sk.length){h+='<div class="card"><h2>Autres activités · mois en cours</h2><div class="g-chips">'+sk.sort(function(a,b){return A.sports[b]-A.sports[a];}).map(function(k){return '<span class="chip">'+esc(SPORT[k]||k.replace(/_/g," "))+' · '+A.sports[k]+'</span>';}).join("")+'</div></div>';}
  h+='<p class="small muted" style="margin:4px 4px 16px">Analyse calculée par Cadenzo à partir des fichiers de l’export (VO2max, charge, statut, prédictions et zones sont ceux de la montre). Les données restent sur ce téléphone.</p>';
  return h;
}
function clear(){G=null; try{localStorage.removeItem(KEY);}catch(e){}}
window.GARMIN={importFiles:importFiles,html:html,clear:clear,has:function(){return !!G;},dbg:function(){return {G:G,analyse:analyse,insights:insights};}};
})();
