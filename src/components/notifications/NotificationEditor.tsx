"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import { NotificationPreview } from "./NotificationPreview";
import { useToast } from "@/components/ui/Toast";
import { RichTextEditor } from "@/components/notifications/RichTextEditor";
import type { SegmentData } from "@/types";

interface SegmentRef {
  segmentId?: string;
  segment?: { id: string };
}

interface NotificationInput {
  id?: string;
  name?: string;
  lang?: string;
  type?: string;
  position?: string;
  status?: string;
  title?: string;
  body?: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  backgroundColor?: string;
  textColor?: string;
  ctaColor?: string;
  autoDismissSeconds?: number | null;
  isDismissable?: boolean;
  isSticky?: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  maxViewsPerUser?: number | null;
  repeatPolicy?: string;
  segments?: SegmentRef[];
  exclusions?: SegmentRef[];
}

interface NotificationEditorProps {
  notification?: NotificationInput;
  segments: SegmentData[];
  mode: "create" | "edit";
}

const defaultValues = {
  name: "",
  lang: "en",
  type: "banner",
  position: "top",
  status: "draft",
  title: "",
  body: "",
  ctaText: "",
  ctaUrl: "",
  imageUrl: "",
  backgroundColor: "#1a1a2e",
  textColor: "#ffffff",
  ctaColor: "#e94560",
  autoDismissSeconds: null as number | null,
  isDismissable: true,
  isSticky: false,
  startsAt: "",
  endsAt: "",
  maxViewsPerUser: null as number | null,
  repeatPolicy: "once",
  segmentIds: [] as string[],
  excludeSegmentIds: [] as string[],
};

