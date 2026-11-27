"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = fs.readFileSync("app.js", "utf8");

function extractFunction(name) {
  const marker = new RegExp("function\\s+" + name + "\\s*\\(");
  const match = marker.exec(source);
  assert.ok(match, "Fonction absente : " + name);
  const start = match.index;
  const open = source.indexOf("{", match.index);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === "\n") lineComment = false; continue; }
    if (blockComment) { if (c === "*" && n === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = null; continue; }
    if (c === "/" && n === "/") { lineComment = true; i++; continue; }
    if (c === "/" && n === "*") { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    if (c === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Bloc non fermé : " + name);
}

const context = {
  Math, Number, String, Object, Array, isFinite,
  TRAIN_PREF: null,
  HIST: [], DAY: 864e5, todayUTC: () => Date.UTC(2026, 10, 27),
  dms: s => Date.parse(s + "T00:00:00Z"), dayN: s => Math.round(Date.parse(s + "T00:00:00Z") / 864e5),
  kmS: n => String(n),
  RENFO: {},
  woMin: () => 12
};
const names = ["stravaStats", "effLevel", "pauseRamp", "famOf", "longCapKm", "isClubSession", "canBackToBack", "applyTrailElevation", "athleteLoadRules", "coachingRules"];
vm.createContext(context);
vm.runInContext("var LVL=[\"debutant\",\"reprise\",\"regulier\",\"confirme\"], SS_CACHE=null, FAMLONG={\"10k\":[60,75,90],semi:[90,105,120],marathon:[150,165,180],tcourt:[75,105,120],tmoyen:[120,165,210],tlong:[180,225,270]};", context);
vm.runInContext(names.map(extractFunction).join("\n"), context);

function pref(profile, sessions = 5, days = [1,2,3,5,6]) {
  return { onboarding_completed: true, sessions_per_week: sessions, training_days: days, athlete_profile: profile };
}
function session(dow, type, km, dp, tag, extra = {}) {
  return Object.assign({ dow, type, km, dp, tag, k: type + dow }, extra);
}

// 1. Blocs consécutifs : réservés aux traileurs confirmés avec charge et jours adaptés.
context.TRAIN_PREF = pref({ discipline:"trail", experience:"confirme", weekly_km:40, runs_per_week:5 });
assert.equal(context.canBackToBack(), true);
context.TRAIN_PREF = pref({ discipline:"route", experience:"confirme", weekly_km:45, runs_per_week:5 });
assert.equal(context.canBackToBack(), false);
context.TRAIN_PREF = pref({ discipline:"trail", experience:"debutant", weekly_km:20, runs_per_week:3 });
assert.equal(context.canBackToBack(), false);
context.TRAIN_PREF = pref({ discipline:"trail", experience:"confirme", weekly_km:40, runs_per_week:5 }, 5, [1,2,3,4,5]);
assert.equal(context.canBackToBack(), false);

// 2. D+ : seulement sur trail, sans écraser les valeurs réelles ni les courses.
const trailPref = pref({ discipline:"trail", experience:"confirme", weekly_km:40, runs_per_week:5 });
const elev = [
  session(1,"Endurance facile",8,0,"e"),
  session(3,"Côtes",6,0,"q"),
  session(5,"Sortie longue",15,300,"l"),
  session(6,"Jour J",38,1300,"l",{race:true}),
  session(2,"Renfo seul",0,0,"e")
];
const elevated = context.applyTrailElevation(elev, {L:38,dp:1300}, trailPref);
assert.ok(elevated[0].dp > 0 && elevated[0].dpEstimated);
assert.ok(elevated[1].dp > elevated[0].dp);
assert.equal(elevated[2].dp, 300);
assert.equal(elevated[3].dp, 1300);
assert.equal(elevated[4].dp, 0);
const road = context.applyTrailElevation([session(1,"Footing",8,0,"e")], {L:38,dp:1300}, pref({discipline:"route"}));
assert.equal(road[0].dp, 0);

// 3. Charge : plafonnement, maintien des séances de club et courses obligatoires.
const loadInput = [
  session(1,"Fractionné / piste",8,0,"q",{club:true}),
  session(2,"Endurance + renfo",8,0,"e"),
  session(3,"Côtes",8,0,"q"),
  session(5,"Sortie longue",18,500,"l"),
  session(6,"Course B",12,250,"l")
];
const load = context.athleteLoadRules(loadInput, pref({discipline:"trail",experience:"debutant",weekly_km:20,runs_per_week:3},4), 1, false);
assert.ok(load.sessions.some(s => s.club && s.km === 8), "Le club obligatoire doit être conservé");
assert.ok(load.sessions.some(s => s.type === "Course B" && s.km === 12), "La course B doit être conservée");
assert.ok(load.sessions.reduce((n,s)=>n+(s.km||0),0) <= load.cap + 0.11 || !!load.warning, "La charge doit être plafonnée ou signalée");

// 4. Intensité : récupération/affûtage sans qualité optionnelle, club maintenu et allégé.
const coachInput = [
  session(1,"Fractionné / piste",8,0,"q",{club:true}),
  session(2,"Côtes",7,100,"q"),
  session(4,"Tempo long",8,100,"q"),
  session(6,"Sortie longue",15,500,"l")
];
const recovery = context.coachingRules(coachInput, trailPref, 4, true, "Base");
assert.equal(recovery.sessions.filter(s => s.tag === "q" && !s.club).length, 0);
assert.ok(recovery.sessions.some(s => s.club), "La séance collective reste présente");
assert.ok(recovery.warnings.length > 0);
const taper = context.coachingRules(coachInput, trailPref, 25, false, "Affûtage");
assert.equal(taper.sessions.filter(s => s.tag === "q" && !s.club).length, 0);

// 5. Qualité jamais au-dessus de la sortie longue ; la réduction touche la qualité d'abord.
const qIn = [
  session(1,"Fractionné",11,0,"q"),
  session(3,"Endurance facile",5,0,"e"),
  session(5,"Sortie longue",8,0,"l")
];
const qOut = context.athleteLoadRules(qIn, pref({discipline:"route",experience:"debutant",weekly_km:14,runs_per_week:3},3,[1,3,5]), 1, false);
const qk = qOut.sessions.find(s => s.tag === "q").km, lk = qOut.sessions.find(s => s.tag === "l").km;
assert.ok(qk <= lk + 0.01, "La qualité ne dépasse pas la sortie longue : " + qk + " / " + lk);
assert.ok(lk >= qk, "La sortie longue est protégée : " + JSON.stringify(qOut.sessions.map(s=>[s.type,s.km])));

// 6. Familles de course.
assert.equal(context.famOf(10,50,{athlete_profile:{discipline:"route"}}).id, "10k");
assert.equal(context.famOf(21.1,150,{athlete_profile:{discipline:"route"}}).id, "semi");
assert.equal(context.famOf(42.2,250,{athlete_profile:{discipline:"route"}}).id, "marathon");
assert.equal(context.famOf(25,1200,{athlete_profile:{discipline:"trail"}}).id, "tmoyen");
assert.equal(context.famOf(15,300,{athlete_profile:{discipline:"trail"}}).id, "tcourt");
assert.equal(context.famOf(50,3000,{athlete_profile:{discipline:"trail"}}).id, "tlong");

// 7. Strava : niveau réel = le plus bas, pause = reprise progressive.
const ds = n => new Date(Date.UTC(2026, 10, 27) - n * 864e5).toISOString().slice(0, 10);
context.HIST.length = 0;
for (let i = 1; i <= 24; i++) context.HIST.push({ date: ds(i * 3), km: 6, dp: 50, t: 2200, hr: 0 });
context.HIST.sort((a, b) => a.date < b.date ? -1 : 1);
context.SS_CACHE = null;
const st = context.stravaStats();
assert.ok(st.ok && st.level === "debutant", "6 km x ~5 sorties par 4 semaines : niveau observé débutant");
assert.equal(context.effLevel({athlete_profile:{experience:"confirme"}}), "debutant");
assert.equal(context.effLevel({athlete_profile:{experience:"debutant"}}), "debutant");
assert.equal(context.pauseRamp(3), null);
assert.equal(context.pauseRamp(10).f, 0.7);
assert.equal(context.pauseRamp(20).f, 0.6);
assert.equal(context.pauseRamp(40).f, 0.5);
context.HIST.length = 0; context.SS_CACHE = null;

console.log("OK : scénarios sportifs validés (blocs, D+, charge, intensités) + qualité/sortie longue, familles, Strava.");
