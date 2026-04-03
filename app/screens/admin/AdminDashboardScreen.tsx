/**
 * AdminDashboardScreen.tsx — REFACTORED & FIXED
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes:
 *  • Chart now displays correctly (fixed Y-axis scaling and data normalization)
 *  • Team overview shows weekly sales data instead of just today's sales
 *  • Fixed KPI logic for accurate calculations
 *  • Improved chart data fetching with proper date ranges
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import Svg, { Line, Polyline, Path, Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users, TrendingUp, Gift, Target, ChevronDown, ChevronRight,
  Bell, Wifi, WifiOff, Filter, Award, BarChart2, Calendar, Menu,
} from "lucide-react-native";

import {
  getDashboardKpis,
  getChartData,
  getEmployees,
  getReportsByDate,
  getReportsByDateRange,
  DashboardKpis,
  ChartDataset,
  Employee,
  Report,
} from "../../data/dbService";

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_H = 200;
const CHART_PAD = { left: 40, right: 16, top: 12, bottom: 28 };

const COLORS = {
  primary: "#8B0111",
  primaryDark: "#8B0111",
  primaryDeep: "#6B0009",
  primaryMuted: "rgba(139,1,17,0.08)",
  white: "#FFFFFF",
  background: "#F0F5FB",
  cardBg: "#FFFFFF",
  textPrimary: "#0D2137",
  textSecondary: "#4A6580",
  textMuted: "#8FA3B8",
  border: "#D6E4F0",
  success: "#00897B",
  successLight: "#E0F2F1",
  warning: "#F57C00",
  warningLight: "#FFF3E0",
  accentBlue: "#1565C0",
  accentBlueLight: "#E3F0FF",
  online: "#43A047",
  onlineLight: "#E8F5E9",
  offline: "#9E9E9E",
  offlineLight: "#F5F5F5",
  overlayBg: "rgba(13,33,55,0.55)",
};

type ChartFilter = "Daily" | "Weekly" | "Monthly";
type KpiFilter = "Today" | "This Week" | "This Month";

// ── Date helpers ──────────────────────────────────────────────────────────────
const todayISO = (): string => new Date().toISOString().split("T")[0];

const dateRangeForFilter = (filter: KpiFilter): { from: string; to: string } => {
  const to = todayISO();
  if (filter === "Today") return { from: to, to };
  if (filter === "This Week") {
    const d = new Date(to + "T00:00:00");
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().split("T")[0], to };
  }
  // This Month
  return { from: to.slice(0, 7) + "-01", to };
};

const getWeekDateRange = (): { from: string; to: string } => {
  const to = todayISO();
  const d = new Date(to + "T00:00:00");
  d.setDate(d.getDate() - 6);
  return { from: d.toISOString().split("T")[0], to };
};

// ─── Employee row interface — enriched with weekly sales for ranking ──────────
interface EmpWithSales extends Employee {
  weeklySales: number;
  weeklyCustomers: number;
  weeklySamplers: number;
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
const LineChart: React.FC<{ data: ChartDataset }> = ({ data }) => {
  const cW = SCREEN_WIDTH - 36 - 32 - CHART_PAD.left - CHART_PAD.right;
  const n = data.labels.length;
  const stepX = n > 1 ? cW / (n - 1) : cW;

  // Find global min/max across all datasets for consistent Y-axis
  const allValues = [...data.sales, ...data.samplers, ...data.customers];
  const globalMin = Math.min(...allValues, 0);
  const globalMax = Math.max(...allValues, 1);

  const norm = (value: number) => {
    return (
      CHART_H -
      CHART_PAD.bottom -
      ((value - globalMin) / (globalMax - globalMin || 1)) *
        (CHART_H - CHART_PAD.top - CHART_PAD.bottom)
    );
  };

  const pts = (arr: number[]) =>
    arr.map((v, i) => ({ x: i * stepX, y: norm(v) }));

  const polyline = (points: { x: number; y: number }[]) =>
    points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const area = (points: { x: number; y: number }[]) => {
    if (!points.length) return "";
    const bottom = CHART_H - CHART_PAD.bottom;
    return (
      `M${points[0].x.toFixed(1)},${bottom} ` +
      points.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
      ` L${points[points.length - 1].x.toFixed(1)},${bottom} Z`
    );
  };

  const salesPts = pts(data.sales);
  const samplersPts = pts(data.samplers);
  const customersPts = pts(data.customers);

  // Generate Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((r) => {
    return Math.round(globalMin + r * (globalMax - globalMin));
  }).reverse();

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <View style={{
          width: CHART_PAD.left,
          height: CHART_H,
          justifyContent: "space-between",
          paddingBottom: CHART_PAD.bottom,
          paddingTop: CHART_PAD.top,
        }}>
          {yLabels.map((v, i) => (
            <Text key={i} style={chartSt.yLabel}>{v}</Text>
          ))}
        </View>

        <View style={{ flex: 1, height: CHART_H }}>
          <Svg width={cW + CHART_PAD.right} height={CHART_H}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const y = CHART_PAD.top + (1 - r) * (CHART_H - CHART_PAD.top - CHART_PAD.bottom);
              return (
                <Line
                  key={i}
                  x1="0"
                  y1={y}
                  x2={cW}
                  y2={y}
                  stroke={COLORS.border}
                  strokeWidth="1"
                  opacity="0.5"
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* Area under sales line */}
            <Path d={area(salesPts)} fill={COLORS.primaryMuted} />

            {/* Samplers line (dashed) */}
            <Polyline
              points={polyline(samplersPts)}
              fill="none"
              stroke={COLORS.success}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6,4"
            />

            {/* Customers line */}
            <Polyline
              points={polyline(customersPts)}
              fill="none"
              stroke={COLORS.accentBlue}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Sales line (thickest) */}
            <Polyline
              points={polyline(salesPts)}
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points for sales */}
            {salesPts.map((p, i) => (
              <Circle
                key={i}
                cx={p.x.toFixed(1)}
                cy={p.y.toFixed(1)}
                r="5"
                fill={COLORS.primary}
                stroke={COLORS.white}
                strokeWidth="2"
              />
            ))}
          </Svg>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: "row", marginLeft: CHART_PAD.left, marginTop: 8 }}>
        {data.labels.map((l, i) => (
          <Text
            key={i}
            style={[chartSt.xLabel, { width: i < n - 1 ? stepX : undefined, textAlign: i === 0 ? "left" : i === n - 1 ? "right" : "center" }]}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
};

// ─── Chart Legend ─────────────────────────────────────────────────────────────
const ChartLegend: React.FC = () => (
  <View style={chartSt.legend}>
    {[
      { color: COLORS.primary, label: "Sales", lineStyle: "solid" },
      { color: COLORS.success, label: "Samplers", lineStyle: "dashed" },
      { color: COLORS.accentBlue, label: "Customers", lineStyle: "solid" },
    ].map(({ color, label, lineStyle }) => (
      <View key={label} style={chartSt.legendItem}>
        <View style={[chartSt.legendLine, { backgroundColor: color, borderStyle: lineStyle === "dashed" ? "dashed" : "solid" }]} />
        <Text style={chartSt.legendText}>{label}</Text>
      </View>
    ))}
  </View>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  bg: string;
  iconBg: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon, trend, trendUp, bg, iconBg }) => (
  <View style={[styles.kpiCard, { backgroundColor: bg }]}>
    <View style={[styles.kpiIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
    <Text style={styles.kpiValue}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
    {trend && (
      <View style={[styles.kpiTrend, { backgroundColor: trendUp ? COLORS.successLight : COLORS.warningLight }]}>
        <Text style={[styles.kpiTrendText, { color: trendUp ? COLORS.success : COLORS.warning }]}>{trend}</Text>
      </View>
    )}
    <Text style={styles.kpiSub}>{sub}</Text>
  </View>
);

// ─── Employee Row with weekly sales ───────────────────────────────────────────
const EmployeeRow: React.FC<{ emp: EmpWithSales; rank: number }> = ({ emp, rank }) => (
  <View style={styles.empRow}>
    <Text style={styles.empRank}>#{rank}</Text>
    <View style={styles.empAvatarWrap}>
      <View style={[styles.empAvatar, { backgroundColor: emp.online ? COLORS.accentBlueLight : COLORS.offlineLight }]}>
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
      {emp.online
        ? <Wifi size={11} color={COLORS.online} />
        : <WifiOff size={11} color={COLORS.offline} />
      }
      <Text style={[styles.statusText, { color: emp.online ? COLORS.online : COLORS.offline }]}>
        {emp.online ? "Active" : "Offline"}
      </Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface AdminDashboardScreenProps { navigation?: any }

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const [chartFilter, setChartFilter] = useState<ChartFilter>("Weekly");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>("This Week");
  const [empTab, setEmpTab] = useState<"all" | "online" | "offline">("all");
  const [showKpiFilter, setShowKpiFilter] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  // Data state
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [chartData, setChartData] = useState<ChartDataset | null>(null);
  const [employees, setEmployees] = useState<EmpWithSales[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(true);

  // ── Load KPIs ─────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async (filter: KpiFilter) => {
    setKpiLoading(true);
    try {
      const { from, to } = dateRangeForFilter(filter);
      const data = await getDashboardKpis(from, to);
      setKpis(data);
    } catch (error) {
      console.error("Failed to load KPIs:", error);
    } finally {
      setKpiLoading(false);
    }
  }, []);

  // ── Load chart data ───────────────────────────────────────────────────────
  const loadChart = useCallback(async (filter: ChartFilter) => {
    setChartLoading(true);
    try {
      let mode: "daily" | "weekly" | "monthly";
      let referenceDate = todayISO();
      
      if (filter === "Daily") {
        mode = "daily";
      } else if (filter === "Weekly") {
        mode = "weekly";
      } else {
        mode = "monthly";
      }
      
      const data = await getChartData(mode, referenceDate);
      setChartData(data);
    } catch (error) {
      console.error("Failed to load chart data:", error);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // ── Load employees with weekly sales ──────────────────────────────────────
  const loadEmployeesWithWeeklySales = useCallback(async () => {
    setEmpLoading(true);
    try {
      const [emps, weekReports] = await Promise.all([
        getEmployees(),
        getReportsByDateRange(getWeekDateRange().from, getWeekDateRange().to),
      ]);
      
      // Build weekly sales aggregates by employee
      const weeklyMap: Record<string, { sales: number; customers: number; samplers: number }> = {};
      weekReports.forEach((r) => {
        if (!weeklyMap[r.employeeId]) {
          weeklyMap[r.employeeId] = { sales: 0, customers: 0, samplers: 0 };
        }
        weeklyMap[r.employeeId].sales += r.sales;
        weeklyMap[r.employeeId].customers += r.customersReached;
        weeklyMap[r.employeeId].samplers += r.samplersGiven;
      });
      
      const enriched: EmpWithSales[] = emps.map((e) => ({
        ...e,
        weeklySales: weeklyMap[e.id]?.sales ?? 0,
        weeklyCustomers: weeklyMap[e.id]?.customers ?? 0,
        weeklySamplers: weeklyMap[e.id]?.samplers ?? 0,
      }));
      
      setEmployees(enriched);
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setEmpLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis(kpiFilter);
  }, [kpiFilter, loadKpis]);

  useEffect(() => {
    loadChart(chartFilter);
  }, [chartFilter, loadChart]);

  useEffect(() => {
    loadEmployeesWithWeeklySales();
  }, [loadEmployeesWithWeeklySales]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const onlineCount = employees.filter((e) => e.online && e.status === "active").length;
  const offlineCount = employees.filter((e) => !e.online && e.status === "active").length;
  const filteredEmps = employees
    .filter((e) => e.status === "active")
    .filter((e) =>
      empTab === "all" ? true : empTab === "online" ? e.online : !e.online
    )
    .sort((a, b) => b.weeklySales - a.weeklySales);

  const KPI_FILTERS: KpiFilter[] = ["Today", "This Week", "This Month"];
  const CHART_FILTERS: ChartFilter[] = ["Daily", "Weekly", "Monthly"];

  return (
    <SafeAreaView style={styles.safe}>
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
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.75}>
            <Bell size={18} color={COLORS.white} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Filter Row */}
        <View style={styles.kpiFilterRow}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <TouchableOpacity
            style={styles.kpiFilterBtn}
            onPress={() => setShowKpiFilter(true)}
            activeOpacity={0.8}
          >
            <Filter size={12} color={COLORS.primary} />
            <Text style={styles.kpiFilterText}>{kpiFilter}</Text>
            <ChevronDown size={12} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* KPI Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiScroll}
          contentContainerStyle={styles.kpiScrollContent}
        >
          {kpiLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.kpiCard, { backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" }]}>
                <ActivityIndicator color={COLORS.primary} size="small" />
              </View>
            ))
          ) : kpis ? (
            <>
              <KpiCard
                label="Total Sales" value={kpis.totalSales}
                sub={`Units ${kpiFilter.toLowerCase()}`}
                icon={<TrendingUp size={18} color={COLORS.primary} />}
                bg={COLORS.cardBg} iconBg={COLORS.primaryMuted}
              />
              <KpiCard
                label="Employees" value={kpis.totalEmployees}
                sub={`${kpis.onlineEmployees} active now`}
                icon={<Users size={18} color={COLORS.accentBlue} />}
                bg={COLORS.cardBg} iconBg={COLORS.accentBlueLight}
              />
              <KpiCard
                label="Samplers" value={kpis.totalSamplers}
                sub={`Given ${kpiFilter.toLowerCase()}`}
                icon={<Gift size={18} color={COLORS.success} />}
                bg={COLORS.cardBg} iconBg={COLORS.successLight}
              />
              <KpiCard
                label="Avg Sales/Rep" value={kpis.avgSalesPerEmployee}
                sub="Per rep"
                icon={<Target size={18} color={COLORS.warning} />}
                bg={COLORS.cardBg} iconBg={COLORS.warningLight}
              />
              <KpiCard
                label="Top Performer"
                value={kpis.topPerformer?.firstName?.split(" ")[0] ?? "—"}
                sub="Highest sales"
                icon={<Award size={18} color={COLORS.primary} />}
                bg={COLORS.cardBg} iconBg={COLORS.primaryMuted}
              />
              <KpiCard
                label="Conversion" value={`${kpis.conversionRate}%`}
                sub="Sales → Samplers"
                icon={<BarChart2 size={18} color={COLORS.accentBlue} />}
                bg={COLORS.cardBg} iconBg={COLORS.accentBlueLight}
              />
            </>
          ) : null}
        </ScrollView>

        {/* Sales Line Chart */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Sales Performance</Text>
          </View>

          <View style={styles.filterPills}>
            {CHART_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.pill, chartFilter === f && styles.pillActive]}
                onPress={() => setChartFilter(f)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, chartFilter === f && styles.pillTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.pill}
              onPress={() => setShowDateModal(true)}
              activeOpacity={0.75}
            >
              <Calendar size={11} color={COLORS.textMuted} />
              <Text style={styles.pillText}>Custom</Text>
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

        {/* Team Overview with Weekly Sales */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View>
              <Text style={styles.cardTitle}>Team Overview</Text>
              <Text style={styles.cardSub}>
                <Text style={{ color: COLORS.online }}>{onlineCount} active</Text>
                {"  ·  "}
                <Text style={{ color: COLORS.offline }}>{offlineCount} offline</Text>
                {"  ·  "}
                <Text style={{ color: COLORS.primary }}>Weekly sales shown</Text>
              </Text>
            </View>
            <View style={styles.empCountBadge}>
              <Text style={styles.empCountText}>{employees.filter(e => e.status === "active").length}</Text>
            </View>
          </View>

          <View style={styles.empTabs}>
            {(["all", "online", "offline"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.empTab, empTab === tab && styles.empTabActive]}
                onPress={() => setEmpTab(tab)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.empTabDot,
                  { backgroundColor: tab === "online" ? COLORS.online : tab === "offline" ? COLORS.offline : COLORS.primary },
                  empTab !== tab && { opacity: 0 },
                ]} />
                <Text style={[styles.empTabText, empTab === tab && styles.empTabTextActive]}>
                  {tab === "all" ? `All (${employees.filter(e => e.status === "active").length})` : 
                    tab === "online" ? `Active (${onlineCount})` : `Offline (${offlineCount})`}
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* KPI Filter Modal */}
      <Modal visible={showKpiFilter} transparent animationType="fade"
        onRequestClose={() => setShowKpiFilter(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
          onPress={() => setShowKpiFilter(false)}>
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Filter Overview</Text>
            {KPI_FILTERS.map((f) => (
              <TouchableOpacity key={f}
                style={[styles.filterOption, kpiFilter === f && styles.filterOptionActive]}
                onPress={() => { setKpiFilter(f); setShowKpiFilter(false); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterOptionText, kpiFilter === f && styles.filterOptionTextActive]}>{f}</Text>
                {kpiFilter === f && <View style={styles.filterCheck} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Date Range Modal */}
      <Modal visible={showDateModal} transparent animationType="slide"
        onRequestClose={() => setShowDateModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
          onPress={() => setShowDateModal(false)}>
          <View style={styles.dateModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.filterModalTitle}>Custom Date Range</Text>
            <Text style={styles.dateModalSub}>
              Custom date range coming soon. Use Daily/Weekly/Monthly for now.
            </Text>
            <TouchableOpacity style={styles.applyBtn}
              onPress={() => setShowDateModal(false)} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const chartSt = StyleSheet.create({
  yLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: "right", fontWeight: "600", paddingRight: 6 },
  xLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600", marginTop: 4 },
  legend: { flexDirection: "row", gap: 16, marginBottom: 12, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendLine: { width: 24, height: 3, borderRadius: 2 },
  legendText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
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
  headerGreet: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.white },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  notifDot: {
    position: "absolute", top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: COLORS.warning, borderWidth: 1.5, borderColor: COLORS.primaryDark,
  },
  scroll: {
    flex: 1, backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -8,
  },
  scrollContent: { paddingTop: 20, paddingHorizontal: 18 },
  kpiFilterRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  kpiFilterBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.primaryMuted, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  kpiFilterText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  kpiScroll: { marginBottom: 16 },
  kpiScrollContent: { gap: 12, paddingRight: 4 },
  kpiCard: {
    width: 135, borderRadius: 18, padding: 14,
    shadowColor: COLORS.textPrimary, shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    minHeight: 120,
  },
  kpiIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  kpiValue: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
  kpiTrend: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  kpiTrendText: { fontSize: 9, fontWeight: "700" },
  kpiSub: { fontSize: 9, color: COLORS.textMuted, marginTop: 4, fontWeight: "500" },

  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, marginBottom: 16,
    shadowColor: COLORS.textPrimary, shadowOpacity: 0.06,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardTitleRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: "500" },

  filterPills: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  pillTextActive: { color: COLORS.white },

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
  empTabDot: { width: 7, height: 7, borderRadius: 4 },
  empTabText: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
  empTabTextActive: { color: COLORS.primary, fontWeight: "800" },
  empHeader: {
    flexDirection: "row", alignItems: "center", paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 6,
  },
  empHeaderText: {
    fontSize: 10, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  empRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8 },
  empRank: { width: 32, fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  empAvatarWrap: { position: "relative", width: 40, height: 40 },
  empAvatar: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  empInitials: { fontSize: 14, fontWeight: "800" },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: COLORS.cardBg,
  },
  empInfo: { flex: 1 },
  empName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  empMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500", marginTop: 1 },
  empStats: { width: 55, alignItems: "flex-end" },
  empStatVal: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  empStatLbl: { fontSize: 9, color: COLORS.textMuted, fontWeight: "600" },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    width: 70, justifyContent: "center",
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  empDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 72, opacity: 0.6 },
  emptyText: { textAlign: "center", color: COLORS.textMuted, paddingVertical: 30, fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: COLORS.overlayBg, justifyContent: "flex-end" },
  filterModal: {
    backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },
  filterModalTitle: {
    fontSize: 17, fontWeight: "800", color: COLORS.textPrimary,
    marginBottom: 16, textAlign: "center",
  },
  filterOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 6,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  filterOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  filterOptionText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  filterOptionTextActive: { color: COLORS.primary, fontWeight: "800" },
  filterCheck: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  dateModal: {
    backgroundColor: COLORS.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 32,
  },
  modalHandle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 20,
  },
  dateModalSub: {
    fontSize: 13, color: COLORS.textMuted, textAlign: "center",
    marginBottom: 22, fontWeight: "500",
  },
  dateRangeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  dateBox: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border, padding: 14,
    alignItems: "center", gap: 4,
  },
  dateBoxLabel: {
    fontSize: 10, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  dateBoxVal: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  dateRangeDash: { width: 16, height: 2, backgroundColor: COLORS.border, borderRadius: 1 },
  applyBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center",
  },
  applyBtnText: { fontSize: 15, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },
});

export default AdminDashboardScreen;