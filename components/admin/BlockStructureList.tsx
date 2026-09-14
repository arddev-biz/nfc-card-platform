"use client";

import type { ResolvedBlock } from "@/lib/blocks/registry";
import { Badge } from "@/components/ui/Badge";

interface BlockStructureListProps {
  blocks: ResolvedBlock[];
  busyKey: string | null;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggleVisible: (block: ResolvedBlock) => void;
}

export function BlockStructureList({ blocks, busyKey, onMove, onToggleVisible }: BlockStructureListProps) {
  return (
    <ul className="divide-y divide-[var(--admin-border)] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
      {blocks.map((block, index) => {
        const isBusy = busyKey === block.key;
        return (
          <li key={block.key} className="flex items-center gap-3 px-4 py-3">
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={`Move ${block.label} up`}
                disabled={index === 0 || isBusy}
                onClick={() => onMove(index, -1)}
                className="rounded border border-[var(--admin-border)] px-1.5 text-xs text-[var(--admin-text-secondary)] disabled:opacity-30"
              >
                &uarr;
              </button>
              <button
                type="button"
                aria-label={`Move ${block.label} down`}
                disabled={index === blocks.length - 1 || isBusy}
                onClick={() => onMove(index, 1)}
                className="mt-1 rounded border border-[var(--admin-border)] px-1.5 text-xs text-[var(--admin-text-secondary)] disabled:opacity-30"
              >
                &darr;
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-[var(--admin-text)]">{block.label}</p>
                {!block.isAvailable && (
                  <Badge tone="gray">No content yet</Badge>
                )}
              </div>
              <p className="truncate text-xs text-[var(--admin-text-secondary)]">{block.description}</p>
            </div>

            <label className="flex shrink-0 items-center gap-2 text-xs text-[var(--admin-text-secondary)]">
              <span className="hidden sm:inline">{block.isVisible ? "Visible" : "Hidden"}</span>
              <button
                type="button"
                role="switch"
                aria-checked={block.isVisible}
                aria-label={`${block.isVisible ? "Hide" : "Show"} ${block.label}`}
                disabled={isBusy}
                onClick={() => onToggleVisible(block)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  block.isVisible ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-border)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    block.isVisible ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
