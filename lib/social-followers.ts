// Server/provider adapters must supply verified snapshots. There is no configured
// provider today; presentation never scrapes, estimates, or invents a count.
export type FollowerState = {status:"unsupported"|"not-connected"} | {status:"available";count:number;provider:string;fetchedAt:string};
export function followerLabel(state: FollowerState | undefined): string | null {
  if(state?.status!=="available" || !Number.isSafeInteger(state.count) || state.count<0 || !state.provider.trim() || !Number.isFinite(Date.parse(state.fetchedAt)))return null;
  return `${new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(state.count)} followers`;
}
export function configuredFollowerState():FollowerState {return {status:"unsupported"};}
