import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Simple in-memory rate limiter
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const trackSchema = z.object({
  accountId: z.string(),
  notificationId: z.string(),
  userId: z.string(),
  event: z.enum(["view", "click", "dismiss"]),
  ctaUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: CORS }
    );
  }

  try {
    const body = await req.json();
    const { accountId, notificationId, userId, event, ctaUrl } =
      trackSchema.parse(body);

    // Verify notification belongs to account
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, accountId },
    });
    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });
    }

    // Upsert end user
    const endUser = await prisma.endUser.upsert({
      where: { accountId_externalId: { accountId, externalId: userId } },
      update: { updatedAt: new Date() },
      create: { accountId, externalId: userId },
    });

    if (event === "view") {
      await prisma.notificationImpression.upsert({
        where: {
          notificationId_userId: {
            notificationId,
            userId: endUser.id,
          },
        },
        update: {
          viewCount: { increment: 1 },
          lastSeenAt: new Date(),
        },
        create: {
          notificationId,
          userId: endUser.id,
          viewCount: 1,
        },
      });
    } else if (event === "click") {
      await prisma.notificationClick.create({
        data: {
          notificationId,
          userId: endUser.id,
          ctaUrlSnapshot: ctaUrl,
        },
      });
    } else if (event === "dismiss") {
      await prisma.notificationImpression.upsert({
        where: {
          notificationId_userId: {
            notificationId,
            userId: endUser.id,
          },
        },
        update: { isDismissed: true },
        create: {
          notificationId,
          userId: endUser.id,
          isDismissed: true,
        },
      });
    }

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400, headers: CORS }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}
