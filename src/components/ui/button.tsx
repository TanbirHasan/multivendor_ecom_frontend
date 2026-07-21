import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-stone-950 text-white shadow-sm shadow-stone-950/15 hover:bg-stone-800 focus-visible:outline-stone-900 disabled:bg-stone-400 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 dark:disabled:bg-amber-300/50",
  secondary:
    "bg-teal-700 text-white shadow-sm shadow-teal-900/15 hover:bg-teal-600 focus-visible:outline-teal-700 disabled:bg-teal-300",
  outline:
    "border border-stone-300/80 bg-white/80 text-stone-800 shadow-sm shadow-stone-950/5 hover:border-stone-400 hover:bg-white focus-visible:outline-stone-900 disabled:text-stone-400 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-100 dark:hover:bg-stone-800",
  ghost:
    "text-stone-600 hover:bg-stone-900/5 focus-visible:outline-stone-900 dark:text-stone-300 dark:hover:bg-white/10",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-900/15 hover:bg-red-500 focus-visible:outline-red-600 disabled:bg-red-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-base rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
