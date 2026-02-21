import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDateShort } from "@/lib/utils";
import { SegmentDeleteButton } from "@/components/segments/SegmentDeleteButton";

export default async function SegmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { accountId?: string };
  if (!user.accountId) redirect("/login");

  const segments = await prisma.segment.findMany({
    where: { accountId: user.accountId },
    orderBy: { createdAt: "desc" },
    include: {
      rules: true,
      _count: { select: { notificationSegments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Segments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your audience segments
          </p>
        </div>
        <Link href="/segments/new">
          <Button>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Segment
          </Button>
        </Link>
      </div>

      {segments.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              No segments yet
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Create audience segments to target specific users with your notifications.
            </p>
            <Link href="/segments/new">
              <Button>Create Segment</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((segment) => (
            <Card key={segment.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {segment.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {segment.rules.length} filter{segment.rules.length !== 1 ? "s" : ""}
                    {" · "}
                    {segment._count.notificationSegments} notification
                    {segment._count.notificationSegments !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/segments/${segment.id}/edit`}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                  <SegmentDeleteButton id={segment.id} name={segment.name} />
                </div>
              </div>

              {/* Rules preview */}
              <div className="space-y-1.5">
                {segment.rules.slice(0, 3).map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 rounded-md px-2 py-1"
                  >
                    <span className="font-medium text-slate-700">
                      {rule.field}
                    </span>
                    <span className="text-slate-400">{rule.operator}</span>
                    <span className="text-indigo-600 font-mono truncate max-w-[100px]">
                      {Array.isArray(rule.value)
                        ? (rule.value as string[]).join(", ")
                        : String(rule.value)}
                    </span>
                  </div>
                ))}
                {segment.rules.length > 3 && (
                  <p className="text-xs text-slate-400">
                    +{segment.rules.length - 3} more filters
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-3">
                Created {formatDateShort(segment.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
