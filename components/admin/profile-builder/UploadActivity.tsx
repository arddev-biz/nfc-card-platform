"use client";
import {createContext,useCallback,useContext,useMemo,useState,type ReactNode} from "react";

const UploadActivityContext=createContext<{active:number;begin:()=>()=>void}>({active:0,begin:()=>()=>undefined});

export function UploadActivityProvider({children}:{children:ReactNode}){
  const [active,setActive]=useState(0);
  const begin=useCallback(()=>{setActive(value=>value+1);let ended=false;return()=>{if(!ended){ended=true;setActive(value=>Math.max(0,value-1));}}},[]);
  return <UploadActivityContext.Provider value={useMemo(()=>({active,begin}),[active,begin])}>{children}</UploadActivityContext.Provider>;
}

export const useUploadActivity=()=>useContext(UploadActivityContext);
