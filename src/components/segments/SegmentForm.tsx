"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import {
  SegmentFilterBuilder,
  type FilterRule,
} from "./SegmentFilterBuilder";

interface SegmentFormProps {
  segment?: {
    id: string;
    name: string;
    rules: FilterRule[];
  };
  mode: "create" | "edit";
}

export function SegmentForm({ segment, mode }: SegmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(segment?.name || "");
  const [rules, setRules] = useState<FilterRule[]>(
    segment?.rules?.map((r) => ({
      field: r.field,
      operator: r.operator,
      value: Array.isArray(r.value) ? r.value : [String(r.value)],
    })) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url =
        mode === "edit"
          ? `/api/v1/segments/${segment?.id}`
          : "/api/v1/segments";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rules }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast(
        mode === "edit" ? "Segment updated!" : "Segment created!",
        "success"
      );
      router.push("/segments");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Segment Details</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Segment Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pro users, Trial users, Admins"
            required
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardBody>
          <SegmentFilterBuilder rules={rules} onChange={setRules} />
        </CardBody>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save Segment
        </Button>
      </div>
    </form>
  );
}
