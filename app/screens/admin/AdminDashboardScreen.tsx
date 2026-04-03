import React, { useState } from "react";
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
} from "react-native";
import Svg, { Line, Polyline, Path, Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  TrendingUp,
  Gift,
  Target,
  ChevronDown,
  ChevronRight,
  Bell,
  Wifi,
  WifiOff,
  Filter,
  Award,
  BarChart2,
  Calendar,
  Menu,
  X,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_H = 140;
const CHART_PAD = { left: 36, right: 12, top: 10, bottom: 24 };

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
type ChartFilter = "Daily" | "Weekly" | "Monthly" | "Custom";
type KpiFilter = "Today" | "This Week" | "This Month";

interface Employee {
  id: string;
  name: string;
  role: string;
  initials: string;
  online: boolean;
  sales: number;
  customers: number;
  location: string;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  bg: string;
  iconBg: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const EMPLOYEES: Employee[] = [
  {
    id: "1",
    name: "Jane Mwangi",
    role: "Field Rep",
    initials: "JM",
    online: true,
    sales: 18,
    customers: 110,
    location: "Westlands",
  },
  {
    id: "2",
    name: "Brian Ochieng",
    role: "Field Rep",
    initials: "BO",
    online: true,
    sales: 22,
    customers: 134,
    location: "CBD",
  },
  {
    id: "3",
    name: "Amina Hassan",
    role: "Senior Rep",
    initials: "AH",
    online: true,
    sales: 31,
    customers: 188,
    location: "Kilimani",
  },
  {
    id: "4",
    name: "Peter Karanja",
    role: "Field Rep",
    initials: "PK",
    online: false,
    sales: 14,
    customers: 82,
    location: "Kasarani",
  },
  {
    id: "5",
    name: "Lydia Wanjiku",
    role: "Team Lead",
    initials: "LW",
    online: true,
    sales: 45,
    customers: 220,
    location: "Upperhill",
  },
  {
    id: "6",
    name: "David Mutua",
    role: "Field Rep",
    initials: "DM",
    online: false,
    sales: 9,
    customers: 55,
    location: "Embakasi",
  },
  {
    id: "7",
    name: "Grace Akinyi",
    role: "Field Rep",
    initials: "GA",
    online: true,
    sales: 20,
    customers: 115,
    location: "Ngong Rd",
  },
  {
    id: "8",
    name: "Samuel Ndung'u",
    role: "Senior Rep",
    initials: "SN",
    online: false,
    sales: 17,
    customers: 98,
    location: "Ruiru",
  },
];

const CHART_DATA: Record<
  ChartFilter,
  { labels: string[]; sales: number[]; customers: number[]; samplers: number[] }
> = {
  Daily: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    sales: [18, 22, 15, 30, 25, 20, 12],
    customers: [110, 134, 95, 188, 145, 120, 78],
    samplers: [55, 70, 45, 90, 75, 60, 38],
  },
  Weekly: {
    labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
    sales: [120, 145, 98, 167],
    customers: [720, 870, 610, 980],
    samplers: [350, 430, 290, 510],
  },
  Monthly: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    sales: [480, 520, 390, 610, 580, 720],
    customers: [2800, 3100, 2400, 3600, 3400, 4200],
    samplers: [1400, 1600, 1100, 1800, 1700, 2100],
  },
  Custom: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    sales: [480, 520, 390, 610, 580, 720],
    customers: [2800, 3100, 2400, 3600, 3400, 4200],
    samplers: [1400, 1600, 1100, 1800, 1700, 2100],
  },
};

const KPI_VALUES: Record<
  KpiFilter,
  {
    totalSales: string;
    totalEmployees: string;
    activeSamplers: string;
    avgReach: string;
    topPerformer: string;
    conversionRate: string;
  }
