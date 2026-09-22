import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "mt-1 block w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input,var(--admin-card))] px-3 py-2 text-sm text-[var(--admin-text)] shadow-sm placeholder:text-[var(--admin-text-secondary)] focus:border-[var(--admin-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
