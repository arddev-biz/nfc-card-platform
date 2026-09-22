import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const css=readFileSync("app/globals.css","utf8");
const dark=Object.fromEntries([...css.matchAll(/\[data-admin-theme="dark"\]\s*\{([^}]+)\}/g)].flatMap(m=>[...m[1].matchAll(/--admin-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([,key,value])=>[key,value])));
function luminance(color:string){const c=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a:string,b:string){const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (values[0]+.05)/(values[1]+.05);}
describe("actual Soft Dark palette contrast",()=>{
  it.each(["bg","card","input","elevated"])("keeps primary and secondary text readable on %s",surface=>{expect(contrast(dark.text,dark[surface])).toBeGreaterThanOrEqual(4.5);expect(contrast(dark["text-secondary"],dark[surface])).toBeGreaterThanOrEqual(4.5);});
  it.each(["danger","success"])("keeps %s status readable",tone=>expect(contrast(dark[tone+"-text"],dark[tone+"-bg"])).toBeGreaterThanOrEqual(4.5));
});
