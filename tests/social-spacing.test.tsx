import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {expect,it,vi} from "vitest";
import {EssentialSectionAppearance} from "@/components/admin/profile-builder/EssentialAppearance";
import {VisualChoice,ExactNumber} from "@/components/admin/profile-builder/VisualControls";
import {readVisual,layoutCSS} from "@/lib/profile-visual";
import type {V2Section} from "@/lib/profile-v2";
const social:V2Section={id:"social",kind:"SOCIALS",singletonKey:"SOCIALS",internalName:"Socials",visibleTitle:null,position:0,isVisible:true,items:[],config:{visual:{layout:{before:17,gap:24}}}};
it("Socials spacing changes only the chosen field",()=>{
 const change=vi.fn();let tree!:TestRenderer.ReactTestRenderer;
 act(()=>{tree=TestRenderer.create(<EssentialSectionAppearance section={social} global={{version:1}} onChange={change}/>)});
 const choice=(label:string)=>tree.root.findAllByType(VisualChoice).find(n=>n.props.label===label)!;
 expect(choice("Space above").props.value).toBe("CUSTOM");
 expect(tree.root.findByType(ExactNumber).props.value).toBe(17);
 act(()=>choice("Space above").props.onChange("0"));
 expect(change.mock.lastCall![0].config.visual.layout).toEqual({before:0,gap:24});
 act(()=>choice("Icon gap").props.onChange("8"));
 expect(change.mock.lastCall![0].config.visual.layout).toEqual({before:17,gap:8});
 act(()=>tree.root.findByType(ExactNumber).props.onChange(37));
 expect(change.mock.lastCall![0].config.visual.layout).toEqual({before:37,gap:24});
 act(()=>tree.unmount());
});
it("Custom selection preserves inherited spacing until edited",()=>{
 const change=vi.fn();let tree!:TestRenderer.ReactTestRenderer;
 act(()=>{tree=TestRenderer.create(<EssentialSectionAppearance section={{...social,config:{visual:{}}}} global={{version:1}} onChange={change}/>)});
 expect(change).not.toHaveBeenCalled();
 act(()=>tree.root.findAllByType(VisualChoice).find(n=>n.props.label==="Space above")!.props.onChange("CUSTOM"));
 expect(change).not.toHaveBeenCalled();
 act(()=>tree.unmount());
});
it("existing schema preserves zero separately from icon gap",()=>{
 const visual=readVisual({layout:{before:0,gap:24}});
 expect(visual.layout).toMatchObject({before:0,gap:24});
 expect(layoutCSS(visual.layout)).toMatchObject({marginTop:0,"--visual-gap":"24px"});
});
