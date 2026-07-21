import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-stone-300/80 bg-white/55 px-6 py-16 text-center shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-700 dark:bg-stone-900/45">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-500/15 dark:text-amber-300">
        <Icon className="size-6" />
      </div>
      <div>
        <p className="font-semibold text-stone-950 dark:text-stone-100">{title}</p>
        {description && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
