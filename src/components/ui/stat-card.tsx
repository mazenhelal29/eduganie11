import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "warning" | "danger";
};

const toneConfig = {
  primary: {
    icon: "bg-primary text-primary-foreground",
    glow: "from-primary/5",
    border: "border-primary/10",
  },
  accent: {
    icon: "bg-accent text-accent-foreground",
    glow: "from-accent/5",
    border: "border-accent/10",
  },
  warning: {
    icon: "bg-amber-500 text-white",
    glow: "from-amber-500/5",
    border: "border-amber-200",
  },
  danger: {
    icon: "bg-red-600 text-white",
    glow: "from-red-600/5",
    border: "border-red-200",
  },
};

export function StatCard({ label, value, helper, icon: Icon, tone = "primary" }: StatCardProps) {
  const config = toneConfig[tone];

  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5",
        config.border
      )}
    >
      {/* Background gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-60", config.glow)} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
        </div>
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110",
          config.icon
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="relative mt-3 text-xs text-muted-foreground">{helper}</p>
    </section>
  );
}

