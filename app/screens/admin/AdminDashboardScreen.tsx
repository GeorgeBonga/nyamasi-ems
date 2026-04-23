/**
 * AdminDashboardScreen.tsx — FULLY REFACTORED
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes:
 *  • KPI filter → inline popover next to button, not bottom sheet
 *  • Notification bell → tracks employee logins, opens modal list
 *  • Custom date range → fully working date pickers with real filtering
 *  • Bottom modals → safe-area-aware padding (respects nav bar)
 *  • Sales chart → smooth cubic-bezier curves instead of polylines
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
  Platform,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import Svg, { Line, Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users, TrendingUp, Gift, Target, ChevronDown, ChevronLeft, ChevronRight,
  Bell, Wifi, WifiOff, Filter, Award, BarChart2, Calendar, Menu, X,
  LogIn, Check,
} from "lucide-react-native";

import {
  getDashboardKpis,
  getChartData,
  getEmployees,
  getReportsByDateRange,
  DashboardKpis,
  ChartDataset,
  Employee,
  supabase,
} from "../../data/dbService";

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_H = 220;
const CHART_PAD = { left: 42, right: 16, top: 16, bottom: 32 };

const COLORS = {
  primary:       "#8B0111",
  primaryDark:   "#8B0111",
  primaryMuted:  "rgba(139,1,17,0.09)",
  primaryLight:  "#fdf0f1",
  white:         "#FFFFFF",
  background:    "#F0F5FB",
  cardBg:        "#FFFFFF",
  textPrimary:   "#0D2137",
  textSecondary: "#4A6580",
  textMuted:     "#8FA3B8",
  border:        "#D6E4F0",
  success:       "#00897B",
  successLight:  "#E0F2F1",
  warning:       "#F57C00",
  warningLight:  "#FFF3E0",
  accentBlue:    "#1565C0",
  accentBlueLt:  "#E3F0FF",
  online:        "#43A047",
  onlineLight:   "#E8F5E9",
  offline:       "#9E9E9E",
  offlineLight:  "#F5F5F5",
  overlay:       "rgba(13,33,55,0.55)",
};

type ChartFilter = "Daily" | "Weekly" | "Monthly" | "Custom";
type KpiFilter   = "Today" | "This Week" | "This Month";

// ── Date helpers ──────────────────────────────────────────────────────────────
const todayISO = (): string => new Date().toISOString().split("T")[0];

const formatDisplay = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const dateRangeForKpi = (filter: KpiFilter): { from: string; to: string } => {
  const to = todayISO();
  if (filter === "Today") return { from: to, to };
  if (filter === "This Week") {
    const d = new Date(to + "T00:00:00");
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().split("T")[0], to };
  }
  return { from: to.slice(0, 7) + "-01", to };
};

const getWeekRange = (): { from: string; to: string } => {
  const to = todayISO();
  const d = new Date(to + "T00:00:00");
  d.setDate(d.getDate() - 6);
  return { from: d.toISOString().split("T")[0], to };
};

// ── Notification type ─────────────────────────────────────────────────────────
interface LoginNotification {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: Date;
  read: boolean;
}





// ── Smooth bezier path helper ─────────────────────────────────────────────────
const smoothPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length < 2) return "";
  const d: string[] = [`M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d.push(`C ${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`);
  }
  return d.join(" ");
};

const smoothAreaPath = (pts: { x: number; y: number }[], bottom: number): string => {
  if (!pts.length) return "";
  const line = smoothPath(pts);
  return `${line} L ${pts[pts.length - 1].x.toFixed(1)},${bottom} L ${pts[0].x.toFixed(1)},${bottom} Z`;
};

// ─── EmpWithSales ─────────────────────────────────────────────────────────────
interface EmpWithSales extends Employee {
  weeklySales: number;
  weeklyCustomers: number;
  weeklySamplers: number;
}


// ─── Mini Calendar Picker ─────────────────────────────────────────────────────
const MiniCalendar: React.FC<{
  value: string;
  onChange: (iso: string) => void;
  maxDate?: string;
  minDate?: string;
}> = ({ value, onChange, maxDate, minDate }) => {
  const [viewYear, setViewYear]   = useState(() => parseInt(value.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(value.slice(5, 7)) - 1);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDay    = (y: number, m: number) => new Date(y, m, 1).getDay();

  const cells: (number | null)[] = [];
  const fd = firstDay(viewYear, viewMonth);
  for (let i = 0; i < fd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth(viewYear, viewMonth); d++) cells.push(d);

  const isoFor = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <View style={cal.wrap}>
      <View style={cal.header}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <ChevronLeft size={16} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <ChevronRight size={16} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={cal.grid}>
        {DAYS.map(d => (
          <Text key={d} style={cal.dayHeader}>{d}</Text>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <View key={`e${i}`} style={cal.cell} />;
          const iso = isoFor(cell);
          const isSelected = iso === value;
          const isDisabled =
            (maxDate && iso > maxDate) || (minDate && iso < minDate);
          return (
            <TouchableOpacity
              key={iso}
              style={[cal.cell, isSelected && cal.cellSelected, isDisabled && cal.cellDisabled]}
              onPress={() => !isDisabled && onChange(iso)}
              activeOpacity={0.7}
              disabled={!!isDisabled}
            >
              <Text style={[cal.cellText, isSelected && cal.cellTextSelected, isDisabled && cal.cellTextDisabled]}>
                {cell}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const cal = StyleSheet.create({
  wrap:      { marginBottom: 8 },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  navBtn:    { padding: 6 },
  monthLabel:{ fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  grid:      { flexDirection: "row", flexWrap: "wrap" },
  dayHeader: { width: "14.28%", textAlign: "center", fontSize: 10, fontWeight: "700", color: COLORS.textMuted, paddingVertical: 4 },
  cell:      { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  cellSelected:     { backgroundColor: COLORS.primary },
  cellDisabled:     { opacity: 0.3 },
  cellText:         { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  cellTextSelected: { color: "#fff", fontWeight: "800" },
  cellTextDisabled: { color: COLORS.textMuted },
});

// ─── SVG Smooth Line Chart ────────────────────────────────────────────────────
const LineChart: React.FC<{ data: ChartDataset }> = ({ data }) => {
  const cW = SCREEN_WIDTH - 36 - 32 - CHART_PAD.left - CHART_PAD.right;
  const n  = data.labels.length;
  const stepX = n > 1 ? cW / (n - 1) : cW;

  const allValues = [...data.sales, ...data.samplers, ...data.customers];
  const rawMax    = Math.max(...allValues, 1);
  const rawMin    = Math.min(...allValues, 0);
  const padding   = (rawMax - rawMin) * 0.1;
  const globalMax = rawMax + padding;
  const globalMin = Math.max(0, rawMin - padding);

  const plotH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;
  const norm  = (v: number) =>
    CHART_PAD.top + plotH - ((v - globalMin) / (globalMax - globalMin || 1)) * plotH;

  const pts    = (arr: number[]) => arr.map((v, i) => ({ x: i * stepX, y: norm(v) }));
  const bottom = CHART_H - CHART_PAD.bottom;

  const salesPts     = pts(data.sales);
  const samplersPts  = pts(data.samplers);
  const customersPts = pts(data.customers);

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const v = globalMin + ((yTicks - 1 - i) / (yTicks - 1)) * (globalMax - globalMin);
    return Math.round(v);
  });

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        {/* Y axis labels */}
        <View style={{ width: CHART_PAD.left, height: CHART_H, justifyContent: "space-between",
          paddingBottom: CHART_PAD.bottom, paddingTop: CHART_PAD.top }}>
          {yLabels.map((v, i) => (
            <Text key={i} style={chartSt.yLabel}>{v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}</Text>
          ))}
        </View>

        <View style={{ flex: 1, height: CHART_H }}>
          <Svg width={cW + CHART_PAD.right} height={CHART_H}>
            <Defs>
              <LinearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.18" />
                <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            {yLabels.map((_, i) => {
              const y = CHART_PAD.top + (i / (yTicks - 1)) * plotH;
              return (
                <Line key={i} x1="0" y1={y} x2={cW} y2={y}
                  stroke={COLORS.border} strokeWidth="1"
                  opacity="0.6" strokeDasharray="5,5" />
              );
            })}

            {/* Gradient fill under sales */}
            <Path d={smoothAreaPath(salesPts, bottom)} fill="url(#salesGrad)" />

            {/* Samplers — dashed smooth */}
            <Path d={smoothPath(samplersPts)}
              fill="none" stroke={COLORS.success}
              strokeWidth="2" strokeLinecap="round"
              strokeDasharray="6,4" />

            {/* Customers — smooth */}
            <Path d={smoothPath(customersPts)}
              fill="none" stroke={COLORS.accentBlue}
              strokeWidth="2" strokeLinecap="round" />

            {/* Sales — smooth, thickest */}
            <Path d={smoothPath(salesPts)}
              fill="none" stroke={COLORS.primary}
              strokeWidth="2.8" strokeLinecap="round" />

            {/* Sales dots */}
            {salesPts.map((p, i) => (
              <Circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4.5"
                fill={COLORS.primary} stroke={COLORS.white} strokeWidth="2" />
            ))}
          </Svg>
        </View>
      </View>

      {/* X axis */}
      <View style={{ flexDirection: "row", marginLeft: CHART_PAD.left, marginTop: 6 }}>
        {data.labels.map((l, i) => (
          <Text key={i} style={[chartSt.xLabel, {
            width: i < n - 1 ? stepX : undefined,
            textAlign: i === 0 ? "left" : i === n - 1 ? "right" : "center",
          }]}>{l}</Text>
        ))}
      </View>
    </View>
  );
};

