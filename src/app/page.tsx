"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Boxes, Search, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { listProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/products/product-card";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <Suspense fallback={<PageSpinner label="Loading products..." />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get("category")
  );

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([listProducts(), listCategories()]);
        setProducts(productsData);
        setCategories(categoriesData);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || p.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-10 overflow-hidden rounded-[2rem] border border-stone-200/70 bg-stone-950 text-white shadow-2xl shadow-stone-950/20 dark:border-stone-800">
        <div className="grid min-h-[23rem] grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(245_158_11/0.28),transparent_18rem),radial-gradient(circle_at_80%_90%,rgb(20_184_166/0.22),transparent_18rem)]" />
            <div className="relative">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
                <ShoppingBag className="size-4" />
                Multi-vendor marketplace
              </span>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
                Shop independent sellers with a cleaner, faster storefront.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-stone-300">
                Browse live products by category, discover new listings, and give sellers a polished place to grow.
              </p>
              <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <HeroMetric icon={Store} label="Seller ready" value="RBAC" />
                <HeroMetric icon={Boxes} label="Catalog" value={`${products.length}`} />
                <HeroMetric icon={ShieldCheck} label="Admin tools" value="Built in" />
              </div>
            </div>
          </div>
          <div className="relative hidden min-h-full items-center justify-center overflow-hidden border-l border-white/10 bg-linear-to-br from-teal-700 via-teal-600 to-amber-400 p-10 lg:flex">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_14rem)]" />
            <div className="relative grid w-full max-w-sm grid-cols-2 gap-4">
              {["Fresh picks", "Verified sellers", "Smart stock", "Fast edits"].map((item, index) => (
                <div
                  key={item}
                  className={cn(
                    "rounded-3xl bg-white/18 p-5 text-white shadow-xl shadow-stone-950/15 ring-1 ring-white/25 backdrop-blur",
                    index % 2 === 1 && "translate-y-8"
                  )}
                >
                  <PackageTile index={index} />
                  <p className="mt-4 text-sm font-bold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8 rounded-3xl border border-stone-200/70 bg-white/74 p-4 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/64">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-2xl border border-stone-300/80 bg-white py-3 pl-11 pr-4 text-sm font-medium text-stone-900 shadow-sm shadow-stone-950/5 placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10 dark:border-stone-700 dark:bg-stone-950/70 dark:text-stone-100"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  activeCategory === null
                    ? "border-stone-950 bg-stone-950 text-white dark:border-amber-400 dark:bg-amber-400 dark:text-stone-950"
                    : "border-stone-200 bg-white/70 text-stone-600 hover:border-teal-300 hover:text-teal-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:text-amber-300"
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    activeCategory === c.id
                      ? "border-stone-950 bg-stone-950 text-white dark:border-amber-400 dark:bg-amber-400 dark:text-stone-950"
                      : "border-stone-200 bg-white/70 text-stone-600 hover:border-teal-300 hover:text-teal-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:text-amber-300"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <PageSpinner label="Loading products..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No products found" description="Try a different search or category." />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} categoryName={categoryMap.get(product.categoryId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <Icon className="size-4 text-amber-200" />
      <p className="mt-3 text-lg font-black">{value}</p>
      <p className="text-xs font-medium text-stone-400">{label}</p>
    </div>
  );
}

function PackageTile({ index }: { index: number }) {
  const sizes = ["h-12 w-16", "h-16 w-14", "h-14 w-20", "h-12 w-12"];
  return <div className={cn("rounded-2xl bg-white/35 ring-1 ring-white/30", sizes[index])} />;
}
