export function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-brand-offwhite/40 sm:flex-row">
        <span>© {new Date().getFullYear()} NFC Card Platform. All rights reserved.</span>
        <a href="/admin/login" className="hover:text-brand-offwhite/60">
          Admin
        </a>
      </div>
    </footer>
  );
}
