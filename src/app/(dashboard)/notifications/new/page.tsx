import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NotificationEditor } from "@/components/notifications/NotificationEditor";
import type { SegmentData } from "@/types";

export default async function NewNotificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { accountId?: string };
  if (!user.accountId) redirect("/login");

  const segments = await prisma.segment.findMany({
    where: { accountId: user.accountId },
    include: { rules: true },
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/notifications" className="hover:text-slate-900">
          Notifications
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">New</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Create Notification
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Design and configure a new notification campaign.
        </p>
      </div>

      <NotificationEditor segments={segments as unknown as SegmentData[]} mode="create" />
    </div>
  );
}
