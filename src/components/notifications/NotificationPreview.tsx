"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PreviewProps {
  type: string;
  position: string;
  title: string;
  body: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  backgroundColor: string;
  textColor: string;
  ctaColor: string;
  isDismissable: boolean;
  lang: string;
}

export function NotificationPreview({
  type,
  position,
  title,
  body,
  ctaText,
  imageUrl,
  backgroundColor,
  textColor,
  ctaColor,
  isDismissable,
  lang,
}: PreviewProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const isRTL = dir === "rtl";

  if (type === "banner") {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
        {/* Browser bar mockup */}
        <div className="bg-slate-200 px-3 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded h-5 mx-2 text-xs text-slate-400 px-2 flex items-center">
            app.example.com
          </div>
        </div>
        {/* Banner */}
        <div
          dir={dir}
          style={{ backgroundColor, color: textColor }}
          className={cn(
            "px-4 py-2.5 flex items-center gap-3 text-sm",
            position === "bottom" ? "order-last" : ""
          )}
        >
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
          )}
          <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
            {title && <span className="font-semibold me-1">{title}</span>}
            {body && (
              <span
                className="opacity-90"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
          </div>
          {ctaText && (
            <button
              className="shrink-0 px-3 py-1 rounded-md text-xs font-semibold"
              style={{ backgroundColor: ctaColor, color: "#fff" }}
            >
              {ctaText}
            </button>
          )}
          {isDismissable && (
            <button className="shrink-0 opacity-70 hover:opacity-100 ms-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {/* Page content mockup */}
        <div className="p-4 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (type === "modal") {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <div className="bg-slate-200 px-3 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
        </div>
        {/* Dimmed background with modal */}
        <div className="relative p-4 flex items-center justify-center min-h-[180px]">
          <div className="absolute inset-0 bg-black/30" />
          <div
            dir={dir}
            style={{ backgroundColor, color: textColor }}
            className={cn(
              "relative rounded-xl p-5 w-full max-w-xs shadow-xl",
              isRTL ? "text-right" : "text-left"
            )}
          >
            {isDismissable && (
              <button className="absolute top-3 end-3 opacity-70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
            )}
            {title && (
              <h3 className="font-bold text-base mb-1.5">{title}</h3>
            )}
            {body && (
              <p
                className="text-sm opacity-90 mb-4"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
            {ctaText && (
              <button
                className="w-full py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: ctaColor }}
              >
                {ctaText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Toast
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
      <div className="bg-slate-200 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
      </div>
      <div className="relative p-4 min-h-[120px]">
        <div className={cn(
          "absolute",
          position === "bottom" ? "bottom-4" : "top-4",
          isRTL ? "start-4" : "end-4"
        )}>
          <div
            dir={dir}
            style={{ backgroundColor, color: textColor }}
            className={cn(
              "rounded-xl px-4 py-3 shadow-lg w-64",
              isRTL ? "text-right" : "text-left"
            )}
          >
            {title && <p className="font-semibold text-sm">{title}</p>}
            {body && (
              <p
                className="text-xs opacity-90 mt-0.5"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
            {ctaText && (
              <button
                className="mt-2 text-xs font-semibold"
                style={{ color: ctaColor }}
              >
                {ctaText} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
