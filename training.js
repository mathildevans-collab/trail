(function(root){
  "use strict";
  var DISTANCES=[5,10,21.0975,42.195];
  var EFFORTS={1:"Récupération",2:"Endurance fondamentale",3:"Allure soutenue",4:"Seuil / fractionné",5:"VMA courte"};
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function median(a){if(!a.length)return null;var x=a.slice().sort(function(p,q){return p-q;}),m=x.length>>1;return x.length%2?x[m]:(x[m-1]+x[m])/2;}
  function paceText(sec){if(!(sec>0)||!isFinite(sec))return "";var m=Math.floor(sec/60),s=Math.round(sec%60);if(s===60){m++;s=0;}return m+":"+(s<10?"0":"")+s;}
  function paceRange(sec,spread){if(!(sec>0))return "";spread=spread||8;return paceText(sec-spread)+"–"+paceText(sec+spread)+"/km";}
  function hrRange(z){return z&&z[0]>0?(Math.round(z[0])+"–"+(z[1]>0?Math.round(z[1]):"")+(z[1]>0?"":"+")+" bpm"):"";}
  function garminZones(g){
    var z=g&&g.zones,f=z&&z.f;
    if(!Array.isArray(f)||f.length<5||!f.every(function(x){return Number(x)>0;}))return null;
    f=f.map(Number);for(var i=1;i<f.length;i++)if(f[i]<=f[i-1])return null;
    var max=Number(z.max)||0,out={};
    if(max&&max<=f[4])return null;
    for(i=1;i<=5;i++)out[i]=[f[i-1],i<5?f[i]-1:max||null];
    return out;
  }
  function profileZones(profile){
    var max=Number(profile&&profile.max_hr),rest=Number(profile&&profile.resting_hr),out={};
    if(!(max>=120&&max<=230))return null;
    var bands=[[.5,.6],[.6,.7],[.7,.8],[.8,.9],[.9,1]];
    bands.forEach(function(b,i){
      var lo,hi;
      if(rest>=30&&rest<max-20){var reserve=max-rest;lo=rest+reserve*b[0];hi=rest+reserve*b[1];}
      else{lo=max*b[0];hi=max*b[1];}
      out[i+1]=[Math.round(lo),Math.round(hi)];
    });
    return out;
  }
  function effortDistance(name){
    var n=String(name||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
    var map={"400m":.4,"800m":.8,"1k":1,"1mile":1.60934,"2mile":3.21869,"5k":5,"10k":10,"15k":15,"10mile":16.0934,"20k":20,"halfmarathon":21.0975,"30k":30,"marathon":42.195};
    return map[n]||null;
  }
  function performances(history,garmin,today){
    var candidates=[],cut=today-180*86400000;
    var days=garmin&&garmin.days||{};
    Object.keys(days).sort().forEach(function(d){
      var ts=Date.parse(d+"T00:00:00Z"),p=days[d]&&days[d].p;
      if(!Array.isArray(p)||!isFinite(ts)||ts<cut)return;
      p.forEach(function(t,i){if(t>0&&DISTANCES[i])candidates.push({date:d,distance:DISTANCES[i],seconds:Number(t),source:"Garmin"});});
    });
    (history||[]).forEach(function(run){
      if(!run||!run.date||Date.parse(run.date+"T23:59:59Z")<cut)return;
      (run.be||[]).forEach(function(b){
        var name=Array.isArray(b)?b[0]:b.n||b.name,sec=Number(Array.isArray(b)?b[1]:b.t||b.elapsed_time),dist=effortDistance(name);
        if(dist&&sec>0)candidates.push({date:run.date,distance:dist,seconds:sec,source:"Strava"});
      });
    });
    return candidates.filter(function(x){return x.seconds>0&&x.distance>0;}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  }
  function metrics(profile,history,garmin,race,now){
    profile=profile||{};now=now||Date.now();
    var zones=garminZones(garmin)||profileZones(profile),source=garminZones(garmin)?"Garmin":zones?"Profil":"non configurée";
    var perf=performances(history,garmin,now),best=null;
    if(perf.length){
      var recent=perf.filter(function(x){return x.distance>=3.5&&x.distance<=42.195;});
      if(recent.length)best=recent.reduce(function(a,b){
        var ap=a.seconds/Math.pow(a.distance/5,1.06),bp=b.seconds/Math.pow(b.distance/5,1.06);
        return bp<ap?b:a;
      });
    }
    var p5=best?best.seconds/Math.pow(best.distance/5,1.06):null;
    var targetPace=Number(race&&race.targetPaceSecKm)||0;
    if(!p5&&targetPace>180&&targetPace<900)p5=targetPace/Math.pow(Math.max(1,Number(race.distance)||10)/5,.06);
    var paces=null;
    if(p5){
      function at(d){return p5*Math.pow(d/5,.06);}
      paces={vma:Math.max(150,p5-8),threshold:at(10)+8,pace5k:at(5),pace10k:at(10),paceHalf:at(21.0975),paceMarathon:at(42.195),easy:at(5)+75,recovery:at(5)+95};
      if(targetPace>0)paces.race=targetPace;
      else if(race&&Number(race.distance)>0){var d=Number(race.distance);paces.race=at(d);}
    }
    var easySamples=[];
    if(zones&&zones[2]){
      (history||[]).forEach(function(r){
        var km=Number(r.km),t=Number(r.t),hr=Number(r.hr),dp=Number(r.dp)||0;
        if(km>=5&&km<=22&&t>=1500&&hr>=zones[2][0]&&(!zones[2][1]||hr<=zones[2][1]+3)&&dp/km<12){
          var age=Date.parse(String(r.date||"")+"T23:59:59Z");
          if(isFinite(age)&&age>=now-90*86400000)easySamples.push(t/km);
        }
      });
    }
    var observedEasy=easySamples.length>=3?median(easySamples):null;
    if(paces&&observedEasy)paces.easy=observedEasy;
    if(paces&&observedEasy)paces.easyObserved=true;
    return {zones:zones,zoneSource:source,paceSource:best?best.source+(best.date?" · "+best.date:""):targetPace?"objectif de course":"indisponible",paces:paces,performances:perf.length,easySamples:easySamples.length};
  }
  function zoneLabel(n,m){
    var z=m&&m.zones&&m.zones[n],fallback={1:"très facile, respiration relâchée",2:"aisance conversationnelle",3:"soutenu, phrases courtes",4:"difficile mais contrôlé",5:"très intense, effort bref"};
    return "Z"+n+(z&&z[0]?" · "+hrRange(z):" · "+(fallback[n]||"effort ressenti"));
  }
  function zoneForSession(s){
    if(s.zone)return Number(s.zone);
    if(s.type==="Récupération"||s.type==="Footing de récupération")return 1;
    if(s.tag==="q")return /VMA|fractionne court/i.test(s.type||"")?5:/Seuil|tempo|allure specifique/i.test(s.type||"")?4:3;
    return 2;
  }
  function paceForSession(s,m,discipline){
    if(!m||!m.paces||discipline==="trail")return null;
    var p=m.paces,t=String(s.type||"").toLowerCase();
    if(/vma|fractionne court/.test(t))return p.vma;
    if(/seuil|tempo/.test(t))return p.threshold;
    if(/allure specifique|allure course/.test(t))return p.race||p.pace10k;
    if(/recuperation/.test(t))return p.recovery||p.easy;
    if(/endurance|footing|sortie longue|vallonnee|vallonnée/.test(t))return p.easy;
    return null;
  }
  function applyTargets(sessions,m,discipline){
    return (sessions||[]).map(function(s){
      if(!s||s.race||s.type==="Renfo seul"||s.type==="Autre sport")return s;
      var z=zoneForSession(s),zv=m&&m.zones&&m.zones[z],p=paceForSession(s,m,discipline);
      s.zone=z;s.hrTarget=zoneLabel(z,m);
      if(zv)s.hrRange=hrRange(zv);
      if(p){s.pace=paceRange(p,/vma/.test(String(s.type||"").toLowerCase())?5:10);s.pacel="Allure indicative";}
      if(Array.isArray(s.steps)){
        s.steps=s.steps.map(function(step){
          if(!Array.isArray(step))return step;
          return [step[0],String(step[1]||"").replace(/\b(?:zone|Z)\s*([1-5])\b/gi,function(_,n){return zoneLabel(+n,m);})];
        });
        if(zv&&!s.steps.some(function(x){return /FC cible/i.test(String(x[0]));}))s.steps.push(["FC cible",s.hrTarget]);
        if(s.pace&&!s.steps.some(function(x){return /Allure cible/i.test(String(x[0]));}))s.steps.push(["Allure cible",s.pace]);
      }
      return s;
    });
  }
  function roadQuality(phase,week,rec,distance,metrics){
    if(rec)return {tag:"e",zone:2,type:"Footing + lignes droites",km:6,steps:[["35 min","Endurance fondamentale Z2"],["6 × 20 s","Accélérations souples, récupération complète en marchant"]],txt:"Semaine allégée : garde de la fréquence, sans séance intense."};
    var d=Number(distance)||10,kind;
    if(phase==="Base")kind=week%2?"vma":"fartlek";
    else if(phase==="Construction")kind=week%2?"threshold":"vma";
    else kind=d>=30?"race":d>=18?"threshold":"race";
    if(kind==="vma")return {tag:"q",zone:5,type:"VMA courte",km:8,steps:[["15 min","Échauffement progressif en Z2"],["8 × 1 min","Effort VMA en Z5, récupération 1 min en Z1-Z2"],["10 min","Retour au calme en Z1-Z2"]],txt:"Développer la puissance aérobie avec des répétitions courtes et régulières."};
    if(kind==="fartlek")return {tag:"q",zone:4,type:"Fartlek structuré",km:8,steps:[["15 min","Échauffement en Z2"],["6 × 2 min","Effort soutenu Z4, récupération 2 min en Z2"],["10 min","Retour au calme"]],txt:"Alterner les rythmes sans chercher à finir épuisé."};
    if(kind==="threshold")return {tag:"q",zone:4,type:"Seuil",km:9,steps:[["15 min","Échauffement progressif en Z2"],["3 × 8 min","Seuil Z4, récupération 2 min en Z1-Z2"],["10 min","Retour au calme en Z1-Z2"]],txt:"Améliorer la capacité à tenir une allure soutenue et régulière."};
    var reps=d>=30?"3 × 12 min":d>=18?"3 × 10 min":"5 × 4 min";
    var desc=d>=30?"Allure marathon Z3":d>=18?"Allure semi Z3-Z4":"Allure 10 km Z4";
    return {tag:"q",zone:d>=30?3:4,type:"Allure spécifique",km:d>=30?11:9,steps:[["15 min","Échauffement en Z2"],[reps,desc+", récupération 3 min en Z2"],["10 min","Retour au calme en Z1-Z2"]],txt:"Travail spécifique à la distance préparée. L'allure est ajustée aux performances disponibles."};
  }
  function roadWeek(options){
    var w=Number(options.week)||1,n=Math.max(1,Number(options.totalWeeks)||1),phase=options.phase||"Base",rec=!!options.recovery;
    var profile=options.profile||{},weekly=Math.max(10,Number(profile.weekly_km)||25),dist=Number(options.distance)||10;
    var maxLong=dist>=35?30:dist>=18?22:dist>=9?16:12;
    var baseLong=clamp(weekly*.38,8,maxLong),progress=(n<=1?1:clamp((w-1)/(n-1),0,1));
    var longKm=Math.round((baseLong+(maxLong-baseLong)*progress)*(rec?.72:phase==="Affûtage"?.62:1));
    if(phase==="Affûtage")longKm=Math.max(6,Math.round(Math.min(longKm,maxLong*.6)));
    var quality=roadQuality(phase,w,rec,dist,options.metrics);
    var easy=Math.max(4,Math.round(weekly*.2)),short=Math.max(3,Math.round(easy*.75));
    var sessions=[
      Object.assign({dow:1},quality),
      {dow:2,tag:"e",type:"Endurance fondamentale + renfo",km:easy,dp:0,zone:2,renfo:"A1",steps:[[easy+" km","Endurance fondamentale continue en Z2"],["12 min","Renforcement général et gainage"]],txt:"Construire l'endurance aérobie sans accumuler de fatigue."},
      {dow:3,tag:"e",type:"Footing de récupération",km:short,dp:0,zone:1,steps:[[short+" km","Très facile en Z1, respiration relâchée"]],txt:"Récupérer de la séance de qualité. Tu dois pouvoir parler sans effort."},
      {dow:5,tag:"e",type:"Endurance active",km:easy,dp:0,zone:2,steps:[[easy+" km","Endurance Z2 régulière"],["6 × 15 s","Lignes droites souples, récupération complète"]],txt:"Entretenir la foulée et l'économie de course, sans intensité prolongée."},
      {dow:6,tag:"l",type:"Sortie longue route",km:longKm,dp:0,zone:2,steps:[[longKm+" km","Endurance fondamentale Z2, allure régulière"]],txt:"Sortie longue sur terrain roulant. Reste en aisance respiratoire du début à la fin."}
    ];
    return {ph:phase,rec:rec,s:sessions,note:rec?"Volume et intensité réduits pour assimiler la charge.":phase==="Spécifique"?"Les séances se rapprochent de la distance objectif, sans multiplier les intensités.":"Plan route : une séance de qualité, des footings différenciés et une seule sortie longue."};
  }
  function trailQuality(phase,week,rec){
    if(rec)return {tag:"e",zone:2,type:"Footing vallonné facile",km:6,dp:80,steps:[["35 min","Endurance facile en Z2, terrain souple"],["5 × 15 s","Relances souples en côte, récupération complète"]],txt:"Semaine allégée : conserve la fréquence sans séance intense."};
    if(phase==="Base")return week%2?{tag:"q",zone:4,type:"Côtes courtes",km:8,dp:180,steps:[["15 min","Échauffement progressif en Z2"],["8 × 1 min","Montée régulière en Z4, redescendre en trottinant"],["10 min","Retour au calme en Z1-Z2"]],txt:"Développer la force en côte sans sprinter."}:{tag:"q",zone:3,type:"Fartlek nature",km:8,dp:120,steps:[["15 min","Échauffement en Z2"],["6 × 2 min","Effort soutenu Z3-Z4 sur chemin, récupération 2 min facile"],["10 min","Retour au calme"]],txt:"Varier les rythmes sur terrain naturel, sans forcer en descente."};
    if(phase==="Construction")return week%2?{tag:"q",zone:4,type:"Côtes enchaînées",km:9,dp:260,steps:[["15 min","Échauffement en Z2"],["6 × 3 min","Montée au seuil Z4, récupération en descente facile"],["10 min","Retour au calme en Z1-Z2"]],txt:"Renforcer la capacité à soutenir un effort en montée."}:{tag:"q",zone:3,type:"Tempo trail",km:9,dp:180,steps:[["15 min","Échauffement en Z2"],["3 × 8 min","Effort régulier Z3 sur sentier vallonné, récupération 3 min"],["10 min","Retour au calme"]],txt:"Tenir un effort régulier sur terrain irrégulier."};
    return {tag:"q",zone:4,type:"Allure spécifique trail",km:9,dp:300,steps:[["15 min","Échauffement en Z2"],["4 × 6 min","Effort course en montée Z3-Z4, récupération en descente contrôlée"],["10 min","Retour au calme en Z1-Z2"]],txt:"Répéter l'effort du jour J sur un relief proche de la course, sans accélérer en descente."};
  }
  function trailWeek(options){
    options=options||{};
    var w=Number(options.week)||1,n=Math.max(1,Number(options.totalWeeks)||1),phase=options.phase||"Base",rec=!!options.recovery;
    var profile=options.profile||{},race=options.race||{},dist=Number(options.distance)||Number(race.distance)||20;
    var grade=clamp(Number(race.elevation||options.elevation||0)/Math.max(1,dist),0,45);
    var weekly=Math.max(12,Number(profile.weekly_km)||25),progress=n<=1?1:clamp((w-1)/(n-1),0,1);
    var maxLong=dist>=35?30:dist>=22?24:dist>=12?18:14;
    var longKm=Math.round(clamp(weekly*.42,8,maxLong)+(maxLong-clamp(weekly*.42,8,maxLong))*progress);
    if(rec)longKm=Math.max(7,Math.round(longKm*.72));
    if(phase==="Affûtage")longKm=Math.max(6,Math.min(longKm,Math.round(maxLong*.55)));
    var q=trailQuality(phase,w,rec), easy=Math.max(5,Math.round(weekly*.18)), short=Math.max(4,Math.round(easy*.75));
    var longDp=Math.round(longKm*grade*(phase==="Affûtage"?.45:.7));
    var allowB2B=!!options.backToBack&&!rec&&phase==="Spécifique"&&w<n-1;
    var sessions=[
      Object.assign({dow:1},q),
      {dow:2,tag:"e",type:"Endurance + renfo",km:easy,dp:Math.round(easy*grade*.25),zone:2,renfo:"A1",steps:[[easy+" km","Endurance fondamentale en Z2 sur terrain facile"],["12 min","Renforcement général et gainage"]],txt:"Construire l'endurance et la stabilité sans ajouter d'intensité."},
      {dow:3,tag:"e",type:"Footing de récupération",km:short,dp:Math.round(short*grade*.15),zone:1,steps:[[short+" km","Très facile en Z1, terrain roulant ou souple"]],txt:"Récupération active. Ralentis ou marche si les jambes restent lourdes."},
      {dow:5,tag:allowB2B?"l":"e",type:allowB2B?"Sortie longue trail":"Technique trail",km:allowB2B?longKm:Math.max(5,Math.round(easy*.9)),dp:allowB2B?longDp:Math.round(easy*.9*grade*.55),zone:2,steps:allowB2B?[[longKm+" km","Endurance fondamentale Z2, marche active dans les pentes fortes"]]:[["15 min","Échauffement en Z2"],["6 × 45 s","Montée technique à effort contrôlé, descente en marchant ou très lentement"],["Fin de séance","Endurance facile en Z2"]],txt:allowB2B?"Premier jour du bloc : allure facile, ravitaillement testé et descente contrôlée.":"Travail de pied, cadence en montée et contrôle en descente. Aucun sprint."},
      {dow:6,tag:"l",type:allowB2B?"Jour 2 du bloc":"Sortie longue trail",km:allowB2B?Math.max(8,Math.round(longKm*.65)):longKm,dp:allowB2B?Math.round(longDp*.65):longDp,zone:2,steps:[[String(allowB2B?Math.max(8,Math.round(longKm*.65)):longKm)+" km","Endurance fondamentale en Z2, marche active dans les fortes pentes"]],txt:allowB2B?"Deuxième jour du bloc : volume réduit, effort facile, priorité au temps passé sur les jambes.":"Sortie longue sur sentier : régularité, gestion des montées et descentes contrôlées."}
    ];
    if(allowB2B){
      sessions[4].type="Jour 2 du bloc";
      sessions[4].txt+=" Le volume du premier jour doit rester maîtrisé.";
    }
    sessions[4].dp=Math.max(0,sessions[4].dp||0);
    return {ph:phase,rec:rec,s:sessions,note:rec?"Semaine allégée : volume et dénivelé réduits pour assimiler la charge.":allowB2B?"Bloc trail réservé aux profils confirmés avec charge et disponibilités suffisantes.":"Plan trail : une séance de montée, une séance technique, des footings différenciés et une seule sortie longue."};
  }
  function mixedWeek(options){
    var w=Number(options.week)||1,profile=options.profile||{},race=options.race||{},trailTarget=Number(race.elevation||0)/(Number(race.distance)||1)>=12;
    var out=trailTarget?trailWeek(Object.assign({},options,{backToBack:!!options.backToBack})):roadWeek(options);
    var sat=out.s.filter(function(s){return s.dow===5;})[0];
    if(sat&&sat.tag!=="l"){
      sat.type="Endurance vallonnée";
      sat.txt=trailTarget?"Séance terrain : sentier vallonné, cadence courte en montée et descente contrôlée. Reste en Z2.":"Sortie sur chemins et route : travaille l'adaptation du pied sans ajouter d'intensité.";
      sat.steps=[[sat.km+" km","Terrain mixte en Z2, effort constant malgré les changements de surface"]];
      sat.zone=2;
    }else if(sat&&sat.tag==="l"){
      sat.type="Sortie longue mixte";
      sat.txt="Premier jour du bloc mixte : allure facile, terrain varié, ravitaillement testé et descente contrôlée.";
    }
    if(w%2===0){
      var q=out.s.filter(function(s){return s.tag==="q";})[0];
      if(q){q.type="Fartlek mixte";q.zone=4;q.steps=[["15 min","Échauffement en Z2"],["6 × 2 min","Effort soutenu Z4 sur terrain souple, récupération 2 min en Z2"],["10 min","Retour au calme"]];q.txt="Séance de qualité sur terrain varié : rythme contrôlé, relances propres, pas de sprint en descente.";}
    }
    out.note="Plan mixte : qualité sur route ou terrain varié, endurance sur chemins et sortie longue adaptée à la course.";
    return out;
  }
  var api={metrics:metrics,applyTargets:applyTargets,roadWeek:roadWeek,trailWeek:trailWeek,mixedWeek:mixedWeek,zoneLabel:zoneLabel,paceRange:paceRange};
  root.CadenzoTraining=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
