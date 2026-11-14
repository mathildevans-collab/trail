// Cadenzo · fiabilité des données : validation, fusion sans perte, sauvegardes automatiques locales.
// Tout reste sur le téléphone. Aucune donnée n’est envoyée nulle part.
(function(root){
"use strict";

var MAPS=["done","undone","actual","ci","adj","edits","todo","results","extra"];
var SRC={manual:1,strava:1,csv:1,garmin:1,fit:1};
function isObj(o){return o&&typeof o==="object"&&!Array.isArray(o);}
function isoOk(s){return typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+"T00:00:00Z"));}
function fin(n,lo,hi){return typeof n==="number"&&isFinite(n)&&n>=lo&&n<=hi;}
function keyOk(k){return typeof k==="string"&&k.length>0&&k.length<=90;}

// ---------- enveloppe d’export ----------
function wrap(state,garmin){
  var o={app:"cadenzo",kind:"backup",format:1,exported:new Date().toISOString(),state:state};
  if(garmin)o.garmin=garmin; return o;
}
function unwrap(o){ // accepte l’ancien format (état brut) et le nouveau (enveloppe)
  if(isObj(o)&&o.app==="cadenzo"&&isObj(o.state))return {state:o.state,garmin:isObj(o.garmin)?o.garmin:null,exported:o.exported||"",enveloppe:true};
  return {state:o,garmin:null,exported:"",enveloppe:false};
}

// ---------- validation ----------
// Ne jette jamais l’ensemble : les entrées invalides sont écartées et comptées, le reste est gardé.
function validate(raw){
  var errors=[], dropped=0, st=raw;
  if(!isObj(st))return {ok:false,errors:["Le fichier ne contient pas de données Cadenzo."],state:null,dropped:0};
  if(!isObj(st.done)||!isObj(st.set))return {ok:false,errors:["Ce n’est pas une sauvegarde Cadenzo (séances ou réglages absents)."],state:null,dropped:0};
  if(st.v!==3&&st.v!=null&&st.v!==2&&st.v!==1)errors.push("Version inconnue : "+st.v);
  var out={};
  Object.keys(st).forEach(function(k){out[k]=st[k];});
  MAPS.forEach(function(m){
    if(st[m]==null){out[m]={}; return;}
    if(!isObj(st[m])){errors.push("« "+m+" » illisible, ignoré"); out[m]={}; dropped++; return;}
    var c={}; Object.keys(st[m]).forEach(function(k){
      var v=st[m][k]; if(!keyOk(k)){dropped++; return;}
      if(m==="done"||m==="undone"){ if(v)c[k]=1; else dropped++; return; }
      if(m==="actual"){ if(isObj(v)&&fin(v.km,0,1000)&&fin(v.dp==null?0:v.dp,0,30000)&&fin(v.t==null?0:v.t,0,86400*3)){c[k]={km:v.km,dp:v.dp||0,t:v.t||0,src:SRC[v.src]?v.src:"manual"}; if(v.at)c[k].at=v.at;} else dropped++; return; }
      if(m==="extra"){ if(isoOk(k)&&isObj(v)&&fin(v.km,0,1000)){c[k]={km:v.km,dp:v.dp||0,t:v.t||0};} else dropped++; return; }
      if(v==null){dropped++; return;} c[k]=v;
    }); out[m]=c;
  });
  if(!Array.isArray(st.races)){out.races=[]; if(st.races!=null){errors.push("Liste des courses illisible, ignorée"); dropped++;}}
  else{ var seen={}; out.races=st.races.filter(function(r){
      var ok=isObj(r)&&typeof r.id==="string"&&r.id&&!seen[r.id]&&typeof r.name==="string"&&isoOk(r.date)&&fin(r.km,0.1,1000)&&fin(r.dp==null?0:r.dp,0,30000);
      if(ok)seen[r.id]=1; else dropped++; return ok;}); }
  ["set","cycle"].forEach(function(k){ if(!isObj(st[k]))out[k]={}; });
  if(!isObj(st.kit))out.kit={};
  if(typeof st.active!=="string")out.active=(out.races[0]||{}).id||"";
  out.v=3;
  return {ok:true,errors:errors,state:out,dropped:dropped};
}

