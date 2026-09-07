import type { LinkType } from "@prisma/client";
import { LinkIcon } from "./LinkIcon";
import type { ProfileTheme } from "./theme";

export interface PrimaryAction {
  key: string;
  type: LinkType;
  label: string;
  href: string;
  external: boolean;
}

interface PrimaryActionsProps {
  actions: PrimaryAction[];
  theme: ProfileTheme;
}

/**
 * The signature element of the profile: a floating frosted-glass bar of
 * solid accent-colored action buttons (Call, WhatsApp, Directions,
 * Reviews). Everything else on the page stays quiet so this reads first.
 */
export function PrimaryActions({ actions, theme }: PrimaryActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className={`rounded-[1.75rem] p-2 ${theme.panelStrong}`}>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
      >
        {actions.map((action) => (
          <a
            key={action.key}
            href={action.href}
            {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`flex flex-col items-center gap-2 rounded-[1.4rem] px-2 py-3.5 text-center ${theme.press}`}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: theme.accent,
                color: theme.onAccent,
                boxShadow: `0 10px 24px -10px ${theme.accent}`,
              }}
            >
              <LinkIcon type={action.type} className="h-5 w-5" />
            </span>
            <span className={`font-body text-[11px] font-semibold leading-none ${theme.text}`}>
              {action.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
