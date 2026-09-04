import { cn } from "@/lib/utils";

export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const tone =
    score >= 80 ? "text-negative" : score >= 60 ? "text-primary" : "text-muted-foreground";
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Attention score ${score}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="stroke-border"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn("stroke-current", tone)}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * score) / 100} ${c}`}
        />
      </svg>
      <span className={cn("num absolute text-[14px] font-medium", tone)}>{score}</span>
    </span>
  );
}
