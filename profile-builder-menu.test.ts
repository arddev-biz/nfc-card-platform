import { describe, expect, it } from "vitest";
import type { MenuWithContent } from "@/components/admin/MenuManager";
import { builderMenuDraftSchema, menuToBuilderDraft } from "@/lib/profile-builder-menu";
import { builderDraftSchema } from "@/lib/profile-builder-draft";

describe("builder menu draft", () => {
  it("keeps existing category and item IDs while sorting by public order", () => {
    const menu = {
      id: "menu-1", name: "Dinner", description: null, isActive: true,
      categories: [
        { id: "cat-2", name: "Desserts", description: null, isActive: true, sortOrder: 2, items: [] },
        { id: "cat-1", name: "Mains", description: null, isActive: true, sortOrder: 1, items: [
          { id: "item-2", name: "Soup", description: null, priceMinor: 600, currency: "ALL", isActive: true, sortOrder: 2 },
          { id: "item-1", name: "Pasta", description: null, priceMinor: 450, currency: "EUR", isActive: true, sortOrder: 1 },
        ] },
      ],
    } as MenuWithContent;
    const draft = menuToBuilderDraft(menu);
    expect(builderMenuDraftSchema.parse(draft)).toEqual(draft);
    expect(draft?.categories.map(category => category.id)).toEqual(["cat-1", "cat-2"]);
    expect(draft?.categories[0].items.map(item => item.id)).toEqual(["item-1", "item-2"]);
  });

  it("does not create a menu for a profile without one", () => {
    expect(menuToBuilderDraft(null)).toBeNull();
    expect(builderMenuDraftSchema.parse(null)).toBeNull();
  });

  it("rejects invalid prices before any save", () => {
    expect(builderMenuDraftSchema.safeParse({
      id: "new-menu", name: "Menu", description: "", isActive: true,
      categories: [{ id: "new-category", name: "Food", description: "", isActive: true, items: [
        { id: "new-item", name: "Lunch", description: "", priceMinor: -1, currency: "ALL", isActive: true },
      ] }],
    }).success).toBe(false);
  });

  it("allows an unchanged legacy link value through snapshot parsing", () => {
    const link={id:"existing-link",type:"CUSTOM",label:"Old link",value:"",isActive:false,
      presentation:{width:"FULL",iconMode:"DEFAULT",customIconAssetId:null,socialSectionId:null,socialNetwork:null,v2IsVisible:false}};
    expect(builderDraftSchema.shape.links.element.safeParse(link).success).toBe(true);
  });
});
