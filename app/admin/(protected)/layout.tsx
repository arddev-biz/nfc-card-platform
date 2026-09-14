import { requireAdminSession } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminThemeProvider, AdminThemeScript } from "@/components/admin/ThemeProvider";

/**
 * Wraps every protected admin route (everything under /admin except
 * /admin/login, which lives outside this route group). This is the
 * authoritative, server-side enforcement point: requireAdminSession()
 * performs a real database lookup on every request and redirects to
 * /admin/login if there is no valid SUPER_ADMIN session — independent
 * of the optimistic cookie-presence check in middleware.ts.
 *
 * AdminThemeProvider scopes light/soft-dark theming to this subtree via
 * a wrapper div (not <html>/<body>), so it can never affect the public
 * marketing site or public business profiles — see globals.css.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminSession();

  return (
    <>
      <AdminThemeScript />
      <AdminThemeProvider>
        <AdminShell email={user.email}>{children}</AdminShell>
      </AdminThemeProvider>
    </>
  );
}
