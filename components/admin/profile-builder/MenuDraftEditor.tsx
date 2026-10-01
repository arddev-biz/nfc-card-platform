"use client";

import type { BuilderMenuDraft } from "@/lib/profile-builder-menu";
import { fromMinorUnits, toMinorUnits } from "@/lib/currency";
import { SortableList } from "./SortableList";
import {FiPlus,FiTrash2} from "./BuilderIcons";

type Menu = NonNullable<BuilderMenuDraft>;
type Category = Menu["categories"][number];
type Item = Category["items"][number];
const newId=()=>`new-${globalThis.crypto?.randomUUID?.()??Math.random().toString(36).slice(2)}`;
const fieldClass="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-accent)]";

export function MenuDraftEditor({menu,onChange}:{menu:BuilderMenuDraft;onChange:(menu:BuilderMenuDraft)=>void}){
  if(!menu)return <div className="space-y-4"><p className="builder-v3-note">Add your first menu, then create categories and items.</p><button type="button" className="builder-v3-add-link" onClick={()=>onChange({id:newId(),name:"Menu",description:"",isActive:true,categories:[]})}><FiPlus size={16} aria-hidden="true"/> Create Menu</button></div>;
  const updateCategory=(id:string,change:(c:Category)=>Category)=>onChange({...menu,categories:menu.categories.map(c=>c.id===id?change(c):c)});
  const updateItem=(categoryId:string,itemId:string,change:(item:Item)=>Item)=>updateCategory(categoryId,c=>({...c,items:c.items.map(i=>i.id===itemId?change(i):i)}));
  return <div className="space-y-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={menu.isActive} onChange={event=>onChange({...menu,isActive:event.target.checked})}/>Menu available publicly</label><p className="builder-v3-note">The sidebar switch shows the Menu button on your profile. This setting activates the public menu itself.</p>
    <label className="block space-y-1.5 text-sm font-medium">Menu name<input className={fieldClass} value={menu.name} onChange={e=>onChange({...menu,name:e.target.value})}/></label>
    <label className="block space-y-1.5 text-sm font-medium">Description<textarea className={fieldClass} rows={2} value={menu.description} onChange={e=>onChange({...menu,description:e.target.value})}/></label>
    <div className="flex items-center justify-between"><h3 className="text-base font-semibold">Categories</h3><button type="button" className="builder-v3-add-link" onClick={()=>onChange({...menu,categories:[...menu.categories,{id:newId(),name:"New category",description:"",isActive:true,items:[]}]})}><FiPlus size={16} aria-hidden="true"/> Add Category</button></div>
    {!menu.categories.length&&<p className="builder-v3-note">No categories yet.</p>}
    <SortableList chromeIcons fallbackControls={false} items={menu.categories} label={category=>category.name} onOrder={categories=>onChange({...menu,categories})}>{category=><details className="builder-v3-card" open={category.id.startsWith("new-")||undefined}><summary className="cursor-pointer font-semibold">{category.name} <span className="builder-v3-note">({category.items.length} {category.items.length===1?"item":"items"})</span></summary><div className="space-y-4 pt-4">
      <div className="flex items-center gap-2"><label className="ml-auto text-sm"><input type="checkbox" checked={category.isActive} onChange={e=>updateCategory(category.id,c=>({...c,isActive:e.target.checked}))}/> Show category</label></div>
      <label className="block space-y-1.5 text-sm">Category name<input className={fieldClass} value={category.name} onChange={e=>updateCategory(category.id,c=>({...c,name:e.target.value}))}/></label>
      <label className="block space-y-1.5 text-sm">Description<textarea className={fieldClass} rows={2} value={category.description} onChange={e=>updateCategory(category.id,c=>({...c,description:e.target.value}))}/></label>
      <div className="flex items-center justify-between"><strong>Items</strong><button type="button" className="builder-v3-add-link" onClick={()=>updateCategory(category.id,c=>({...c,items:[...c.items,{id:newId(),name:"New item",description:"",priceMinor:0,currency:"ALL",isActive:true}]}))}><FiPlus size={16} aria-hidden="true"/> Add Item</button></div>
      <SortableList chromeIcons fallbackControls={false} items={category.items} label={item=>item.name} onOrder={items=>updateCategory(category.id,c=>({...c,items}))}>{item=><div className="rounded-lg border border-[var(--admin-border)] p-3 space-y-3"><div className="flex items-center gap-2"><strong className="text-sm">{item.name}</strong><label className="ml-auto text-sm"><input type="checkbox" checked={item.isActive} onChange={e=>updateItem(category.id,item.id,i=>({...i,isActive:e.target.checked}))}/> Show</label></div>
        <label className="block space-y-1 text-sm">Item name<input className={fieldClass} value={item.name} onChange={e=>updateItem(category.id,item.id,i=>({...i,name:e.target.value}))}/></label>
        <label className="block space-y-1 text-sm">Description<textarea className={fieldClass} rows={2} value={item.description} onChange={e=>updateItem(category.id,item.id,i=>({...i,description:e.target.value}))}/></label>
        <div className="grid grid-cols-[1fr_auto] gap-2"><label className="block space-y-1 text-sm">Price<input className={fieldClass} type="number" min="0" step={item.currency==="EUR"?"0.01":"1"} value={fromMinorUnits(item.priceMinor,item.currency)} onChange={e=>updateItem(category.id,item.id,i=>({...i,priceMinor:toMinorUnits(Number(e.target.value),i.currency)}))}/></label><label className="block space-y-1 text-sm">Currency<select className={fieldClass} value={item.currency} onChange={e=>updateItem(category.id,item.id,i=>{const amount=fromMinorUnits(i.priceMinor,i.currency),currency=e.target.value as Item["currency"];return {...i,currency,priceMinor:toMinorUnits(amount,currency)}})}><option value="ALL">ALL</option><option value="EUR">EUR</option></select></label></div>
        <button type="button" className="builder-v3-delete" onClick={()=>{if(window.confirm(`Remove “${item.name}”? It will be deleted when you save.`))updateCategory(category.id,c=>({...c,items:c.items.filter(i=>i.id!==item.id)}))}}><FiTrash2 size={16} aria-hidden="true"/>Remove item</button>
      </div>}</SortableList>
      <button type="button" className="builder-v3-delete" onClick={()=>{if(window.confirm(`Remove “${category.name}” and its items? They will be deleted when you save.`))onChange({...menu,categories:menu.categories.filter(c=>c.id!==category.id)})}}><FiTrash2 size={16} aria-hidden="true"/>Remove category</button>
    </div></details>}</SortableList>
  </div>;
}