export function NotificationEditor({
  notification,
  segments,
  mode,
}: NotificationEditorProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "appearance" | "schedule" | "targeting">("content");

  const [form, setForm] = useState({
    ...defaultValues,
    ...notification,
    segmentIds: notification?.segments?.map((s: { segmentId?: string; segment?: { id: string } }) =>
      s.segmentId || s.segment?.id || ""
    ).filter(Boolean) || [],
    excludeSegmentIds: notification?.exclusions?.map((s: { segmentId?: string; segment?: { id: string } }) =>
      s.segmentId || s.segment?.id || ""
    ).filter(Boolean) || [],
    startsAt: notification?.startsAt
      ? new Date(notification.startsAt).toISOString().slice(0, 16)
      : "",
    endsAt: notification?.endsAt
      ? new Date(notification.endsAt).toISOString().slice(0, 16)
      : "",
    autoDismissSeconds: notification?.autoDismissSeconds ?? null,
    maxViewsPerUser: notification?.maxViewsPerUser ?? null,
  });

  const set = useCallback(
    <K extends keyof typeof defaultValues>(key: K, value: (typeof defaultValues)[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleSegment = (id: string, type: "include" | "exclude") => {
    if (type === "include") {
      setForm((prev) => ({
        ...prev,
        segmentIds: prev.segmentIds.includes(id)
          ? prev.segmentIds.filter((s) => s !== id)
          : [...prev.segmentIds, id],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        excludeSegmentIds: prev.excludeSegmentIds.includes(id)
          ? prev.excludeSegmentIds.filter((s) => s !== id)
          : [...prev.excludeSegmentIds, id],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        autoDismissSeconds: form.autoDismissSeconds || null,
        maxViewsPerUser: form.maxViewsPerUser || null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        ctaText: form.ctaText || null,
        ctaUrl: form.ctaUrl || null,
        imageUrl: form.imageUrl || null,
      };

      const url =
        mode === "edit"
          ? `/api/v1/notifications/${notification?.id}`
          : "/api/v1/notifications";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast(
        mode === "edit" ? "Notification updated!" : "Notification created!",
        "success"
      );
      router.push("/notifications");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "content", label: t("notifications.content") },
    { id: "appearance", label: t("notifications.appearance") },
    { id: "schedule", label: t("notifications.scheduling") },
    { id: "targeting", label: t("notifications.targeting") },
  ] as const;

  const typeOptions = [
    { value: "banner", label: t("notifications.types.banner") },
    { value: "modal", label: t("notifications.types.modal") },
    { value: "toast", label: t("notifications.types.toast") },
  ];

  const positionOptions = [
    { value: "top", label: t("notifications.positions.top") },
    { value: "bottom", label: t("notifications.positions.bottom") },
    { value: "center", label: t("notifications.positions.center") },
  ];

  const statusOptions = [
    { value: "draft", label: t("notifications.statuses.draft") },
    { value: "scheduled", label: t("notifications.statuses.scheduled") },
    { value: "active", label: t("notifications.statuses.active") },
    { value: "ended", label: t("notifications.statuses.ended") },
  ];

  const langOptions = [
    { value: "en", label: t("common.english") },
    { value: "ar", label: t("common.arabic") },
  ];

  const repeatOptions = [
    { value: "once", label: t("notifications.once") },
    { value: "every_load", label: t("notifications.everyLoad") },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="xl:col-span-2 space-y-4">
          {/* Header fields */}
          <Card>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("notifications.internalName")}
                hint={t("notifications.internalNameHint")}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Summer promotion banner"
                required
              />
              <Select
                label={t("common.status")}
                value={form.status}
                onChange={(e) => set("status", e.target.value as typeof form.status)}
                options={statusOptions}
              />
              <Select
                label={t("notifications.notificationLanguage")}
                value={form.lang}
                onChange={(e) => set("lang", e.target.value)}
                options={langOptions}
              />
              <Select
                label={t("notifications.notificationType")}
                value={form.type}
                onChange={(e) => set("type", e.target.value as typeof form.type)}
                options={typeOptions}
              />
              <Select
                label={t("notifications.position")}
                value={form.position}
                onChange={(e) => set("position", e.target.value as typeof form.position)}
                options={positionOptions}
              />
            </CardBody>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content tab */}
          {activeTab === "content" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("notifications.content")}</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label={t("notifications.title_field")}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder={
                    form.lang === "ar"
                      ? "عنوان الإشعار"
                      : "Notification title..."
                  }
                  required
                  dir={form.lang === "ar" ? "rtl" : "ltr"}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">
                    {t("notifications.body")}
                  </label>
                  <RichTextEditor
                    content={form.body}
                    onChange={(val: string) => set("body", val)}
                    placeholder={
                      form.lang === "ar"
                        ? "نص الإشعار..."
                        : "Notification body..."
                    }
                    dir={form.lang === "ar" ? "rtl" : "ltr"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("notifications.ctaText")}
                    value={form.ctaText || ""}
                    onChange={(e) => set("ctaText", e.target.value)}
                    placeholder={form.lang === "ar" ? "ابدأ الآن" : "Get started"}
                    dir={form.lang === "ar" ? "rtl" : "ltr"}
                  />
                  <Input
                    label={t("notifications.ctaUrl")}
                    type="url"
                    value={form.ctaUrl || ""}
                    onChange={(e) => set("ctaUrl", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <Input
                  label={t("notifications.imageUrl")}
                  type="url"
                  value={form.imageUrl || ""}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://example.com/image.png"
                />
              </CardBody>
            </Card>
          )}

          {/* Appearance tab */}
          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("notifications.appearance")}</CardTitle>
              </CardHeader>
              <CardBody className="space-y-5">
                {/* Color pickers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorPicker
                    label={t("notifications.backgroundColor")}
                    value={form.backgroundColor}
                    onChange={(v) => set("backgroundColor", v)}
                  />
                  <ColorPicker
                    label={t("notifications.textColor")}
                    value={form.textColor}
                    onChange={(v) => set("textColor", v)}
                  />
                  <ColorPicker
                    label={t("notifications.ctaColor")}
                    value={form.ctaColor}
                    onChange={(v) => set("ctaColor", v)}
                  />
                </div>

                {/* Behavior toggles */}
                <div className="space-y-3">
                  <Toggle
                    label={t("notifications.isDismissable")}
                    checked={form.isDismissable}
                    onChange={(v) => set("isDismissable", v)}
                  />
                  <Toggle
                    label={t("notifications.isSticky")}
                    checked={form.isSticky}
                    onChange={(v) => set("isSticky", v)}
                  />
                </div>

                {/* Auto dismiss */}
                <div className="flex flex-col gap-1">
                  <Toggle
                    label={t("notifications.autoDismiss")}
                    checked={form.autoDismissSeconds !== null}
                    onChange={(v) =>
                      set("autoDismissSeconds", v ? 5 : null)
                    }
                  />
                  {form.autoDismissSeconds !== null && (
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={form.autoDismissSeconds || ""}
                      onChange={(e) =>
                        set("autoDismissSeconds", parseInt(e.target.value) || null)
                      }
                      className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm mt-2"
                      placeholder="5"
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Schedule tab */}
          {activeTab === "schedule" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("notifications.scheduling")}</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("notifications.startDate")}
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => set("startsAt", e.target.value)}
                  />
                  <Input
                    label={t("notifications.endDate")}
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => set("endsAt", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("notifications.maxViews")}
                    hint={t("notifications.maxViewsHint")}
                    type="number"
                    min={1}
                    value={form.maxViewsPerUser || ""}
                    onChange={(e) =>
                      set(
                        "maxViewsPerUser",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="∞"
                  />
                  <Select
                    label={t("notifications.repeatPolicy")}
                    value={form.repeatPolicy}
                    onChange={(e) =>
                      set("repeatPolicy", e.target.value as typeof form.repeatPolicy)
                    }
                    options={repeatOptions}
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Targeting tab */}
          {activeTab === "targeting" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("notifications.targeting")}</CardTitle>
              </CardHeader>
              <CardBody className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {t("notifications.includeSegments")}
                  </p>
                  {segments.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {t("segments.noSegments")}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {segments.map((seg) => (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => toggleSegment(seg.id, "include")}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            form.segmentIds.includes(seg.id)
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400"
                          }`}
                        >
                          {seg.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {form.segmentIds.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {t("notifications.allUsers")}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {t("notifications.excludeSegments")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {segments.map((seg) => (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => toggleSegment(seg.id, "exclude")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          form.excludeSegmentIds.includes(seg.id)
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-slate-700 border-slate-300 hover:border-red-400"
                        }`}
                      >
                        {seg.name}
                      </button>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {t("common.save")}
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("notifications.preview")}</CardTitle>
            </CardHeader>
            <CardBody>
              <NotificationPreview
                type={form.type}
                position={form.position}
                title={form.title || "Your notification title"}
                body={form.body || "Your notification body text will appear here."}
                ctaText={form.ctaText}
                ctaUrl={form.ctaUrl}
                imageUrl={form.imageUrl}
                backgroundColor={form.backgroundColor}
                textColor={form.textColor}
                ctaColor={form.ctaColor}
                isDismissable={form.isDismissable}
                lang={form.lang}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </form>
  );
}

// Helper sub-components

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm font-mono text-slate-700 outline-none bg-transparent"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-slate-300"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}
