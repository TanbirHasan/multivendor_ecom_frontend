"use client";

import { LayoutDashboard, PackagePlus, Store, ClipboardList } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";

const navItems: DashboardNavItem[] = [
  { href: "/seller", label: "Overview", icon: LayoutDashboard },
  { href: "/seller/products", label: "My Products", icon: ClipboardList },
  { href: "/seller/products/new", label: "Add Product", icon: PackagePlus },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["SELLER"]}>
      <DashboardShell
        title="Seller dashboard"
        description="List new products and manage your existing inventory."
        icon={Store}
        navItems={navItems}
      >
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
