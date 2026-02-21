import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterNotificationsForUser } from "@/lib/segment-matcher";
import type { UserAttributes } from "@/types";
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  plan: z.string().optional(),
  role: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let userAttrs: UserAttributes = { id: "anonymous" };

  try {
    const body = await req.json();
    if (body.user) {
      const parsed = userSchema.safeParse(body.user);
      if (parsed.success) {
        userAttrs = parsed.data as UserAttributes;
      }
    }
  } catch {
    // Body parsing failed — continue as anonymous
  }

  const now = new Date();

  // Get active notifications (auto-update status)
  const notifications = await prisma.notification.findMany({
    where: {
      accountId,
      OR: [
        { status: "active" },
        {
          status: "scheduled",
          startsAt: { lte: now },
        },
      ],
      AND: [
        {
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
      ],
    },
    include: {
      segments: { include: { segment: { include: { rules: true } } } },
      exclusions: { include: { segment: { include: { rules: true } } } },
    },
  });

  // Filter by segment rules
  const matchingIds = filterNotificationsForUser(notifications, userAttrs);

  // Check per-user view limits if user is identified
  let eligibleNotifications = notifications.filter((n) =>
    matchingIds.includes(n.id)
  );

  if (userAttrs.id && userAttrs.id !== "anonymous") {
    // Get or create end user
    let endUser = await prisma.endUser.findUnique({
      where: {
        accountId_externalId: {
          accountId,
          externalId: userAttrs.id,
        },
      },
    });

    if (!endUser) {
      endUser = await prisma.endUser.create({
        data: {
          accountId,
          externalId: userAttrs.id,
          email: userAttrs.email as string | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attributes: userAttrs as any,
        },
      });
    }

    // Filter by max views
    const impressions = await prisma.notificationImpression.findMany({
      where: {
        userId: endUser.id,
        notificationId: { in: eligibleNotifications.map((n) => n.id) },
      },
    });

    const impressionMap = Object.fromEntries(
      impressions.map((i) => [i.notificationId, i])
    );

    eligibleNotifications = eligibleNotifications.filter((n) => {
      const imp = impressionMap[n.id];
      if (!imp) return true;
      if (n.maxViewsPerUser !== null && imp.viewCount >= n.maxViewsPerUser) {
        return false;
      }
      if (n.repeatPolicy === "once" && imp.viewCount >= 1) return false;
      return true;
    });
  }

  // Return stripped-down payload for SDK
  const sdkPayload = eligibleNotifications.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    lang: n.lang,
    title: n.title,
    body: n.body,
    ctaText: n.ctaText,
    ctaUrl: n.ctaUrl,
    imageUrl: n.imageUrl,
    backgroundColor: n.backgroundColor,
    textColor: n.textColor,
    ctaColor: n.ctaColor,
    autoDismissSeconds: n.autoDismissSeconds,
    isDismissable: n.isDismissable,
  }));

  return NextResponse.json(
    { notifications: sdkPayload },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