// ---------- fusion sans perte ----------
// Règle : ce téléphone gagne en cas de conflit, rien n’est supprimé, aucune clé n’est dupliquée.
// Exception voulue : une saisie manuelle l’emporte sur une valeur lue depuis Strava ou un CSV.
function clone(o){return JSON.parse(JSON.stringify(o));}
function merge(local,incoming){
  var s=clone(local), n=clone(incoming), add={}, kept=0;
  function bump(g){add[g]=(add[g]||0)+1;}
  MAPS.forEach(function(m){ if(!isObj(s[m]))s[m]={}; });
  // séances faites / décochées volontairement
  Object.keys(n.done||{}).forEach(function(k){ if(s.undone[k])return; if(!s.done[k]){s.done[k]=1; bump("séances faites");} });
  Object.keys(n.undone||{}).forEach(function(k){ if(s.done[k])return; if(!s.undone[k]){s.undone[k]=1;} });
  // chiffres réalisés
  Object.keys(n.actual||{}).forEach(function(k){
    var a=n.actual[k], b=s.actual[k];
    if(!b){s.actual[k]=a; bump("chiffres réalisés");}
    else if(a.src==="manual"&&b.src!=="manual"){s.actual[k]=a; bump("chiffres réalisés");}
    else kept++;
  });
  ["ci","adj","edits","todo","results"].forEach(function(m){
    Object.keys(n[m]||{}).forEach(function(k){ if(!(k in s[m])){s[m][k]=n[m][k]; bump({ci:"check-ins",adj:"ajustements",edits:"séances modifiées",todo:"listes cochées",results:"résultats"}[m]);} else kept++; });
  });
  // sorties hors plan : calculées depuis Strava, on ne garde que ce qui manque
  Object.keys(n.extra||{}).forEach(function(k){ if(!(k in s.extra))s.extra[k]=n.extra[k]; });
  // listes par course (kit)
  s.kit=isObj(s.kit)?s.kit:{}; Object.keys(n.kit||{}).forEach(function(rid){
    if(!isObj(s.kit[rid])){s.kit[rid]=n.kit[rid]; bump("listes de matériel");}
    else if(isObj(n.kit[rid]))Object.keys(n.kit[rid]).forEach(function(k){ if(!(k in s.kit[rid]))s.kit[rid][k]=n.kit[rid][k]; });
  });
  // courses : union par identifiant
  var ids={}; (s.races||[]).forEach(function(r){ids[r.id]=1;});
  (n.races||[]).forEach(function(r){ if(!ids[r.id]){(s.races=s.races||[]).push(r); ids[r.id]=1; bump("courses");} });
  if(!s.race&&n.race)s.race=n.race; if(!s.practice&&n.practice)s.practice=n.practice;
  return {state:s,added:add,kept:kept};
}
function summary(local,incoming){ // ce que l’import ajouterait, sans rien modifier
  var m=merge(local,incoming), tot=0; Object.keys(m.added).forEach(function(k){tot+=m.added[k];}); return {added:m.added,total:tot,kept:m.kept};
}
function counts(st){
  return {done:Object.keys(st.done||{}).length,actual:Object.keys(st.actual||{}).length,edits:Object.keys(st.edits||{}).length,adj:Object.keys(st.adj||{}).length,races:(st.races||[]).length,ci:Object.keys(st.ci||{}).length};
}
function hash(str){var h=5381,i; for(i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0; return (h>>>0).toString(36)+":"+str.length;}

// ---------- sauvegardes automatiques (IndexedDB) ----------
var DB=null, DBNAME="cadenzo-safe";
function idb(){
  if(DB)return DB;
  DB=new Promise(function(res){
    try{ var q=root.indexedDB.open(DBNAME,1);
      q.onupgradeneeded=function(){q.result.createObjectStore("snaps",{keyPath:"id"});};
      q.onsuccess=function(){res(q.result);}; q.onerror=function(){res(null);}; q.onblocked=function(){res(null);};
    }catch(e){res(null);}
  }); return DB;
}
function tx(mode,fn){
  return idb().then(function(db){ if(!db)return null;
    return new Promise(function(res){ try{ var t=db.transaction("snaps",mode), s=t.objectStore("snaps"), out=fn(s); t.oncomplete=function(){res(out&&out.result!==undefined?out.result:true);}; t.onerror=function(){res(null);}; t.onabort=function(){res(null);}; }catch(e){res(null);} });
  });
}
var KEEP={auto:12,other:8}, LASTID=0;
function snap(reason,str,extra){ // reason : auto | manuel | avant import | avant restauration | illisible
  var id=Math.max(Date.now(),LASTID+1); LASTID=id; var rec={id:id,reason:reason,at:new Date(id).toISOString(),size:str.length,hash:hash(str),data:str}; if(extra)rec.extra=extra;
  return tx("readwrite",function(s){s.put(rec);}).then(function(ok){ if(!ok)return null; return prune().then(function(){return rec;}); });
}
function list(){
  return tx("readonly",function(s){return s.getAll();}).then(function(a){ if(!Array.isArray(a))return []; return a.map(function(r){return {id:r.id,reason:r.reason,at:r.at,size:r.size,hash:r.hash};}).sort(function(x,y){return y.id-x.id;}); });
}
function get(id){return tx("readonly",function(s){return s.get(id);}).then(function(r){return r&&typeof r==="object"?r:null;});}
function prune(){
  return list().then(function(a){ var na=0,no=0, del=[]; a.forEach(function(r){ if(r.reason==="auto"){ if(++na>KEEP.auto)del.push(r.id);} else { if(++no>KEEP.other)del.push(r.id);} });
    if(!del.length)return true; return tx("readwrite",function(s){del.forEach(function(i){s.delete(i);});}); });
}
function persist(){
  try{ if(root.navigator&&navigator.storage&&navigator.storage.persist)return navigator.storage.persist().then(function(p){return p;}).catch(function(){return false;}); }catch(e){}
  return Promise.resolve(false);
}
function persisted(){
  try{ if(root.navigator&&navigator.storage&&navigator.storage.persisted)return navigator.storage.persisted().catch(function(){return false;}); }catch(e){}
  return Promise.resolve(false);
}

var API={wrap:wrap,unwrap:unwrap,validate:validate,merge:merge,summary:summary,counts:counts,hash:hash,snap:snap,list:list,get:get,persist:persist,persisted:persisted,clone:clone};
if(typeof module!=="undefined"&&module.exports)module.exports=API; else root.SAFE=API;
})(typeof window!=="undefined"?window:globalThis);
