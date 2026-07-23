"use client";

import { LayoutDashboard, Layers, Package, ShieldCheck, Users } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";

const navItems: DashboardNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/products", label: "Products", icon: Package },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["ADMIN"]}>
      <DashboardShell
        title="Admin console"
        description="Manage users, categories, and products across the marketplace."
        icon={ShieldCheck}
        navItems={navItems}
      >
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
