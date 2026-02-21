import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";
import { StatCard } from "@/components/ui/Card";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { StatusBadge } from "@/components/ui/Badge";
import { calcCTR, formatDateShort } from "@/lib/utils";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { accountId?: string };
  if (!user.accountId) redirect("/login");

  const accountId = user.accountId;
  const since = subDays(new Date(), 30);

  const [notifications, impressions, clicks, dismissals] = await Promise.all([
    prisma.notification.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { impressions: true, clicks: true } },
      },
    }),
    prisma.notificationImpression.findMany({
      where: {
        notification: { accountId },
        firstSeenAt: { gte: since },
      },
      select: { viewCount: true, firstSeenAt: true },
    }),
    prisma.notificationClick.findMany({
      where: {
        notification: { accountId },
        clickedAt: { gte: since },
      },
      select: { clickedAt: true },
    }),
    prisma.notificationImpression.count({
      where: {
        notification: { accountId },
        isDismissed: true,
      },
    }),
  ]);

  const totalImpressions = impressions.reduce((s, i) => s + i.viewCount, 0);
  const totalClicks = clicks.length;

  // Build 30-day chart data
  const dailyMap: Record<string, { date: string; impressions: number; clicks: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    dailyMap[date] = { date, impressions: 0, clicks: 0 };
  }

  impressions.forEach((imp) => {
    const date = format(imp.firstSeenAt, "yyyy-MM-dd");
    if (dailyMap[date]) dailyMap[date].impressions += imp.viewCount;
  });
  clicks.forEach((click) => {
    const date = format(click.clickedAt, "yyyy-MM-dd");
    if (dailyMap[date]) dailyMap[date].clicks += 1;
  });

  const chartData = Object.values(dailyMap);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Track notification performance — last 30 days
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Impressions"
          value={totalImpressions.toLocaleString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        />
        <StatCard
          label="Total Clicks"
          value={totalClicks.toLocaleString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 10 20 15 15 20" />
              <path d="M4 4v7a4 4 0 0 0 4 4h12" />
            </svg>
          }
        />
        <StatCard
          label="Avg CTR"
          value={calcCTR(totalImpressions, totalClicks)}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          }
        />
        <StatCard
          label="Dismissals"
          value={dismissals.toLocaleString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <AnalyticsCharts data={chartData} />

      {/* Per-notification table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Per Notification
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-start px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Notification
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
                  Clicks
                </th>
                <th className="text-start px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-slate-900">{n.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={n.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDateShort(n.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {n._count.impressions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {n._count.clicks.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-600">
                    {calcCTR(n._count.impressions, n._count.clicks)}
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">
                    No notifications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
