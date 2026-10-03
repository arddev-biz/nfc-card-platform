interface IconProps {
  className?: string;
}

const common = {
  "aria-hidden": true as const,
  focusable: "false" as const,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SidebarPanelIcon({ className = "h-5 w-5", expand = false }: IconProps & { expand?: boolean }) {
  return <svg {...common} className={className}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d={expand ? "M13 9l3 3-3 3" : "M16 9l-3 3 3 3"}/></svg>;
}
export function TrophyIcon({className="h-5 w-5"}:IconProps) {
  return <svg {...common} className={className}><path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6v3"/></svg>;
}
export function SunIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg {...common} className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>;
}
export function MoonIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg {...common} className={className}><path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13z"/></svg>;
}

export function OverviewIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function BusinessesIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4 20V5a1 1 0 0 1 1-1h6v16" />
      <path d="M13 20V9a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v11" />
      <path d="M7 7h1M7 10h1M7 13h1" />
    </svg>
  );
}

export function NfcIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M6 16a7 7 0 0 1 0-8" />
      <path d="M9.5 13.5a2.5 2.5 0 0 1 0-3" />
      <rect x="12" y="6" width="9" height="12" rx="1.5" />
    </svg>
  );
}

export function LeadsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

export function VerificationIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9.5 12l1.8 1.8L14.5 10" />
    </svg>
  );
}

export function AnalyticsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  );
}

export function SubscriptionsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function SettingsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function LogoutIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function MenuIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
