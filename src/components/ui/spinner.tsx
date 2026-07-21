import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return <Loader2 className={cn("animate-spin text-teal-700 dark:text-amber-400", className)} size={size} />;
}

export function PageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-stone-500 dark:text-stone-400">
      <Spinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
