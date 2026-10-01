import { z } from "zod";
import type { MenuWithContent } from "@/components/admin/MenuManager";

const menuId = z.string().min(1).max(100);
const menuItemDraft = z.object({
  id: menuId,
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000),
  priceMinor: z.number().int().min(0).max(100000000),
  currency: z.enum(["ALL", "EUR"]),
  isActive: z.boolean(),
}).strict();
const menuCategoryDraft = z.object({
  id: menuId,
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000),
  isActive: z.boolean(),
  items: z.array(menuItemDraft).max(200),
}).strict();
export const builderMenuDraftSchema = z.object({
  id: menuId,
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  isActive: z.boolean(),
  categories: z.array(menuCategoryDraft).max(100),
}).strict().nullable();
export type BuilderMenuDraft = z.infer<typeof builderMenuDraftSchema>;

export function menuToBuilderDraft(menu: MenuWithContent | null): BuilderMenuDraft {
  if (!menu) return null;
  return {
    id: menu.id, name: menu.name, description: menu.description ?? "", isActive: menu.isActive,
    categories: [...menu.categories].sort((a,b)=>a.sortOrder-b.sortOrder).map(category=>({
      id: category.id, name: category.name, description: category.description ?? "", isActive: category.isActive,
      items: [...category.items].sort((a,b)=>a.sortOrder-b.sortOrder).map(item=>({
        id: item.id, name: item.name, description: item.description ?? "", priceMinor: item.priceMinor,
        currency: item.currency, isActive: item.isActive,
      })),
    })),
  };
}
