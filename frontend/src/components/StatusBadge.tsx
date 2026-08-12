import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "info" | "danger" | "muted";

const toneMap: Record<string, Tone> = {
  Available: "success",
  Completed: "success",
  Active: "success",
  "On Trip": "info",
  Dispatched: "info",
  Draft: "warning",
  "In Shop": "warning",
  Suspended: "warning",
  "Off Duty": "muted",
  Retired: "danger",
  Cancelled: "danger",
  Expired: "danger",
};

const toneClass: Record<Tone, string> = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-info text-info-foreground",
  danger: "bg-danger text-danger-foreground",
  muted: "bg-muted text-muted-foreground border border-border",
};

export function StatusBadge({ status, tone, className }: { status: string; tone?: Tone; className?: string }) {
  const t = tone ?? toneMap[status] ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        toneClass[t],
        className,
      )}
    >
      {status}
    </span>
  );
}

export function SafetyBadge({ score }: { score: number }) {
  const tone: Tone = score > 80 ? "success" : score > 60 ? "warning" : "danger";
  return <StatusBadge status={String(score)} tone={tone} />;
}
