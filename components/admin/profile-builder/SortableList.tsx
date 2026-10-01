"use client";
import { useId, type ReactNode } from "react";
import {FiMove} from "./BuilderIcons";
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
export type RowOrderControls={move:(delta:number)=>void;first:boolean;last:boolean};
function Row({ chromeIcons, fallbackControls, id, label, index, count, disabled, move, selected, children }: { chromeIcons:boolean; fallbackControls:boolean; selected?:boolean; id: string; label: string; index: number; count: number; disabled: boolean; move: (a: number,b: number) => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} data-selected={selected||undefined} className="builder-sortable-row flex min-w-0 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-2">
    <div className="flex shrink-0 items-start gap-1">
      <button type="button" {...attributes} {...listeners} disabled={disabled} aria-label={`Drag ${label}`} className="touch-none cursor-grab rounded p-1 min-h-8 w-7">{chromeIcons?<FiMove size={16} aria-hidden="true"/>:"⠿"}</button>
      {fallbackControls&&<details data-overflow-menu className="relative"><summary aria-label={`Reorder ${label}`} className="cursor-pointer list-none py-2 text-xs">⋯</summary><div className="absolute left-0 z-30 flex rounded border border-[var(--admin-border)] bg-[var(--admin-card)] p-1 shadow">
      <button type="button" disabled={disabled || index === 0} className="min-h-8 w-8 rounded hover:bg-[var(--admin-border)]" aria-label={`Move ${label} up`} onClick={() => move(index,index-1)}>↑</button>
      <button type="button" disabled={disabled || index === count-1} className="min-h-8 w-8 rounded hover:bg-[var(--admin-border)]" aria-label={`Move ${label} down`} onClick={() => move(index,index+1)}>↓</button></div></details>}
    </div>
    <div className="min-w-0 flex-1">{children}</div>
  </li>;
}
export function SortableList<T extends { id: string }>({ items, onOrder, label, children, selectedId, fallbackControls=true, chromeIcons=false, disabled = false }: {
  chromeIcons?:boolean; fallbackControls?:boolean; selectedId?:string|null; items: T[]; onOrder: (items: T[]) => void; label: (item: T) => string; children: (item: T,controls:RowOrderControls) => ReactNode; disabled?: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const dndId=useId();
  const describe=(id:string|number)=>{const item=items.find(item=>item.id===id);return item?label(item):"Item";};
  const position=(id:string|number)=>items.findIndex(item=>item.id===id)+1;
  function move(a: number,b: number) { if (!disabled && a >= 0 && b >= 0 && b < items.length) onOrder(arrayMove(items,a,b)); }
  return <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} accessibility={{announcements:{onDragStart:({active})=>`Picked up ${describe(active.id)}, position ${position(active.id)} of ${items.length}.`,onDragOver:({active,over})=>over?`${describe(active.id)}, position ${position(over.id)} of ${items.length}.`:undefined,onDragEnd:({active,over})=>over?`Placed ${describe(active.id)} at position ${position(over.id)} of ${items.length}.`:`Reordering ${describe(active.id)} cancelled.`,onDragCancel:({active})=>`Reordering ${describe(active.id)} cancelled.`}}} onDragEnd={({ active, over }) => { if (over) move(items.findIndex(i => i.id === active.id), items.findIndex(i => i.id === over.id)); }}>
    <SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}>
      <ul className="space-y-3">{items.map((item,index) => <Row chromeIcons={chromeIcons} fallbackControls={fallbackControls} key={item.id} selected={selectedId===item.id} id={item.id} label={label(item)} index={index} count={items.length} disabled={disabled} move={move}>{children(item,{move:delta=>move(index,index+delta),first:index===0,last:index===items.length-1})}</Row>)}</ul>
    </SortableContext>
  </DndContext>;
}
