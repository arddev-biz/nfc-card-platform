"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/admin/icons";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--admin-text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <LogoutIcon className="h-5 w-5" />
      {isLoggingOut ? "Logging out…" : "Log out"}
    </button>
  );
}
