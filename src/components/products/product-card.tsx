import Link from "next/link";
import { Package } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const gradients = [
  "from-indigo-400 to-violet-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-fuchsia-400 to-purple-500",
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={`relative flex h-40 items-center justify-center bg-linear-to-br ${gradientFor(product.id)}`}>
        <Package className="size-10 text-white/80" strokeWidth={1.5} />
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {categoryName && <Badge>{categoryName}</Badge>}
        <h3 className="line-clamp-1 font-medium text-slate-900 group-hover:text-indigo-600 dark:text-slate-100">
          {product.name}
        </h3>
        <p className="line-clamp-2 flex-1 text-sm text-slate-500">{product.description}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900 dark:text-white">{formatPrice(product.price)}</span>
          <span className="text-xs text-slate-400">{product.stock} in stock</span>
        </div>
      </div>
    </Link>
  );
}
