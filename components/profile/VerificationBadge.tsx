export function VerificationBadge({ color = "#2563EB", tooltip }: { color?: string; tooltip?:string|null }) {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#2563EB";
  const channels = [1,3,5].map(start => parseInt(safeColor.slice(start,start+2),16)/255)
    .map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  const luminance = channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  const text=tooltip?.trim()&&!/[<>]/.test(tooltip)&&tooltip.length<=200?tooltip:"Verified profile";
  return <span className="verification-badge group relative inline-flex align-middle" tabIndex={0} aria-label={text}><span role="tooltip" className="verification-tooltip">{text}</span><svg role="img" aria-label={text} viewBox="0 0 24 24" className="inline-block h-6 w-6 shrink-0 align-middle" style={{ color: safeColor }}>
    <title>{text}</title><circle cx="12" cy="12" r="10" fill="currentColor" stroke={luminance > .179 ? "#172033" : "#fff"} strokeOpacity=".35" />
    <path d="m7.5 12 3 3 6-6" fill="none" stroke={luminance > .179 ? "#172033" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg></span>;
}
