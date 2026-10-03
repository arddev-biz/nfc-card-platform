"use client";

import { PLATFORM_NAME } from "@/lib/platform";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnseenLeadCount } from "@/components/admin/LeadNotifications";
import { SidebarNav } from "@/components/admin/Sidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import { MenuIcon, CloseIcon, SidebarPanelIcon } from "@/components/admin/icons";

function Brand() {
  return (
    <Link href="/admin" aria-label={PLATFORM_NAME} title={PLATFORM_NAME} className="flex items-center gap-2 px-4 py-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--admin-accent)] text-xs font-bold text-[var(--admin-accent-text)]">
        N
      </span>
      <span className="text-sm font-semibold text-[var(--admin-text)]">{PLATFORM_NAME}</span>
    </Link>
  );
}

function AccountArea({ email }: { email: string }) {
  return (
    <div className="admin-account-area border-t border-[var(--admin-border)] p-3">
      <Link
        href="/admin/settings"
        className="block truncate rounded-lg px-3 py-2 text-xs text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)] hover:text-[var(--admin-text)]"
      >
        <span className="admin-account-avatar" aria-hidden="true">SA</span><span className="admin-account-copy"><strong>Super Admin</strong><span>{email}</span></span>
      </Link>
      <div className="mt-1">
        <LogoutButton />
      </div>
    </div>
  );
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const unseenLeadCount=useUnseenLeadCount();
  const shellRef=useRef<HTMLDivElement>(null);
  const pathname=usePathname();
  const revealRef=useRef<HTMLButtonElement>(null);
  const sidebarRef=useRef<HTMLElement>(null);
  const [ready,setReady]=useState(false);
  const [preferred,setPreferred]=useState<"expanded"|"collapsed">("expanded");
  const [builder,setBuilder]=useState(false),[available,setAvailable]=useState(0),[revealed,setRevealed]=useState(false);
  useEffect(()=>{try{const saved=localStorage.getItem("admin-sidebar-preference");if(saved==="expanded"||saved==="collapsed")setPreferred(saved);else if(saved==="hidden"){setPreferred("collapsed");localStorage.setItem("admin-sidebar-preference","collapsed")}}catch{}setReady(true)},[]);
  useEffect(()=>{
    const shell=shellRef.current;if(!shell)return;
    const measure=()=>setAvailable(shell.clientWidth+(window.innerWidth-document.documentElement.clientWidth));
    const resize=new ResizeObserver(measure);resize.observe(shell);measure();
    return()=>resize.disconnect();
  },[]);
  useEffect(()=>{
    setRevealed(false);
    const shell=shellRef.current;if(!shell)return;
    // Legacy business editors share the route: observe only until V3 mounts.
    let mutation:MutationObserver|undefined;
    const detect=()=>{const found=!!shell.querySelector(".builder-v3");setBuilder(found);if(found)mutation?.disconnect()};
    if(/^\/admin\/businesses\/[^/]+$/.test(pathname)){mutation=new MutationObserver(detect);mutation.observe(shell,{childList:true,subtree:true});detect()}else setBuilder(false);
    return()=>mutation?.disconnect();
  },[pathname]);
  const capacity=builder?(available>=1600?"expanded":available>=1366?"collapsed":"hidden"):"expanded";
  const effective=capacity==="hidden"?"hidden":preferred==="collapsed"||capacity==="collapsed"?"collapsed":"expanded";
  const isRevealed=effective==="hidden"&&revealed;
  useEffect(()=>{if(effective!=="hidden")setRevealed(false);else if(!revealed&&sidebarRef.current?.contains(document.activeElement))revealRef.current?.focus()},[effective,revealed]);
  function dismiss(){setRevealed(false);revealRef.current?.focus()}
  function choose(mode:typeof preferred){setPreferred(mode);setRevealed(false);try{localStorage.setItem("admin-sidebar-preference",mode)}catch{}}

  return (
    <ToastProvider>
      <div ref={shellRef} data-sidebar-ready={ready&&available>0} data-sidebar-mode={effective} data-sidebar-revealed={isRevealed||undefined} onKeyDown={event=>{if(event.key==="Escape"&&!event.defaultPrevented&&isRevealed)dismiss()}} className="admin-shell flex min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
        <button ref={revealRef} type="button" className="admin-sidebar-reveal" aria-label={isRevealed?"Close admin navigation":"Show admin navigation"} aria-expanded={isRevealed} aria-controls="admin-desktop-sidebar" onClick={()=>isRevealed?dismiss():setRevealed(true)}><MenuIcon className="h-5 w-5"/></button>
        {/* Desktop sidebar — persistent, per PC-first requirement */}
        <aside ref={sidebarRef} id="admin-desktop-sidebar" aria-label="Super Admin navigation" className="admin-desktop-sidebar hidden w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)] lg:flex">
          <div className="admin-sidebar-controls"><button type="button" disabled={capacity!=="expanded"} title={capacity!=="expanded"?"Builder needs this space. Expand navigation at 1600px or wider.":effective==="expanded"?"Collapse navigation":"Expand navigation"} aria-label={capacity!=="expanded"?"Navigation constrained by Builder width":effective==="expanded"?"Collapse navigation":"Expand navigation"} onClick={()=>choose(effective==="expanded"?"collapsed":"expanded")}><SidebarPanelIcon expand={effective!=="expanded"}/></button></div>
          <Brand />
          <SidebarNav unseenLeadCount={unseenLeadCount} />
          <AccountArea email={email} />
        </aside>

        {/* Mobile drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)]">
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="mr-3 rounded-lg p-2 text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)]"
                  aria-label="Close menu"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav unseenLeadCount={unseenLeadCount} />
              <AccountArea email={email} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="admin-utility-bar flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-3 lg:px-8">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="rounded-lg p-2 text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)] lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="hidden lg:block" />
            <div className="admin-utility-actions"><Link className="admin-icon-button admin-utility-notifications" href="/admin/leads" aria-label={unseenLeadCount?`${unseenLeadCount} new leads`:'View leads'} title="View leads"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>{unseenLeadCount>0&&<span className="admin-notification-dot"/>}</Link><ThemeToggle iconOnly/><Link className="admin-toolbar-account" href="/admin/settings" aria-label="Super Admin account" title="Super Admin account"><span>SA</span><span aria-hidden="true">⌄</span></Link></div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div className="admin-content mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
