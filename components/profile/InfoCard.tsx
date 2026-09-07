import { LinkIcon } from "./LinkIcon";
import { MapPin } from "./icons";
import type { ProfileTheme } from "./theme";

export interface InfoRow {
  key: string;
  kind: "address" | "phone" | "website";
  label: string;
  href?: string;
}

interface InfoCardProps {
  rows: InfoRow[];
  theme: ProfileTheme;
}

export function InfoCard({ rows, theme }: InfoCardProps) {
  if (rows.length === 0) return null;

  return (
    <div className={`rounded-2xl p-1.5 ${theme.panel}`}>
      <ul className={`divide-y ${theme.divider}`}>
        {rows.map((row) => {
          const content = (
            <span className="flex items-center gap-3.5 px-3 py-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.accentTint, color: theme.accent }}
              >
                {row.kind === "address" ? (
                  <MapPin className="h-4 w-4" />
                ) : (
                  <LinkIcon type={row.kind === "phone" ? "PHONE" : "WEBSITE"} className="h-4 w-4" />
                )}
              </span>
              <span className={`min-w-0 flex-1 font-body text-sm ${theme.subtext}`}>{row.label}</span>
            </span>
          );

          return (
            <li key={row.key}>
              {row.href ? (
                <a
                  href={row.href}
                  {...(row.kind === "website" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="block rounded-xl transition-opacity hover:opacity-70"
                >
                  {content}
                </a>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
