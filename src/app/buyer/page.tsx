"use client";

import Link from "next/link";
import { Clock, Layers, ShoppingBag, Sparkles, User as UserIcon } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, initials } from "@/lib/utils";

export default function BuyerDashboardPage() {
  return (
    <RequireAuth roles={["BUYER"]}>
      <BuyerDashboardContent />
    </RequireAuth>
  );
}

function BuyerDashboardContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-stone-800 dark:bg-stone-900/68">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-teal-700 text-lg font-black text-white shadow-sm shadow-teal-900/15 dark:bg-amber-400 dark:text-stone-950">
            {initials(user.name)}
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Welcome back, {user.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <RoleBadge role={user.role} />
              <span className="text-xs font-medium text-stone-400">Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
        <Link href="/profile">
          <Button variant="outline">
            <UserIcon className="size-4" />
            Edit profile
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Link
          href="/"
          className="group flex flex-col justify-between rounded-3xl border border-stone-200/70 bg-white/84 p-6 shadow-sm shadow-stone-950/5 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:border-stone-800 dark:bg-stone-900/78"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-stone-950 text-amber-300 dark:bg-amber-400 dark:text-stone-950">
            <ShoppingBag className="size-5" />
          </span>
          <div className="mt-6">
            <p className="text-lg font-black text-stone-950 dark:text-stone-100">Browse products</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Explore listings from every seller on Marketa.</p>
          </div>
        </Link>

        <Link
          href="/categories"
          className="group flex flex-col justify-between rounded-3xl border border-stone-200/70 bg-white/84 p-6 shadow-sm shadow-stone-950/5 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:border-stone-800 dark:bg-stone-900/78"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
            <Layers className="size-5" />
          </span>
          <div className="mt-6">
            <p className="text-lg font-black text-stone-950 dark:text-stone-100">Shop by category</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Jump straight into a filtered storefront view.</p>
          </div>
        </Link>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-3xl border border-stone-200/70 bg-stone-50/70 p-5 dark:border-stone-800 dark:bg-stone-950/35">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <Clock className="size-4.5" />
        </span>
        <div>
          <p className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
            Order history <Sparkles className="size-3.5 text-amber-500" />
          </p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Orders, payments, and reviews land in a later phase of the backend — this space will show your purchase
            history and order status once those endpoints exist.
          </p>
        </div>
      </div>
    </div>
  );
}
