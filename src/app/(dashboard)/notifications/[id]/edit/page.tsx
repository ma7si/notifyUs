import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NotificationEditor } from "@/components/notifications/NotificationEditor";
import type { SegmentData } from "@/types";

export default async function EditNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { accountId?: string };
  if (!user.accountId) redirect("/login");

  const { id } = await params;

  const [notification, segments] = await Promise.all([
    prisma.notification.findFirst({
      where: { id, accountId: user.accountId },
      include: {
        segments: { include: { segment: true } },
        exclusions: { include: { segment: true } },
      },
    }),
    prisma.segment.findMany({
      where: { accountId: user.accountId },
      include: { rules: true },
    }),
  ]);

  if (!notification) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/notifications" className="hover:text-slate-900">
          Notifications
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{notification.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Notification</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Update your notification campaign.
        </p>
      </div>

      <NotificationEditor
        notification={notification as unknown as Parameters<typeof NotificationEditor>[0]["notification"]}
        segments={segments as unknown as SegmentData[]}
        mode="edit"
      />
    </div>
  );
}
