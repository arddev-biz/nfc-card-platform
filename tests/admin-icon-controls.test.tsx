import React from "react";
import {act,create} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it,vi} from "vitest";
const theme=vi.hoisted(()=>({resolved:"light" as "light"|"dark",preference:"system",setPreference:vi.fn()}));
vi.mock("@/components/admin/ThemeProvider",()=>({useOptionalAdminTheme:()=>theme,useAdminTheme:()=>theme}));
import {ThemeToggle} from "@/components/admin/ThemeToggle";
import {SidebarPanelIcon,OverviewIcon,BusinessesIcon,NfcIcon,LeadsIcon,VerificationIcon,AnalyticsIcon,SubscriptionsIcon,SettingsIcon,LogoutIcon} from "@/components/admin/icons";
it("uses the effective theme and delegates persistence to the existing provider",()=>{
 theme.resolved="light";theme.setPreference.mockClear();let tree!:ReturnType<typeof create>;
 act(()=>{tree=create(<ThemeToggle iconOnly/>)});
 expect(tree.root.findByType("button").props["aria-label"]).toBe("Switch to dark theme");
 expect(tree.root.findByType("button").props.title).toBe("Switch to dark theme");
 act(()=>tree.root.findByType("button").props.onClick());expect(theme.setPreference).toHaveBeenLastCalledWith("dark");
 theme.resolved="dark";act(()=>tree.update(<ThemeToggle iconOnly/>));
 expect(tree.root.findByType("button").props["aria-label"]).toBe("Switch to light theme");
 act(()=>tree.root.findByType("button").props.onClick());expect(theme.setPreference).toHaveBeenLastCalledWith("light");
 expect(tree.root.findByType("button").children).toHaveLength(1);act(()=>tree.unmount());
});
it("keeps every rail icon decorative with shared size and stroke",()=>{
 for(const Icon of [OverviewIcon,BusinessesIcon,NfcIcon,LeadsIcon,VerificationIcon,AnalyticsIcon,SubscriptionsIcon,SettingsIcon,LogoutIcon]){
  const html=renderToStaticMarkup(<Icon/>);expect(html).toContain('viewBox="0 0 24 24"');expect(html).toContain('stroke-width="1.8"');expect(html).toContain('aria-hidden="true"');expect(html).toContain('class="h-5 w-5"');
 }
 expect(renderToStaticMarkup(<SidebarPanelIcon expand/>)).not.toBe(renderToStaticMarkup(<SidebarPanelIcon/>));
});
