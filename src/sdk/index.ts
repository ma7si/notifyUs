/**
 * NotifyUs JavaScript SDK
 * Embed in your SaaS app to display in-app notifications.
 *
 * Usage:
 *   <script src="https://your-notifyus.com/sdk.js?account=ACCOUNT_ID" async></script>
 *   <script>
 *     window.notifyUsReady = function() {
 *       notifyUs.identify({ id: "user-123", plan: "pro", role: "admin" });
 *     };
 *   </script>
 */

interface UserData {
  id: string;
  email?: string;
  plan?: string;
  role?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface SDKNotification {
  id: string;
  type: "banner" | "modal" | "toast";
  position: "top" | "bottom" | "center";
  lang: string;
  title: string;
  body: string;
  ctaText: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  backgroundColor: string;
  textColor: string;
  ctaColor: string;
  autoDismissSeconds: number | null;
  isDismissable: boolean;
}

class NotifyUsSDK {
  private accountId: string = "";
  private baseUrl: string = "";
  private user: UserData | null = null;
  private locale: string = "en";
  private dir: "ltr" | "rtl" = "ltr";
  private renderedIds: Set<string> = new Set();

  init(accountId: string, baseUrl: string) {
    this.accountId = accountId;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.injectStyles();
    this.fetchAndRender();
  }

  identify(userData: UserData) {
    this.user = userData;
    this.fetchAndRender();
  }

  setLanguage(lang: string) {
    this.locale = lang;
    this.dir = lang === "ar" ? "rtl" : "ltr";
  }

  setDir(dir: "ltr" | "rtl") {
    this.dir = dir;
  }