> = {
  Today: {
    totalSales: "142",
    totalEmployees: "8",
    activeSamplers: "448",
    avgReach: "115",
    topPerformer: "Lydia W.",
    conversionRate: "73%",
  },
  "This Week": {
    totalSales: "876",
    totalEmployees: "8",
    activeSamplers: "2,680",
    avgReach: "698",
    topPerformer: "Lydia W.",
    conversionRate: "69%",
  },
  "This Month": {
    totalSales: "3,410",
    totalEmployees: "8",
    activeSamplers: "10,420",
    avgReach: "2,715",
    topPerformer: "Amina H.",
    conversionRate: "71%",
  },
};

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
interface LineChartProps {
  filter: ChartFilter;
}

const LineChart: React.FC<LineChartProps> = ({ filter }) => {
  const raw = CHART_DATA[filter];
  const cW = SCREEN_WIDTH - 36 - 32 - CHART_PAD.left - CHART_PAD.right;
  const n = raw.labels.length;
  const stepX = n > 1 ? cW / (n - 1) : cW;

  const norm = (arr: number[], v: number) => {
    const mn = Math.min(...arr),
      mx = Math.max(...arr);
    return (
      CHART_H -
      CHART_PAD.top -
      ((v - mn) / (mx - mn || 1)) * (CHART_H - CHART_PAD.top - CHART_PAD.bottom)
    );
  };

  const pts = (arr: number[]) =>
    arr.map((v, i) => ({ x: i * stepX, y: norm(arr, v) }));

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

  const salesPts = pts(raw.sales);
  const samplersPts = pts(raw.samplers);
  const customersPts = pts(raw.customers);

  const yLabels = [0, 0.33, 0.66, 1]
    .map((r) => {
      const mx = Math.max(...raw.sales);
      const mn = Math.min(...raw.sales);
      return Math.round(mn + r * (mx - mn));
    })
    .reverse();

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            width: CHART_PAD.left,
            height: CHART_H,
            justifyContent: "space-between",
            paddingBottom: CHART_PAD.bottom,
            paddingTop: CHART_PAD.top,
          }}
        >
          {yLabels.map((v, i) => (
            <Text key={i} style={chartSt.yLabel}>
              {v}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1, height: CHART_H }}>
          <Svg
            width={cW + CHART_PAD.right}
            height={CHART_H}
            viewBox={`0 0 ${cW + CHART_PAD.right} ${CHART_H}`}
          >
            {[0.25, 0.5, 0.75, 1].map((r, i) => (
              <Line
                key={i}
                x1="0"
                y1={(
                  CHART_PAD.top +
                  (1 - r) * (CHART_H - CHART_PAD.top - CHART_PAD.bottom)
                ).toFixed(1)}
                x2={cW}
                y2={(
                  CHART_PAD.top +
                  (1 - r) * (CHART_H - CHART_PAD.top - CHART_PAD.bottom)
                ).toFixed(1)}
                stroke={COLORS.border}
                strokeWidth="1"
                opacity="0.7"
              />
            ))}

            <Path d={area(salesPts)} fill={COLORS.primaryMuted} />

            <Polyline
              points={polyline(samplersPts)}
              fill="none"
              stroke={COLORS.success}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="5,3"
            />

            <Polyline
              points={polyline(customersPts)}
              fill="none"
              stroke={COLORS.accentBlue}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <Polyline
              points={polyline(salesPts)}
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {salesPts.map((p, i) => (
              <Circle
                key={i}
                cx={p.x.toFixed(1)}
                cy={p.y.toFixed(1)}
                r="4"
                fill={COLORS.primary}
                stroke={COLORS.white}
                strokeWidth="1.5"
              />
            ))}

            {samplersPts.map((p, i) => (
              <Circle
                key={i}
                cx={p.x.toFixed(1)}
                cy={p.y.toFixed(1)}
                r="3"
                fill={COLORS.success}
                stroke={COLORS.white}
                strokeWidth="1.5"
              />
            ))}
          </Svg>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          marginLeft: CHART_PAD.left,
          marginTop: 4,
        }}
      >
        {raw.labels.map((l, i) => (
          <Text
            key={i}
            style={[chartSt.xLabel, { width: i < n - 1 ? stepX : undefined }]}
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
      { color: COLORS.primary, label: "Sales", dash: false },
      { color: COLORS.success, label: "Samplers", dash: true },
      { color: COLORS.accentBlue, label: "Customers", dash: false },
    ].map(({ color, label, dash }) => (
      <View key={label} style={chartSt.legendItem}>
        <View
          style={[
            chartSt.legendLine,
            { backgroundColor: color, borderStyle: dash ? "dashed" : "solid" },
          ]}
        />
        <Text style={chartSt.legendText}>{label}</Text>
      </View>
    ))}
  </View>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  sub,
  icon,
  trend,
  trendUp,
  bg,
  iconBg,
}) => (
  <View style={[styles.kpiCard, { backgroundColor: bg }]}>
    <View style={[styles.kpiIconWrap, { backgroundColor: iconBg }]}>
      {icon}
    </View>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
    {trend && (
      <View
        style={[
          styles.kpiTrend,
          {
            backgroundColor: trendUp
              ? COLORS.successLight
              : COLORS.warningLight,
          },
        ]}
      >
        <Text
          style={[
            styles.kpiTrendText,
            { color: trendUp ? COLORS.success : COLORS.warning },
          ]}
        >
          {trend}
        </Text>
      </View>
    )}
    <Text style={styles.kpiSub}>{sub}</Text>
  </View>
);

