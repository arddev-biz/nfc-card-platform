/** Export only fields explicitly published in Business Info, never hidden canonical data. */
export function contactCard(name:string,fields:{phone?:string|null;email?:string|null;address?:string|null;website?:string|null}) {
  const escape=(v:string)=>v.replace(/\\/g,"\\\\").replace(/[\r\n]+/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
  const lines=["BEGIN:VCARD","VERSION:3.0",`FN:${escape(name)}`];
  if(fields.phone)lines.push(`TEL:${escape(fields.phone)}`);
  if(fields.email)lines.push(`EMAIL:${escape(fields.email)}`);
  if(fields.address)lines.push(`ADR:;;${escape(fields.address)};;;;`);
  if(fields.website)lines.push(`URL:${escape(fields.website)}`);
  return "data:text/vcard;charset=utf-8,"+encodeURIComponent([...lines,"END:VCARD"].join("\r\n"));
}
