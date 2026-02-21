import React from "react";
import Link from "next/link";
import { SegmentForm } from "@/components/segments/SegmentForm";

export default function NewSegmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/segments" className="hover:text-slate-900">
          Segments
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">New</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Segment</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Define an audience segment with filter rules.
        </p>
      </div>

      <SegmentForm mode="create" />
    </div>
  );
}
