import type { ComponentType } from "react";
import {
  OverviewIcon,
  BusinessesIcon,
  NfcIcon,
  LeadsIcon,
  VerificationIcon,
  AnalyticsIcon,
  SubscriptionsIcon,
  SettingsIcon,
} from "@/components/admin/icons";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /**
   * "active" items render as real links. "soon" items render disabled,
   * with a small "Soon" label, so the target nav shape is visible
   * without shipping dead/fake links to pages that don't exist yet.
   * Activating a future module is a one-line change here — no shell
   * restructuring required.
   */
  status: "active" | "soon";
}

export const ADMIN_NAV_MAIN: AdminNavItem[] = [
  { key: "overview", label: "Overview", href: "/admin", icon: OverviewIcon, status: "active" },
  { key: "businesses", label: "Businesses", href: "/admin/businesses", icon: BusinessesIcon, status: "active" },
  { key: "nfc-cards", label: "NFC Cards", href: "/admin/nfc-cards", icon: NfcIcon, status: "soon" },
  { key: "leads", label: "Leads", href: "/admin/leads", icon: LeadsIcon, status: "active" },
  { key: "verification", label: "Verification", href: "/admin/verification", icon: VerificationIcon, status: "soon" },
  { key: "analytics", label: "Analytics", href: "/admin/analytics", icon: AnalyticsIcon, status: "soon" },
  { key: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: SubscriptionsIcon, status: "soon" },
];

export const ADMIN_NAV_SETTINGS: AdminNavItem[] = [
  { key: "settings", label: "Settings", href: "/admin/settings", icon: SettingsIcon, status: "active" },
];
