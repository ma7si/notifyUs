"use strict";var _notifyUsSDK=(()=>{var r=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var d=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var f=(s,i)=>{for(var t in i)r(s,t,{get:i[t],enumerable:!0})},g=(s,i,t,e)=>{if(i&&typeof i=="object"||typeof i=="function")for(let o of d(i))!p.call(s,o)&&o!==t&&r(s,o,{get:()=>i[o],enumerable:!(e=c(i,o))||e.enumerable});return s};var y=s=>g(r({},"__esModule",{value:!0}),s);var h={};f(h,{notifyUs:()=>l});var a=class{constructor(){this.accountId="";this.baseUrl="";this.user=null;this.locale="en";this.dir="ltr";this.renderedIds=new Set}init(i,t){this.accountId=i,this.baseUrl=t.replace(/\/$/,""),this.injectStyles(),this.fetchAndRender()}identify(i){this.user=i,this.fetchAndRender()}setLanguage(i){this.locale=i,this.dir=i==="ar"?"rtl":"ltr"}setDir(i){this.dir=i}async fetchAndRender(){if(this.accountId)try{let i=await fetch(`${this.baseUrl}/api/v1/sdk/${this.accountId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user:this.user})});if(!i.ok)return;let{notifications:t}=await i.json();this.renderNotifications(t)}catch(i){console.error("[NotifyUs] Failed to fetch notifications:",i)}}renderNotifications(i){for(let t of i)this.renderedIds.has(t.id)||(this.renderedIds.add(t.id),this.renderNotification(t),this.trackEvent(t.id,"view"))}renderNotification(i){let t=document.createElement("div");t.id=`notifyus-${i.id}`,t.setAttribute("dir",i.lang==="ar"?"rtl":this.dir),i.type==="banner"?this.renderBanner(t,i):i.type==="modal"?this.renderModal(t,i):this.renderToast(t,i),document.body.appendChild(t),i.autoDismissSeconds&&setTimeout(()=>this.dismiss(i.id,t),i.autoDismissSeconds*1e3)}renderBanner(i,t){let e=t.lang==="ar"||this.dir==="rtl";i.innerHTML=`
      <div class="nfy-banner" style="
        background-color: ${t.backgroundColor};
        color: ${t.textColor};
        position: fixed;
        ${t.position==="bottom"?"bottom: 0":"top: 0"};
        left: 0; right: 0;
        z-index: 999999;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        direction: ${e?"rtl":"ltr"};
        text-align: ${e?"right":"left"};
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      ">
        ${t.imageUrl?`<img src="${t.imageUrl}" style="height:32px;width:32px;border-radius:6px;object-fit:cover;flex-shrink:0;" alt=""/>`:""}
        <div style="flex:1;">
          ${t.title?`<strong>${this.escape(t.title)}</strong> `:""}
          ${t.body?`<span style="opacity:0.9;">${t.body}</span>`:""}
        </div>
        ${t.ctaText?`
          <button class="nfy-cta" onclick="notifyUs._handleCTA('${t.id}', '${t.ctaUrl||""}')" style="
            background-color: ${t.ctaColor};
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 6px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            flex-shrink: 0;
          ">${this.escape(t.ctaText)}</button>
        `:""}
        ${t.isDismissable?`
          <button onclick="notifyUs._dismiss('${t.id}')" style="
            background: none;
            border: none;
            color: ${t.textColor};
            opacity: 0.7;
            cursor: pointer;
            padding: 4px;
            flex-shrink: 0;
            line-height: 1;
          " aria-label="Close">\u2715</button>
        `:""}
      </div>
    `}renderModal(i,t){let e=t.lang==="ar"||this.dir==="rtl";i.innerHTML=`
      <div class="nfy-overlay" style="
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      ">
        <div class="nfy-modal" style="
          background-color: ${t.backgroundColor};
          color: ${t.textColor};
          border-radius: 16px;
          padding: 32px;
          max-width: 480px;
          width: 100%;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          direction: ${e?"rtl":"ltr"};
          text-align: ${e?"right":"left"};
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        ">
          ${t.isDismissable?`
            <button onclick="notifyUs._dismiss('${t.id}')" style="
              position: absolute;
              top: 16px;
              ${e?"left":"right"}: 16px;
              background: none;
              border: none;
              color: ${t.textColor};
              opacity: 0.6;
              cursor: pointer;
              font-size: 18px;
              line-height: 1;
            " aria-label="Close">\u2715</button>
          `:""}
          ${t.imageUrl?`<img src="${t.imageUrl}" style="width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:16px;" alt=""/>`:""}
          ${t.title?`<h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">${this.escape(t.title)}</h2>`:""}
          ${t.body?`<p style="margin:0 0 20px;opacity:0.9;line-height:1.6;">${t.body}</p>`:""}
          ${t.ctaText?`
            <button onclick="notifyUs._handleCTA('${t.id}', '${t.ctaUrl||""}')" style="
              width: 100%;
              background-color: ${t.ctaColor};
              color: #fff;
              border: none;
              border-radius: 10px;
              padding: 12px 24px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
            ">${this.escape(t.ctaText)}</button>
          `:""}
        </div>
      </div>
    `}renderToast(i,t){let e=t.lang==="ar"||this.dir==="rtl",o=t.position==="bottom";i.innerHTML=`
      <div class="nfy-toast" style="
        position: fixed;
        ${o?"bottom: 20px":"top: 20px"};
        ${e?"left: 20px":"right: 20px"};
        z-index: 999999;
        background-color: ${t.backgroundColor};
        color: ${t.textColor};
        border-radius: 12px;
        padding: 14px 16px;
        max-width: 360px;
        width: calc(100vw - 40px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        direction: ${e?"rtl":"ltr"};
        text-align: ${e?"right":"left"};
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        animation: nfySlideIn 0.3s ease;
      ">
        <div style="display:flex;align-items:start;justify-content:space-between;gap:8px;">
          <div style="flex:1;">
            ${t.title?`<p style="margin:0 0 4px;font-weight:600;">${this.escape(t.title)}</p>`:""}
            ${t.body?`<p style="margin:0;opacity:0.85;font-size:13px;">${t.body}</p>`:""}
            ${t.ctaText?`
              <button onclick="notifyUs._handleCTA('${t.id}', '${t.ctaUrl||""}')" style="
                background:none;border:none;color:${t.ctaColor};font-size:13px;font-weight:600;
                cursor:pointer;padding:0;margin-top:8px;
              ">${this.escape(t.ctaText)} \u2192</button>
            `:""}
          </div>
          ${t.isDismissable?`
            <button onclick="notifyUs._dismiss('${t.id}')" style="
              background:none;border:none;color:${t.textColor};opacity:0.6;
              cursor:pointer;padding:0;line-height:1;flex-shrink:0;
            " aria-label="Close">\u2715</button>
          `:""}
        </div>
      </div>
    `}_dismiss(i){let t=document.getElementById(`notifyus-${i}`);t&&(t.style.opacity="0",t.style.transition="opacity 0.3s ease",setTimeout(()=>t.remove(),300)),this.trackEvent(i,"dismiss")}dismiss(i,t){t.style.opacity="0",t.style.transition="opacity 0.3s ease",setTimeout(()=>t.remove(),300),this.trackEvent(i,"dismiss")}_handleCTA(i,t){this.trackEvent(i,"click",t),t&&window.open(t,"_blank","noopener,noreferrer")}async trackEvent(i,t,e){var n;let o=((n=this.user)==null?void 0:n.id)||"anonymous";try{await fetch(`${this.baseUrl}/api/v1/sdk/track`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accountId:this.accountId,notificationId:i,userId:o,event:t,ctaUrl:e})})}catch(u){}}injectStyles(){if(document.getElementById("notifyus-styles"))return;let i=document.createElement("style");i.id="notifyus-styles",i.textContent=`
      @keyframes nfySlideIn {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .nfy-cta:hover { opacity: 0.9; }
    `,document.head.appendChild(i)}escape(i){let t=document.createElement("div");return t.textContent=i,t.innerHTML}},l=new a;(function(){let s=document.querySelectorAll('script[src*="sdk.js"]'),i="",t="";for(let e of s){let o=new URL(e.src),n=o.searchParams.get("account");if(n){i=n,t=o.origin;break}}i&&l.init(i,t),window.notifyUs=l,typeof window.notifyUsReady=="function"&&window.notifyUsReady()})();return y(h);})();
