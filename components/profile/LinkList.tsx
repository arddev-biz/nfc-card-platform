import type { LinkType } from "@prisma/client";
import { LinkIcon } from "./LinkIcon";
import { ChevronRight } from "./icons";
import type { ProfileTheme } from "./theme";

export interface ProfileLinkItem {
  id: string;
  type: LinkType;
  label: string;
  href: string;
  external: boolean;
}

interface LinkListProps {
  links: ProfileLinkItem[];
  theme: ProfileTheme;
}

export function LinkList({ links, theme }: LinkListProps) {
  if (links.length === 0) return null;

  return (
    <nav aria-label="Business links">
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 ${theme.panel} ${theme.press}`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1"
                style={{
                  backgroundColor: theme.accentTint,
                  color: theme.accent,
                  borderColor: theme.accentRing,
                }}
              >
                <LinkIcon type={link.type} className="h-4 w-4" />
              </span>
              <span className={`min-w-0 flex-1 truncate font-body text-sm font-semibold ${theme.text}`}>
                {link.label}
              </span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${theme.muted}`} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