// ─── Employee Row ─────────────────────────────────────────────────────────────
const EmployeeRow: React.FC<{ emp: Employee; rank: number }> = ({
  emp,
  rank,
}) => (
  <View style={styles.empRow}>
    <Text style={styles.empRank}>#{rank}</Text>
    <View style={styles.empAvatarWrap}>
      <View
        style={[
          styles.empAvatar,
          {
            backgroundColor: emp.online
              ? COLORS.accentBlueLight
              : COLORS.offlineLight,
          },
        ]}
      >
        <Text
          style={[
            styles.empInitials,
            { color: emp.online ? COLORS.accentBlue : COLORS.offline },
          ]}
        >
          {emp.initials}
        </Text>
      </View>
      <View
        style={[
          styles.onlineDot,
          { backgroundColor: emp.online ? COLORS.online : COLORS.offline },
        ]}
      />
    </View>
    <View style={styles.empInfo}>
      <Text style={styles.empName}>{emp.name}</Text>
      <Text style={styles.empMeta}>
        {emp.location} · {emp.role}
      </Text>
    </View>
    <View style={styles.empStats}>
      <Text style={styles.empStatVal}>{emp.sales}</Text>
      <Text style={styles.empStatLbl}>sales</Text>
    </View>
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: emp.online
            ? COLORS.onlineLight
            : COLORS.offlineLight,
        },
      ]}
    >
      {emp.online ? (
        <Wifi size={11} color={COLORS.online} />
      ) : (
        <WifiOff size={11} color={COLORS.offline} />
      )}
      <Text
        style={[
          styles.statusText,
          { color: emp.online ? COLORS.online : COLORS.offline },
        ]}
      >
        {emp.online ? "Active" : "Offline"}
      </Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface AdminDashboardScreenProps {
  navigation?: any;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  navigation,
}) => {
  const [chartFilter, setChartFilter] = useState<ChartFilter>("Daily");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>("Today");
  const [empTab, setEmpTab] = useState<"all" | "online" | "offline">("all");
  const [showDateModal, setShowDateModal] = useState(false);
  const [showKpiFilter, setShowKpiFilter] = useState(false);

  const kpi = KPI_VALUES[kpiFilter];
  const onlineCount = EMPLOYEES.filter((e) => e.online).length;
  const offlineCount = EMPLOYEES.filter((e) => !e.online).length;
  const filteredEmps = EMPLOYEES.filter((e) =>
    empTab === "all" ? true : empTab === "online" ? e.online : !e.online,
  ).sort((a, b) => b.sales - a.sales);

  const CHART_FILTERS: ChartFilter[] = ["Daily", "Weekly", "Monthly", "Custom"];
  const KPI_FILTERS: KpiFilter[] = ["Today", "This Week", "This Month"];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Hamburger - opens drawer from navigator */}
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation?.openDrawer()}
          activeOpacity={0.7}
        >
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
          <KpiCard
            label="Total Sales"
            value={kpi.totalSales}
            sub={`Units ${kpiFilter.toLowerCase()}`}
            icon={<TrendingUp size={18} color={COLORS.primary} />}
            trend="↑ 12%"
            trendUp
            bg={COLORS.cardBg}
            iconBg={COLORS.primaryMuted}
          />
          <KpiCard
            label="Employees"
            value={kpi.totalEmployees}
            sub={`${onlineCount} active now`}
            icon={<Users size={18} color={COLORS.accentBlue} />}
            bg={COLORS.cardBg}
            iconBg={COLORS.accentBlueLight}
          />
          <KpiCard
            label="Samplers Given"
            value={kpi.activeSamplers}
            sub={`Avg ${kpiFilter.toLowerCase()}`}
            icon={<Gift size={18} color={COLORS.success} />}
            trend="↑ 8%"
            trendUp
            bg={COLORS.cardBg}
            iconBg={COLORS.successLight}
          />
          <KpiCard
            label="Avg. Reach"
            value={kpi.avgReach}
            sub="Customers / rep"
            icon={<Target size={18} color={COLORS.warning} />}
            trend="↑ 5%"
            trendUp
            bg={COLORS.cardBg}
            iconBg={COLORS.warningLight}
          />
          <KpiCard
            label="Top Performer"
            value={kpi.topPerformer}
            sub="Highest sales"
            icon={<Award size={18} color={COLORS.primary} />}
            bg={COLORS.cardBg}
            iconBg={COLORS.primaryMuted}
          />
          <KpiCard
            label="Conversion"
            value={kpi.conversionRate}
            sub="Sales / customers"
            icon={<BarChart2 size={18} color={COLORS.accentBlue} />}
            trend="↑ 3%"
            trendUp
            bg={COLORS.cardBg}
            iconBg={COLORS.accentBlueLight}
          />
        </ScrollView>

        {/* ── Sales Line Chart ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Sales Performance</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </View>

          <View style={styles.filterPills}>
            {CHART_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.pill, chartFilter === f && styles.pillActive]}
                onPress={() =>
                  f === "Custom" ? setShowDateModal(true) : setChartFilter(f)
                }
                activeOpacity={0.75}
              >
                {f === "Custom" && (
                  <Calendar
                    size={11}
                    color={chartFilter === f ? COLORS.white : COLORS.textMuted}
                  />
                )}
                <Text
                  style={[
                    styles.pillText,
                    chartFilter === f && styles.pillTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ChartLegend />
          <LineChart filter={chartFilter} />
        </View>

        {/* ── Team Overview ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View>
              <Text style={styles.cardTitle}>Team Overview</Text>
              <Text style={styles.cardSub}>
                <Text style={{ color: COLORS.online }}>
                  {onlineCount} active
                </Text>
                {"  ·  "}
                <Text style={{ color: COLORS.offline }}>
                  {offlineCount} offline
                </Text>
              </Text>
            </View>
            <View style={styles.empCountBadge}>
              <Text style={styles.empCountText}>{EMPLOYEES.length}</Text>
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
                <View
                  style={[
                    styles.empTabDot,
                    {
                      backgroundColor:
                        tab === "online"
                          ? COLORS.online
                          : tab === "offline"
                            ? COLORS.offline
                            : COLORS.primary,
                    },
                    empTab !== tab && { opacity: 0 },
                  ]}
                />
                <Text
                  style={[
                    styles.empTabText,
                    empTab === tab && styles.empTabTextActive,
                  ]}
                >
                  {tab === "all"
                    ? `All (${EMPLOYEES.length})`
                    : tab === "online"
                      ? `Active (${onlineCount})`
                      : `Offline (${offlineCount})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.empHeader}>
            <Text style={[styles.empHeaderText, { width: 24 }]}>#</Text>
            <Text style={[styles.empHeaderText, { width: 48 }]}> </Text>
            <Text style={[styles.empHeaderText, { flex: 1 }]}>Employee</Text>
            <Text style={[styles.empHeaderText, { width: 40 }]}>Sales</Text>
            <Text style={[styles.empHeaderText, { width: 66 }]}>Status</Text>
          </View>

          {filteredEmps.map((emp, i) => (
            <React.Fragment key={emp.id}>
              <EmployeeRow emp={emp} rank={i + 1} />
              {i < filteredEmps.length - 1 && (
                <View style={styles.empDivider} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── KPI Filter Modal ── */}
      <Modal
        visible={showKpiFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKpiFilter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowKpiFilter(false)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Filter Overview</Text>
            {KPI_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterOption,
                  kpiFilter === f && styles.filterOptionActive,
                ]}
                onPress={() => {
                  setKpiFilter(f);
                  setShowKpiFilter(false);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    kpiFilter === f && styles.filterOptionTextActive,
                  ]}
                >
                  {f}
                </Text>
                {kpiFilter === f && <View style={styles.filterCheck} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Custom Date Modal ── */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <View style={styles.dateModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.filterModalTitle}>Custom Date Range</Text>
            <Text style={styles.dateModalSub}>
              Select a start and end date to filter the chart
            </Text>
            <View style={styles.dateRangeRow}>
              <View style={styles.dateBox}>
                <Calendar size={16} color={COLORS.primary} />
                <Text style={styles.dateBoxLabel}>Start Date</Text>
                <Text style={styles.dateBoxVal}>Apr 1, 2026</Text>
              </View>
              <View style={styles.dateRangeDash} />
              <View style={styles.dateBox}>
                <Calendar size={16} color={COLORS.primary} />
                <Text style={styles.dateBoxLabel}>End Date</Text>
                <Text style={styles.dateBoxVal}>Apr 30, 2026</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                setChartFilter("Custom");
                setShowDateModal(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>Apply Range</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Chart Styles ─────────────────────────────────────────────────────────────
const chartSt = StyleSheet.create({
  yLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "right",
    fontWeight: "600",
    paddingRight: 4,
  },
  xLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "center",
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
    marginTop: 2,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendLine: {
    width: 16,
    height: 2.5,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  // Header
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 4,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    paddingBottom: 20,
  },
  headerGreet: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
  },

  // Scroll
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 18,
  },

  // KPI
  kpiFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  kpiFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiFilterText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  kpiScroll: {
    marginBottom: 16,
    marginHorizontal: -18,

    padding: 2,
  },
  kpiScrollContent: {
    paddingHorizontal: 18,

    padding: 2,

    gap: 12,
    paddingRight: 24,
  },
  kpiCard: {
    width: 130,
    borderRadius: 18,
    padding: 14,
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: 4,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  kpiSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  kpiTrend: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  kpiTrendText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // Card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },

  // Filter pills
  filterPills: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  pillTextActive: {
    color: COLORS.white,
  },

  // Employees
  empCountBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  empCountText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  empTabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  empTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  empTabActive: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  empTabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  empTabText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  empTabTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  empHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 4,
  },
  empHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
  },
  empRank: {
    width: 24,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  empAvatarWrap: {
    position: "relative",
    width: 38,
    height: 38,
  },
  empAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  empInitials: {
    fontSize: 13,
    fontWeight: "800",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  empInfo: { flex: 1 },
  empName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  empMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 1,
  },
  empStats: {
    width: 40,
    alignItems: "center",
  },
  empStatVal: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  empStatLbl: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 66,
    justifyContent: "center",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  empDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 32,
    opacity: 0.6,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayBg,
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },
  filterModalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  filterCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  dateModal: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  dateModalSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 22,
    fontWeight: "500",
  },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  dateBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  dateBoxLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateBoxVal: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  dateRangeDash: {
    width: 16,
    height: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});

export default AdminDashboardScreen;
