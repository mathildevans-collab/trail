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
      #view:has(.auth-page){max-width:none;min-height:100svh;padding:0;background:#101512}
      .auth-page{position:relative;isolation:isolate;min-height:100svh;display:flex;align-items:center;justify-content:center;padding:calc(28px + env(safe-area-inset-top)) 24px calc(28px + env(safe-area-inset-bottom));overflow:hidden;background:radial-gradient(ellipse at 50% 35%,rgba(49,91,66,.28),transparent 48%),#101512;color:#f4f6f2}
      .auth-page:before{content:"";position:absolute;z-index:-1;width:420px;height:420px;border:1px solid rgba(153,188,157,.09);border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 34px rgba(153,188,157,.025),0 0 0 72px rgba(153,188,157,.018)}
      .auth-wrap{width:min(100%,360px);margin:auto;text-align:center}
      .auth-brand{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 auto 12px}
      .auth-logo{width:54px;height:54px;border-radius:17px;object-fit:cover;box-shadow:0 8px 28px rgba(0,0,0,.3)}
      .auth-brand-name{font:800 39px/1 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-1.8px;color:#f3f5f0}
      .auth-tagline{margin:0 0 42px;color:#9aa89d;font:500 14px "Hanken Grotesk",sans-serif;letter-spacing:.2px}
      .auth-login{padding:0}
      #auth-message{min-height:0;margin:0 0 14px;color:#c2ccc4;font:500 13px/1.5 "Hanken Grotesk",sans-serif}
      #auth-message:empty{display:none}
      .auth-connect{width:100%;min-height:56px;border:0!important;border-radius:15px!important;background:#fc4c02!important;color:#fff!important;font:800 15px "Hanken Grotesk",sans-serif!important;box-shadow:0 9px 28px rgba(252,76,2,.18);display:flex;align-items:center;justify-content:center;gap:11px;transition:transform .18s,filter .18s}
      .auth-connect:active{transform:scale(.985);filter:brightness(.94)}
      .auth-strava-mark{font:900 20px Arial,sans-serif;letter-spacing:-1.4px}
      .auth-foot{margin:18px 0 0;color:#718078;font:500 11px "Hanken Grotesk",sans-serif;letter-spacing:.2px}
      @media(max-width:380px){.auth-logo{width:49px;height:49px}.auth-brand-name{font-size:35px}.auth-tagline{margin-bottom:34px}}
      @media(prefers-reduced-motion:reduce){.auth-connect{transition:none}}
    `;;
    document.head.appendChild(style);
  }
  view.innerHTML='<section class="auth-page"><div class="auth-wrap"><div class="auth-brand"><img class="auth-logo" src="icon-192.png?v=63" alt=""><span class="auth-brand-name">cadenzo</span></div><p class="auth-tagline">Un pas après l’autre.</p><div class="auth-login"><p id="auth-message" role="status"></p><button id="auth-action" class="btn primary auth-connect"></button></div><p class="auth-foot">Connexion sécurisée avec Strava</p></div></section>';
  document.getElementById("auth-message").textContent=message;
  var button=document.getElementById("auth-action");button.textContent=buttonText;button.addEventListener("click",action);
}
function showError(message){screen(message,"Réessayer avec Strava",function(){location.href=FUNCTION_URL+"?action=start";});}
function loadApp(user){
  window.CADENZO_USER_ID=user.id;
  window.CadenzoAuth={
    userId:user.id,
    sync:function(){
      function validSession(){
        return client.auth.getSession().then(function(r){
          if(r.error)throw r.error;
          var session=r.data&&r.data.session;
          if(session&&session.expires_at&&session.expires_at>Date.now()/1000+90)return session;
          return client.auth.refreshSession().then(function(refreshed){
            if(refreshed.error||!refreshed.data||!refreshed.data.session)throw new Error("Ta session Cadenzo a expiré. Reconnecte-toi.");
            return refreshed.data.session;
          });
        });
      }
      function request(session){
        return fetch(FUNCTION_URL+"?action=sync",{method:"POST",headers:{"Authorization":"Bearer "+session.access_token,"apikey":SUPABASE_KEY,"Content-Type":"application/json"},cache:"no-store"}).then(function(r){
          return r.json().catch(function(){return {};}).then(function(data){
            if(!r.ok){
              var error=new Error(data.error||("Erreur "+r.status));error.status=r.status;error.code=data.code||"";error.retryAfter=data.retryAfter||0;error.retryAt=data.retryAt||null;
              if(error.code==="STRAVA_REAUTH_REQUIRED"){location.href=FUNCTION_URL+"?action=start";throw error;}
              if(r.status===401)error.sessionExpired=true;
              throw error;
            }
            return data;
          });
        });
      }
      return validSession().then(request).catch(function(error){
        if(error&&error.sessionExpired)return client.auth.refreshSession().then(function(r){
          if(r.error||!r.data||!r.data.session)throw new Error("Ta session Cadenzo a expiré. Reconnecte-toi.");
          return request(r.data.session);
        });
        throw error;
      });
    },
    signOut:function(){return client.auth.signOut().then(function(){location.reload();});}
  };
  if(window.SAFE&&SAFE.setUser)SAFE.setUser(user.id);
  tabs.hidden=false;
  client.from("cadenzo_profiles").select("display_name,username,profile_picture").eq("user_id",user.id).maybeSingle().then(function(result){
    window.CADENZO_PROFILE_PICTURE=result.data&&result.data.profile_picture||"";
    var name=result.data&&(result.data.display_name||result.data.username)||user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name)||user.email&&user.email.split("@")[0]||"";
    var parts=name.trim().split(/[\s._-]+/).filter(Boolean);
    window.CADENZO_USER_INITIALS=parts.length>1?(parts[0][0]+parts[parts.length-1][0]).toUpperCase():parts.length?parts[0].slice(0,2).toUpperCase():"";
  }).catch(function(){
    var fallback=user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name)||user.email&&user.email.split("@")[0]||"";
    window.CADENZO_PROFILE_PICTURE="";
  }).then(function(){
    window.CADENZO_FORCE_SYNC=true;
    var script=document.createElement("script");script.src="app.js?v=104";script.onerror=function(){view.textContent="Impossible de charger Cadenzo. Vérifie ta connexion puis recharge la page.";};document.body.appendChild(script);
  });
}
document.addEventListener("click",function(event){
  var target=event.target&&event.target.closest?event.target.closest("[data-account-logout]"):null;
  if(!target)return;
  event.preventDefault();event.stopPropagation();
  if(target.disabled)return;
  target.disabled=true;target.setAttribute("aria-busy","true");
  client.auth.signOut({scope:"local"}).then(function(result){
    if(result&&result.error)throw result.error;
    window.CADENZO_USER_ID=null;window.CADENZO_USER_INITIALS="";
    location.replace(location.pathname);
  }).catch(function(error){
    target.disabled=false;target.removeAttribute("aria-busy");
    alert("Déconnexion impossible : "+(error&&error.message||"réessaie"));
  });
});
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
    screen("","Se connecter avec Strava",function(){location.href=FUNCTION_URL+"?action=start";});
  }).catch(function(e){showError("Supabase est momentanément inaccessible : "+(e.message||"réessaie dans un instant."));});
}
start();
})();