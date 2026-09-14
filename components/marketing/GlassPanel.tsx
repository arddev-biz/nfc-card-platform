import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * The one reusable "glass" surface for the marketing site — translucent
 * background, backdrop blur, subtle border/highlight. Used deliberately
 * sparingly (nav, hero card, feature cards, pricing card) rather than on
 * every element, per the brand direction.
 */
export function GlassPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        className
      )}
      {...props}
    />
  );
}
