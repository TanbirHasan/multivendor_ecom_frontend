"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LayoutGrid, LogOut, Menu, Package, ShoppingBag, User, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { dashboardPathForRole } from "@/lib/roles";
import toast from "react-hot-toast";

const DASHBOARD_LABEL = {
  ADMIN: "Admin Console",
  SELLER: "Seller Dashboard",
  BUYER: "My Dashboard",
} as const;

export function Navbar() {
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out");
      router.push("/");
    } catch {
      toast.error("Logout failed");
    }
  }

  const dashboardHref = user ? dashboardPathForRole(user.role) : null;
  const dashboardLabel = user ? DASHBOARD_LABEL[user.role] : null;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/78 shadow-sm shadow-stone-950/5 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/78">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-stone-950 dark:text-white">
            <span className="flex size-9 items-center justify-center rounded-xl bg-stone-950 text-amber-300 shadow-sm shadow-stone-950/20 dark:bg-amber-400 dark:text-stone-950">
              <ShoppingBag className="size-4.5" />
            </span>
            Marketa
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-stone-200/70 bg-white/55 p-1 text-sm font-semibold text-stone-600 shadow-sm shadow-stone-950/5 dark:border-stone-800 dark:bg-stone-900/55 dark:text-stone-300 md:flex">
            <Link href="/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-stone-950 hover:text-white dark:hover:bg-white dark:hover:text-stone-950">
              Products
            </Link>
            <Link href="/categories" className="rounded-full px-3 py-1.5 transition-colors hover:bg-stone-950 hover:text-white dark:hover:bg-white dark:hover:text-stone-950">
              Categories
            </Link>
            {dashboardHref && dashboardLabel && (
              <Link href={dashboardHref} className="rounded-full px-3 py-1.5 transition-colors hover:bg-stone-950 hover:text-white dark:hover:bg-white dark:hover:text-stone-950">
                {dashboardLabel}
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isInitializing ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-stone-100 dark:bg-stone-800" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <RoleBadge role={user.role} />
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/65 py-1 pl-1 pr-3 text-sm font-semibold text-stone-700 shadow-sm shadow-stone-950/5 transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-200 dark:hover:text-amber-300"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white dark:bg-amber-400 dark:text-stone-950">
                  {initials(user.name)}
                </span>
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 hover:text-teal-700 dark:text-stone-300 dark:hover:text-amber-300">
                Log in
              </Link>
              <Link href="/register" className="rounded-xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-stone-950/20 transition-colors hover:bg-stone-800 dark:bg-amber-400 dark:text-stone-950 dark:hover:bg-amber-300">
                Sign up
              </Link>
            </div>
          )}
        </div>

        <button
          className="rounded-xl p-2 text-stone-600 hover:bg-stone-900/5 md:hidden dark:text-stone-300 dark:hover:bg-white/10"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-stone-200/70 bg-white/80 px-4 py-4 shadow-lg shadow-stone-950/5 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/90">
          <div className="flex flex-col gap-1 text-sm font-semibold text-stone-700 dark:text-stone-200">
            <MobileLink href="/" icon={LayoutGrid} label="Products" onClick={() => setMobileOpen(false)} />
            <MobileLink href="/categories" icon={Package} label="Categories" onClick={() => setMobileOpen(false)} />
            {dashboardHref && dashboardLabel && (
              <MobileLink href={dashboardHref} icon={LayoutDashboard} label={dashboardLabel} onClick={() => setMobileOpen(false)} />
            )}
            <div className="my-2 border-t border-stone-200 dark:border-stone-800" />
            {isAuthenticated && user ? (
              <>
                <MobileLink href="/profile" icon={User} label={user.name} onClick={() => setMobileOpen(false)} />
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="size-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <MobileLink href="/login" icon={User} label="Log in" onClick={() => setMobileOpen(false)} />
                <MobileLink href="/register" icon={User} label="Sign up" onClick={() => setMobileOpen(false)} />
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-stone-900/5 dark:hover:bg-white/10">
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
