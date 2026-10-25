"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { saveProduct } from "@/app/admin/actions";
import { CATEGORY_SUGGESTIONS } from "@/lib/config";
import { createClient } from "@/lib/supabase/browser";
import type { Product } from "@/lib/types";
import { slugify } from "@/lib/utils";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const STATUSES = ["Active", "Draft", "Out of Stock"] as const;

export default function ProductForm({ product, categories }: { product?: Product; categories: string[] }) {
  const [state, action, pending] = useActionState(saveProduct, { error: "" });
  const [images, setImages] = useState<string[]>(product?.image_urls ?? []);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const options = [...new Set([...CATEGORY_SUGGESTIONS, ...categories])];
  const specsText = product ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join("\n") : "";

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setUploadError("");
    const sb = createClient();
    const urls: string[] = [];
    for (const file of files) {
      const ext = TYPES[file.type];
      if (!ext) { setUploadError("Use JPG, PNG, WebP or AVIF images."); continue; }
      if (file.size > 5 * 1024 * 1024) { setUploadError(`${file.name} is larger than 5 MB.`); continue; }
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("product-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (error) { setUploadError(`Upload failed: ${error.message}`); continue; }
      urls.push(sb.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    setImages((prev) => [...prev, ...urls].slice(0, 10));
    setUploading(false);
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="image_urls" value={JSON.stringify(images)} />

      <div>
        <label className="label">Images <span className="text-muted">(first image is the cover)</span></label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url, i) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button type="button" aria-label="Remove image" onClick={() => setImages((p) => p.filter((u) => u !== url))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90"><X size={14} /></button>
              {i > 0 && <button type="button" onClick={() => setImages((p) => [url, ...p.filter((u) => u !== url)])} className="absolute inset-x-0 bottom-0 bg-white/90 py-1 text-[11px]">Make cover</button>}
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/30 text-xs text-muted">
            <Upload size={20} />{uploading ? "Uploading…" : "Upload"}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={onFiles} disabled={uploading} />
          </label>
        </div>
        {uploadError && <p role="alert" className="mt-2 text-sm text-danger">{uploadError}</p>}
      </div>

      <div>
        <label className="label" htmlFor="name">Product name</label>
        <input id="name" name="name" required value={name} placeholder="Essential cotton blouse" className="field"
          onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
      </div>
      <div>
        <label className="label" htmlFor="slug">Web address (slug)</label>
        <input id="slug" name="slug" required value={slug} className="field" onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="price">Price (ZAR)</label><input id="price" name="price" required type="number" step="0.01" min="0" inputMode="decimal" defaultValue={product?.price_zar} placeholder="450.00" className="field" /></div>
        <div><label className="label" htmlFor="stock">Stock</label><input id="stock" name="stock" required type="number" step="1" min="0" inputMode="numeric" defaultValue={product?.stock_count ?? ""} placeholder="25" className="field" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="compare">Compare-at price (optional)</label><input id="compare" name="compare" type="number" step="0.01" min="0" inputMode="decimal" defaultValue={product?.compare_at_price_zar ?? ""} placeholder="600.00" className="field" /></div>
        <div>
          <label className="label" htmlFor="condition">Condition</label>
          <select id="condition" name="condition" defaultValue={product?.condition ?? "New"} className="field">
            <option>New</option><option>Used - Like New</option><option>Used</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="category">Category</label>
        <input id="category" name="category" required list="cats" defaultValue={product?.category} placeholder="Women" className="field" />
        <datalist id="cats">{options.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
      <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" rows={4} defaultValue={product?.description} placeholder="Soft, breathable cotton with a relaxed fit." className="field" /></div>
      <div>
        <label className="label" htmlFor="specs">Details (optional, one per line as “Label: value”)</label>
        <textarea id="specs" name="specs" rows={3} defaultValue={specsText} placeholder={"Material: Cotton\nSize: M"} className="field" />
      </div>

      <div>
        <p className="label">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <label key={s} className="cursor-pointer">
              <input type="radio" name="status" value={s} defaultChecked={(product?.status ?? "Active") === s} className="peer sr-only" />
              <span className="chip peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white">{s}</span>
            </label>
          ))}
          <label className="cursor-pointer">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="peer sr-only" />
            <span className="chip peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white">Featured</span>
          </label>
        </div>
      </div>

      {state.error && <p role="alert" className="rounded-xl bg-soft-pink px-3 py-2 text-sm text-deep-pink">{state.error}</p>}
      <div className="flex gap-3">
        <Link href="/admin/products" className="btn btn-outline flex-1"><ArrowLeft size={16} /> Cancel</Link>
        <button disabled={pending || uploading} className="btn btn-primary flex-1">{pending ? "Saving…" : "Save product"}</button>
      </div>
    </form>
  );
}
