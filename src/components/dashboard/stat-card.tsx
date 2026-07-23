import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
}) {
  const tones: Record<string, string> = {
    default: "bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950",
    warning: "bg-amber-500 text-white",
    success: "bg-emerald-600 text-white",
  };

  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white/84 p-5 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
      <span className={cn("flex size-10 items-center justify-center rounded-2xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-2xl font-black tracking-tight text-stone-950 dark:text-white">{value}</p>
      <p className="mt-1 text-sm font-medium text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}
