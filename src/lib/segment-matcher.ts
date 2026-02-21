import type { UserAttributes } from "@/types";

interface SegmentRule {
  field: string;
  operator: string;
  value: unknown;
}

interface Segment {
  id: string;
  rules: SegmentRule[];
}

/**
 * Check if a user's attributes match a segment's rules.
 * All rules must match (AND logic).
 */
export function userMatchesSegment(
  userAttrs: UserAttributes,
  segment: Segment
): boolean {
  if (!segment.rules || segment.rules.length === 0) return true;

  return segment.rules.every((rule) => {
    const userValue = getUserFieldValue(userAttrs, rule.field);
    const ruleValues = Array.isArray(rule.value)
      ? rule.value.map(String)
      : [String(rule.value)];

    switch (rule.operator) {
      case "in":
        if (Array.isArray(userValue)) {
          return userValue.some((v) => ruleValues.includes(String(v)));
        }
        return ruleValues.includes(String(userValue));

      case "not_in":
        if (Array.isArray(userValue)) {
          return !userValue.some((v) => ruleValues.includes(String(v)));
        }
        return !ruleValues.includes(String(userValue));

      case "eq":
        return String(userValue) === ruleValues[0];

      case "contains":
        if (Array.isArray(userValue)) {
          return userValue.some((v) =>
            String(v)
              .toLowerCase()
              .includes(ruleValues[0].toLowerCase())
          );
        }
        return String(userValue)
          .toLowerCase()
          .includes(ruleValues[0].toLowerCase());

      default:
        return false;
    }
  });
}

function getUserFieldValue(
  userAttrs: UserAttributes,
  field: string
): unknown {
  // Direct attribute fields
  if (field in userAttrs) {
    return userAttrs[field];
  }
  // Check nested attributes object (if SaaS passes custom JSON)
  return undefined;
}

/**
 * Filter notifications based on user attributes and segment rules.
 */
export function filterNotificationsForUser(
  notifications: Array<{
    id: string;
    segments: Array<{ segment: Segment }>;
    exclusions: Array<{ segment: Segment }>;
  }>,
  userAttrs: UserAttributes
): string[] {
  return notifications
    .filter((notification) => {
      const hasSegments = notification.segments.length > 0;

      // If notification has no segments, show to all
      if (!hasSegments) return true;

      // Check inclusions: user must match at least one segment
      const matchesInclusion = notification.segments.some(({ segment }) =>
        userMatchesSegment(userAttrs, segment)
      );

      if (!matchesInclusion) return false;

      // Check exclusions: user must NOT match any exclusion segment
      const matchesExclusion = notification.exclusions.some(({ segment }) =>
        userMatchesSegment(userAttrs, segment)
      );

      return !matchesExclusion;
    })
    .map((n) => n.id);
}
