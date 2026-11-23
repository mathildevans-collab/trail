(function(){
"use strict";
var SUPABASE_URL="https://psotpksrdlkivauxdiad.supabase.co";
var SUPABASE_KEY="sb_publishable_TE_8fhfqw-Y4bPFX60uoTA_UD3K2wrC";
var FUNCTION_URL=SUPABASE_URL+"/functions/v1/cadenzo-strava";
var client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
var view=document.getElementById("view"),tabs=document.getElementById("tabs"),rm=document.getElementById("rm");
function screen(message,buttonText,action){
  tabs.hidden=true;rm.hidden=true;
  view.innerHTML='<section style="min-height:75vh;display:grid;place-items:center;padding:24px"><div style="width:min(420px,100%);background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:24px;padding:28px;box-shadow:0 12px 40px #00000012;text-align:center"><div style="font-size:34px;margin-bottom:10px">🏃</div><h1 style="margin:0 0 8px;font-size:28px">Cadenzo</h1><p style="color:var(--muted,#777);margin:0 0 22px">Ton espace trail, avec tes données personnelles.</p><p id="auth-message" role="status" style="font-size:14px;margin:0 0 18px"></p><button id="auth-action" class="btn primary" style="width:100%;min-height:48px"></button><p style="font-size:12px;color:var(--muted,#777);margin:16px 0 0">La connexion est sécurisée par Supabase et Strava.</p></div></section>';
  document.getElementById("auth-message").textContent=message;
  var button=document.getElementById("auth-action");button.textContent=buttonText;button.addEventListener("click",action);
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
  status.style.cssText="position:fixed;z-index:30;right:12px;top:10px;display:flex;align-items:center;gap:8px;background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:999px;padding:5px 8px 5px 12px;box-shadow:0 3px 14px #00000012;font:600 11px system-ui;max-width:calc(100vw - 24px)";
  status.innerHTML='<span style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Compte Strava connecté</span><button type="button" aria-label="Se déconnecter" style="border:0;border-radius:50%;width:28px;height:28px;background:var(--soft,#eee);font-size:15px">↪</button>';
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