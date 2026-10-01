"use client";
import { useRef, useState } from "react";
import { navigation } from "./content";
import { Brand, Cta } from "./Visuals";
import styles from "./landing.module.css";

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <header className={styles.navbar} onKeyDown={event => { if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); } }}>
    <nav className={styles.container + " " + styles.navInner} aria-label="Main navigation">
      <a href="#home" aria-label="AuraLink home"><Brand /></a>
      <div className={styles.desktopLinks}>{navigation.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</div>
      <div className={styles.navActions}><a className={styles.login} href="/admin/login">Login</a><Cta>Get Started</Cta><button ref={toggle} className={styles.menuToggle} type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="landing-mobile-navigation" onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button></div>
      <div id="landing-mobile-navigation" className={styles.mobileLinks} hidden={!open}>{navigation.map(item => <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}<a href="/admin/login">Login</a></div>
    </nav>
  </header>;
}
