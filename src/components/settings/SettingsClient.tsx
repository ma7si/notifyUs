"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import { useRouter } from "next/navigation";

interface Domain {
  id: string;
  hostname: string;
}

interface AccountData {
  id: string;
  name: string;
  logoUrl: string | null;
  apiKey: string;
  domains: Domain[];
}

export function SettingsClient({ account }: { account: AccountData }) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(account.name);
  const [logoUrl, setLogoUrl] = useState(account.logoUrl || "");
  const [apiKey, setApiKey] = useState(account.apiKey);
  const [newDomain, setNewDomain] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [removingDomain, setRemovingDomain] = useState<string | null>(null);

  const saveAccount = async () => {
    setSavingAccount(true);
    try {
      const res = await fetch("/api/v1/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl: logoUrl || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast("Settings saved!", "success");
      router.refresh();
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSavingAccount(false);
    }
  };

  const regenerateApiKey = async () => {
    if (!confirm("Regenerate API key? Your old key will stop working immediately.")) return;
    try {
      const res = await fetch("/api/v1/account", { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setApiKey(data.apiKey);
      toast("API key regenerated", "success");
    } catch {
      toast("Failed to regenerate key", "error");
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) return;
    setSavingDomain(true);
    try {
      const res = await fetch("/api/v1/account/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: newDomain.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      setNewDomain("");
      toast("Domain added", "success");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingDomain(false);
    }
  };

  const removeDomain = async (id: string) => {
    setRemovingDomain(id);
    try {
      await fetch(`/api/v1/account/domains?id=${id}`, { method: "DELETE" });
      toast("Domain removed", "success");
      router.refresh();
    } catch {
      toast("Failed to remove domain", "error");
    } finally {
      setRemovingDomain(null);
    }
  };

  const sdkSnippet = `<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.com"}/sdk.js?account=${account.id}" async></script>
<script>
  // Identify the current user
  window.notifyUsReady = function() {
    notifyUs.identify({
      id: "user-123",
      email: "user@example.com",
      plan: "pro",
      role: "admin",
      tags: ["trial"]
    });
  };
</script>`;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Account Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Logo URL"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          <div className="flex justify-end">
            <Button onClick={saveAccount} loading={savingAccount}>
              Save Account
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-500">
            Use this key to authenticate REST API requests and the JavaScript SDK.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 truncate">
              {apiKey}
            </code>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(apiKey);
                toast("Copied!", "success");
              }}
            >
              Copy
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={regenerateApiKey}>
            Regenerate Key
          </Button>
        </CardBody>
      </Card>

      {/* Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Allowed Domains</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-500">
            Add domains where the NotifyUs SDK will be used.
          </p>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="app.example.com"
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              className="flex-1"
            />
            <Button onClick={addDomain} loading={savingDomain} className="shrink-0">
              Add
            </Button>
          </div>
          {account.domains.length > 0 && (
            <ul className="space-y-2">
              {account.domains.map((domain) => (
                <li
                  key={domain.id}
                  className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-mono text-slate-800">
                    {domain.hostname}
                  </span>
                  <button
                    onClick={() => removeDomain(domain.id)}
                    disabled={removingDomain === domain.id}
                    className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* SDK Install */}
      <Card>
        <CardHeader>
          <CardTitle>SDK Installation</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-500">
            Paste this snippet into the <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> of your web app:
          </p>
          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed">
              {sdkSnippet}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sdkSnippet);
                toast("Copied!", "success");
              }}
              className="absolute top-3 end-3 text-slate-400 hover:text-white transition-colors"
              title="Copy"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Your Account ID: <code className="font-mono">{account.id}</code>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
