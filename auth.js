(function(){
"use strict";
var SUPABASE_URL="https://psotpksrdlkivauxdiad.supabase.co";
var SUPABASE_KEY="sb_publishable_TE_8fhfqw-Y4bPFX60uoTA_UD3K2wrC";
var FUNCTION_URL=SUPABASE_URL+"/functions/v1/cadenzo-strava";
var client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
var view=document.getElementById("view"),tabs=document.getElementById("tabs"),rm=document.getElementById("rm");
function screen(message,buttonText,action){
  tabs.hidden=true;rm.hidden=true;
  var style=document.getElementById("cadenzo-auth-style");
  if(!style){
    style=document.createElement("style");style.id="cadenzo-auth-style";
    style.textContent=`
      #view:has(.auth-page){max-width:none;min-height:100svh;padding:0;background:#f3f4f0}
      .auth-page{position:relative;isolation:isolate;min-height:100svh;display:flex;align-items:center;justify-content:center;padding:calc(28px + env(safe-area-inset-top)) 22px calc(28px + env(safe-area-inset-bottom));overflow:hidden;background:radial-gradient(ellipse at 90% 8%,rgba(226,167,46,.16),transparent 32%),radial-gradient(ellipse at 0% 92%,rgba(47,93,70,.13),transparent 34%),#f3f4f0}
      .auth-page:before,.auth-page:after{content:"";position:absolute;z-index:-1;border:1px solid rgba(47,93,70,.12);border-radius:50%;width:320px;height:320px;right:-190px;top:18%;box-shadow:0 0 0 28px rgba(47,93,70,.025),0 0 0 58px rgba(47,93,70,.02)}
      .auth-page:after{width:240px;height:240px;right:auto;left:-170px;top:auto;bottom:8%}
      .auth-wrap{width:min(100%,440px);margin:auto}
      .auth-brand{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 auto 28px}
      .auth-logo{width:66px;height:66px;border-radius:21px;object-fit:cover;box-shadow:0 8px 24px rgba(31,62,46,.16)}
      .auth-brand-name{font:800 34px/1 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-1.3px;color:#203b2d}
      .auth-brand-sub{font:700 10px/1.4 "Hanken Grotesk",sans-serif;letter-spacing:2px;text-transform:uppercase;color:#718076;margin-top:5px}
      .auth-panel{position:relative;background:rgba(255,255,252,.94);border:1px solid rgba(35,63,47,.1);border-radius:30px;padding:30px 24px 24px;box-shadow:0 22px 70px rgba(32,53,40,.11),0 2px 8px rgba(32,53,40,.04);backdrop-filter:blur(16px)}
      .auth-kicker{display:inline-flex;align-items:center;gap:7px;border-radius:99px;padding:7px 11px;background:#e5eee7;color:#2f5d46;font:700 11px "Hanken Grotesk",sans-serif;letter-spacing:.7px;text-transform:uppercase;margin-bottom:18px}
      .auth-kicker i{width:7px;height:7px;border-radius:50%;background:#e2a72e}
      .auth-title{font:800 clamp(30px,8vw,39px)/1.04 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-1.2px;color:#1d2c23;margin:0 0 12px}
      .auth-copy{font:500 15px/1.55 "Hanken Grotesk",sans-serif;color:#657168;margin:0 0 24px}
      .auth-visual{height:94px;border-radius:18px;background:linear-gradient(115deg,#244a36,#37664b);margin:0 0 22px;position:relative;overflow:hidden;display:flex;align-items:center;padding:16px 18px;color:white}
      .auth-visual:after{content:"";position:absolute;width:170px;height:170px;border:1px solid rgba(255,255,255,.19);border-radius:50%;right:-18px;top:-66px;box-shadow:0 0 0 20px rgba(255,255,255,.045),0 0 0 42px rgba(255,255,255,.035)}
      .auth-visual svg{width:100%;height:100%;position:absolute;inset:0;opacity:.7}
      .auth-visual-label{position:relative;z-index:1;font:700 11px "Hanken Grotesk",sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#e8c66d}
      .auth-visual strong{display:block;font:700 17px "Bricolage Grotesque",sans-serif;letter-spacing:.1px;color:white;margin-top:3px}
      .auth-connect{width:100%;min-height:58px;border:0!important;border-radius:17px!important;background:#fc4c02!important;color:#fff!important;font:800 16px "Hanken Grotesk",sans-serif!important;box-shadow:0 8px 18px rgba(252,76,2,.22);display:flex;align-items:center;justify-content:center;gap:11px;transition:transform .18s,box-shadow .18s}
      .auth-connect:active{transform:scale(.985);box-shadow:0 4px 10px rgba(252,76,2,.18)}
      .auth-strava-mark{font:900 20px Arial,sans-serif;letter-spacing:-1.4px}
      .auth-perks{display:grid;gap:12px;margin:22px 2px 0}
      .auth-perk{display:flex;align-items:center;gap:11px;color:#536158;font:600 13px "Hanken Grotesk",sans-serif}
      .auth-perk-icon{width:29px;height:29px;border-radius:10px;background:#e8efe9;color:#2f5d46;display:grid;place-items:center;flex:none}
      .auth-perk-icon svg{width:15px;height:15px}
      .auth-foot{margin:20px 0 0;text-align:center;color:#879188;font:500 11px/1.5 "Hanken Grotesk",sans-serif}
      .auth-foot b{color:#647368;font-weight:700}
      @media(max-width:380px){.auth-panel{padding:25px 19px 21px;border-radius:25px}.auth-brand{margin-bottom:22px}.auth-logo{width:58px;height:58px}.auth-brand-name{font-size:31px}}
      @media(prefers-reduced-motion:reduce){.auth-connect{transition:none}}
    `;
    document.head.appendChild(style);
  }
  view.innerHTML='<section class="auth-page"><div class="auth-wrap"><div class="auth-brand"><img class="auth-logo" src="icon-192.png?v=63" alt="Logo Cadenzo"><div><div class="auth-brand-name">cadenzo</div><div class="auth-brand-sub">Trouve ton rythme. Va plus loin.</div></div></div><div class="auth-panel"><div class="auth-kicker"><i></i> Ton espace running & trail</div><h1 class="auth-title">Chaque sortie<br>te rapproche.</h1><p class="auth-copy">Retrouve ton entraînement, tes statistiques et tes performances dans un espace pensé pour ta progression.</p><div class="auth-visual"><svg viewBox="0 0 390 100" preserveAspectRatio="none" fill="none"><path d="M-10 76 C38 72 46 22 88 38 S140 91 178 57 231 12 268 40 330 85 402 19" stroke="white" stroke-width="2" stroke-dasharray="5 7" opacity=".7"/><circle cx="178" cy="57" r="4" fill="#e2a72e"/><circle cx="268" cy="40" r="4" fill="#e2a72e"/></svg><div><div class="auth-visual-label">Ton terrain. Tes données.</div><strong>Une progression qui te ressemble.</strong></div></div><p id="auth-message" role="status" style="font-size:13px;color:#657168;margin:0 0 12px;text-align:center"></p><button id="auth-action" class="btn primary auth-connect"></button><div class="auth-perks"><div class="auth-perk"><span class="auth-perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5 9.5 17 19 7.5"/></svg></span> Tes activités Run et TrailRun synchronisées</div><div class="auth-perk"><span class="auth-perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span> Un compte privé, tes données restent les tiennes</div></div></div><p class="auth-foot">Connexion sécurisée via <b>Strava</b> · Tu gardes le contrôle de tes autorisations</p></div></section>';
  document.getElementById("auth-message").textContent=message;
  var button=document.getElementById("auth-action");button.innerHTML='<span class="auth-strava-mark">S</span><span>'+buttonText+'</span>';button.addEventListener("click",action);
}
function showError(message){screen(message,"Réessayer avec Strava",function(){location.href=FUNCTION_URL+"?action=start";});}
function loadApp(user){
  window.CADENZO_USER_ID=user.id;
  window.CadenzoAuth={
    userId:user.id,
    sync:function(){
      return client.auth.getSession().then(function(r){
        var session=r.data&&r.data.session;
        if(!session)throw new Error("Session expirée. Reconnecte-toi.");
        return fetch(FUNCTION_URL+"?action=sync",{method:"POST",headers:{"Authorization":"Bearer "+session.access_token,"apikey":SUPABASE_KEY,"Content-Type":"application/json"},cache:"no-store"});
      }).then(function(r){return r.json().then(function(data){if(!r.ok)throw new Error(data.error||("Erreur "+r.status));return data;});});
    },
    signOut:function(){return client.auth.signOut().then(function(){location.reload();});}
  };
  if(window.SAFE&&SAFE.setUser)SAFE.setUser(user.id);
  tabs.hidden=false;
  var status=document.createElement("div");
  status.id="cadenzo-account";
  status.style.cssText="position:fixed;z-index:40;top:calc(10px + env(safe-area-inset-top));right:12px;display:flex;align-items:center;gap:9px;padding:6px 7px 6px 10px;border:1px solid rgba(47,93,70,.14);border-radius:999px;background:rgba(251,251,248,.94);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 5px 22px rgba(25,45,33,.12);font:600 12px system-ui;color:#263b2d;max-width:calc(100vw - 24px)";
  status.innerHTML='<span style="width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#e3ece6;color:#2f5d46;font-size:13px;font-weight:800">✓</span><span style="display:flex;flex-direction:column;line-height:1.1;min-width:0"><span style="font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:#77857b;font-weight:800">Session</span><span style="font-size:12px;font-weight:800;white-space:nowrap">Connecté à Strava</span></span><span style="width:6px;height:6px;border-radius:50%;background:#2f9b60;box-shadow:0 0 0 3px #dcefe3;margin:0 5px 0 2px"></span><button type="button" aria-label="Se déconnecter" title="Se déconnecter" style="border:0;border-radius:50%;width:30px;height:30px;background:#f0f2ed;color:#58645b;font-size:16px;display:grid;place-items:center">↪</button>';
  status.querySelector("button").addEventListener("click",function(){if(confirm("Se déconnecter de Cadenzo sur cet appareil ?"))window.CadenzoAuth.signOut();});
  document.body.appendChild(status);
  var script=document.createElement("script");script.src="app.js?v=92";script.onerror=function(){view.textContent="Impossible de charger Cadenzo. Vérifie ta connexion puis recharge la page.";};document.body.appendChild(script);
}
function start(){
  var params=new URLSearchParams(location.search),tokenHash=params.get("token_hash"),type=params.get("type");
  if(params.has("strava_error")){var err=params.get("strava_error");history.replaceState({},document.title,location.pathname);showError(err||"La connexion Strava a échoué.");return;}
  if(tokenHash&&type==="magiclink"){
    screen("Finalisation de ta connexion Strava…","Patiente…",function(){});
    client.auth.verifyOtp({token_hash:tokenHash,type:"magiclink"}).then(function(r){
      if(r.error)throw r.error;
      history.replaceState({},document.title,location.pathname);
      loadApp(r.data.user);
    }).catch(function(e){showError("Connexion impossible : "+(e.message||"lien expiré")+". Relance la connexion.");});
    return;
  }
  client.auth.getSession().then(function(r){
    if(r.error)throw r.error;
    if(r.data.session&&r.data.session.user){loadApp(r.data.session.user);return;}
    screen("Connecte-toi avec ton compte Strava pour accéder à tes séances et à tes statistiques. Chaque compte ne voit que ses propres activités.","Se connecter avec Strava",function(){location.href=FUNCTION_URL+"?action=start";});
  }).catch(function(e){showError("Supabase est momentanément inaccessible : "+(e.message||"réessaie dans un instant."));});
}
start();
})();