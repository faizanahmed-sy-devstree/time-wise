"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 0. Error Warning */}
      {isSequenceBroken && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-bold flex items-center gap-3 shadow-lg">
          <div className="bg-rose-500 text-white p-1.5 rounded-full">
            <Icons.AlertTriangle className="h-5 w-5" />
          </div>
          <span className="text-sm tracking-tight font-semibold">Sequence broken: Duplicate records detected.</span>
        </div>
      )}

      {/* 1. Main Hero Card */}
      <Card className="relative p-10 rounded-[3rem] bg-[#09090b] border-white/5 shadow-2xl overflow-hidden">
        {/* Deep ambient glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-40" />
        
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-lg font-medium text-white/40 mb-3 tracking-wide">
            {stats.remainingMs > 0 ? "Time remaining today" : "Overtime accrued"}
          </span>
          <div
            className={cn(
              "text-7xl sm:text-8xl font-black font-mono tracking-tighter tabular-nums leading-none mb-12 drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]",
              stats.remainingMs <= 0 ? "text-rose-500" : "text-white"
            )}
          >
            {formatHms(stats.remainingMs)}
          </div>

          {/* 4-Column Grid Stats (Ultra Dark Theme) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <StatBlock 
              label="Started at" 
              value={stats.firstPunchTime ? format(stats.firstPunchTime, "hh:mm a") : "--:--"} 
              className="bg-teal-950/40 border-teal-500/20 text-teal-100"
              icon={<Icons.Timer className="h-4 w-4 text-teal-400" />}
            />
            <StatBlock 
              label="Completes at" 
              value={format(stats.estimatedEndTime, "hh:mm a")} 
              className="bg-cyan-950/40 border-cyan-500/20 text-cyan-100"
              icon={<Icons.CheckCircle className="h-4 w-4 text-cyan-400" />}
            />
            <StatBlock 
              label="Total break" 
              value={formatHms(stats.totalBreakMs)} 
              className="bg-purple-950/40 border-purple-500/20 text-purple-100"
              icon={<Icons.Coffee className="h-4 w-4 text-purple-400" />}
            />
            <StatBlock 
              label="Daily goal" 
              value={`${stats.targetHours}h ${stats.targetMinutes}m`} 
              className="bg-rose-950/40 border-rose-500/20 text-rose-100"
              icon={<Icons.Target className="h-4 w-4 text-rose-400" />}
            />
          </div>
          
          {/* Progress Bar */}
          <div className="w-full mt-12 space-y-3">
             <div className="flex justify-between items-center px-2">
                <span className="text-sm font-semibold text-white/30 tracking-tight">Shift progress</span>
                <span className="text-sm font-black text-primary">{Math.round(stats.progress)}%</span>
             </div>
             <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000", stats.remainingMs <= 0 ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" : "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]")} 
                  style={{ width: `${stats.progress}%` }} 
                />
             </div>
          </div>
        </div>
      </Card>

      {/* 2. Activity History */}
      <Card className="p-8 rounded-[3rem] bg-card border-white/5 shadow-xl overflow-hidden relative group">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
               <Icons.Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Activity history</h3>
          </div>
          <span className="text-sm font-bold px-4 py-1.5 bg-white/5 rounded-full text-white/40 tracking-wide">
            {logs.length} Entries
          </span>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex items-start gap-12 pb-8 px-6">
            {logs.map((l, i) => {
              const isPunchIn = l.inOutType === "IN";
              const isLast = i === logs.length - 1;
              return (
                <div key={i} className="relative flex flex-col items-center group/node">
                  {!isLast && (
                    <div className="absolute left-[50%] top-[3.25rem] w-[calc(100%+3rem)] h-[2px] bg-white/5 group-hover/node:bg-primary/20 transition-colors z-0" />
                  )}
                  
                  <span className="text-lg font-bold text-foreground mb-5 tabular-nums">
                    {format(parseUtc(l.clockTime), "hh:mm a")}
                  </span>

                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 shadow-xl bg-[#09090b]",
                      isPunchIn
                        ? "border-emerald-500/40 ring-4 ring-emerald-500/5 group-hover/node:scale-110"
                        : "border-orange-500/40 ring-4 ring-orange-500/5 group-hover/node:scale-110"
                    )}
                  >
                    <Icons.RefreshCcw
                      className={cn(
                        "w-6 h-6",
                        isPunchIn ? "text-emerald-500" : "text-orange-500 rotate-180"
                      )}
                    />
                  </div>

                  <div className="mt-5 px-4 py-1.5 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-white/40 tracking-tight">
                      {isPunchIn ? "Clock in" : "Clock out"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* 3. Footer Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        <FooterMetric label="Attendance policy" value={data.policyName} />
        <FooterMetric label="Shift schedule" value={data.shiftName} />
        <FooterMetric label="Monthly average" value={`${monthStats?.workingHours.dayAvg.toFixed(1)}h / day`} />
        <FooterMetric 
          label="Late / Early logs" 
          value={`${monthStats?.gracePeriod.lateIn} In • ${monthStats?.gracePeriod.earlyOut} Out`} 
        />
      </div>
    </div>
  );
}

/* Sub-components */

function StatBlock({ label, value, icon, className }: { label: string; value: string; icon: React.ReactNode; className: string }) {
  return (
    <div className={cn("p-6 border rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.03] hover:bg-opacity-60 shadow-lg group", className)}>
      <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
        {icon}
        <span className="text-md font-medium tracking-wide">{label}</span>
      </div>
      <div className="text-4xl font-black tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function FooterMetric({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground/40 tracking-wide">
        {label}
      </span>
      <div className="text-sm font-bold text-muted-foreground/80 truncate max-w-full">
        {value || "Not available"}
      </div>
    </div>
  );
}