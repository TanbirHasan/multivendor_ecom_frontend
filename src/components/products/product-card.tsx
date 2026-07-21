import Link from "next/link";
import { Package, Sparkles } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const gradients = [
  "from-teal-700 via-teal-600 to-amber-400",
  "from-stone-900 via-stone-700 to-orange-400",
  "from-emerald-700 via-teal-600 to-cyan-400",
  "from-amber-500 via-orange-500 to-red-500",
  "from-sky-700 via-teal-600 to-emerald-400",
  "from-rose-700 via-orange-500 to-amber-300",
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return gradients[hash % gradients.length];
}

export function ProductCard({ product, categoryName }: { product: Product; categoryName?: string }) {
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex min-h-[22rem] flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white/86 shadow-sm shadow-stone-950/6 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-950/10 dark:border-stone-800 dark:bg-stone-900/82 dark:hover:border-stone-700"
    >
      <div className={`relative flex h-44 items-center justify-center overflow-hidden bg-linear-to-br ${gradientFor(product.id)}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_13rem)]" />
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur">
          <Sparkles className="size-3.5" />
          Marketplace pick
        </div>
        <Package className="relative size-14 text-white/86 drop-shadow" strokeWidth={1.35} />
        {outOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-stone-950/75 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {categoryName && <Badge>{categoryName}</Badge>}
        <h3 className="line-clamp-1 text-base font-bold text-stone-950 group-hover:text-teal-700 dark:text-stone-100 dark:group-hover:text-amber-300">
          {product.name}
        </h3>
        <p className="line-clamp-2 flex-1 text-sm leading-6 text-stone-500 dark:text-stone-400">{product.description}</p>
        <div className="mt-1 flex items-end justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
          <span className="text-xl font-black text-stone-950 dark:text-white">{formatPrice(product.price)}</span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-300">
            {product.stock} in stock
          </span>
        </div>
      </div>
    </Link>
  );
}
