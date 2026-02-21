import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccount } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  lang: z.enum(["en", "ar"]).optional(),
  type: z.enum(["banner", "modal", "toast"]).optional(),
  position: z.enum(["top", "bottom", "center"]).optional(),
  status: z.enum(["draft", "scheduled", "active", "ended"]).optional(),
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  ctaColor: z.string().optional(),
  autoDismissSeconds: z.number().optional().nullable(),
  isDismissable: z.boolean().optional(),
  isSticky: z.boolean().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  maxViewsPerUser: z.number().optional().nullable(),
  repeatPolicy: z.enum(["once", "every_load"]).optional(),
  segmentIds: z.array(z.string()).optional(),
  excludeSegmentIds: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: { id, accountId: account.id },
    include: {
      _count: { select: { impressions: true, clicks: true } },
      segments: { include: { segment: true } },
      exclusions: { include: { segment: true } },
    },
  });

  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(notification);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.notification.findFirst({
    where: { id, accountId: account.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const { segmentIds, excludeSegmentIds, ...notificationData } = data;

    const updateData: Record<string, unknown> = {
      ...notificationData,
      ...(notificationData.startsAt !== undefined
        ? { startsAt: notificationData.startsAt ? new Date(notificationData.startsAt as string) : null }
        : {}),
      ...(notificationData.endsAt !== undefined
        ? { endsAt: notificationData.endsAt ? new Date(notificationData.endsAt as string) : null }
        : {}),
    };

    // Update segments if provided
    if (segmentIds !== undefined) {
      await prisma.notificationSegment.deleteMany({ where: { notificationId: id } });
      updateData.segments = {
        create: segmentIds.map((segmentId: string) => ({ segmentId })),
      };
    }
    if (excludeSegmentIds !== undefined) {
      await prisma.notificationExclusion.deleteMany({ where: { notificationId: id } });
      updateData.exclusions = {
        create: excludeSegmentIds.map((segmentId: string) => ({ segmentId })),
      };
    }

    const notification = await prisma.notification.update({
      where: { id, accountId: account.id },
      data: updateData,
      include: {
        _count: { select: { impressions: true, clicks: true } },
        segments: { include: { segment: { select: { id: true, name: true } } } },
        exclusions: {
          include: { segment: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(notification);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.notification.findFirst({
    where: { id, accountId: account.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notification.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
