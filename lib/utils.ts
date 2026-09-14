import { clsx, type ClassValue } from "clsx";

/**
 * Combines conditional class names. Kept intentionally minimal for V1 —
 * no class-merging/conflict-resolution library, just clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
