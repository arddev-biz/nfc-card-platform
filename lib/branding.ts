import { PLATFORM_NAME } from "./platform";
export function hasPremiumBranding(subscription: {plan:string;status:string;startDate:Date;endDate:Date}|null|undefined,now=new Date()):boolean {
  return !!subscription&&subscription.plan.toLowerCase()==="premium"&&["ACTIVE","EXPIRING_SOON"].includes(subscription.status)&&subscription.startDate<=now&&subscription.endDate>now;
}
export function brandingCapabilities(role:string,premium:boolean) { return {customizeFooter:role==="SUPER_ADMIN"||(role==="BUSINESS_OWNER"&&premium)}; }
export function resolveFooter(config:{hidden?:boolean;text?:string}|undefined,platformName=PLATFORM_NAME):string|null {
  return config?.hidden ? null : (config?.text?.trim() ? config.text : platformName);
}
