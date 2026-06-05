import { cn } from "@/lib/utils";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, className, ...props }: FieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input
        className={cn(
          "focus-ring h-10 rounded-md border bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground",
          className,
        )}
        {...props}
      />
    </label>
  );
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function SelectField({ label, className, children, ...props }: SelectFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <select
        className={cn("focus-ring h-10 rounded-md border bg-background px-3 text-sm font-normal", className)}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
