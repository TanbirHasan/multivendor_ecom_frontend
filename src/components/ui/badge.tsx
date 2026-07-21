import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const roleClasses: Record<Role, string> = {
  ADMIN: "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-400/20 dark:bg-violet-500/15 dark:text-violet-300",
  SELLER: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-300",
  BUYER: "border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-400/20 dark:bg-teal-500/15 dark:text-teal-300",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        roleClasses[role],
        className
      )}
    >
      {role}
    </span>
  );
}

export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300",
    success: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-300",
    danger: "border-red-200 bg-red-100 text-red-800 dark:border-red-400/20 dark:bg-red-500/15 dark:text-red-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
