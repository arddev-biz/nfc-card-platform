import React from "react";
import {act,create} from "react-test-renderer";
import {it,expect,vi} from "vitest";
import {EssentialSectionAppearance} from "@/components/admin/profile-builder/EssentialAppearance";
import {VisualChoice} from "@/components/admin/profile-builder/VisualFields";
import {section,text} from "./helpers/builder-v3";
it("basic Social choices never expand customization after draft updates",()=>{
 const source={...section("SOCIALS"),kind:"SOCIALS" as const,singletonKey:"SOCIALS" as const,config:{composition:"ICONS",labels:false}};
 const changed=vi.fn();let tree!:ReturnType<typeof create>;
 const render=(value:typeof source)=><EssentialSectionAppearance section={value} global={{version:1}} onChange={changed}/>;
 act(()=>{tree=create(render(source))});
 for(const [label,value] of [["Presentation","CARDS"],["Alignment","LEFT"],["Icon gap","2"],["Space above","0"],["Social icon size","20"],["Social button size","60"]]){
 act(()=>tree.root.findAllByType(VisualChoice).find(n=>n.props.label===label)!.props.onChange(value));
 act(()=>tree.update(render(changed.mock.lastCall![0])));
 expect(tree.root.findAllByType("input").find(n=>n.props.type==="checkbox"&&text(n.parent!).includes("Customize this section"))!.props.checked).toBe(false);
 expect(text(tree.root)).not.toContain("Inner logo container");
 act(()=>tree.update(render(source)));
 }
 act(()=>tree.unmount());
});
