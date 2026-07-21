import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-xl border border-stone-300/80 bg-white/85 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm shadow-stone-950/5 transition-colors focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10 disabled:bg-stone-100 disabled:text-stone-500 dark:border-stone-700 dark:bg-stone-950/70 dark:text-stone-100 dark:placeholder:text-stone-500";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  id: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps
>(({ label, error, hint, id, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
        </label>
      )}
      <input id={id} ref={ref} className={cn(fieldClasses, error && "border-red-400 focus:border-red-500 focus:ring-red-500/20", className)} {...props} />
      {hint && !error && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps
>(({ label, error, hint, id, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
        </label>
      )}
      <textarea id={id} ref={ref} className={cn(fieldClasses, "min-h-24 resize-y", error && "border-red-400 focus:border-red-500 focus:ring-red-500/20", className)} {...props} />
      {hint && !error && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldWrapperProps
>(({ label, error, hint, id, className, children, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
        </label>
      )}
      <select id={id} ref={ref} className={cn(fieldClasses, "cursor-pointer", error && "border-red-400", className)} {...props}>
        {children}
      </select>
      {hint && !error && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
});
Select.displayName = "Select";