  private async fetchAndRender() {
    if (!this.accountId) return;

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/sdk/${this.accountId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: this.user }),
        }
      );

      if (!response.ok) return;

      const { notifications } = await response.json();
      this.renderNotifications(notifications);
    } catch {
      // Silently fail
    }
  }

  private renderNotifications(notifications: SDKNotification[]) {
    for (const notification of notifications) {
      if (this.renderedIds.has(notification.id)) continue;
      this.renderedIds.add(notification.id);
      this.renderNotification(notification);
      this.trackEvent(notification.id, "view");
    }
  }

  private renderNotification(n: SDKNotification) {
    const container = document.createElement("div");
    container.id = `notifyus-${n.id}`;
    container.setAttribute("dir", n.lang === "ar" ? "rtl" : this.dir);

    if (n.type === "banner") {
      this.renderBanner(container, n);
    } else if (n.type === "modal") {
      this.renderModal(container, n);
    } else {
      this.renderToast(container, n);
    }

    document.body.appendChild(container);

    if (n.autoDismissSeconds) {
      setTimeout(() => this.dismiss(n.id, container), n.autoDismissSeconds * 1000);
    }
  }

  private renderBanner(container: HTMLElement, n: SDKNotification) {
    const isRTL = n.lang === "ar" || this.dir === "rtl";
    container.innerHTML = `
      <div class="nfy-banner" style="
        background-color: ${n.backgroundColor};
        color: ${n.textColor};
        position: fixed;
        ${n.position === "bottom" ? "bottom: 0" : "top: 0"};
        left: 0; right: 0;
        z-index: 999999;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        direction: ${isRTL ? "rtl" : "ltr"};
        text-align: ${isRTL ? "right" : "left"};
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      ">
        ${n.imageUrl ? `<img src="${n.imageUrl}" style="height:32px;width:32px;border-radius:6px;object-fit:cover;flex-shrink:0;" alt=""/>` : ""}
        <div style="flex:1;">
          ${n.title ? `<strong>${this.escape(n.title)}</strong> ` : ""}
          ${n.body ? `<span style="opacity:0.9;">${n.body}</span>` : ""}
        </div>
        ${n.ctaText ? `
          <button class="nfy-cta" onclick="notifyUs._handleCTA('${n.id}', '${n.ctaUrl || ""}')" style="
            background-color: ${n.ctaColor};
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 6px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            flex-shrink: 0;
          ">${this.escape(n.ctaText)}</button>
        ` : ""}
        ${n.isDismissable ? `
          <button onclick="notifyUs._dismiss('${n.id}')" style="
            background: none;
            border: none;
            color: ${n.textColor};
            opacity: 0.7;
            cursor: pointer;
            padding: 4px;
            flex-shrink: 0;
            line-height: 1;
          " aria-label="Close">✕</button>
        ` : ""}
      </div>
    `;
  }

  private renderModal(container: HTMLElement, n: SDKNotification) {
    const isRTL = n.lang === "ar" || this.dir === "rtl";
    container.innerHTML = `
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
          background-color: ${n.backgroundColor};
          color: ${n.textColor};
          border-radius: 16px;
          padding: 32px;
          max-width: 480px;
          width: 100%;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          direction: ${isRTL ? "rtl" : "ltr"};
          text-align: ${isRTL ? "right" : "left"};
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        ">
          ${n.isDismissable ? `
            <button onclick="notifyUs._dismiss('${n.id}')" style="
              position: absolute;
              top: 16px;
              ${isRTL ? "left" : "right"}: 16px;
              background: none;
              border: none;
              color: ${n.textColor};
              opacity: 0.6;
              cursor: pointer;
              font-size: 18px;
              line-height: 1;
            " aria-label="Close">✕</button>
          ` : ""}
          ${n.imageUrl ? `<img src="${n.imageUrl}" style="width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:16px;" alt=""/>` : ""}
          ${n.title ? `<h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">${this.escape(n.title)}</h2>` : ""}
          ${n.body ? `<p style="margin:0 0 20px;opacity:0.9;line-height:1.6;">${n.body}</p>` : ""}
          ${n.ctaText ? `
            <button onclick="notifyUs._handleCTA('${n.id}', '${n.ctaUrl || ""}')" style="
              width: 100%;
              background-color: ${n.ctaColor};
              color: #fff;
              border: none;
              border-radius: 10px;
              padding: 12px 24px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
            ">${this.escape(n.ctaText)}</button>
          ` : ""}
        </div>
      </div>
    `;
  }

  private renderToast(container: HTMLElement, n: SDKNotification) {
    const isRTL = n.lang === "ar" || this.dir === "rtl";
    const isBottom = n.position === "bottom";
    container.innerHTML = `
      <div class="nfy-toast" style="
        position: fixed;
        ${isBottom ? "bottom: 20px" : "top: 20px"};
        ${isRTL ? "left: 20px" : "right: 20px"};
        z-index: 999999;
        background-color: ${n.backgroundColor};
        color: ${n.textColor};
        border-radius: 12px;
        padding: 14px 16px;
        max-width: 360px;
        width: calc(100vw - 40px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        direction: ${isRTL ? "rtl" : "ltr"};
        text-align: ${isRTL ? "right" : "left"};
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        animation: nfySlideIn 0.3s ease;
      ">
        <div style="display:flex;align-items:start;justify-content:space-between;gap:8px;">
          <div style="flex:1;">
            ${n.title ? `<p style="margin:0 0 4px;font-weight:600;">${this.escape(n.title)}</p>` : ""}
            ${n.body ? `<p style="margin:0;opacity:0.85;font-size:13px;">${n.body}</p>` : ""}
            ${n.ctaText ? `
              <button onclick="notifyUs._handleCTA('${n.id}', '${n.ctaUrl || ""}')" style="
                background:none;border:none;color:${n.ctaColor};font-size:13px;font-weight:600;
                cursor:pointer;padding:0;margin-top:8px;
              ">${this.escape(n.ctaText)} →</button>
            ` : ""}
          </div>
          ${n.isDismissable ? `
            <button onclick="notifyUs._dismiss('${n.id}')" style="
              background:none;border:none;color:${n.textColor};opacity:0.6;
              cursor:pointer;padding:0;line-height:1;flex-shrink:0;
            " aria-label="Close">✕</button>
          ` : ""}
        </div>
      </div>
    `;
  }

  _dismiss(id: string) {
    const el = document.getElementById(`notifyus-${id}`);
    if (el) {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.3s ease";
      setTimeout(() => el.remove(), 300);
    }
    this.trackEvent(id, "dismiss");
  }

  private dismiss(id: string, container: HTMLElement) {
    container.style.opacity = "0";
    container.style.transition = "opacity 0.3s ease";
    setTimeout(() => container.remove(), 300);
    this.trackEvent(id, "dismiss");
  }

  _handleCTA(id: string, url: string) {
    this.trackEvent(id, "click", url);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  private async trackEvent(
    notificationId: string,
    event: "view" | "click" | "dismiss",
    ctaUrl?: string
  ) {
    const userId = this.user?.id || "anonymous";
    try {
      await fetch(`${this.baseUrl}/api/v1/sdk/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: this.accountId,
          notificationId,
          userId,
          event,
          ctaUrl,
        }),
      });
    } catch {
      // Silently fail
    }
  }

  private injectStyles() {
    if (document.getElementById("notifyus-styles")) return;
    const style = document.createElement("style");
    style.id = "notifyus-styles";
    style.textContent = `
      @keyframes nfySlideIn {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .nfy-cta:hover { opacity: 0.9; }
    `;
    document.head.appendChild(style);
  }

  private escape(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}

// Create global singleton
const notifyUs = new NotifyUsSDK();

// Auto-init from script tag query params
(function () {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[src*="sdk.js"]'
  );
  let accountId = "";
  let baseUrl = "";

  for (const script of scripts) {
    const url = new URL(script.src);
    const acct = url.searchParams.get("account");
    if (acct) {
      accountId = acct;
      baseUrl = url.origin;
      break;
    }
  }

  if (accountId) {
    notifyUs.init(accountId, baseUrl);
  }

  // Expose globally
  (window as unknown as Record<string, unknown>).notifyUs = notifyUs;

  // Call ready callback if defined
  if (typeof (window as unknown as Record<string, unknown>).notifyUsReady === "function") {
    (
      (window as unknown as Record<string, unknown>).notifyUsReady as () => void
    )();
  }
})();

export { notifyUs };
export type { UserData, SDKNotification };
