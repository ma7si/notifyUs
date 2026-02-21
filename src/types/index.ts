export type Locale = "en" | "ar";
export type Dir = "ltr" | "rtl";

export type NotificationType = "banner" | "modal" | "toast";
export type NotificationPosition = "top" | "bottom" | "center";
export type NotificationStatus = "draft" | "scheduled" | "active" | "ended";
export type RepeatPolicy = "once" | "every_load";

export interface NotificationData {
  id: string;
  accountId: string;
  name: string;
  lang: string;
  type: NotificationType;
  position: NotificationPosition;
  status: NotificationStatus;
  title: string;
  body: string;
  ctaText: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  backgroundColor: string;
  textColor: string;
  ctaColor: string;
  autoDismissSeconds: number | null;
  isDismissable: boolean;
  isSticky: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  maxViewsPerUser: number | null;
  repeatPolicy: RepeatPolicy;
  createdAt: Date;
  updatedAt: Date;
  impressions?: { _count?: number }[];
  clicks?: { _count?: number }[];
  _count?: {
    impressions: number;
    clicks: number;
  };
}

export interface SegmentData {
  id: string;
  accountId: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  rules: SegmentRuleData[];
}

export interface SegmentRuleData {
  id: string;
  segmentId: string;
  field: string;
  operator: string;
  value: string[];
}

export interface AnalyticsData {
  notificationId: string;
  impressions: number;
  clicks: number;
  dismissals: number;
  ctr: number;
  dailyData: DailyAnalytics[];
}

export interface DailyAnalytics {
  date: string;
  impressions: number;
  clicks: number;
}

export interface UserAttributes {
  id: string;
  email?: string;
  plan?: string;
  role?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface SDKNotification {
  id: string;
  type: NotificationType;
  position: NotificationPosition;
  lang: string;
  title: string;
  body: string;
  ctaText: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  backgroundColor: string;
  textColor: string;
  ctaColor: string;
  autoDismissSeconds: number | null;
  isDismissable: boolean;
}
