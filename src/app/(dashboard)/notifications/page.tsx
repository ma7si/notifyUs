import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDateShort, calcCTR } from "@/lib/utils";
import { NotificationActions } from "@/components/notifications/NotificationActions";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { accountId?: string };
  if (!user.accountId) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { accountId: user.accountId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { impressions: true, clicks: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your notification campaigns
          </p>
        </div>
        <Link href="/notifications/new">
          <Button>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Notification
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              No notifications yet
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Create your first notification campaign to get started.
            </p>
            <Link href="/notifications/new">
              <Button>Create Notification</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-start px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="text-end px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {n.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                          {n.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <TypeBadge type={n.type} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDateShort(n.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900 font-medium">
                      {n._count.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {calcCTR(n._count.impressions, n._count.clicks)}
                    </td>
                    <td className="px-6 py-4">
                      <NotificationActions id={n.id} name={n.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { variant: "info" | "purple" | "warning"; label: string }> = {
    banner: { variant: "info", label: "Banner" },
    modal: { variant: "purple", label: "Modal" },
    toast: { variant: "warning", label: "Toast" },
  };
  const config = map[type] || { variant: "info", label: type };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
