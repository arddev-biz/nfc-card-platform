import type { ReactNode } from "react";
import type { Demo } from "./content";
import styles from "./landing.module.css";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={styles.brand}><svg viewBox="0 0 40 44" width="32" height="36" fill="none" aria-hidden="true"><path d="m15 21 9-10a7 7 0 0 1 10 10l-4 4" stroke="#79f255" strokeWidth="7" strokeLinecap="round" /><path d="m25 23-9 10A7 7 0 0 1 6 23l4-4" stroke="#cbd5cd" strokeWidth="7" strokeLinecap="round" /></svg>{!compact && <span>AuraLink<span className={styles.brandDot}>.</span></span>}</span>;
}
const paths = {
  tap: <><path d="M8 14V8a2 2 0 0 1 4 0v4l2-1 5 3v5H9l-5-5 2-2 2 2Z" /><path d="M15 3a7 7 0 0 1 6 7M15 6a4 4 0 0 1 3 4" /></>,
  profile: <><rect x="4" y="3" width="16" height="18" rx="3" /><circle cx="12" cy="9" r="2" /><path d="M8 15h8M8 18h5" /></>,
  link: <><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-5-5l4-4a4 4 0 0 1 5 0M16 8l1-1a4 4 0 0 1 5 5l-4 4a4 4 0 0 1-5 0" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  growth: <><path d="m4 17 6-6 4 3 6-9M14 5h6v6" /><path d="M4 21h16" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  qr: <><path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6" /><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z" /></>,
};
export function Icon({ name }: { name: keyof typeof paths }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function Cta({ children, href = "/get-started", secondary = false }: { children: ReactNode; href?: string; secondary?: boolean }) {
  return <a className={styles.button + " " + (secondary ? styles.secondary : styles.primary)} href={href}>{children}{!secondary && <Icon name="arrow" />}</a>;
}
export function PhonePreview({ demo }: { demo: Demo }) {
  return <div className={styles.phone} data-theme={demo.theme} role="img" aria-label={demo.category + " demo profile: " + demo.name + ", with " + demo.actions.join(", ") + "."}>
    <div aria-hidden="true" className={styles.phoneScreen}>
      <div className={styles.phoneStatus}><span>9:41</span><span className={styles.island} /><span>••• ▰</span></div>
      <div className={styles.demoCover}><span>{demo.category}</span><div className={styles.coverArch} /><div className={styles.coverOrb} /></div>
      <div className={styles.demoContent}><div className={styles.avatar}>{demo.monogram}</div><strong className={styles.demoName}>{demo.name}</strong><p>{demo.tagline}</p>
        <div className={styles.socialDots}><span>◎</span><span>f</span><span>♪</span><span>✳</span></div>
        <div className={styles.demoActions}>{demo.actions.map((action, i) => <div key={action}><span>{["↗", "◷", "☆", "⌖"][i]}</span>{action}<span>›</span></div>)}</div>
        <span className={styles.demoFooter}>Connected with AuraLink</span>
      </div>
    </div>
  </div>;
}
export function NfcCard() {
  return <div className={styles.nfcCard} role="img" aria-label="Matte black AuraLink NFC business card"><div className={styles.cardTop}><span>YOUR NEXT CONNECTION</span><Icon name="tap" /></div><div className={styles.cardBrand}><Brand /><span>TAP. CONNECT. GROW.</span></div><div className={styles.cardBottom}><span>NFC ENABLED</span><Icon name="qr" /></div></div>;
}
