"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}

export function DashboardShell({ title, description, icon: Icon, navItems, children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:px-8">
      <aside className="lg:sticky lg:top-24 lg:w-64 lg:shrink-0">
        <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-5 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
          <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
            <Icon className="size-5" />
          </span>
          <h1 className="text-xl font-black tracking-tight text-stone-950 dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>

          <nav className="mt-6 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = item.href === pathname || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-stone-950 text-white dark:bg-amber-400 dark:text-stone-950"
                      : "text-stone-600 hover:bg-stone-900/5 dark:text-stone-300 dark:hover:bg-white/10"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
