"use client";

import { useState } from "react";
import type { MenuWithContent } from "@/components/admin/MenuManager";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { MenuManager } from "@/components/admin/MenuManager";

interface MenuEditorProps {
  organizationId: string;
  isEnabled: boolean;
  menu: MenuWithContent | null;
}

export function MenuEditor({ organizationId, isEnabled, menu }: MenuEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--admin-text-secondary)]">
        This block controls whether your Digital Menu appears on your public profile and
        where. Manage categories and items without leaving the builder.
      </p>
      <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        Manage Menu
      </Button>

      <Drawer open={isOpen} title="Digital Menu" onClose={() => setIsOpen(false)}>
        <MenuManager organizationId={organizationId} isEnabled={isEnabled} menu={menu} />
      </Drawer>
    </div>
  );
}
