"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { saveProduct } from "@/app/admin/actions";
import { CATEGORY_SUGGESTIONS } from "@/lib/config";
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
  const [condition, setCondition] = useState(product?.condition ?? "New");
  const [stock, setStock] = useState(String(product?.stock_count ?? ""));
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
    const urls: string[] = [];
    try {
      for (const file of files) {
        const ext = TYPES[file.type];
        if (!ext) {
          setUploadError(`Use JPG, PNG, WebP or AVIF images.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`${file.name} is larger than 5 MB.`);
          continue;
        }

        try {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/admin/product-images", { method: "POST", body: formData });
          const result: { url?: string; error?: string } = await response.json().catch(() => ({}));
          if (!response.ok || !result.url) {
            setUploadError(`Upload failed: ${result.error ?? "The server could not process the image."}`);
            continue;
          }
          urls.push(result.url);
        } catch {
          setUploadError("Upload failed: Could not reach the upload service. Check your connection and try again.");
        }
      }
      setImages((prev) => [...prev, ...urls].slice(0, 10));
    } finally {
      setUploading(false);
    }
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
        <div><label className="label" htmlFor="stock">Stock</label><input id="stock" name="stock" required type="number" step="1" min="0" inputMode="numeric" value={condition === "Single item" && Number(stock) > 0 ? "1" : stock} onChange={(e) => setStock(e.target.value)} placeholder="25" className="field" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="compare">Compare-at price (optional)</label><input id="compare" name="compare" type="number" step="0.01" min="0" inputMode="decimal" defaultValue={product?.compare_at_price_zar ?? ""} placeholder="600.00" className="field" /></div>
        <div>
          <label className="label" htmlFor="condition">Condition</label>
          <select id="condition" name="condition" value={condition} onChange={(e) => { const next = e.target.value; setCondition(next); if (next === "Single item" && (stock === "" || Number(stock) > 0)) setStock("1"); }} className="field">
            <option value="New">New</option><option value="Used - Like New">Used like new</option><option value="Used">Used</option><option value="Single item">Single item</option>
          </select>
          {condition === "Single item" && <p className="mt-1 text-xs text-muted">Unique one-off item. Stock is limited to one unit; after it sells, keep stock at 0.</p>}
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

      <details className="rounded-2xl border border-line p-4" open={Boolean(product?.checkout_url)}>
        <summary className="cursor-pointer text-sm font-medium">Payment link (optional)</summary>
        <div className="mt-3">
          <label className="label" htmlFor="checkout_url">Checkout link for this product</label>
          <input id="checkout_url" name="checkout_url" type="url" defaultValue={product?.checkout_url ?? ""} placeholder="https://payf.st/..." className="field" />
          <p className="mt-1 text-xs text-muted">Paste a PayFast, Paystack or other payment link. Customers who choose “Payment link” at checkout are sent here when this is the only product in their bag.</p>
        </div>
      </details>

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
