import React from "react";
import {act,create} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it,vi,afterEach} from "vitest";
import {EssentialDesignEditor} from "@/components/admin/profile-builder/EssentialDesignEditor";
import {EssentialSectionAppearance} from "@/components/admin/profile-builder/EssentialAppearance";
import {PresetNumber} from "@/components/admin/profile-builder/PrecisionControls";
import {BusinessForm} from "@/components/admin/BusinessForm";
import {referenceGlassDesign} from "@/lib/reference-glass-theme";
import {section,text,setup,mount,region,preview} from "./helpers/builder-v3";
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));
afterEach(()=>vi.unstubAllGlobals());

it("new profiles start at Header without mutating the draft or issuing a save",async()=>{
 const env=setup(),tree=await mount(true);
 expect(text(region(tree,"editor"))).toContain("Your public identity and introduction.");
 expect(text(region(tree,"editor"))).toContain("Choose a starting theme in Design");
 expect(text(tree.root)).toContain("Saved");expect(env.request).not.toHaveBeenCalled();
 expect(preview(tree).business.profile.displayName).toBeTruthy();act(()=>tree.unmount());
});

it("keeps six compact global groups and all Warm Glass precision controls reachable",()=>{
 const changed=vi.fn();let tree!:ReturnType<typeof create>;
 act(()=>{tree=create(<EssentialDesignEditor design={referenceGlassDesign} onChange={changed} organizationId="org" backgroundUrl={null} coverUrl={null} onBackgroundChange={()=>{}} accent="#ffffff" onAccentChange={()=>{}}/>)});
 const groups=tree.root.findAllByType("details").filter(node=>node.props.className?.includes("builder-v3-card"));
 expect(groups.map(node=>text(node.findAllByType("summary")[0]))).toEqual(["Themes","Background","Buttons & Cards","Typography","Brand color","Page spacing"]);
 expect(groups.filter(node=>node.props.open).map(node=>text(node.findAllByType("summary")[0]))).toEqual(["Themes"]);
 for(const label of ["Border thickness","Fill direction","Inside padding","Page width","Side spacing"])expect(text(tree.root)).toContain(label);
 expect(changed).not.toHaveBeenCalled();act(()=>tree.unmount());
});

it("saved exact values remain collapsed and unchanged until Custom is requested",()=>{
 const changed=vi.fn();let tree!:ReturnType<typeof create>;
 act(()=>{tree=create(<PresetNumber label="Size" value={70} min={44} max={160} presets={[{value:60,label:"Medium"}]} onChange={changed}/>)});
 expect(tree.root.findByType("details").props.open).toBe(false);expect(tree.root.findByType("input").props.value).toBe(70);expect(changed).not.toHaveBeenCalled();
 act(()=>tree.root.findAllByType("button").find(node=>text(node)==="Custom")!.props.onClick());expect(tree.root.findByType("details").props.open).toBe(true);expect(changed).not.toHaveBeenCalled();act(()=>tree.unmount());
});

it("Social layout is primary and a primary edit stores only the requested field",()=>{
 const source={...section("SOCIALS"),kind:"SOCIALS" as const,singletonKey:"SOCIALS" as const,config:{composition:"ICONS",labels:false}};
 const changed=vi.fn();let tree!:ReturnType<typeof create>;
 act(()=>{tree=create(<EssentialSectionAppearance section={source} global={referenceGlassDesign.visual!} onChange={changed}/>)});
 for(const label of ["Presentation","Alignment","Social icon size","Space above","Icon gap"])expect(text(tree.root)).toContain(label);
 expect(text(tree.root).indexOf("Icon gap")).toBeLessThan(text(tree.root).indexOf("Customize this section"));expect(changed).not.toHaveBeenCalled();
 const presentation=tree.root.findAllByType("fieldset").find(node=>text(node.findByType("legend"))==="Presentation")!;
 act(()=>presentation.findAllByType("button").find(node=>text(node)==="Button Cards")!.props.onClick());
 expect(changed.mock.lastCall![0]).toEqual({...source,config:{...source.config,composition:"CARDS"}});act(()=>tree.unmount());
});

it("new-business creation keeps identity primary and defers appearance to Builder",()=>{
 const html=renderToStaticMarkup(<BusinessForm mode="create"/>);
 expect(html).toContain("Business name *");expect(html).toContain("Profile URL");expect(html).toContain("Contact &amp; location (optional)");
 expect(html).toContain("Next, add your logo, cover and a theme in Profile Builder");expect(html).not.toContain("Accent Color");expect(html).not.toContain("Background type");
 const edit=renderToStaticMarkup(<BusinessForm mode="edit" organizationId="org"/>);expect(edit).toContain("Accent Color");expect(edit).toContain("Background type");
});
