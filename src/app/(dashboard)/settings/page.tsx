import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { accountId?: string };
  if (!user.accountId) redirect("/login");

  const account = await prisma.account.findUnique({
    where: { id: user.accountId },
    include: { domains: true },
  });

  if (!account) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage your account, domains, and SDK integration.
        </p>
      </div>

      <SettingsClient
        account={{
          id: account.id,
          name: account.name,
          logoUrl: account.logoUrl,
          apiKey: account.apiKey,
          domains: account.domains,
        }}
      />
    </div>
  );
}