// ─── Chart Legend ─────────────────────────────────────────────────────────────
const ChartLegend: React.FC = () => (
  <View style={chartSt.legend}>
    {[
      { color: COLORS.primary,    label: "Sales",     dash: false },
      { color: COLORS.success,    label: "Samplers",  dash: true  },
      { color: COLORS.accentBlue, label: "Customers", dash: false },
    ].map(({ color, label, dash }) => (
      <View key={label} style={chartSt.legendItem}>
        <View style={[chartSt.legendDash, { backgroundColor: color, opacity: dash ? 0.7 : 1 }]}>
          {dash && <View style={[chartSt.dashGap, { backgroundColor: COLORS.cardBg }]} />}
        </View>
        <Text style={chartSt.legendText}>{label}</Text>
      </View>
    ))}
  </View>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; bg: string; iconBg: string;
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon, bg, iconBg }) => (
  <View style={[styles.kpiCard, { backgroundColor: bg }]}>
    <View style={[styles.kpiIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
    <Text style={styles.kpiValue}>{typeof value === "number" ? value.toLocaleString() : value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiSub}>{sub}</Text>
  </View>
);

// ─── Employee Row ─────────────────────────────────────────────────────────────
const EmployeeRow: React.FC<{ emp: EmpWithSales; rank: number }> = ({ emp, rank }) => (
  <View style={styles.empRow}>
    <Text style={styles.empRank}>#{rank}</Text>
    <View style={styles.empAvatarWrap}>
      <View style={[styles.empAvatar, { backgroundColor: emp.online ? COLORS.accentBlueLt : COLORS.offlineLight }]}>
        <Text style={[styles.empInitials, { color: emp.online ? COLORS.accentBlue : COLORS.offline }]}>
          {emp.initials}
        </Text>
      </View>
      <View style={[styles.onlineDot, { backgroundColor: emp.online ? COLORS.online : COLORS.offline }]} />
    </View>
    <View style={styles.empInfo}>
      <Text style={styles.empName}>{emp.fullName}</Text>
      <Text style={styles.empMeta}>{emp.assignedArea} · {emp.role}</Text>
    </View>
    <View style={styles.empStats}>
      <Text style={styles.empStatVal}>{emp.weeklySales}</Text>
      <Text style={styles.empStatLbl}>weekly</Text>
    </View>
    <View style={[styles.statusBadge, { backgroundColor: emp.online ? COLORS.onlineLight : COLORS.offlineLight }]}>
      {emp.online ? <Wifi size={11} color={COLORS.online} /> : <WifiOff size={11} color={COLORS.offline} />}
      <Text style={[styles.statusText, { color: emp.online ? COLORS.online : COLORS.offline }]}>
        {emp.online ? "Active" : "Offline"}
      </Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AdminDashboardScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
   const insets = useSafeAreaInsets();

  // Chart & filter state
  const [chartFilter, setChartFilter] = useState<ChartFilter>("Weekly");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>("This Week");
  const [empTab, setEmpTab] = useState<"all" | "online" | "offline">("all");

  // Popover & modals
  const [showKpiPopover, setShowKpiPopover] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Custom date range
  const [customFrom, setCustomFrom] = useState(getWeekRange().from);
  const [customTo, setCustomTo] = useState(todayISO());
  const [calendarTarget, setCalendarTarget] = useState<"from" | "to">("from");
  const [pendingFrom, setPendingFrom] = useState(getWeekRange().from);
  const [pendingTo, setPendingTo] = useState(todayISO());

  // Notifications
  const [notifications, setNotifications] = useState<LoginNotification[]>([]);

  // Data state
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [chartData, setChartData] = useState<ChartDataset | null>(null);
  const [employees, setEmployees] = useState<EmpWithSales[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD THIS CODE BELOW (inside the component)
  // ═══════════════════════════════════════════════════════════════════════════

  // Load existing notifications from database
  const loadNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted: LoginNotification[] = (data || []).map((n: any) => ({
        id: n.id,
        employeeId: n.employee_id,
        employeeName: n.employee_name,
        timestamp: new Date(n.created_at),
        read: n.read,
      }));

      setNotifications(formatted);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // REAL-TIME CHECK-IN NOTIFICATIONS
  // useEffect(() => {
  //   // Subscribe to new checkins
  //   const checkinSubscription = supabase
  //     .channel("checkins-channel")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "INSERT",
  //         schema: "public",
  //         table: "checkins",
  //       },
  //       async (payload) => {
  //         const newCheckin = payload.new;
          
  //         const { data: emp } = await supabase
  //           .from("employees")
  //           .select("full_name")
  //           .eq("id", newCheckin.employee_id)
  //           .single();

  //         if (emp) {
  //           const newNotification: LoginNotification = {
  //             id: `notif-${newCheckin.id}`,
  //             employeeId: newCheckin.employee_id,
  //             employeeName: emp.full_name,
  //             timestamp: new Date(newCheckin.check_in_time),
  //             read: false,
  //           };

  //           setNotifications(prev => [newNotification, ...prev]);
  //         }
  //       }
  //     )
  //     .subscribe();

  //   // Subscribe to employee online status changes
  //   const employeeSubscription = supabase
  //     .channel("employees-channel")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "UPDATE",
  //         schema: "public",
  //         table: "employees",
  //       },
  //       async (payload) => {
  //         const updatedEmp = payload.new;
  //         const oldEmp = payload.old;
          
  //         if (!oldEmp.online && updatedEmp.online) {
  //           const newNotification: LoginNotification = {
  //             id: `notif-online-${updatedEmp.id}-${Date.now()}`,
  //             employeeId: updatedEmp.id,
  //             employeeName: updatedEmp.full_name,
  //             timestamp: new Date(),
  //             read: false,
  //           };

  //           setNotifications(prev => [newNotification, ...prev]);
  //         }
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     checkinSubscription.unsubscribe();
  //     employeeSubscription.unsubscribe();
  //   };
  // }, []);

  // REAL-TIME NOTIFICATIONS - Combined into single channel
useEffect(() => {
  // Create ONE channel for all real-time updates
  const channel = supabase
    .channel("admin-notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "checkins",
      },
      async (payload) => {
        const newCheckin = payload.new;
        
        const { data: emp } = await supabase
          .from("employees")
          .select("full_name")
          .eq("id", newCheckin.employee_id)
          .single();

        if (emp) {
          const newNotification: LoginNotification = {
            id: `notif-${newCheckin.id}`,
            employeeId: newCheckin.employee_id,
            employeeName: emp.full_name,
            timestamp: new Date(newCheckin.check_in_time),
            read: false,
          };

          setNotifications(prev => [newNotification, ...prev]);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "employees",
      },
      async (payload) => {
        const updatedEmp = payload.new;
        const oldEmp = payload.old;
        
        if (!oldEmp.online && updatedEmp.online) {
          const newNotification: LoginNotification = {
            id: `notif-online-${updatedEmp.id}-${Date.now()}`,
            employeeId: updatedEmp.id,
            employeeName: updatedEmp.full_name,
            timestamp: new Date(),
            read: false,
          };

          setNotifications(prev => [newNotification, ...prev]);
        }
      }
    )
    .subscribe(); // ✅ Only ONE subscribe call for the whole channel

  return () => {
    channel.unsubscribe();
  };
}, []);

  const markAllRead = async () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);
  };

  // ── Load KPIs ─────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async (filter: KpiFilter, from?: string, to?: string) => {
    setKpiLoading(true);
    try {
      const range = from && to ? { from, to } : dateRangeForKpi(filter);
      const data  = await getDashboardKpis(range.from, range.to);
      setKpis(data);
    } catch (e) { console.error(e); }
    finally { setKpiLoading(false); }
  }, []);

  // ── Load chart ────────────────────────────────────────────────────────────
  const loadChart = useCallback(async (filter: ChartFilter, from?: string, to?: string) => {
    setChartLoading(true);
    try {
      let mode: "daily" | "weekly" | "monthly" | "custom";
      if      (filter === "Daily")   mode = "daily";
      else if (filter === "Weekly")  mode = "weekly";
      else if (filter === "Monthly") mode = "monthly";
      else                           mode = "custom";

      const data = mode === "custom" && from && to
        ? await getChartData("custom", todayISO(), from, to)
        : await getChartData(mode as any, todayISO());
      setChartData(data);
    } catch (e) { console.error(e); }
    finally { setChartLoading(false); }
  }, []);

  // ── Load employees ────────────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setEmpLoading(true);
    try {
      const range = getWeekRange();
      const [emps, reports] = await Promise.all([
        getEmployees(),
        getReportsByDateRange(range.from, range.to),
      ]);
      const map: Record<string, { sales: number; customers: number; samplers: number }> = {};
      reports.forEach(r => {
        if (!map[r.employeeId]) map[r.employeeId] = { sales: 0, customers: 0, samplers: 0 };
        map[r.employeeId].sales     += r.sales;
        map[r.employeeId].customers += r.customersReached;
        map[r.employeeId].samplers  += r.samplersGiven;
      });
      setEmployees(emps.map(e => ({
        ...e,
        weeklySales:     map[e.id]?.sales     ?? 0,
        weeklyCustomers: map[e.id]?.customers ?? 0,
        weeklySamplers:  map[e.id]?.samplers  ?? 0,
      })));
    } catch (e) { console.error(e); }
    finally { setEmpLoading(false); }
  }, []);

  useEffect(() => { loadKpis(kpiFilter); },    [kpiFilter]);
  useEffect(() => { loadChart(chartFilter); },  [chartFilter]);
  useEffect(() => { loadEmployees(); },         []);

  // ── Apply custom date range ───────────────────────────────────────────────
  const applyCustomRange = () => {
    setCustomFrom(pendingFrom);
    setCustomTo(pendingTo);
    setChartFilter("Custom");
    loadChart("Custom", pendingFrom, pendingTo);
    setShowDateModal(false);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const onlineCount = employees.filter(e => e.online && e.status === "active").length;
  const offlineCount= employees.filter(e => !e.online && e.status === "active").length;
  const filteredEmps= employees
    .filter(e => e.status === "active")
    .filter(e => empTab === "all" ? true : empTab === "online" ? e.online : !e.online)
    .sort((a, b) => b.weeklySales - a.weeklySales);

  const KPI_FILTERS:   KpiFilter[]   = ["Today", "This Week", "This Month"];
  const CHART_FILTERS: ChartFilter[] = ["Daily", "Weekly", "Monthly"];

  const timeAgo = (d: Date): string => {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation?.openDrawer()} activeOpacity={0.7}>
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerGreet}>Welcome back,</Text>
          <Text style={styles.headerTitle}>Admin</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.75}
          onPress={() => { setShowNotifModal(true); markAllRead(); }}
        >
          <Bell size={18} color={COLORS.white} />
          {unreadCount > 0 && (
            <View style={styles.notifDot}>
              <Text style={styles.notifDotText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Filter Row */}
        <View style={styles.kpiFilterRow}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View>
            <TouchableOpacity
              style={styles.kpiFilterBtn}
              onPress={() => setShowKpiPopover(v => !v)}
              activeOpacity={0.8}
            >
              <Filter size={12} color={COLORS.primary} />
              <Text style={styles.kpiFilterText}>{kpiFilter}</Text>
              <ChevronDown size={12} color={COLORS.primary}
                style={{ transform: [{ rotate: showKpiPopover ? "180deg" : "0deg" }] }} />
            </TouchableOpacity>

            {/* ── Inline Popover ── */}
            {showKpiPopover && (
              <View style={styles.kpiPopover}>
                {KPI_FILTERS.map((f, i) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.popoverOption,
                      i < KPI_FILTERS.length - 1 && styles.popoverOptionBorder,
                      kpiFilter === f && styles.popoverOptionActive,
                    ]}
                    onPress={() => { setKpiFilter(f); setShowKpiPopover(false); }}
                    activeOpacity={0.75}
                  >
                    {kpiFilter === f && <Check size={13} color={COLORS.primary} strokeWidth={2.5} />}
                    <Text style={[styles.popoverOptionText, kpiFilter === f && styles.popoverOptionTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Touch-away to close popover */}
        {showKpiPopover && (
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowKpiPopover(false)}
            activeOpacity={0}
          />
        )}

        {/* KPI Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.kpiScroll} contentContainerStyle={styles.kpiScrollContent}>
          {kpiLoading ? (
            [1,2,3,4,5,6].map(i => (
              <View key={i} style={[styles.kpiCard, { backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" }]}>
                <ActivityIndicator color={COLORS.primary} size="small" />
              </View>
            ))
          ) : kpis ? (
            <>
              <KpiCard label="Total Sales"    value={kpis.totalSales}          sub={`${kpiFilter}`}
                icon={<TrendingUp size={18} color={COLORS.primary} />}   bg={COLORS.cardBg} iconBg={COLORS.primaryMuted} />
              <KpiCard label="Employees"      value={kpis.totalEmployees}      sub={`${kpis.onlineEmployees} active`}
                icon={<Users size={18} color={COLORS.accentBlue} />}     bg={COLORS.cardBg} iconBg={COLORS.accentBlueLt} />
              <KpiCard label="Samplers"       value={kpis.totalSamplers}       sub={`${kpiFilter}`}
                icon={<Gift size={18} color={COLORS.success} />}         bg={COLORS.cardBg} iconBg={COLORS.successLight} />
              <KpiCard label="Avg Sales/Rep"  value={kpis.avgSalesPerEmployee} sub="Per rep"
                icon={<Target size={18} color={COLORS.warning} />}       bg={COLORS.cardBg} iconBg={COLORS.warningLight} />
              <KpiCard label="Top Performer"  value={kpis.topPerformer?.firstName?.split(" ")[0] ?? "—"} sub="Highest sales"
                icon={<Award size={18} color={COLORS.primary} />}        bg={COLORS.cardBg} iconBg={COLORS.primaryMuted} />
              <KpiCard label="Conversion"     value={`${kpis.conversionRate}%`} sub="Sales → Samplers"
                icon={<BarChart2 size={18} color={COLORS.accentBlue} />} bg={COLORS.cardBg} iconBg={COLORS.accentBlueLt} />
            </>
          ) : null}
        </ScrollView>

        {/* Sales Chart */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Sales Performance</Text>
            {chartFilter === "Custom" && (
              <Text style={styles.customRangeLabel}>
                {formatDisplay(customFrom)} — {formatDisplay(customTo)}
              </Text>
            )}
          </View>

          <View style={styles.filterPills}>
            {CHART_FILTERS.map(f => (
              <TouchableOpacity key={f}
                style={[styles.pill, chartFilter === f && styles.pillActive]}
                onPress={() => setChartFilter(f)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, chartFilter === f && styles.pillTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.pill, chartFilter === "Custom" && styles.pillActive]}
              onPress={() => { setPendingFrom(customFrom); setPendingTo(customTo); setShowDateModal(true); }}
              activeOpacity={0.75}
            >
              <Calendar size={11} color={chartFilter === "Custom" ? COLORS.white : COLORS.textMuted} />
              <Text style={[styles.pillText, chartFilter === "Custom" && styles.pillTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>

          <ChartLegend />
          {chartLoading || !chartData ? (
            <View style={{ height: CHART_H, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : (
            <LineChart data={chartData} />
          )}
        </View>

        {/* Team Overview */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View>
              <Text style={styles.cardTitle}>Team Overview</Text>
              <Text style={styles.cardSub}>
                <Text style={{ color: COLORS.online }}>{onlineCount} active</Text>
                {"  ·  "}
                <Text style={{ color: COLORS.offline }}>{offlineCount} offline</Text>
              </Text>
            </View>
            <View style={styles.empCountBadge}>
              <Text style={styles.empCountText}>{employees.filter(e => e.status === "active").length}</Text>
            </View>
          </View>

          <View style={styles.empTabs}>
            {(["all", "online", "offline"] as const).map(tab => (
              <TouchableOpacity key={tab}
                style={[styles.empTab, empTab === tab && styles.empTabActive]}
                onPress={() => setEmpTab(tab)}
                activeOpacity={0.8}
              >
                <View style={[styles.empTabDot,
                  { backgroundColor: tab === "online" ? COLORS.online : tab === "offline" ? COLORS.offline : COLORS.primary },
                  empTab !== tab && { opacity: 0 }]} />
                <Text style={[styles.empTabText, empTab === tab && styles.empTabTextActive]}>
                  {tab === "all" ? `All (${employees.filter(e=>e.status==="active").length})`
                    : tab === "online" ? `Active (${onlineCount})` : `Offline (${offlineCount})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.empHeader}>
            <Text style={[styles.empHeaderText, { width: 32 }]}>Rank</Text>
            <Text style={[styles.empHeaderText, { width: 48 }]}> </Text>
            <Text style={[styles.empHeaderText, { flex: 1 }]}>Employee</Text>
            <Text style={[styles.empHeaderText, { width: 60, textAlign: "right" }]}>Weekly</Text>
            <Text style={[styles.empHeaderText, { width: 66, textAlign: "right" }]}>Status</Text>
          </View>

          {empLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : filteredEmps.length === 0 ? (
            <Text style={styles.emptyText}>No employees found</Text>
          ) : (
            filteredEmps.map((emp, i) => (
              <React.Fragment key={emp.id}>
                <EmployeeRow emp={emp} rank={i + 1} />
                {i < filteredEmps.length - 1 && <View style={styles.empDivider} />}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════════════════
          NOTIFICATION MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showNotifModal} transparent animationType="slide"
        onRequestClose={() => setShowNotifModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject}
            onPress={() => setShowNotifModal(false)} activeOpacity={1} />
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Notifications</Text>
                <Text style={styles.sheetSub}>{notifications.length} employee logins</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotifModal(false)} style={styles.sheetCloseBtn}>
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyNotif}>
                <Bell size={32} color={COLORS.border} />
                <Text style={styles.emptyNotifText}>No notifications yet</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {notifications.map((n, i) => (
                  <View key={n.id} style={[styles.notifRow, i < notifications.length - 1 && styles.notifRowBorder]}>
                    <View style={styles.notifIcon}>
                      <LogIn size={15} color={COLORS.success} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifName}>{n.employeeName}</Text>
                      <Text style={styles.notifDetail}>Checked in · {timeAgo(n.timestamp)}</Text>
                    </View>
                    <View style={styles.notifOnline} />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          CUSTOM DATE RANGE MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showDateModal} transparent animationType="slide"
        onRequestClose={() => setShowDateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject}
              onPress={() => setShowDateModal(false)} activeOpacity={1} />
            <View style={[styles.bottomSheet, styles.dateSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Custom Date Range</Text>
                <TouchableOpacity onPress={() => setShowDateModal(false)} style={styles.sheetCloseBtn}>
                  <X size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Range display pills */}
              <View style={styles.rangeRow}>
                <TouchableOpacity
                  style={[styles.rangePill, calendarTarget === "from" && styles.rangePillActive]}
                  onPress={() => setCalendarTarget("from")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rangePillLabel}>From</Text>
                  <Text style={[styles.rangePillDate, calendarTarget === "from" && { color: COLORS.primary }]}>
                    {formatDisplay(pendingFrom)}
                  </Text>
                </TouchableOpacity>
                <View style={styles.rangeDash} />
                <TouchableOpacity
                  style={[styles.rangePill, calendarTarget === "to" && styles.rangePillActive]}
                  onPress={() => setCalendarTarget("to")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rangePillLabel}>To</Text>
                  <Text style={[styles.rangePillDate, calendarTarget === "to" && { color: COLORS.primary }]}>
                    {formatDisplay(pendingTo)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Calendar */}
              <MiniCalendar
                value={calendarTarget === "from" ? pendingFrom : pendingTo}
                onChange={iso => {
                  if (calendarTarget === "from") {
                    setPendingFrom(iso);
                    if (iso > pendingTo) setPendingTo(iso);
                    setCalendarTarget("to");
                  } else {
                    if (iso < pendingFrom) { setPendingFrom(iso); }
                    else setPendingTo(iso);
                  }
                }}
                maxDate={calendarTarget === "to" ? todayISO() : undefined}
                minDate={calendarTarget === "to" ? pendingFrom : undefined}
              />

              {/* Apply */}
              <TouchableOpacity style={styles.applyBtn} onPress={applyCustomRange} activeOpacity={0.85}>
                <Check size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.applyBtnText}>Apply Range</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const chartSt = StyleSheet.create({
  yLabel:     { fontSize: 10, color: COLORS.textMuted, textAlign: "right", fontWeight: "600", paddingRight: 6 },
  xLabel:     { fontSize: 10, color: COLORS.textMuted, fontWeight: "600", marginTop: 4 },
  legend:     { flexDirection: "row", gap: 16, marginBottom: 14, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDash: { width: 22, height: 3, borderRadius: 2, overflow: "hidden", justifyContent: "center" },
  dashGap:    { width: 6, height: 3, alignSelf: "center" },
  legendText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
});

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.primaryDark },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerGreet:  { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  headerTitle:  { fontSize: 20, fontWeight: "800", color: COLORS.white },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  notifDot: {
    position: "absolute", top: 5, right: 5,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.warning,
    borderWidth: 1.5, borderColor: COLORS.primaryDark,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 2,
  },
  notifDotText: { fontSize: 8, fontWeight: "800", color: "#fff" },

  scroll:        { flex: 1, backgroundColor: COLORS.background, 
    // borderTopLeftRadius: 24, borderTopRightRadius: 24,
     marginTop: -8 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 18 },

  // ── KPI filter row + popover ──
  kpiFilterRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14, zIndex: 100,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  kpiFilterBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.primaryMuted, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: COLORS.primary + "25",
  },
  kpiFilterText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },

  // Inline popover
  kpiPopover: {
    position: "absolute", top: 38, right: 0,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    minWidth: 160,
    overflow: "hidden",
    zIndex: 200,
    borderWidth: 1, borderColor: COLORS.border,
  },
  popoverOption: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  popoverOptionBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  popoverOptionActive: { backgroundColor: COLORS.primaryMuted },
  popoverOptionText:   { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  popoverOptionTextActive: { color: COLORS.primary, fontWeight: "800" },

  // ── KPI cards ──
  kpiScroll:        { marginBottom: 16 },
  kpiScrollContent: { gap: 12, paddingRight: 4 },
  kpiCard: {
    width: 135, borderRadius: 18, padding: 14,
    shadowColor: COLORS.textPrimary, shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, minHeight: 120,
  },
  kpiIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  kpiValue: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
  kpiSub:   { fontSize: 9, color: COLORS.textMuted, marginTop: 4, fontWeight: "500" },

  // ── Chart card ──
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, marginBottom: 16,
    shadowColor: COLORS.textPrimary, shadowOpacity: 0.06,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardTitleRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardTitle:         { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  cardSub:           { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: "500" },
  customRangeLabel:  { fontSize: 11, color: COLORS.primary, fontWeight: "700", textAlign: "right", flex: 1, paddingLeft: 8 },

  filterPills: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  pillActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText:       { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  pillTextActive: { color: COLORS.white },

  // ── Employee table ──
  empCountBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryMuted, alignItems: "center", justifyContent: "center",
  },
  empCountText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  empTabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  empTab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  empTabActive: {
    backgroundColor: COLORS.cardBg, borderColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOpacity: 0.12, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  empTabDot:      { width: 7, height: 7, borderRadius: 4 },
  empTabText:     { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
  empTabTextActive:{ color: COLORS.primary, fontWeight: "800" },
  empHeader: {
    flexDirection: "row", alignItems: "center", paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 6,
  },
  empHeaderText: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  empRow:        { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8 },
  empRank:       { width: 32, fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  empAvatarWrap: { position: "relative", width: 40, height: 40 },
  empAvatar:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  empInitials:   { fontSize: 14, fontWeight: "800" },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: COLORS.cardBg,
  },
  empInfo:    { flex: 1 },
  empName:    { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  empMeta:    { fontSize: 11, color: COLORS.textMuted, fontWeight: "500", marginTop: 1 },
  empStats:   { width: 55, alignItems: "flex-end" },
  empStatVal: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  empStatLbl: { fontSize: 9, color: COLORS.textMuted, fontWeight: "600" },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, width: 70, justifyContent: "center",
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  empDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 72, opacity: 0.6 },
  emptyText:  { textAlign: "center", color: COLORS.textMuted, paddingVertical: 30, fontSize: 14 },

  // ── Shared modal styles ──
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: "flex-end" },
  bottomSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12,
  },
  dateSheet:   { },
  sheetHandle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16,
  },
  sheetTitle:    { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  sheetSub:      { fontSize: 12, color: COLORS.textMuted, marginTop: 3, fontWeight: "500" },
  sheetCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },

  // ── Notification rows ──
  emptyNotif:     { alignItems: "center", paddingVertical: 36, gap: 10 },
  emptyNotifText: { fontSize: 14, color: COLORS.textMuted, fontWeight: "600" },
  notifRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  notifRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  notifIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.successLight, alignItems: "center", justifyContent: "center",
  },
  notifName:    { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  notifDetail:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: "500" },
  notifOnline:  { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.online },

  // ── Custom date range ──
  rangeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  rangePill: {
    flex: 1, backgroundColor: COLORS.background,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border,
    padding: 12, alignItems: "center", gap: 3,
  },
  rangePillActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  rangePillLabel:   { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  rangePillDate:    { fontSize: 13, fontWeight: "800", color: COLORS.textPrimary },
  rangeDash:        { width: 16, height: 2, backgroundColor: COLORS.border, borderRadius: 1 },
  applyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, marginTop: 8,
  },
  applyBtnText: { fontSize: 15, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },
});

export default AdminDashboardScreen;