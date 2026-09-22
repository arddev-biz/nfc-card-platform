"use client";
import {createContext,useContext,useEffect,useId,useMemo,useRef,useState,type ReactNode} from "react";
import {Button} from "@/components/ui/Button";
type Entry={dirty:boolean;save:()=>Promise<boolean>};
const Context=createContext<{register:(id:string,entry:React.RefObject<Entry>)=>()=>void;changed:()=>void}|null>(null);
export function SaveCoordinator({children}:{children:ReactNode}) {
  const entries=useRef(new Map<string,React.RefObject<Entry>>());
  const [,render]=useState(0),[saving,setSaving]=useState(false),[error,setError]=useState("");
  const locked=useRef(false);
  const context=useMemo(()=>({register:(id:string,entry:React.RefObject<Entry>)=>{entries.current.set(id,entry);render(n=>n+1);return()=>{entries.current.delete(id);render(n=>n+1);};},changed:()=>render(n=>n+1)}),[]);
  const dirty=[...entries.current.values()].some(entry=>entry.current?.dirty);
  async function save(){
    if(locked.current)return;locked.current=true;setSaving(true);setError("");
    try {for(const entry of [...entries.current.values()])if(entry.current?.dirty&&!await entry.current.save())throw new Error("Some changes could not be saved. Unsaved drafts are retained; retry Save Changes.");}
    catch(e){setError(e instanceof Error?e.message:"Save failed. Drafts retained.");}
    finally{locked.current=false;setSaving(false);}
  }
  return <Context.Provider value={context}><div className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-bg)] p-3"><span role={error?"alert":"status"} className="text-sm">{error||(!dirty&&!saving?"Saved":"")}</span><Button type="button" disabled={!dirty||saving} onClick={save}>{saving?"Saving...":"Save Changes"}</Button></div><fieldset disabled={saving} className="min-w-0 border-0 p-0">{children}</fieldset></Context.Provider>;
}
export function useSaveCoordinator(){return useContext(Context);}
export function SaveDomain({dirty,onSave,children}:{dirty:boolean;onSave:()=>Promise<boolean>;children?:ReactNode}) {
  const context=useContext(Context),id=useId(),entry=useRef<Entry>({dirty,save:onSave});entry.current={dirty,save:onSave};
  useEffect(()=>context?.register(id,entry),[context,id]);
  useEffect(()=>context?.changed(),[context,dirty]);
  return context?null:<Button type="button" onClick={onSave}>{children??"Save"}</Button>;
}
