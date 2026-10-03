"use client";
import type {ReactNode} from "react";

/** Resize one renderer instance; never mount alternate mobile/desktop copies. */
export function ProfilePreviewFrame({children,width=390}:{children:ReactNode;width?:number}) {
  return <div className="builder-phone" style={{width:width+14,maxWidth:"none",flexShrink:0}}><div className="builder-phone-viewport">{children}</div></div>;
}
