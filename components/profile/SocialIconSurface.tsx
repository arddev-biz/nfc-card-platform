import type {CSSProperties,ReactNode} from "react";
import {socialConfig} from "@/lib/profile-v2";
export function SocialIconSurface({config,children}:{config:unknown;children:ReactNode}) {
  const parsed=socialConfig.safeParse(config),c=parsed.success?parsed.data:socialConfig.parse({});
  return <span className="social-icon-surface" data-style={c.containerStyle} data-shape={c.shape} data-border={c.border||c.containerStyle==="OUTLINE"} style={{"--social-surface":c.containerColor??"var(--v2-surface)","--social-border":c.borderColor??"var(--v2-border)"} as CSSProperties}>{children}</span>;
}
