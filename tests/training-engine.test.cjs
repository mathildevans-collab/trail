"use strict";
const assert=require("node:assert/strict");
const T=require("../training.js");
const now=Date.now();
const profile={discipline:"route",experience:"regulier",weekly_km:35,runs_per_week:4,max_hr:190,resting_hr:55};
const history=[
 {date:new Date(now-12*864e5).toISOString().slice(0,10),km:10,dp:10,t:3000,hr:145,be:[{n:"5K",t:1420}]},
 {date:new Date(now-8*864e5).toISOString().slice(0,10),km:8,dp:0,t:2400,hr:142,be:[]},
 {date:new Date(now-4*864e5).toISOString().slice(0,10),km:12,dp:20,t:3720,hr:146,be:[{n:"10K",t:3000}]}
];
const garmin={zones:{f:[100,120,140,160,180],max:190},days:{}};
const m=T.metrics(profile,history,garmin,{distance:10},now);
assert.equal(m.zoneSource,"Garmin");
assert.deepEqual(m.zones[2],[120,139]);
assert.ok(m.paces&&m.paces.easy>0&&m.paces.threshold>0);
assert.equal(T.metrics(profile,history,null,{distance:10},now).zoneSource,"Profil");
assert.equal(T.metrics({},[],null,{distance:10},now).zones,null);
for(const d of ["route","trail","mixte"]){
 const o={week:4,totalWeeks:16,phase:"Construction",distance:21.1,profile:Object.assign({},profile,{discipline:d}),race:{distance:21.1,elevation:d==="trail"?900:40}};
 const w=d==="route"?T.roadWeek(o):d==="mixte"?T.mixedWeek(o):null;
 if(w){
  assert.equal(w.s.filter(s=>s.tag==="l").length,1);
  assert.ok(w.s.some(s=>s.tag==="q"&&s.steps.length>=3));
  if(d==="route")assert.ok(w.s.every(s=>(s.dp||0)===0));
  if(d==="mixte")assert.ok(w.s.some(s=>s.type==="Endurance vallonnée"));
 }
}
const sessions=T.applyTargets([{type:"Seuil",tag:"q",steps:[["15 min","Échauffement Z2"],["3 × 8 min","Seuil Z4"]]}],m,"route");
assert.ok(sessions[0].hrTarget.includes("bpm"));
assert.ok(sessions[0].pace);
console.log("OK : zones Garmin/profil, allures issues des efforts, plans route/mixte et cibles de séance.");
