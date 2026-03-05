"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  format,
  differenceInMilliseconds,
  parse,
  isSameDay,
  addHours,
  differenceInMinutes,
  isValid,
} from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MewurkService, AttendanceData, CardDetailsResponse } from "@/services/mewurk";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MewurkLogsProps {
  targetHours: number;
  targetMinutes: number;
  onSettingsChange: (hours: string, minutes: string) => void;
}

export function MewurkLogs({ targetHours, targetMinutes, onSettingsChange }: MewurkLogsProps) {
  const { toast } = useToast();

  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [employeeCode, setEmployeeCode] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Settings State
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [tempHours, setTempHours] = useState(targetHours.toString());
  const [tempMinutes, setTempMinutes] = useState(targetMinutes.toString());

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data State
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState<AttendanceData | null>(null);
  const [monthStats, setMonthStats] = useState<CardDetailsResponse["data"]["cardDetails"] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time State (for live updates)
  const [currentTime, setCurrentTime] = useState(new Date());

  // UI State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [designTheme, setDesignTheme] = useState("original");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Init temp state when props change
  useEffect(() => {
    setTempHours(targetHours.toString());
    setTempMinutes(targetMinutes.toString());
  }, [targetHours, targetMinutes]);

  const handleSaveDuration = () => {
    onSettingsChange(tempHours, tempMinutes);
    setIsEditingDuration(false);
  };

  // Load auth from local storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("mewurk_auth_token");
    const storedEmpCode = localStorage.getItem("mewurk_employee_code");
    const storedName = localStorage.getItem("mewurk_user_name");

    if (storedToken && storedEmpCode) {
      setToken(storedToken);
      setEmployeeCode(storedEmpCode);
      if (storedName) setUserName(storedName);
    }

    // Timer for live calculation
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // every second
    return () => clearInterval(timer);
  }, []);

  const refreshSession = async () => {
    const storedRefreshToken = localStorage.getItem("mewurk_refresh_token");
    if (!storedRefreshToken) return false;

    try {
      const res = await MewurkService.refreshToken(storedRefreshToken);
      if (res.isSuccess && res.data.token) {
        const newToken = res.data.token;
        const newRefreshToken = res.data.refreshToken;

        localStorage.setItem("mewurk_auth_token", newToken);
        if (newRefreshToken) {
          localStorage.setItem("mewurk_refresh_token", newRefreshToken);
        }
        setToken(newToken);
        return true;
      }
    } catch (e) {
      console.error("Auto-login failed:", e);
    }
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const lookupRes = await MewurkService.lookupUser(email);
      if (!lookupRes.isSuccess || !lookupRes.data.tenantDetails.length) {
        throw new Error("User not found or no tenant associated.");
      }
      const tenantId = lookupRes.data.tenantDetails[0].tenantId;

      const loginRes = await MewurkService.loginUser(email, password, tenantId);
      if (!loginRes.isSuccess) {
        throw new Error(loginRes.message || "Login failed.");
      }

      const newToken = loginRes.data.token;
      const newEmpCode = String(loginRes.data.userModel.employeeCode);
      const newName = `${loginRes.data.userModel.firstName} ${loginRes.data.userModel.lastName}`;

      localStorage.setItem("mewurk_auth_token", newToken);
      if (loginRes.data.refreshToken) {
        localStorage.setItem("mewurk_refresh_token", loginRes.data.refreshToken);
      }
      localStorage.setItem("mewurk_employee_code", newEmpCode);
      localStorage.setItem("mewurk_user_name", newName);

      setToken(newToken);
      setEmployeeCode(newEmpCode);
      setUserName(newName);
      setEmail("");
      setPassword("");

      toast({ title: "Success", description: "Logged in to Mewurk successfully." });
    } catch (err: any) {
      setError(err.message || "Login failed. Please check credentials.");
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mewurk_auth_token");
    localStorage.removeItem("mewurk_refresh_token");
    localStorage.removeItem("mewurk_employee_code");
    localStorage.removeItem("mewurk_user_name");
    setToken(null);
    setEmployeeCode(null);
    setUserName(null);
    setData(null);
    setMonthStats(null); // Clear month stats on logout
  };

  const fetchLogs = async () => {
    if (!token || !employeeCode) return;

    setLoading(true);
    setError(null);

    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-indexed for API

      const [logsRes, statsRes] = await Promise.all([
        MewurkService.fetchAttendanceLogs(formattedDate, token, employeeCode),
        MewurkService.fetchCardDetails(token, employeeCode, year, month),
      ]);

      if (logsRes.isSuccess) {
        setData(logsRes.data);
      } else {
        if (logsRes.statusCode === 401) {
          // Try to refresh token
          const refreshed = await refreshSession();
          if (refreshed) {
            // Retry fetch (will happen automatically due to token dependency in useEffect)
            return;
          }

          handleLogout();
          toast({
            title: "Session Expired",
            description: "Please login again.",
            variant: "destructive",
          });
          return;
        }
        setError(logsRes.message || "Failed to fetch logs");
      }

      if (statsRes.isSuccess) {
        setMonthStats(statsRes.data.cardDetails);
      } else {
        console.error("Failed to fetch month stats:", statsRes.message);
        if (statsRes.statusCode === 401) {
          handleLogout();
          toast({
            title: "Session Expired",
            description: "Please login again.",
            variant: "destructive",
          });
          return;
        }
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      if (err.message && err.message.includes("401")) {
        handleLogout();
        toast({
          title: "Session Expired",
          description: "Please login again.",
          variant: "destructive",
        });
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && employeeCode) {
      fetchLogs();
    }
  }, [date, token, employeeCode]);

  // --- CALCULATIONS ---
  const parseUtc = (dateStr: string) => {
    if (!dateStr) return new Date();
    // If ISO format (e.g. 2026-02-06T04:16:00), force UTC by adding Z if missing
    if (dateStr.includes("T") && !dateStr.toLowerCase().includes("z")) {
      return new Date(dateStr + "Z");
    }
    // If custom format "MM/dd/yyyy HH:mm:ss", parse manually as UTC
    // e.g. "02/06/2026 10:31:00"
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
      const [datePart, timePart] = dateStr.split(" ");
      const [month, day, year] = datePart.split("/");
      const [hour, minute, second] = timePart.split(":");
      return new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
    }
    return new Date(dateStr);
  };

  const stats = useMemo(() => {
    if (!data || !data.clockInDetails.length) return null;

    // Sort logs by time (Oldest -> Newest) to ensure accurate sequence
    const logs = [...data.clockInDetails].sort((a, b) => {
      return new Date(a.clockTime).getTime() - new Date(b.clockTime).getTime();
    });

    const firstPunch = logs.find((l) => l.inOutType === "IN");
    const lastPunch = logs[logs.length - 1];

    let actualCompletionTime: Date | null = null;
    let accumulatedWorkMs = 0;
    let targetMet = false;

    // Variables for break calculation
    let totalWorkMs = 0;
    let totalBreakMs = 0;
    let breakCount = 0;

    // Calculate Shift Duration
    // Priority 1: Calculate from API provided shift times
    // Priority 2: Default to 8 hours 15 minutes (29700000 ms)
    let shiftTotalMs = 29700000; // Default 8h 15m
    let usedShiftTimes = false;

    if (data.shiftStartTime && data.shiftEndTime) {
      try {
        const shiftStart = parseUtc(data.shiftStartTime);
        const shiftEnd = parseUtc(data.shiftEndTime);

        if (isValid(shiftStart) && isValid(shiftEnd)) {
          const diff = differenceInMilliseconds(shiftEnd, shiftStart);
          if (diff > 0) {
            shiftTotalMs = diff;
            usedShiftTimes = true;
          }
        }
      } catch (e) {
        console.error("Failed to parse shift times for duration calculation", e);
      }
    }

    // First pass: Calculate accurate completion time based on logs
    for (let i = 0; i < logs.length; i++) {
      const current = logs[i];
      const next = logs[i + 1];
      const currentDate = parseUtc(current.clockTime);

      if (current.inOutType === "IN") {
        if (next && next.inOutType === "OUT") {
          // Completed session
          const nextDate = parseUtc(next.clockTime);
          const sessionDuration = differenceInMilliseconds(nextDate, currentDate);

          if (!targetMet) {
            if (accumulatedWorkMs + sessionDuration >= shiftTotalMs) {
              // Target met during this session
              const remainingToTarget = shiftTotalMs - accumulatedWorkMs;
              actualCompletionTime = new Date(currentDate.getTime() + remainingToTarget);
              targetMet = true;
            }
          }
          accumulatedWorkMs += sessionDuration;
        } else if (!next && isSameDay(currentDate, currentTime)) {
          // Ongoing session (if today)
          const sessionDuration = differenceInMilliseconds(currentTime, currentDate);

          if (!targetMet) {
            if (accumulatedWorkMs + sessionDuration >= shiftTotalMs) {
              // Target met just now/during current session
              const remainingToTarget = shiftTotalMs - accumulatedWorkMs;
              actualCompletionTime = new Date(currentDate.getTime() + remainingToTarget);
              targetMet = true;
            }
          }
          accumulatedWorkMs += sessionDuration;
        }
      }
    }

    // Calculate breaks (separate loop or logic, reused from existing but kept clean)
    // We need total work and break stats regardless of when target was met
    // The loop above calculated accumulatedWorkMs correctly for total work including overtime

    // But we need to ensure we count breaks correctly too
    for (let i = 0; i < logs.length; i++) {
      const current = logs[i];
      const next = logs[i + 1];
      const currentDate = parseUtc(current.clockTime);

      if (current.inOutType === "OUT") {
        // Check for break
        if (next && next.inOutType === "IN") {
          const nextDate = parseUtc(next.clockTime);
          breakCount++;
          totalBreakMs += differenceInMilliseconds(nextDate, currentDate);
        }
      }
    }

    totalWorkMs = accumulatedWorkMs; // Assign to the returned var

    const remainingMs = shiftTotalMs - totalWorkMs;
    const progress = Math.min(100, (totalWorkMs / shiftTotalMs) * 100);

    // If we haven't met target, Estimated is moving. If we met it, it's fixed.
    // actually, estimatedEndTime is mainly for "When WILL I finish".
    // actualCompletionTime is "When DID I finish".
    // We can unify this:
    // If targetMet, use actualCompletionTime.
    // If not met, use currentTime + remaining.

    const effectiveCompletionTime =
      actualCompletionTime || new Date(currentTime.getTime() + remainingMs);

    // Calculate target hours/mins for display
    const calculatedTargetHours = Math.floor(shiftTotalMs / (1000 * 60 * 60));
    const calculatedTargetMinutes = Math.floor((shiftTotalMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      firstPunchTime: firstPunch ? parseUtc(firstPunch.clockTime) : null,
      lastActivityTime: lastPunch ? parseUtc(lastPunch.clockTime) : null,
      isWorking: lastPunch?.inOutType === "IN",
      totalWorkMs,
      totalBreakMs,
      breakCount,
      remainingMs,
      progress,
      shiftTotalMs,
      estimatedEndTime: effectiveCompletionTime,
      targetHours: calculatedTargetHours,
      targetMinutes: calculatedTargetMinutes,
      isDefaultAndMissing: !usedShiftTimes,
    };
  }, [data, currentTime]);

  const formatHms = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const isSequenceBroken = useMemo(() => {
    if (!data?.clockInDetails || data.clockInDetails.length < 2) return false;
    for (let i = 0; i < data.clockInDetails.length - 1; i++) {
      if (data.clockInDetails[i].inOutType === data.clockInDetails[i + 1].inOutType) {
        return true;
      }
    }
    return false;
  }, [data]);

  const ActivityTimeline = ({ logs }: { logs: any[] }) => {
    return (
      <Card className="flex flex-col border border-border/80 dark:border-white/5 shadow-2xl bg-card dark:bg-[#090b14] text-card-foreground dark:text-white p-6 rounded-[2rem] overflow-hidden relative group h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-50 dark:opacity-50" />
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-2">
            <Icons.Activity className="h-5 w-5 text-pink-500" />
            <h3 className="text-xs font-bold text-muted-foreground/80 dark:text-muted-foreground/80">
              Activity History
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-pink-500 text-[10px] font-bold tracking-tight bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
              {logs.length} entries
            </span>
          </div>
        </div>

        <ScrollArea className="w-full pb-4 relative z-10">
          <div className="flex items-start gap-12 pt-6 pb-10 min-w-max px-8">
            {logs.map((log, index) => {
              const isLast = index === logs.length - 1;
              const isPunchIn = log.inOutType === "IN";
              const logTime = parseUtc(log.clockTime);
              let colorClass = "text-orange-500 dark:text-orange-400";
              let bgColorClass = "bg-orange-500/10";
              let ringColorClass = "ring-orange-500/20";
              if (isPunchIn) {
                if (index === 0) {
                  colorClass = "text-emerald-600 dark:text-emerald-400";
                  bgColorClass = "bg-emerald-500/10";
                  ringColorClass = "ring-emerald-500/20";
                } else {
                  colorClass = "text-purple-600 dark:text-purple-400";
                  bgColorClass = "bg-purple-500/10";
                  ringColorClass = "ring-purple-500/20";
                }
              } else if (isLast) {
                colorClass = "text-slate-500 dark:text-slate-400";
                bgColorClass = "bg-slate-500/10";
                ringColorClass = "ring-slate-500/20";
              }

              return (
                <div key={index} className="relative flex flex-col items-center group/node">
                  {!isLast && (
                    <div className="absolute left-[50%] top-[3.8rem] w-[calc(100%+3rem)] h-[1.5px] bg-pink-500/30 dark:bg-[#ff3366] z-0" />
                  )}
                  <span className="text-[12px] font-bold text-foreground/90 mb-4 font-mono">
                    {format(logTime, "HH:mm:ss")}
                  </span>
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full border-2 flex items-center justify-center relative z-10 transition-all duration-300 ring-4 shadow-lg",
                      "bg-background dark:bg-[#090b14]",
                      isPunchIn && index === 0
                        ? "border-emerald-500/40 ring-emerald-500/10 scale-110"
                        : "border-pink-500/20 ring-pink-500/5",
                      bgColorClass,
                      ringColorClass
                    )}
                  >
                    <Icons.RefreshCcw
                      className={cn("h-5 w-5", colorClass, !isPunchIn && "rotate-180")}
                    />
                  </div>
                  <div className="mt-5 px-3 py-1 bg-muted dark:bg-[#161b2c] rounded-lg border border-border/50 dark:border-white/5">
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {isPunchIn ? "Clock In" : "Clock Out"}
                    </span>
                  </div>
                  {isLast && isPunchIn && (
                    <div className="absolute top-[4rem] left-[50%] flex flex-col items-center">
                      <div className="h-10 w-[1.5px] bg-pink-500 mt-4 animate-pulse" />
                      <Icons.ArrowDown className="h-4 w-4 text-pink-500 animate-bounce" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>
    );
  };

  // Login View
  if (!token) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-xl border-primary/10 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Icons.Building className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Mewurk Connect</CardTitle>
            <CardDescription>Login with your corporate credentials</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  className="bg-background/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                    className="bg-background/50 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-9 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn}
                  >
                    {showPassword ? (
                      <Icons.EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <Icons.Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
                  <Icons.Info className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full shadow-lg shadow-primary/20"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Login to Mewurk
                    <Icons.LogIn className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Logs View
  return (
    <div className="flex flex-col gap-4 h-full font-sans overflow-hidden">
      {/* Header Badge */}
      <Card className="flex-none shadow-md border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-3 opacity-5">
          <Icons.Briefcase className="w-32 h-32 -mr-8 -mt-8" />
        </div>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="font-bold text-primary text-sm">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-base leading-none tracking-tight">
                {userName || "User"}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium">
                  Connected to Mewurk
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {mounted && (
              <>
                {/* Design Theme Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-background/80">
                      <Icons.Palette className="h-4 w-4" />
                      <span className="hidden sm:inline capitalize">{designTheme}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDesignTheme("original")}>
                      Original
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Light/Dark Toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background/80"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  title="Toggle Theme"
                >
                  {theme === "dark" ? (
                    <Icons.Sun className="h-4 w-4" />
                  ) : (
                    <Icons.Moon className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
            <div className="relative flex-1 sm:flex-none">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal bg-background/80",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Icons.Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setDate(newDate);
                        setIsCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={handleLogout}
              title="Logout"
            >
              <Icons.LogOut className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-in fade-in duration-500">
          <div className="relative">
            <Icons.Loader className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border border-primary opacity-20"></div>
          </div>
          <p className="text-sm font-medium">Fetching Records...</p>
        </div>
      ) : data && stats ? (
        <ScrollArea className="flex-1 pr-3 -mr-3">
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-8">
            {/* 0. Warning: Sequence Broken */}
            {isSequenceBroken && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-red-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                    <Icons.AlertTriangle className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-sm text-red-500">Sequence Broken</h4>
                </div>
                <div className="flex items-center gap-2 text-red-500/60 font-medium text-[10px] tracking-tight group-hover:text-red-500 transition-colors">
                  <span>Click here to see where it happened</span>
                  <Icons.ArrowRight className="h-3 w-3" />
                </div>
              </div>
            )}

            {/* 1. Primary: Time Remaining & Completes At & Total Break */}
            <Card className="flex-none shadow-xl border-border/80 dark:border-white/5 bg-card dark:bg-[#090b14] overflow-hidden relative group rounded-[2rem] p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 dark:from-blue-500/20 via-transparent to-pink-500/5 dark:to-pink-500/10 opacity-100" />
              <div className="relative z-10 space-y-8">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <span className="text-xs font-bold text-muted-foreground/60 tracking-tight">
                    {stats.remainingMs > 0 ? "Time remaining" : "Overtime session"}
                  </span>
                  <div
                    className={cn(
                      "text-6xl sm:text-7xl font-black font-mono tracking-tighter tabular-nums leading-none",
                      stats.remainingMs <= 0 ? "text-orange-500" : "text-foreground dark:text-white"
                    )}
                  >
                    {formatHms(Math.abs(stats.remainingMs))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted dark:bg-white/5 border border-border/50 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-1 group/item hover:border-pink-500/30 transition-all">
                    <span className="text-xs font-bold text-muted-foreground/60 group-hover/item:text-pink-500 transition-colors">
                      {stats.remainingMs <= 0 ? "Finished at" : "Completes at"}
                    </span>
                    <div className="text-3xl font-black font-mono text-foreground dark:text-white">
                      {format(stats.estimatedEndTime, "hh:mm a")}
                    </div>
                  </div>
                  <div className="bg-muted dark:bg-white/5 border border-border/50 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-1 group/item hover:border-pink-500/30 transition-all">
                    <span className="text-xs font-bold text-muted-foreground/60 group-hover/item:text-pink-500 transition-colors">
                      Total break
                    </span>
                    <div className="text-3xl font-black font-mono text-foreground dark:text-white">
                      {formatHms(stats.totalBreakMs)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-muted-foreground/60">
                      Work progress
                    </span>
                    <span className="text-xs font-black font-mono text-foreground dark:text-white">
                      {Math.round(stats.progress)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-muted/50 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-border/50 dark:border-white/5">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        stats.remainingMs <= 0 ? "bg-orange-500" : "bg-blue-600"
                      )}
                      style={{ width: `${Math.min(100, stats.progress)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Middle Section: Timeline (70%) & Stats (30%) */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              <div className="lg:col-span-7">
                <ActivityTimeline
                  logs={[...data.clockInDetails].sort(
                    (a, b) => new Date(a.clockTime).getTime() - new Date(b.clockTime).getTime()
                  )}
                />
              </div>
              <div className="lg:col-span-3 flex flex-col gap-4">
                <Card className="bg-card dark:bg-[#12141c] border-border/80 dark:border-white/5 rounded-2xl p-6 flex flex-col gap-2 flex-1 justify-center shadow-lg dark:shadow-none transition-shadow">
                  <div className="flex items-center gap-2">
                    <Icons.Timer className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-muted-foreground/60">Started at</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-foreground dark:text-white">
                    {stats.firstPunchTime ? format(stats.firstPunchTime, "hh:mm a") : "--:--"}
                  </div>
                </Card>
                <Card className="bg-card dark:bg-[#12141c] border-border/80 dark:border-white/5 rounded-2xl p-6 flex flex-col gap-2 flex-1 justify-center shadow-lg dark:shadow-none transition-shadow">
                  <div className="flex items-center gap-2">
                    <Icons.Target className="h-4 w-4 text-pink-500" />
                    <span className="text-xs font-bold text-muted-foreground/60">Goal</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-foreground dark:text-white">
                    {stats.targetHours}h {stats.targetMinutes > 0 ? `${stats.targetMinutes}m` : ""}
                  </div>
                </Card>
              </div>
            </div>

            {/* 4. Others: Monthly Stats & Active Info */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/80 dark:border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground/40">Avg hours</span>
                <div className="text-lg font-bold text-muted-foreground">
                  {monthStats?.workingHours.dayAvg.toFixed(1)}h
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground/40">Late / Early</span>
                <div className="text-lg font-bold text-muted-foreground">
                  {monthStats?.gracePeriod.lateIn} / {monthStats?.gracePeriod.earlyOut}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground/40">Shift</span>
                <div className="text-xs font-bold text-muted-foreground truncate">
                  {data.shiftName || "N/A"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground/40">Policy</span>
                <div className="text-xs font-bold text-muted-foreground truncate">
                  {data.policyName || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-80">
          <Icons.Calendar className="h-12 w-12 stroke-1" />
          <p className="text-sm">Select a specific date to view attendance logs.</p>
        </div>
      )}
    </div>
  );
}
