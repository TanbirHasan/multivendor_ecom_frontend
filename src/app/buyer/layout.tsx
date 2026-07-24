"use client";

import { LayoutDashboard, Receipt, UserCircle } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";

const navItems: DashboardNavItem[] = [
  { href: "/buyer", label: "Overview", icon: LayoutDashboard },
  { href: "/buyer/orders", label: "My Orders", icon: Receipt },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["BUYER"]}>
      <DashboardShell
        title="My dashboard"
        description="Track your orders and manage your account."
        icon={UserCircle}
        navItems={navItems}
      >
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
