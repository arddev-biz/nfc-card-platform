import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--admin-accent)] text-[var(--admin-accent-text)] hover:brightness-95",
  secondary:
    "bg-[var(--admin-card)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:bg-[var(--admin-border)]",
  ghost:
    "bg-transparent text-[var(--admin-text)] hover:bg-[var(--admin-border)]",
};

/**
 * Minimal, dependency-light button. Kept intentionally simple for V1 —
 * no full design-system/variant library, just enough shared styling
 * to keep the admin and public UI consistent.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
