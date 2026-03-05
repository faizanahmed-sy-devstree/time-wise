"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MewurkThemeProps } from "../mewurk-logs";

export function OriginalLayout({
  data,
  stats,
  monthStats,
  isSequenceBroken,
  formatHms,
  parseUtc,
}: MewurkThemeProps) {
  const logs = [...data.clockInDetails].sort(
    (a, b) => new Date(a.clockTime).getTime() - new Date(b.clockTime).getTime()
  );

  // Calculate Time Completed (Total Shift - Remaining)
  const totalShiftMs = stats.targetHours * 3600000 + stats.targetMinutes * 60000;
  const completedMs = totalShiftMs - stats.remainingMs;

  return (
    /* Main Responsive Grid Container */
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 lg:h-[calc(100vh-250px)]">
      {/* LEFT COLUMN: Main Stats & Timer (8/12) */}
      <div className="lg:col-span-8 flex flex-col gap-4 lg:h-full order-1">
        {/* 1. Main Hero Card */}
        <Card className="relative p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] bg-white dark:bg-[#09090b] border-zinc-200 dark:border-white/5 shadow-2xl dark:shadow-none overflow-hidden flex flex-col justify-center min-h-[350px] lg:flex-1">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 lg:w-96 lg:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-[80px] lg:blur-[120px] pointer-events-none opacity-40" />

          <div className="relative z-10 flex flex-col items-center">
            {isSequenceBroken && (
              <div className="mb-4 px-3 py-1 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-500 rounded-full text-[10px] font-bold flex items-center gap-2 animate-pulse">
                <Icons.AlertTriangle className="h-3 w-3" /> Sequence broken
              </div>
            )}

            <span className="text-xs lg:text-sm font-medium text-zinc-500 dark:text-white/40 mb-2 tracking-wide">
              {stats.remainingMs > 0 ? "Time remaining today" : "Overtime accrued"}
            </span>

            <div
              className={cn(
                "text-5xl md:text-7xl lg:text-8xl font-black font-mono tracking-tighter tabular-nums leading-none mb-8 drop-shadow-sm dark:drop-shadow-[0_0_30px_rgba(255,255,255,0.05)] text-center",
                stats.remainingMs <= 0 ? "text-rose-500" : "text-zinc-900 dark:text-white"
              )}
            >
              {formatHms(stats.remainingMs)}
            </div>

            {/* 4-Column Grid Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
              <StatBlock
                label="Started"
                value={stats.firstPunchTime ? format(stats.firstPunchTime, "hh:mm a") : "--:--"}
                className="bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-500/20 text-teal-900 dark:text-teal-100"
                icon={<Icons.Timer className="h-4 w-4 text-teal-600 dark:text-teal-400" />}
              />
              <StatBlock
                label="Completes"
                value={format(stats.estimatedEndTime, "hh:mm a")}
                className="bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-500/20 text-cyan-900 dark:text-cyan-100"
                icon={<Icons.CheckCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
              />
              <StatBlock
                label="Break"
                value={formatHms(stats.totalBreakMs)}
                className="bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-500/20 text-purple-900 dark:text-purple-100"
                icon={<Icons.Coffee className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              />
              <StatBlock
                label="Completed"
                value={formatHms(completedMs)}
                className="bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/20 text-rose-900 dark:text-rose-100"
                icon={<Icons.History className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
              />
            </div>

            {/* 
    Enhanced Progress Bar Section 
    - Gradient Fill: Indigo to Emerald (Active) or Rose to Orange (Overtime)
    - Shimmer: Animated light streak
    - Glow: Subtle outer glow matching the progress color
*/}
            <div className="w-full mt-10 space-y-4 group/progress">
              <div className="flex justify-between items-end px-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">
                    Current Progress
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">
                      {Math.round(stats.progress)}
                    </span>
                    <span className="text-sm font-bold text-primary">%</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">
                    Status
                  </span>
                  <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        stats.remainingMs <= 0
                          ? "bg-rose-500 animate-ping"
                          : "bg-emerald-500 animate-pulse"
                      )}
                    />
                    <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-400 uppercase tracking-widest">
                      {stats.remainingMs <= 0 ? "Overtime" : "In Session"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative h-6 w-full bg-zinc-100 dark:bg-white/5 rounded-2xl p-1 border border-zinc-200 dark:border-white/10 shadow-inner">
                {/* Progress Fill */}
                <div
                  className={cn(
                    "h-full rounded-xl transition-all duration-1000 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]",
                    stats.remainingMs <= 0
                      ? "bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400 shadow-rose-500/20"
                      : "bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-400 shadow-blue-500/20"
                  )}
                  style={{
                    width: `${stats.progress}%`,
                    boxShadow:
                      stats.remainingMs <= 0 ? "0 0 15px -2px #f43f5e" : "0 0 15px -2px #3b82f6",
                  }}
                >
                  {/* Animated Gloss/Shimmer Effect */}
                  <div className="absolute inset-0 w-full h-full">
                    <div className="absolute inset-0 translate-x-[-100%] animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent w-[50%] skew-x-[-20deg]" />
                  </div>

                  {/* Top light highlight for 3D effect */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30" />
                </div>

                {/* Subtle Background Markers (Ticks) */}
                <div className="absolute inset-0 flex justify-between px-4 pointer-events-none opacity-20">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-full w-[1px] bg-zinc-400 dark:bg-white/20" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer Metrics (5 columns to include Goal) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 order-3 lg:order-2">
          <FooterMetric label="Policy" value={data.policyName} />
          <FooterMetric label="Shift" value={data.shiftName} />
          <FooterMetric label="Avg" value={`${monthStats?.workingHours.dayAvg.toFixed(1)}h/d`} />
          <FooterMetric
            label="Exceptions"
            value={`${monthStats?.gracePeriod.lateIn}In • ${monthStats?.gracePeriod.earlyOut}Out`}
          />
          <FooterMetric
            label="Daily Goal"
            value={`${stats.targetHours}h ${stats.targetMinutes}m`}
          />
        </div>
      </div>

      {/* RIGHT COLUMN: Activity History */}
      <Card className="lg:col-span-4 p-5 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] bg-white dark:bg-card border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-none flex flex-col lg:h-full order-2 lg:order-3 overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Icons.Activity className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
            </div>
            <h3 className="text-sm lg:text-md font-bold tracking-tight text-zinc-900 dark:text-white">
              Activity history
            </h3>
          </div>
          <span className="text-[9px] lg:text-[10px] font-bold px-2 py-1 bg-zinc-100 dark:bg-white/5 rounded-full text-zinc-500 dark:text-white/40 uppercase tracking-widest">
            {logs.length} Logged
          </span>
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="relative pl-8 space-y-6 lg:space-y-8 py-2">
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-zinc-200 dark:bg-white/10" />

            {logs.map((l, i) => {
              const isPunchIn = l.inOutType === "IN";
              return (
                <div key={i} className="relative flex items-center justify-between group">
                  <div
                    className={cn(
                      "absolute -left-[24px] w-3.5 h-3.5 rounded-full border-2 z-10 transition-transform group-hover:scale-125",
                      "bg-white dark:bg-[#09090b]",
                      isPunchIn ? "border-emerald-500" : "border-orange-500"
                    )}
                  />

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-white/30 mb-0.5 uppercase tracking-tighter">
                      {isPunchIn ? "Clock in" : "Clock out"}
                    </span>
                    <span className="text-lg lg:text-xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">
                      {format(parseUtc(l.clockTime), "hh:mm a")}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "p-1.5 rounded-lg border",
                      isPunchIn
                        ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-white/5"
                        : "bg-orange-50 dark:bg-orange-500/5 border-orange-100 dark:border-white/5"
                    )}
                  >
                    <Icons.RefreshCcw
                      className={cn(
                        "w-3.5 h-3.5 lg:w-4 lg:h-4",
                        isPunchIn
                          ? "text-emerald-600 dark:text-emerald-500"
                          : "text-orange-600 dark:text-orange-500 rotate-180"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={cn(
        "p-3 lg:p-4 border rounded-[1.2rem] lg:rounded-[1.5rem] flex flex-col gap-1 transition-all shadow-sm dark:shadow-lg group",
        className
      )}
    >
      <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
        {icon}
        <span className="text-[8px] lg:text-[10px] font-bold tracking-wide uppercase">{label}</span>
      </div>
      <div className="text-lg lg:text-2xl font-black tracking-tight tabular-nums truncate">
        {value}
      </div>
    </div>
  );
}

function FooterMetric({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="bg-zinc-100 dark:bg-white/5 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-zinc-200 dark:border-white/5 transition-colors">
      <span className="text-[8px] lg:text-[9px] font-bold text-zinc-400 dark:text-white/20 tracking-wide uppercase block mb-0.5 lg:mb-1">
        {label}
      </span>
      <div className="text-[10px] lg:text-[11px] font-bold text-zinc-600 dark:text-white/60 truncate">
        {value || "N/A"}
      </div>
    </div>
  );
}
