"use client";
import { useState } from "react";
export default function AffiliateStatusControl({ id, status }: { id: string; status: string }) {
 const [value,setValue]=useState(status); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function change(next:string){setBusy(true);setMessage("");try{const response=await fetch("/api/admin/affiliates/"+id,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:next})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Update failed");setValue(next);setMessage("Saved");}catch(e){setMessage(e instanceof Error?e.message:"Update failed");}finally{setBusy(false);}}
 return <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-neutral-100 px-2 py-1 text-xs">{value}</span>{value!=="active"&&<button disabled={busy} onClick={()=>change("active")} className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs text-white">Approve</button>}{value==="active"&&<button disabled={busy} onClick={()=>change("paused")} className="rounded-full border px-3 py-1.5 text-xs">Pause</button>}<span className="text-xs text-neutral-500">{busy?"Saving…":message}</span></div>;
}
