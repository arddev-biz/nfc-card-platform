import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/session";
import { Container } from "@/components/ui/Container";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminThemeProvider, AdminThemeScript } from "@/components/admin/ThemeProvider";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

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
        <header className="border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
          <Container className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-[var(--admin-text)]">
                NFC Card Platform — Admin
              </span>
              <Link
                href="/admin/businesses"
                className="text-sm text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
              >
                Businesses
              </Link>
              <Link
                href="/admin/leads"
                className="text-sm text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
              >
                Leads
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-[var(--admin-text-secondary)]">{user.email}</span>
              <LogoutButton />
            </div>
          </Container>
        </header>
        <Container className="py-8">{children}</Container>
      </AdminThemeProvider>
    </>
  );
}
