import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccount } from "@/lib/api-auth";
import { subDays, format } from "date-fns";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");

  const notification = await prisma.notification.findFirst({
    where: { id, accountId: account.id },
  });
  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const since = subDays(new Date(), days);

  const [impressions, clicks, dismissals] = await Promise.all([
    prisma.notificationImpression.findMany({
      where: { notificationId: id, firstSeenAt: { gte: since } },
      select: { viewCount: true, firstSeenAt: true, isDismissed: true },
    }),
    prisma.notificationClick.findMany({
      where: { notificationId: id, clickedAt: { gte: since } },
      select: { clickedAt: true },
    }),
    prisma.notificationImpression.count({
      where: { notificationId: id, isDismissed: true },
    }),
  ]);

  const totalImpressions = impressions.reduce((sum, i) => sum + i.viewCount, 0);
  const totalClicks = clicks.length;
  const ctr =
    totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(1)
      : "0";

  // Build daily data
  const dailyMap: Record<string, { impressions: number; clicks: number }> = {};
  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    dailyMap[date] = { impressions: 0, clicks: 0 };
  }

  impressions.forEach((imp) => {
    const date = format(imp.firstSeenAt, "yyyy-MM-dd");
    if (dailyMap[date]) {
      dailyMap[date].impressions += imp.viewCount;
    }
  });

  clicks.forEach((click) => {
    const date = format(click.clickedAt, "yyyy-MM-dd");
    if (dailyMap[date]) {
      dailyMap[date].clicks += 1;
    }
  });

  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  return NextResponse.json({
    notificationId: id,
    totalImpressions,
    totalClicks,
    totalDismissals: dismissals,
    ctr: parseFloat(ctr),
    dailyData,
  });
}
