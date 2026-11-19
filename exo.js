// Cadenzo · bibliothèque d’exercices : dessins précis en 2 étapes + fiche technique de chaque exercice.
// Tout est dessiné en SVG (aucune image à télécharger : ça marche hors connexion).
(function(root){
"use strict";

// ================= moteur de dessin =================
// Personnage de profil, tourné vers la droite. Chaque segment est défini par un angle absolu (degrés) :
// 0 = vers le bas, 90 = vers l’avant (droite), 180 = vers le haut, −90 = vers l’arrière (gauche).
var LEN={tor:17,head:5.4,neck:8.8,ua:9.5,fa:8.5,th:15,sh:15,ft:5.6};
var G=80, FAR=.36;                       // ligne du sol (y) et opacité des membres éloignés
function pt(o,len,deg){var r=deg*Math.PI/180; return [o[0]+len*Math.sin(r),o[1]+len*Math.cos(r)];}
function rnd(n){return Math.round(n*10)/10;}
function clampAcos(v){return Math.acos(Math.max(-1,Math.min(1,v)))*180/Math.PI;}

// P = {x, H, t, hd, a:[ua,fa], b:[ua,fa], l:[cuisse,tibia,pied], m:[cuisse,tibia,pied], hot:[], props:[], ar:[], lab:""}
// - H : hauteur du bassin au-dessus du sol (le sol est la ligne y = 68)
// - un tibia « g+ » / « g− » (ou avant-bras) est calculé pour que le pied (la main) touche exactement le sol, vers l’avant (+) ou l’arrière (−)
// - « sup » : hauteur d’une surface d’appui (marche, chaise) sous le pied ou la main concernés
function solve(P){
  var hipY, x=P.x==null?58:P.x, sup=P.sup||{};
  function floorOf(k){return G-2-(sup[k]||0)-(k==="a"||k==="b"?-1:1);}
  function build(hy){
    var hip=[0,hy], o={hip:hip};
    var tor=P.t==null?180:P.t; if(P.sp){o.mid=pt(hip,LEN.tor/2,P.sp[0]); o.sh=pt(o.mid,LEN.tor/2,P.sp[1]); tor=P.sp[1];} else o.sh=pt(hip,LEN.tor,tor);
    var hd=P.hd==null?tor:P.hd; o.head=pt(o.sh,LEN.neck,hd);
    function limb(root,a,lens,floor,names){
      var j1=pt(root,lens[0],a[0]), a2=a[1];
      if(typeof a2==="string"){ var sgn=a2.charAt(1)==="+"?1:-1, need=(floor-j1[1])/lens[1]; if(Math.abs(need)>1.001)o.warn=(o.warn||"")+names+" hors de portée ("+rnd(need)+") ";
        a2=sgn*clampAcos(need); }
      var j2=pt(j1,lens[1],a2), r={}; r[names+"1"]=j1; r[names+"2"]=j2; if(a[2]!==undefined)r[names+"3"]=pt(j2,LEN.ft,a[2]); return r;
    }
    Object.assign(o,limb(hip,P.l||[0,0,90],[LEN.th,LEN.sh],floorOf("l"),"l"),limb(hip,P.m||[0,0,90],[LEN.th,LEN.sh],floorOf("m"),"m"),
      limb(o.sh,P.a||[0,0],[LEN.ua,LEN.fa],floorOf("a"),"a"),limb(o.sh,P.b||[0,0],[LEN.ua,LEN.fa],floorOf("b"),"b"));
    if(!o.l3)o.l3=pt(o.l2,LEN.ft,90); if(!o.m3)o.m3=pt(o.m2,LEN.ft,90);
    return o;
  }
  if(P.H==="auto"){ // le bassin se place pour que les appuis (jambes « cont ») touchent leur surface
    var t0=build(0), best=null; (P.cont||["l"]).forEach(function(k){ var low=Math.max(t0[k+"2"][1],t0[k+"3"][1]); var hy=floorOf(k)-low; best=best==null?hy:Math.min(best,hy); });
    hipY=best;
  } else hipY=G-(P.H==null?33:P.H);
  var o=build(hipY), ax=P.anc?o[P.anc[0]][0]:o.hip[0], dx=(P.anc?P.anc[1]:x)-ax;
  Object.keys(o).forEach(function(k){ if(k==="warn")return; o[k]=[o[k][0]+dx,o[k][1]]; });
  return o;
}
function seg(p,q,w,col,op){return '<path d="M'+rnd(p[0])+' '+rnd(p[1])+'L'+rnd(q[0])+' '+rnd(q[1])+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round"'+(op?' opacity="'+op+'"':'')+'/>';}
function arrow(a){ // [x1,y1,x2,y2,courbure]
  var x1=a[0],y1=a[1],x2=a[2],y2=a[3],c=a[4]||0, mx=(x1+x2)/2, my=(y1+y2)/2, dx=x2-x1, dy=y2-y1, d=Math.sqrt(dx*dx+dy*dy)||1, cx=mx-dy/d*c, cy=my+dx/d*c;
  var tx=x2-cx, ty=y2-cy, tl=Math.sqrt(tx*tx+ty*ty)||1; tx/=tl; ty/=tl; var hx=x2-tx*4.2, hy=y2-ty*4.2;
  return '<g class="arw"><path d="M'+rnd(x1)+' '+rnd(y1)+'Q'+rnd(cx)+' '+rnd(cy)+' '+rnd(hx)+' '+rnd(hy)+'" fill="none" stroke="var(--acc,#ff4b1f)" stroke-width="1.7" stroke-linecap="round"/>'+
    '<path d="M'+rnd(x2)+' '+rnd(y2)+'L'+rnd(hx-ty*2.3)+' '+rnd(hy+tx*2.3)+'L'+rnd(hx+ty*2.3)+' '+rnd(hy-tx*2.3)+'Z" fill="var(--acc,#ff4b1f)"/></g>';
}
var PROPS={
  wall:function(x){return '<path d="M'+x+' 4V'+G+'" stroke="var(--muted,#8a948d)" stroke-width="2.6" stroke-linecap="round"/><path d="M'+(x+3)+' 10l-3 3M'+(x+3)+' 22l-3 3M'+(x+3)+' 34l-3 3M'+(x+3)+' 46l-3 3M'+(x+3)+' 58l-3 3" stroke="var(--line,#ccc)" stroke-width="1.4" stroke-linecap="round"/>';},
  step:function(x,w,h){h=h||10; w=w||34; return '<rect x="'+x+'" y="'+(G-h)+'" width="'+w+'" height="'+h+'" rx="1.5" fill="var(--line,#ddd)" stroke="var(--muted,#8a948d)" stroke-width="1.8"/>';},
  chair:function(x,sx){ sx=sx||1; var s=sx; // dossier côté gauche si s=1, côté droit si s=−1
    var back=x, seat=x+(s>0?0:-26); return '<path d="M'+x+' '+(G-30)+'V'+G+'M'+(x+26*s)+' '+(G-22)+'V'+G+'M'+x+' '+(G-22)+'H'+(x+26*s)+'" fill="none" stroke="var(--muted,#8a948d)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';},
  couch:function(x,w){w=w||24; return '<rect x="'+x+'" y="'+(G-18)+'" width="'+w+'" height="18" rx="3" fill="var(--line,#ddd)" stroke="var(--muted,#8a948d)" stroke-width="1.8"/>';},
  mat:function(x,w){return '<rect x="'+x+'" y="'+(G-1.5)+'" width="'+w+'" height="3" rx="1.5" fill="var(--muted,#8a948d)" opacity=".5"/>';},
  towel:function(x,w){return '<rect x="'+x+'" y="'+(G-2.4)+'" width="'+w+'" height="2.4" rx="1.2" fill="var(--acc,#ff4b1f)" opacity=".55"/>';},
  bag:function(x,y){return '<rect x="'+x+'" y="'+y+'" width="8" height="11" rx="2.5" fill="var(--acc,#ff4b1f)" opacity=".75"/>';}
};
function pose(P,cls){
  var o=solve(P), FARO=P.fo!=null?P.fo:(P.front?.9:FAR), C="currentColor", H="var(--acc,#ff4b1f)", hot=P.hot||[], on=function(k){return hot.indexOf(k)>=0;}, g='<g class="'+cls+'">';
  // accessoires
  (P.props||[]).forEach(function(p){ if(PROPS[p[0]])g+=PROPS[p[0]].apply(null,p.slice(1)); });
  // membres éloignés
  g+=seg(o.hip,o.m1,6.4,on("thighF")?H:C,on("thighF")?.8:FARO)+seg(o.m1,o.m2,5,on("shinF")?H:C,on("shinF")?.8:FARO)+seg(o.m2,o.m3,3.8,C,FARO);
  g+=seg(o.sh,o.b1,4.2,on("armF")?H:C,on("armF")?.8:FARO)+seg(o.b1,o.b2,3.6,on("armF")?H:C,on("armF")?.8:FARO);
  // tronc, tête
  g+=o.mid?seg(o.hip,o.mid,9,on("torso")?H:C)+seg(o.mid,o.sh,9,on("torso")?H:C):seg(o.hip,o.sh,9,on("torso")?H:C);
  if(on("back")){g+=seg(pt(o.hip,3,P.t==null?180:P.t),pt(o.hip,17,P.t==null?180:P.t),9,H);}
  // membres proches
  g+=seg(o.hip,o.l1,7,on("thigh")?H:C)+seg(o.l1,o.l2,5.4,on("shin")?H:C)+seg(o.l2,o.l3,4,on("foot")?H:C);
  g+=seg(o.sh,o.a1,4.8,on("arm")?H:C)+seg(o.a1,o.a2,4,on("arm")?H:C);
  if(on("glute"))g+='<circle cx="'+rnd(o.hip[0])+'" cy="'+rnd(o.hip[1])+'" r="5.6" fill="'+H+'"/>';
  if(on("knee"))g+='<circle cx="'+rnd(o.l1[0])+'" cy="'+rnd(o.l1[1])+'" r="3.4" fill="none" stroke="'+H+'" stroke-width="1.8"/>';
  if(on("ankle"))g+='<circle cx="'+rnd(o.l2[0])+'" cy="'+rnd(o.l2[1])+'" r="3.4" fill="none" stroke="'+H+'" stroke-width="1.8"/>';
  g+='<circle cx="'+rnd(o.head[0])+'" cy="'+rnd(o.head[1])+'" r="'+LEN.head+'" fill="'+C+'"/>';
  (P.ar||[]).forEach(function(a){g+=arrow(a);});
  return g+'</g>';
}
function props0(P){return ''; }

// ================= catalogue (rempli plus bas) =================
var EX={};      // id -> {n, z, s, e[], a, b, p[], x[], v, A:poseA, B:poseB, k:"mots-clés"}
var ORDER=[];
function add(id,o){o.id=id; EX[id]=o; ORDER.push(id);}

function svgBox(inner,w,cls,label){return '<svg viewBox="0 0 '+w+' 86" class="'+cls+'" role="img" aria-label="'+String(label||"").replace(/"/g,"")+'" preserveAspectRatio="xMidYMid meet">'+inner+'</svg>';}
function floor(x0,x1){return '<path d="M'+x0+' '+G+'H'+x1+'" stroke="var(--line,#ccc)" stroke-width="2" stroke-linecap="round"/>';}
// panneau unique (animé entre A et B)
function one(id,thumb){
  var e=EX[id]; if(!e)return ''; var two=!!e.B&&!thumb;
  var inner=floor(8,108)+pose(e.A,"p1")+(two?pose(e.B,"p2"):'');
  return '<svg viewBox="8 0 100 86" class="wfig'+(two?' anim':'')+'" role="img" aria-label="'+String(e.n).replace(/"/g,"")+'" preserveAspectRatio="xMidYMid meet">'+inner+'</svg>';
}
// deux étapes côte à côte, numérotées : « 1 Départ » → « 2 Mouvement »
function pair(id){
  var e=EX[id]; if(!e)return '';
  function badge(n,t){return '<g><circle cx="14" cy="9" r="5.6" fill="var(--brand,#2f5d46)"/><text x="14" y="11.7" text-anchor="middle" font-size="7.4" font-weight="800" style="fill:var(--card,#fff);font-size:7.4px" font-family="inherit">'+n+'</text><text x="22" y="11.4" font-size="6.6" font-weight="700" style="fill:var(--muted,#6b756f);font-size:6.6px" stroke="var(--card,#fff)" stroke-width="2.4" paint-order="stroke" font-family="inherit">'+t+'</text></g>';}
  if(!e.B){ return '<svg viewBox="0 -4 200 90" class="wfig pair" role="img" aria-label="'+String(e.n).replace(/"/g,"")+' : position tenue" preserveAspectRatio="xMidYMid meet"><g transform="translate(42 0)">'+floor(-30,116)+pose(e.A,"s")+'</g><g transform="translate(0 0)">'+badge(1,e.l1||"Position tenue")+'</g></svg>'; }
  var inner='<g transform="translate(-8 0)">'+floor(8,108)+pose(e.A,"s")+badge(1,e.l1||"Départ")+'</g><g transform="translate(92 0)">'+floor(8,108)+pose(e.B,"s")+badge(2,e.l2||"Mouvement")+'</g><path d="M100 4V82" stroke="var(--line,#ddd)" stroke-width="1" stroke-dasharray="2 3"/>';
  return '<svg viewBox="0 -4 200 90" class="wfig pair" role="img" aria-label="'+String(e.n).replace(/"/g,"")+' : étape 1, '+(e.l1||"départ")+', puis étape 2, '+(e.l2||"mouvement")+'" preserveAspectRatio="xMidYMid meet">'+inner+'</svg>';
}

root.EXO={EX:EX,ORDER:ORDER,add:add,one:one,pair:pair,pose:pose,solve:solve,LEN:LEN,G:G};
})(typeof window!=="undefined"?window:globalThis);
