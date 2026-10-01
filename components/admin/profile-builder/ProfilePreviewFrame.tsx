"use client";
import type {ReactNode} from "react";

/** Resize one renderer instance; never mount alternate mobile/desktop copies. */
export function ProfilePreviewFrame({children}:{children:ReactNode}) {
  return <div className="builder-phone"><div className="builder-phone-viewport">{children}</div></div>;
}
