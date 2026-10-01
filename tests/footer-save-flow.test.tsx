import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {afterEach,expect,it,vi} from "vitest";
import {ProfileBuilderShell} from "@/components/admin/ProfileBuilderShell";
import {ProfileRenderer} from "@/components/profile/ProfileRenderer";
import {ToastProvider} from "@/components/ui/Toast";
import {profileDesign} from "@/lib/profile-design";
import {FooterEditor} from "@/components/admin/profile-builder/GlobalDesignControls";
import type {V2Data} from "@/lib/profile-v2";

vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/components/profile/ProfileRenderer",()=>({ProfileRenderer:()=>null}));
vi.mock("@/components/admin/profile-builder/SortableList",()=>({SortableList:()=>null}));

const design=profileDesign.parse({footer:{hidden:false,text:"Existing brand"}});
const v2:V2Data={version:2,revision:0,theme:"CLASSIC",design,links:[],sections:[]};
const business={name:"Test",businessType:null,v2,profile:{displayName:"Test",bio:null,phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT" as const,links:[]}};
let tree:TestRenderer.ReactTestRenderer;
afterEach(()=>{if(tree)act(()=>tree.unmount());});

it("keeps saved footer data in the shared renderer without exposing platform policy in the builder",()=>{
  act(()=>{tree=TestRenderer.create(<ToastProvider><ProfileBuilderShell organizationId="test" businessSlug="test" business={business} initialBlocks={[]} menuAvailable={false} isMenuEnabled={false} menu={null}/></ToastProvider>);});
  expect(tree.root.findByType(ProfileRenderer).props.business.v2.design.footer).toEqual(design.footer);
  expect(tree.root.findAllByProps({"data-structure-anchor":"FOOTER"})).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).not.toContain("Super Admin can configure branding");
});

it("offers Footer as a fixed destination, edits it centrally and keeps Admin policy outside structure",()=>{
  act(()=>{tree=TestRenderer.create(<ToastProvider><ProfileBuilderShell organizationId="test" businessSlug="test" business={business} initialBlocks={[]} menuAvailable={false} isMenuEnabled={false} menu={null} adminPanel={<p>Administrative policy</p>}/></ToastProvider>);});
  const structure=tree.root.findByProps({"aria-label":"Profile structure"});
  const footer=structure.findByProps({className:"builder-v3-section-row builder-v3-footer-row"});
  expect(footer.findByProps({"aria-label":"Fixed at bottom"})).toBeDefined();
  expect(structure.findAllByType(FooterEditor)).toHaveLength(0);
  expect(structure.findAllByType("p").some(node=>node.children.includes("Administrative policy"))).toBe(false);
  act(()=>footer.props.onClick());
  const editor=tree.root.findByProps({"aria-label":"Profile editor"}).findByType(FooterEditor);
  expect(editor.props.showPolicy).toBe(false);expect(editor.props.tab).toBe("content");
  act(()=>editor.props.onChange({...design,footer:{...design.footer!,text:"Draft footer"}}));
  expect(tree.root.findByType(ProfileRenderer).props.business.v2.design.footer.text).toBe("Draft footer");
});
