"use client";

import { useState } from "react";
import type { MenuWithContent } from "@/components/admin/MenuManager";
import { Button } from "@/components/ui/Button";
import { MenuManager } from "@/components/admin/MenuManager";

interface MenuEditorProps {
  organizationId: string;
  isEnabled: boolean;
  menu: MenuWithContent | null;
}

export function MenuEditor({ organizationId, isEnabled, menu }: MenuEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--admin-text-secondary)]">
        This block controls whether your Digital Menu appears on your public profile and
        where. Manage categories and items without leaving the builder.
      </p>
      <Button type="button" variant="secondary" aria-expanded={isOpen} onClick={() => { setHasOpened(true); setIsOpen(!isOpen); }}>
        Manage Menu
      </Button>

      <div hidden={!isOpen}>
        {hasOpened && <MenuManager organizationId={organizationId} isEnabled={isEnabled} menu={menu} />}
      </div>
    </div>
  );
}
