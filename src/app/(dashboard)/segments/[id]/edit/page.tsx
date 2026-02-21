import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SegmentForm } from "@/components/segments/SegmentForm";
import type { FilterRule } from "@/components/segments/SegmentFilterBuilder";

export default async function EditSegmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { accountId?: string };
  if (!user.accountId) redirect("/login");

  const { id } = await params;

  const segment = await prisma.segment.findFirst({
    where: { id, accountId: user.accountId },
    include: { rules: true },
  });

  if (!segment) notFound();

  const segmentData = {
    id: segment.id,
    name: segment.name,
    rules: segment.rules.map((r) => ({
      field: r.field,
      operator: r.operator,
      value: Array.isArray(r.value) ? (r.value as string[]) : [],
    })) as FilterRule[],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/segments" className="hover:text-slate-900">
          Segments
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{segment.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Segment</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Update segment filters and settings.
        </p>
      </div>

      <SegmentForm segment={segmentData} mode="edit" />
    </div>
  );
}
