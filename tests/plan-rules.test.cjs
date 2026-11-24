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
  kmS: n => String(n),
  RENFO: {},
  woMin: () => 12
};
const names = ["isClubSession", "canBackToBack", "applyTrailElevation", "athleteLoadRules", "coachingRules"];
vm.createContext(context);
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

console.log("OK : 4 familles de scénarios sportifs validées (blocs, D+, charge, intensités).");
