"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ProfileBlockKey } from "@prisma/client";
import type { ResolvedBlock } from "@/lib/blocks/registry";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface BlockStructureListProps {
  blocks: ResolvedBlock[];
  selectedKey: ProfileBlockKey | "HEADER" | null;
  busyKey: string | null;
  onSelect: (key: ProfileBlockKey) => void;
  onReorder: (next: ResolvedBlock[]) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggleVisible: (block: ResolvedBlock) => void;
}

function SortableRow({
  block,
  index,
  total,
  isSelected,
  isBusy,
  onSelect,
  onMove,
  onToggleVisible,
}: {
  block: ResolvedBlock;
  index: number;
  total: number;
  isSelected: boolean;
  isBusy: boolean;
  onSelect: (key: ProfileBlockKey) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggleVisible: (block: ResolvedBlock) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.key,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5",
        isSelected && "bg-[var(--admin-accent)]/10"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${block.label}`}
        className="cursor-grab touch-none rounded p-1 text-[var(--admin-text-secondary)] active:cursor-grabbing"
      >
        ⠿
      </button>

      <div className="flex flex-col">
        <button
          type="button"
          aria-label={`Move ${block.label} up`}
          disabled={index === 0 || isBusy}
          onClick={() => onMove(index, -1)}
          className="rounded border border-[var(--admin-border)] px-1 text-[10px] text-[var(--admin-text-secondary)] disabled:opacity-30"
        >
          &uarr;
        </button>
        <button
          type="button"
          aria-label={`Move ${block.label} down`}
          disabled={index === total - 1 || isBusy}
          onClick={() => onMove(index, 1)}
          className="mt-0.5 rounded border border-[var(--admin-border)] px-1 text-[10px] text-[var(--admin-text-secondary)] disabled:opacity-30"
        >
          &darr;
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSelect(block.key)}
        className="min-w-0 flex-1 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--admin-text)]">{block.label}</span>
          {!block.isAvailable && <Badge tone="gray">No content yet</Badge>}
        </span>
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={block.isVisible}
        aria-label={`${block.isVisible ? "Hide" : "Show"} ${block.label}`}
        disabled={isBusy}
        onClick={() => onToggleVisible(block)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
          block.isVisible ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-border)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            block.isVisible ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </li>
  );
}

export function BlockStructureList({
  blocks,
  selectedKey,
  busyKey,
  onSelect,
  onReorder,
  onMove,
  onToggleVisible,
}: BlockStructureListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.key === active.id);
    const newIndex = blocks.findIndex((b) => b.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, position: i })));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.key)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-[var(--admin-border)] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          {blocks.map((block, index) => (
            <SortableRow
              key={block.key}
              block={block}
              index={index}
              total={blocks.length}
              isSelected={selectedKey === block.key}
              isBusy={busyKey === block.key}
              onSelect={onSelect}
              onMove={onMove}
              onToggleVisible={onToggleVisible}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
