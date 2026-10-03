"use client";
import {createContext,useCallback,useContext,useMemo,useState,type ReactNode} from "react";
const Context=createContext({errors:[] as string[],report:(_id:string,_message:string|null)=>{}});
/** Tracks invalid visible inputs without putting invalid values into the profile draft. */
export function InputValidationProvider({children}:{children:ReactNode}){
 const [fields,setFields]=useState<Record<string,string>>({});
 const report=useCallback((id:string,message:string|null)=>setFields(previous=>{if(previous[id]===message||(!message&&!previous[id]))return previous;const next={...previous};if(message)next[id]=message;else delete next[id];return next}),[]);
 const value=useMemo(()=>({errors:Object.values(fields),report}),[fields,report]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useInputValidation=()=>useContext(Context);
