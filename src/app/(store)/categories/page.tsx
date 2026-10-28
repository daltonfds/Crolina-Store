import Link from "next/link";
import { getProducts } from "@/lib/catalog";

export const revalidate = 60;
export const metadata = { title: "Categories" };

export default async function Categories() {
  const products = await getProducts({});
  const map = new Map<string, { count: number; image: string | null }>();
  for (const p of products) {
    const cur = map.get(p.category) ?? { count: 0, image: null };
    cur.count += 1;
    if (!cur.image && p.image_urls[0]) cur.image = p.image_urls[0];
    map.set(p.category, cur);
  }
  const cats = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-medium">Categories</h1>
      {cats.length === 0 ? <p className="text-sm text-muted">Categories will appear as products are added.</p> : (
        <div className="grid grid-cols-3 gap-4 text-center text-xs md:grid-cols-6">
          {cats.map(([name, c]) => (
            <Link key={name} href={`/shop?category=${encodeURIComponent(name)}`}>
              <div className="mx-auto aspect-square w-full max-w-[7rem] overflow-hidden rounded-full bg-surface">
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={name} loading="lazy" className="h-full w-full object-cover" />
                )}
              </div>
              <p className="mt-2 line-clamp-2">{name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
