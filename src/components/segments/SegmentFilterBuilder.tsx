"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { useLanguage } from "@/contexts/LanguageContext";

export interface FilterRule {
  field: string;
  operator: string;
  value: string[];
}

interface SegmentFilterBuilderProps {
  rules: FilterRule[];
  onChange: (rules: FilterRule[]) => void;
}

const FIELD_OPTIONS = [
  { value: "plan", label: "Plan" },
  { value: "role", label: "Role" },
  { value: "tags", label: "Tags" },
  { value: "email", label: "Email" },
  { value: "country", label: "Country" },
];

const OPERATOR_OPTIONS = [
  { value: "in", label: "is one of" },
  { value: "not_in", label: "is not one of" },
  { value: "eq", label: "equals" },
  { value: "contains", label: "contains" },
];

export function SegmentFilterBuilder({
  rules,
  onChange,
}: SegmentFilterBuilderProps) {
  const { t } = useLanguage();

  const addRule = () => {
    onChange([...rules, { field: "plan", operator: "in", value: [] }]);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<FilterRule>) => {
    onChange(
      rules.map((rule, i) =>
        i === index ? { ...rule, ...updates } : rule
      )
    );
  };

  const getFieldOptions = () =>
    FIELD_OPTIONS.map((f) => ({
      value: f.value,
      label: t(`segments.fields.${f.value}`) || f.label,
    }));

  const getOperatorOptions = () =>
    OPERATOR_OPTIONS.map((o) => ({
      value: o.value,
      label: t(`segments.operators.${o.value}`) || o.label,
    }));

  return (
    <div className="space-y-3">
      {rules.length === 0 && (
        <p className="text-sm text-slate-400 py-3 text-center border-2 border-dashed border-slate-200 rounded-lg">
          No filters — this segment will match all users.
        </p>
      )}

      {rules.map((rule, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select
              value={rule.field}
              onChange={(e) => updateRule(index, { field: e.target.value })}
              options={getFieldOptions()}
            />
            <Select
              value={rule.operator}
              onChange={(e) =>
                updateRule(index, { operator: e.target.value })
              }
              options={getOperatorOptions()}
            />
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={rule.value.join(", ")}
                onChange={(e) =>
                  updateRule(index, {
                    value: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="value1, value2"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400">
                Separate multiple values with commas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeRule(index)}
            className="shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
            title="Remove filter"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addRule}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {t("segments.addFilter")}
      </Button>
    </div>
  );
}
