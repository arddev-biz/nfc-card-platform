"use client";
import {useId,type ReactNode} from "react";
import {SortableList,type RowOrderControls} from "./SortableList";
import {Switch} from "@/components/ui/Switch";
export function CollectionItem({label,expanded,onExpand,checked,onToggle,disabled,actions,children}:{label:string;expanded:boolean;onExpand:()=>void;checked?:boolean;onToggle?:(value:boolean)=>void;disabled?:boolean;actions?:ReactNode;children:ReactNode}) {
  const id=useId();
  return <div className="collection-item">
    <div className="builder-row">
      <button type="button" className="min-w-0 flex-1 py-3 text-left font-medium" aria-expanded={expanded} aria-controls={id} onClick={onExpand}>{label}</button>
      {onToggle&&<Switch label={`Active ${label}`} checked={!!checked} onChange={onToggle} disabled={disabled}/>}
      {actions}
    </div>
    <div id={id} hidden={!expanded} className="space-y-3 border-t border-[var(--admin-border)] pt-4">{children}</div>
  </div>;
}
export function CollectionEditor<T extends {id:string}>({label,items,onOrder,children,disabled=false,fallbackControls=true}:{fallbackControls?:boolean;label:string;items:T[];onOrder:(items:T[])=>void;children:(item:T,controls:RowOrderControls)=>ReactNode;disabled?:boolean}) {
  return <section aria-label={label} data-collection-editor="true" className="space-y-3"><h3 className="text-lg font-semibold">{label}</h3><SortableList fallbackControls={fallbackControls} items={items} label={item=>item.id} onOrder={onOrder} disabled={disabled}>{children}</SortableList></section>;
}
