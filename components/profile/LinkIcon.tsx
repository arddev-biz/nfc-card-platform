import { LinkType } from "@prisma/client";

interface LinkIconProps {
  type: LinkType;
  className?: string;
}

/**
 * Small generic glyphs (not brand logos) for each link type, kept as
 * plain inline SVG so the public profile needs no new icon-library
 * dependency. Adding a future link type only means adding one case
 * here — the rest of the app never needs to know about icon shapes.
 */
export function LinkIcon({ type, className = "h-5 w-5" }: LinkIconProps) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "INSTAGRAM":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "FACEBOOK":
      return (
        <svg {...common}>
          <path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9z" />
        </svg>
      );
    case "TIKTOK":
      return (
        <svg {...common}>
          <path d="M14 4v9.5a3 3 0 1 1-2-2.83" />
          <path d="M14 4c.5 2 2 3.5 4 4" />
        </svg>
      );
    case "WHATSAPP":
      return (
        <svg {...common}>
          <path d="M6 18l1-3.2A7 7 0 1 1 10 17l-4 1z" />
          <path d="M9.5 10.5c.3 1.6 1.4 2.7 3 3" />
        </svg>
      );
    case "PHONE":
      return (
        <svg {...common}>
          <path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 1-2z" />
        </svg>
      );
    case "EMAIL":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 6.5l9 6.5 9-6.5" />
        </svg>
      );
    case "GOOGLE_MAPS":
      return (
        <svg {...common}>
          <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.3" />
        </svg>
      );
    case "GOOGLE_REVIEWS":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2.5l2.9 6 6.6.6-5 4.4 1.5 6.5L12 16.8 6 20l1.5-6.5-5-4.4 6.6-.6z" />
        </svg>
      );
    case "BOOKING":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 9h16M8 3v4M16 3v4" />
        </svg>
      );
    case "WEBSITE":
    case "CUSTOM":
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
        </svg>
      );
  }
}
