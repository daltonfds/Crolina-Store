"use client";
import {useState} from "react";
import type {ChangeEvent} from "react";
import {ImagePlus, X, LoaderCircle} from "lucide-react";
import {createSupabaseBrowserClient} from "@/lib/supabase-browser";
export default function ProductImageManager({images,onChange}:{images:string[];onChange:(images:string[])=>void}) {
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function upload(e:ChangeEvent<HTMLInputElement>){
  const files=Array.from(e.target.files||[]);e.target.value="";
  if(!files.length)return;
  if(images.length+files.length>8){setMessage("A maximum of 8 images is allowed per product.");return;}
  const invalid=files.find(f=>!f.type.startsWith("image/")||f.size>8*1024*1024);
  if(invalid){setMessage("Choose image files only, each no larger than 8 MB.");return;}
  setBusy(true);setMessage("");
  try{
   const db=createSupabaseBrowserClient();const added:string[]=[];
   for(const file of files){
    const safe=file.name.toLowerCase().replace(/[^a-z0-9.-]+/g,"-").slice(-100);
    const path="products/"+crypto.randomUUID()+"-"+safe;
    const {error}=await db.storage.from("product-images").upload(path,file,{cacheControl:"31536000",upsert:false,contentType:file.type});
    if(error)throw error;
    added.push(db.storage.from("product-images").getPublicUrl(path).data.publicUrl);
   }
   onChange([...images,...added]);setMessage(added.length+" image(s) uploaded to Supabase Storage.");
  }catch(err){setMessage(err instanceof Error?err.message:"Could not upload images. Verify administrator access and try again.");}
  finally{setBusy(false);}
 }
 return <div className="wide"><label>Product images (up to 8)</label><p className="admin-upload-help">Upload JPG, PNG or WebP files. Images are saved in Supabase Storage and remain linked to this product after saving. Max 8 MB per image.</p><label className="button secondary image-upload-button"><ImagePlus size={17}/>{busy?"Uploading images…":"Choose product photos"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy||images.length>=8} onChange={upload} hidden/></label>{busy&&<LoaderCircle className="upload-spinner" size={18}/>}{message&&<p className="admin-upload-help" role="status">{message}</p>}<div className="admin-image-previews">{images.map((src,i)=><div className="admin-image-preview" key={src+i}><img src={src} alt={"Product photo "+(i+1)}/><button type="button" onClick={()=>onChange(images.filter((_,j)=>j!==i))} aria-label={"Remove image "+(i+1)}><X size={14}/></button></div>)}</div><label className="image-url-fallback">Or paste image URLs, one per line<textarea rows={3} value={images.join("\n")} onChange={e=>onChange(e.target.value.split("\n").map(x=>x.trim()).filter(Boolean).slice(0,8))}/></label></div>;
}
