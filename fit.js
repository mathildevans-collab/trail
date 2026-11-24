// Séances vers la montre : fichiers d'entraînement .FIT (à copier dans GARMIN/NewFiles) et .zip de la semaine.
(function(){
var HRZ={1:[110,135],2:[135,150],3:[153,167],4:[169,180],5:[180,196]};

// Cible cardio lue dans un texte : "135-150 bpm", "zone 4", "Z3 haute", "Z3-Z4"...
function hrIn(t){
  t=String(t||""); var m=t.match(/(\d{3})\s*-\s*(\d{3})\s*bpm/); if(m)return [+m[1],+m[2]];
  if(/zone 1-2 à|Z1 →|→/.test(t))return null;
  m=t.match(/Z(\d)\s*-\s*Z(\d)/i); if(m)return [HRZ[m[1]][0],HRZ[m[2]][1]];
  m=t.match(/\bZ(?:one )?\s?(\d)(?:\s*-\s*(\d))?/i); if(m){var a=HRZ[m[1]], b=HRZ[m[2]||m[1]]; return a&&b?[a[0],b[1]]:null;}
  return null;
}
function step(name,dur,hr,int,notes){return {name:name,dur:dur,hr:hr,int:int||"active",notes:notes||""};}
function durOf(n,u){return u==="m"?{d:n}:u==="km"?{d:Math.round(n*1000)}:u==="s"?{t:n}:{t:n*60};}

// Séance de l'appli → étapes structurées. null si rien à envoyer.
function wktOf(s){
  if(!s||s.race||s.type==="Course B"||!s.km||/Club · piste|Club allégé|Récupération/.test(s.type))return null;
  var zs=FIT.zoneOf?FIT.zoneOf(s.type):"", out=[], st=s.steps||[];
  st.forEach(function(x){
    var a=String(x[0]), b=String(x[1]), m;
    if((m=a.match(/^(\d+) min$/))&&/chauffement/i.test(b))out.push(step("Échauffement",{t:+m[1]*60},HRZ[2],"warmup",b));
    else if((m=a.match(/^(\d+) min$/))&&/calme/i.test(b))out.push(step("Retour au calme",{t:+m[1]*60},null,"cooldown",b));
    else if(m=a.match(/^(\d+) × (\d+) (m|s|min)$/)){
      var n=+m[1], rec, r2=b.match(/(\d+) min (?:en zone (\d)|de récup)/);
      if(r2)rec=step("Récup",{t:+r2[1]*60},r2[2]?HRZ[r2[2]]:null,"recovery");
      else if(/descente en trot/i.test(b))rec=step("Descente trot",{open:1},null,"recovery","Appuie sur Tour en bas");
      else if(/remontée en marchant/i.test(b))rec=step("Remontée",{open:1},null,"recovery","Appuie sur Tour en haut");
      else if(/descente en marchant/i.test(b))rec=step("Descente",{open:1},null,"recovery","Appuie sur Tour en bas");
      else rec=step("Récup",{t:m[3]==="s"?60:120},null,"recovery");
      out.push({rep:n,steps:[step(/descente/i.test(s.type)?"Descente":/côte/i.test(s.type+b)?"Montée":"Effort",durOf(+m[2],m[3]),/allure course/i.test(b)?null:hrIn(b)||hrIn(zs),"active",b),rec]});
    }
    else if(m=a.match(/^(\d+) paires$/))out.push({rep:+m[1],steps:[step("2 montées",{d:1000},hrIn(b)||[153,180],"active",b),step("Récup",{t:180},null,"recovery","Marche active si FC > 175")]});
    else if(m=a.match(/^(\d+) min$/))out.push(step(/footing/i.test(b)&&!out.length&&st.length>1?"Échauffement":/footing/i.test(b)?"Footing":/tempo/i.test(b)?"Tempo":/progressif|zone 1-2 à/i.test(b+s.type)?"Progressif":"Course",{t:+m[1]*60},hrIn(b),/footing/i.test(b)&&!out.length&&st.length>1?"warmup":"active",b));
    else if(m=a.match(/^([\d.,]+) km$/))out.push(step("Course",{d:Math.round(parseFloat(m[1].replace(",","."))*1000)},hrIn(b)||hrIn(zs),"active",b));
  });
  if(!out.length)out.push(step(s.type,{d:Math.round(s.km*1000)},hrIn(zs),"active",s.txt||""));
  return out;
}

// ---- encodeur FIT ----
var CT=[0x0000,0xCC01,0xD801,0x1400,0xF001,0x3C00,0x2800,0xE401,0xA001,0x6C00,0x7800,0xB401,0x5000,0x9C01,0x8801,0x4400];
function crc16(bytes,from,to){var c=0; for(var i=from;i<to;i++){var b=bytes[i], t=CT[c&15]; c=(c>>4)&0x0FFF; c=c^t^CT[b&15]; t=CT[c&15]; c=(c>>4)&0x0FFF; c=c^t^CT[(b>>4)&15];} return c;}
var BT={enum:[0x00,1,0xFF],u8:[0x02,1,0xFF],u16:[0x84,2,0xFFFF],u32:[0x86,4,0xFFFFFFFF],u32z:[0x8C,4,0],str:[0x07,0,0]};
function utf8(s,size){var e=new TextEncoder().encode(String(s||"")), n=Math.min(e.length,size-1); while(n>0&&(e[n]&0xC0)===0x80)n--; var o=new Uint8Array(size); o.set(e.subarray(0,n)); return o;}
function Writer(){this.b=[];}
Writer.prototype.num=function(v,n){for(var i=0;i<n;i++){this.b.push(v&0xFF); v=Math.floor(v/256);}};
Writer.prototype.def=function(local,global,fields){var b=this.b; b.push(0x40|local,0,0); this.num(global,2); b.push(fields.length); fields.forEach(function(f){var t=BT[f[1]]; b.push(f[0],f[1]==="str"?f[2]:t[1],t[0]);}); this[local]=fields;};
Writer.prototype.rec=function(local,vals){var self=this; this.b.push(local); this[local].forEach(function(f,i){var t=BT[f[1]], v=vals[i];
  if(f[1]==="str"){var u=utf8(v,f[2]); for(var k=0;k<u.length;k++)self.b.push(u[k]);} else self.num(v==null?t[2]:v,t[1]);});};

var INT={active:0,rest:1,warmup:2,cooldown:3,recovery:4};
function encode(name,steps){
  var w=new Writer(), flat=[];
  steps.forEach(function(x){if(x.rep){var i0=flat.length; x.steps.forEach(function(y){flat.push(y);}); flat.push({repeat:i0,n:x.rep});} else flat.push(x);});
  w.def(0,0,[[0,"enum"],[1,"u16"],[2,"u16"],[3,"u32z"],[4,"u32"]]);
  w.rec(0,[5,255,0,(Math.random()*0x7FFFFFFF|0)+1,Math.floor(Date.now()/1000)-631065600]);
  w.def(1,26,[[4,"enum"],[6,"u16"],[8,"str",32],[11,"enum"]]);
  w.rec(1,[1,flat.length,name,3]);
  w.def(2,27,[[254,"u16"],[0,"str",24],[1,"enum"],[2,"u32"],[3,"enum"],[4,"u32"],[5,"u32"],[6,"u32"],[7,"enum"],[8,"str",64]]);
  flat.forEach(function(x,i){
    if(x.repeat!=null){w.rec(2,[i,"",6,x.repeat,null,x.n,null,null,null,""]); return;}
    var dt=x.dur.t?0:x.dur.d?1:5, dv=x.dur.t?x.dur.t*1000:x.dur.d?x.dur.d*100:null;
    w.rec(2,[i,x.name,dt,dv,x.hr?1:2,0,x.hr?x.hr[0]+100:null,x.hr?x.hr[1]+100:null,INT[x.int]||0,x.notes]);
  });
  var data=w.b, out=new Uint8Array(14+data.length+2), dl=data.length;
  out.set([14,0x20,0x54,0x08,dl&255,(dl>>8)&255,(dl>>16)&255,(dl>>>24)&255,46,70,73,84]);
  var hc=crc16(out,0,12); out[12]=hc&255; out[13]=hc>>8;
  out.set(data,14); var fc=crc16(out,0,14+dl); out[14+dl]=fc&255; out[15+dl]=fc>>8;
  return out;
}

// ---- zip sans compression (plusieurs .fit d'un coup) ----
var C32=(function(){var t=[]; for(var n=0;n<256;n++){var c=n; for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0;} return t;})();
function crc32(u){var c=0xFFFFFFFF; for(var i=0;i<u.length;i++)c=C32[(c^u[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0;}
function zip(files){
  var parts=[], cen=[], off=0;
  function le(n,k){var a=[]; for(var i=0;i<k;i++){a.push(n&255); n=Math.floor(n/256);} return a;}
  files.forEach(function(f){var nm=new TextEncoder().encode(f.name), c=crc32(f.data), sz=f.data.length;
    var h=[0x50,0x4B,3,4].concat(le(20,2),le(0,2),le(0,2),le(0,2),le(0x21,2),le(c,4),le(sz,4),le(sz,4),le(nm.length,2),le(0,2));
    parts.push(new Uint8Array(h),nm,f.data);
    cen.push(new Uint8Array([0x50,0x4B,1,2].concat(le(20,2),le(20,2),le(0,2),le(0,2),le(0,2),le(0x21,2),le(c,4),le(sz,4),le(sz,4),le(nm.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(off,4))),nm);
    off+=h.length+nm.length+sz;});
  var cl=0; cen.forEach(function(p){cl+=p.length;});
  var end=new Uint8Array([0x50,0x4B,5,6].concat(le(0,2),le(0,2),le(files.length,2),le(files.length,2),le(cl,4),le(off,4),le(0,2)));
  return new Blob(parts.concat(cen,[end]),{type:"application/zip"});
}
function slug(s){return String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,28);}
function download(blob,name){var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},4000);}

window.FIT={wktOf:wktOf,encode:encode,zip:zip,slug:slug,download:download,hrIn:hrIn};
})();
