"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, LogOut, Menu, Package, Shield, ShoppingBag, User, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import toast from "react-hot-toast";

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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ShoppingBag className="size-4.5" />
            </span>
            Marketa
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <Link href="/" className="transition-colors hover:text-indigo-600">
              Products
            </Link>
            <Link href="/categories" className="transition-colors hover:text-indigo-600">
              Categories
            </Link>
            {user?.role === "SELLER" && (
              <Link href="/dashboard" className="transition-colors hover:text-indigo-600">
                My Products
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <>
                <Link href="/admin/categories" className="transition-colors hover:text-indigo-600">
                  Manage Categories
                </Link>
                <Link href="/admin/users" className="transition-colors hover:text-indigo-600">
                  Manage Users
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isInitializing ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <RoleBadge role={user.role} />
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                  {initials(user.name)}
                </span>
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300">
                Log in
              </Link>
              <Link href="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500">
                Sign up
              </Link>
            </div>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 md:hidden dark:text-slate-300"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 px-4 py-4 md:hidden dark:border-slate-800">
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            <MobileLink href="/" icon={LayoutGrid} label="Products" onClick={() => setMobileOpen(false)} />
            <MobileLink href="/categories" icon={Package} label="Categories" onClick={() => setMobileOpen(false)} />
            {user?.role === "SELLER" && (
              <MobileLink href="/dashboard" icon={Package} label="My Products" onClick={() => setMobileOpen(false)} />
            )}
            {user?.role === "ADMIN" && (
              <>
                <MobileLink href="/admin/categories" icon={Shield} label="Manage Categories" onClick={() => setMobileOpen(false)} />
                <MobileLink href="/admin/users" icon={Shield} label="Manage Users" onClick={() => setMobileOpen(false)} />
              </>
            )}
            <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
            {isAuthenticated && user ? (
              <>
                <MobileLink href="/profile" icon={User} label={user.name} onClick={() => setMobileOpen(false)} />
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-red-600"
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
    <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
