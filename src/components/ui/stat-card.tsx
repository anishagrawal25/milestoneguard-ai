"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  color?: "indigo" | "teal" | "emerald" | "amber";
}

export function StatCard({
  title,
  value,
  isCurrency = false,
  prefix = "",
  suffix = "",
  description,
  icon: Icon,
  trend,
  color = "indigo",
}: StatCardProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 900; // ms
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(ease * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  const colorStyles = {
    indigo: {
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
      accentBorder: "group-hover:border-indigo-300 dark:group-hover:border-indigo-800",
    },
    teal: {
      iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
      accentBorder: "group-hover:border-teal-300 dark:group-hover:border-teal-800",
    },
    emerald: {
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      accentBorder: "group-hover:border-emerald-300 dark:group-hover:border-emerald-800",
    },
    amber: {
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      accentBorder: "group-hover:border-amber-300 dark:group-hover:border-amber-800",
    },
  }[color];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-card transition-all duration-300 hover:shadow-float",
        colorStyles.accentBorder
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("rounded-xl p-2.5 transition-colors", colorStyles.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h4 className="text-3xl font-bold tracking-tight text-foreground num-tabular">
          {isCurrency
            ? formatCurrency(displayValue)
            : `${prefix}${displayValue.toLocaleString()}${suffix}`}
        </h4>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
