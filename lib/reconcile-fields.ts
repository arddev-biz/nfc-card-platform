/** Preserve only edits not acknowledged by this save. Never replace a whole
 * draft record merely because one independent field was persisted. */
export function reconcileFields<T extends object>(current:T,previous:T,persisted:T,submitted?:Partial<T>):T {
  const next={...persisted};
  for(const key in current) {
    const changed=JSON.stringify(current[key])!==JSON.stringify(previous[key]);
    const acknowledged=submitted&&key in submitted&&JSON.stringify(current[key])===JSON.stringify(submitted[key]);
    if(changed&&!acknowledged)next[key]=current[key];
  }
  return next;
}
