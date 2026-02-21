import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccount } from "@/lib/api-auth";
import { z } from "zod";

const notificationSchema = z.object({
  name: z.string().min(1),
  lang: z.enum(["en", "ar"]).default("en"),
  type: z.enum(["banner", "modal", "toast"]).default("banner"),
  position: z.enum(["top", "bottom", "center"]).default("top"),
  status: z.enum(["draft", "scheduled", "active", "ended"]).default("draft"),
  title: z.string().min(1),
  body: z.string().default(""),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  backgroundColor: z.string().default("#1a1a2e"),
  textColor: z.string().default("#ffffff"),
  ctaColor: z.string().default("#e94560"),
  autoDismissSeconds: z.number().optional().nullable(),
  isDismissable: z.boolean().default(true),
  isSticky: z.boolean().default(false),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  maxViewsPerUser: z.number().optional().nullable(),
  repeatPolicy: z.enum(["once", "every_load"]).default("once"),
  segmentIds: z.array(z.string()).optional().default([]),
  excludeSegmentIds: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where = {
    accountId: account.id,
    ...(status ? { status } : {}),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { impressions: true, clicks: true } },
        segments: { include: { segment: { select: { id: true, name: true } } } },
        exclusions: {
          include: { segment: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({ data: notifications, total, page, limit });
}

export async function POST(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = notificationSchema.parse(body);
    const { segmentIds, excludeSegmentIds, ...notificationData } = data;

    const notification = await prisma.notification.create({
      data: {
        ...notificationData,
        accountId: account.id,
        startsAt: notificationData.startsAt
          ? new Date(notificationData.startsAt)
          : null,
        endsAt: notificationData.endsAt
          ? new Date(notificationData.endsAt)
          : null,
        segments: {
          create: segmentIds.map((segmentId: string) => ({ segmentId })),
        },
        exclusions: {
          create: excludeSegmentIds.map((segmentId: string) => ({
            segmentId,
          })),
        },
      },
      include: {
        _count: { select: { impressions: true, clicks: true } },
        segments: { include: { segment: { select: { id: true, name: true } } } },
        exclusions: {
          include: { segment: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
