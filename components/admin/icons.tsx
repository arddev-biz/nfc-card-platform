interface IconProps {
  className?: string;
}

const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

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
      <path d="M4 21V7a1 1 0 0 1 1-1h6v15" />
      <path d="M13 21V11a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v10" />
      <path d="M7 9h1M7 12h1M7 15h1" />
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
      <path d="M4 5h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z" />
      <path d="M4 6l8 6 8-6" />
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
      <path d="M4 20V10M11 20V4M18 20v-7" />
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
