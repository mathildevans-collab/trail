// Cadenzo · synchro entre appareils, sans compte.
// Les données sont CHIFFRÉES sur l’appareil (AES-GCM, clé aléatoire de 256 bits) avant d’être déposées
// sur Supabase (table cadenzo_sync, accessible seulement par les fonctions cadenzo_get / cadenzo_put).
// Supabase ne voit qu’un fichier illisible ; la clé n’existe que dans le « code de liaison »
// que tu copies toi-même d’un appareil à l’autre.
(function(root){
"use strict";
// Projet Supabase : l’URL et la clé publishable (anon) sont publiques par nature ; ne jamais mettre la clé service_role ici.
var SB_URL="https://psotpksrdlkivauxdiad.supabase.co";
var SB_KEY="sb_publishable_TE_8fhfqw-Y4bPFX60uoTA_UD3K2wrC";
// Clés propres à chaque appareil : jamais synchronisées.
var LOCAL_KEYS={sync:1,rev:1,saved:1,focus:1,race:1,practice:1,set:1};
var SHARED_SET={gel:1,water:1,vib:1,checkin:1};

function stable(v){ // JSON à clés triées : le même contenu donne toujours le même texte
  if(v===null||typeof v!=="object")return JSON.stringify(v);
  if(Array.isArray(v))return "["+v.map(stable).join(",")+"]";
  return "{"+Object.keys(v).sort().filter(function(k){return v[k]!==undefined;}).map(function(k){return JSON.stringify(k)+":"+stable(v[k]);}).join(",")+"}";
}
function shared(D){ // ce qui voyage entre les appareils
  var o={}; Object.keys(D).forEach(function(k){ if(!LOCAL_KEYS[k])o[k]=D[k]; });
  o.set={}; var s=D.set||{}; Object.keys(SHARED_SET).forEach(function(k){ if(s[k]!=null)o.set[k]=s[k]; });
  return JSON.parse(JSON.stringify(o));
}
function hashOf(sh){ return root.SAFE?root.SAFE.hash(stable(sh)):stable(sh).length+""; }

// ---------- décision : que faire à cette synchro ? ----------
// L, R : états partagés local / distant (R=null si rien en ligne) ; last : empreinte à la dernière synchro réussie ;
// parent : empreinte de l’état que l’auteur du fichier distant avait lu avant d’écrire (détecte les écritures croisées).
function decide(L,R,last,hash,parent){
  if(!R)return {act:"push",why:"premier envoi"};
  var lh=hash(L), rh=hash(R);
  if(lh===rh)return {act:"same",lh:lh};
  if(last&&lh===last)return parent===last?{act:"pull",why:"modifié sur l’autre appareil"}:{act:"merge",why:"écritures croisées"};
  if(last&&rh===last)return {act:"push",why:"modifié ici"};
  return {act:"merge",why:last?"modifié des deux côtés":"première liaison"};
}

// ---------- octets / base64 ----------
function toB64(u8){var t="";for(var i=0;i<u8.length;i++)t+=String.fromCharCode(u8[i]);return btoa(t);}
function fromB64(s){var t=atob(s),u=new Uint8Array(t.length);for(var i=0;i<t.length;i++)u[i]=t.charCodeAt(i);return u;}
function urlB64(u8){return toB64(u8).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function unUrlB64(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return fromB64(s);}
function rnd(n){var a=new Uint8Array(n); root.crypto.getRandomValues(a); return a;}
function fail(code,msg){var e=new Error(msg); e.code=code; return e;}

// ---------- chiffrement ----------
function keyOf(cfg){return root.crypto.subtle.importKey("raw",unUrlB64(cfg.key),"AES-GCM",false,["encrypt","decrypt"]);}
function encrypt(cfg,obj){
  var iv=rnd(12), data=new TextEncoder().encode(JSON.stringify(obj));
  return keyOf(cfg).then(function(k){return root.crypto.subtle.encrypt({name:"AES-GCM",iv:iv},k,data);}).then(function(ct){
    return {cadenzo:"sync",v:1,iv:toB64(iv),ct:toB64(new Uint8Array(ct))};});
}
function decrypt(cfg,env){
  if(!env||env.cadenzo!=="sync"||!env.iv||!env.ct)return Promise.reject(fail("data","Le fichier en ligne n’est pas un fichier Cadenzo."));
  return keyOf(cfg).then(function(k){return root.crypto.subtle.decrypt({name:"AES-GCM",iv:fromB64(env.iv)},k,fromB64(env.ct));})
    .then(function(pt){return JSON.parse(new TextDecoder().decode(pt));},function(){throw fail("key","Ce code de liaison ne correspond pas aux données en ligne.");});
}

// ---------- code de liaison ----------
function newConfig(){return {id:urlB64(rnd(24)),key:urlB64(rnd(32)),sb:1};}
function makeCode(cfg){return "cdz3."+urlB64(new TextEncoder().encode(JSON.stringify({i:cfg.id,k:cfg.key})));}
function parseCode(s){
  s=String(s||"").replace(/\s+/g,""); if(s.indexOf("cdz3.")!==0)return null;
  try{var o=JSON.parse(new TextDecoder().decode(unUrlB64(s.slice(5)))); if(o&&/^[\w-]{20,80}$/.test(o.i)&&/^[\w-]{40,50}$/.test(o.k))return {id:o.i,key:o.k,sb:1};}catch(e){}
  return null;
}

// ---------- stockage ----------
function net(status){
  if(status===401||status===403)return fail("svc","Supabase refuse la clé de l’appli (clé publishable ou droits des fonctions).");
  if(status===404)return fail("svc","Fonctions de synchro absentes sur Supabase (script SQL pas lancé ?).");
  if(status===429)return fail("net","Trop de requêtes, nouvel essai plus tard.");
  return fail("net","Le service de stockage ne répond pas ("+status+").");
}
function rpc(fn,args){
  if(!SB_URL||!SB_KEY)return Promise.reject(fail("svc","Synchro pas encore configurée dans l’appli (projet Supabase manquant)."));
  var h={"Content-Type":"application/json","Accept":"application/json","apikey":SB_KEY};
  if(!/^sb_/.test(SB_KEY))h.Authorization="Bearer "+SB_KEY; // ancienne clé anon (JWT)
  return fetch(SB_URL.replace(/\/+$/,"")+"/rest/v1/rpc/"+fn,{method:"POST",headers:h,body:JSON.stringify(args),cache:"no-store"}).then(function(r){
    if(!r.ok)throw net(r.status); return r.text();
  }).then(function(t){return t?JSON.parse(t):null;});
}
function putRemote(cfg,doc){
  return encrypt(cfg,doc).then(function(env){
    if(JSON.stringify(env).length>1500000)throw fail("size","Données trop volumineuses pour la synchro (trace GPX trop lourde ?).");
    return rpc("cadenzo_put",{p_id:cfg.id,p_env:env});
  }).then(function(){return true;});
}
function create(cfg,doc){ if(!cfg.id)cfg.id=urlB64(rnd(24)); return putRemote(cfg,doc).then(function(){return cfg.id;}); }
function getRemote(cfg){
  return rpc("cadenzo_get",{p_id:cfg.id}).then(function(env){
    if(env==null)throw fail("gone","Rien en ligne pour ce code de liaison. Reconnecte les appareils.");
    return decrypt(cfg,env);
  }).then(function(doc){return {doc:doc};});
}
function wrapDoc(sh,dev,parent){return {app:"cadenzo",kind:"sync",format:2,mt:new Date().toISOString(),device:dev||"",parent:parent||"",state:sh};}

var API_={stable:stable,shared:shared,hashOf:hashOf,decide:decide,newConfig:newConfig,makeCode:makeCode,parseCode:parseCode,create:create,getRemote:getRemote,putRemote:putRemote,wrapDoc:wrapDoc,configured:function(){return !!(SB_URL&&SB_KEY);},encrypt:encrypt,decrypt:decrypt};
if(typeof module!=="undefined"&&module.exports)module.exports=API_; else root.CSYNC=API_;
})(typeof window!=="undefined"?window:globalThis);
