/**
 * ReportsScreen.tsx — REFACTORED
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from original:
 *  • Removed DAILY_REPORTS[], MONTHLY_SUMMARY[] — all from dbService
 *  • getHydratedReports(dateISO) drives Daily tab (employee profile joined in)
 *  • getMonthlyAggregates(month, year) drives Monthly tab — computed dynamically
 *  • Available dates for the date filter pills built from real report data
 *  • approveReport() / flagReport() wire admin actions to the data store
 *  • MonthlyRow reads from EmployeeMonthlyAggregate (no more direct mock fields)
 *  • Summary tab top performers and "needs attention" computed from real aggregates
 *  • Loading states on all three tabs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, Platform, Alert, TextInput, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Download, ChevronDown, Calendar, TrendingUp, Users, Gift,
  Filter, Eye, FileText, BarChart2, ChevronRight, Search, X,
  Award, AlertTriangle, CheckCircle, Menu,
} from "lucide-react-native";

import {
  getHydratedReports,
  getMonthlyAggregates,
  approveReport,
  flagReport,
  HydratedReport,
  EmployeeMonthlyAggregate,
} from "../../data/dbService";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary:         "#8B0111",
  primaryDark:     "#8B0111",
  primaryMuted:    "rgba(139,1,17,0.08)",
  primaryLight:    "rgba(139,1,17,0.15)",
  white:           "#FFFFFF",
  background:      "#F0F5FB",
  cardBg:          "#FFFFFF",
  textPrimary:     "#0D2137",
  textSecondary:   "#4A6580",
  textMuted:       "#8FA3B8",
  border:          "#D6E4F0",
  success:         "#00897B",
  successLight:    "#E0F2F1",
  warning:         "#F57C00",
  warningLight:    "#FFF3E0",
  accentBlue:      "#1565C0",
  accentBlueLight: "#E3F0FF",
  danger:          "#C62828",
  dangerLight:     "#FFEBEE",
  overlayBg:       "rgba(13,33,55,0.6)",
};

type ReportTab = "daily" | "monthly" | "summary";
type Month = "Jan"|"Feb"|"Mar"|"Apr"|"May"|"Jun"|"Jul"|"Aug"|"Sep"|"Oct"|"Nov"|"Dec";

const MONTHS: Month[] = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS  = ["2026","2025","2024"];

// ─── Tiny Clock icon shim ─────────────────────────────────────────────────────
const Clock: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <View style={{ width:size, height:size, borderRadius:size/2, borderWidth:1.5, borderColor:color, alignItems:"center", justifyContent:"center" }}>
    <View style={{ width:1.5, height:size*0.28, backgroundColor:color, position:"absolute", bottom:"50%", right:"48%" }} />
    <View style={{ width:size*0.28, height:1.5, backgroundColor:color, position:"absolute", left:"50%", top:"50%" }} />
  </View>
);

// ─── Trend Bar ────────────────────────────────────────────────────────────────
const TrendBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <View style={{ height:4, backgroundColor:COLORS.border, borderRadius:2, overflow:"hidden", flex:1 }}>
    <View style={{ height:4, width:`${Math.min(100,(value/max)*100)}%` as any, backgroundColor:color, borderRadius:2 }} />
  </View>
);

// ─── Daily Card ───────────────────────────────────────────────────────────────
const DailyCard: React.FC<{
  report: HydratedReport;
  onView: () => void;
  onApprove: () => void;
  onFlag: (flagged: boolean) => void;
}> = ({ report, onView, onApprove, onFlag }) => (
  <View style={repSt.dailyCard}>
    <View style={repSt.dailyBody}>
      {/* Top row */}
      <View style={repSt.dailyTop}>
        <View style={[repSt.initials, {
          backgroundColor: report.flagged ? COLORS.dangerLight : COLORS.primaryMuted,
        }]}>
          <Text style={[repSt.initialsText, {
            color: report.flagged ? COLORS.danger : COLORS.primary,
          }]}>
            {report.employee?.initials ?? "??"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={repSt.nameRow}>
            <Text style={repSt.empName}>{report.employee?.fullName ?? "Unknown"}</Text>
            {report.flagged && (
              <View style={repSt.flagBadge}>
                <AlertTriangle size={10} color={COLORS.danger} />
                <Text style={repSt.flagText}>Low</Text>
              </View>
            )}
            {!report.submitted && (
              <View style={[repSt.flagBadge, { backgroundColor: COLORS.warningLight }]}>
                <Clock size={10} color={COLORS.warning} />
                <Text style={[repSt.flagText, { color: COLORS.warning }]}>Pending</Text>
              </View>
            )}
            {report.approved && (
              <View style={[repSt.flagBadge, { backgroundColor: COLORS.successLight }]}>
                <CheckCircle size={10} color={COLORS.success} />
                <Text style={[repSt.flagText, { color: COLORS.success }]}>Approved</Text>
              </View>
            )}
          </View>
          <Text style={repSt.empRole}>
            {report.employee?.role ?? ""} · {report.location}
          </Text>
        </View>
        <View style={repSt.dateBox}>
          <Text style={repSt.dateDayName}>{report.dayName.slice(0, 3)}</Text>
          <Text style={repSt.dateShort}>{report.shortDate}</Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={repSt.statsStrip}>
        {[
          { icon: <TrendingUp size={12} color={COLORS.primary} />, lbl: "Sales",    val: report.sales,             color: COLORS.primary    },
          { icon: <Users     size={12} color={COLORS.accentBlue} />, lbl: "Reached", val: report.customersReached,  color: COLORS.accentBlue },
          { icon: <Gift      size={12} color={COLORS.success} />, lbl: "Samplers", val: report.samplersGiven,     color: COLORS.success    },
        ].map((s, i) => (
          <React.Fragment key={s.lbl}>
            {i > 0 && <View style={repSt.statDivider} />}
            <View style={repSt.statItem}>
              {s.icon}
              <Text style={repSt.statLbl}>{s.lbl}</Text>
              <Text style={[repSt.statVal, { color: s.color }]}>{s.val}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {report.notes ? (
        <Text style={repSt.noteText} numberOfLines={2}>{report.notes}</Text>
      ) : null}

      {/* Action row */}
      <View style={repSt.actionRow}>
        <TouchableOpacity style={repSt.viewRowBtn} onPress={onView} activeOpacity={0.8}>
          <Eye size={13} color={COLORS.accentBlue} />
          <Text style={repSt.viewRowBtnText}>View</Text>
        </TouchableOpacity>
        {!report.approved && (
          <TouchableOpacity
            style={[repSt.viewRowBtn, { backgroundColor: COLORS.successLight }]}
            onPress={onApprove} activeOpacity={0.8}
          >
            <CheckCircle size={13} color={COLORS.success} />
            <Text style={[repSt.viewRowBtnText, { color: COLORS.success }]}>Approve</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[repSt.viewRowBtn, { backgroundColor: report.flagged ? COLORS.successLight : COLORS.dangerLight }]}
          onPress={() => onFlag(!report.flagged)} activeOpacity={0.8}
        >
          <AlertTriangle size={13} color={report.flagged ? COLORS.success : COLORS.danger} />
          <Text style={[repSt.viewRowBtnText, { color: report.flagged ? COLORS.success : COLORS.danger }]}>
            {report.flagged ? "Unflag" : "Flag"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── Monthly Row ──────────────────────────────────────────────────────────────
const MonthlyRow: React.FC<{
  agg: EmployeeMonthlyAggregate;
  rank: number;
  maxSales: number;
  onView: () => void;
}> = ({ agg, rank, maxSales, onView }) => (
  <View style={repSt.monthlyRow}>
    <Text style={repSt.rank}>#{rank}</Text>
    <View style={[repSt.initials, { width:38, height:38, borderRadius:19,
      backgroundColor: agg.achievePct >= 100 ? COLORS.successLight : COLORS.primaryMuted }]}>
      <Text style={[repSt.initialsText, { color: agg.achievePct >= 100 ? COLORS.success : COLORS.primary }]}>
        {agg.employee.initials}
      </Text>
    </View>
    <View style={{ flex: 1, gap: 4 }}>
      <View style={repSt.monthlyNameRow}>
        <Text style={repSt.empName}>{agg.employee.fullName}</Text>
        <View style={[repSt.trendChip, {
          backgroundColor: agg.trend==="up" ? COLORS.successLight : agg.trend==="down" ? COLORS.dangerLight : COLORS.warningLight,
        }]}>
          <Text style={[repSt.trendChipText, {
            color: agg.trend==="up" ? COLORS.success : agg.trend==="down" ? COLORS.danger : COLORS.warning,
          }]}>
            {agg.trend==="up" ? "↑" : agg.trend==="down" ? "↓" : "→"} {agg.achievePct}%
          </Text>
        </View>
      </View>
      <View style={repSt.progressRow}>
        <TrendBar
          value={agg.totalSales}
          max={maxSales}
          color={agg.achievePct >= 100 ? COLORS.success : COLORS.primary}
        />
        <Text style={repSt.progressLabel}>{agg.totalSales}/{agg.target}</Text>
      </View>
      <Text style={repSt.monthlyMeta}>
        {agg.daysReported}d · Avg {agg.avgSalesPerDay}/day · Best: {agg.bestDayDisplay}
      </Text>
    </View>
    <TouchableOpacity onPress={onView} style={repSt.eyeBtn} activeOpacity={0.8}>
      <Eye size={15} color={COLORS.textMuted} />
    </TouchableOpacity>
  </View>
);

// ─── Report Detail Modal ──────────────────────────────────────────────────────
const ReportDetailModal: React.FC<{
  report: HydratedReport | null; visible: boolean; onClose: () => void;
}> = ({ report, visible, onClose }) => {
  if (!report) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={repSt.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={repSt.detailSheet}>
          <View style={repSt.modalHandle} />
          <View style={repSt.detailHeader}>
            <View>
              <Text style={repSt.detailTitle}>Daily Report</Text>
              <Text style={repSt.detailSub}>{report.employee?.fullName} · {report.date}</Text>
            </View>
            <TouchableOpacity style={repSt.closeBtn} onPress={onClose}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={repSt.detailStatsGrid}>
              {[
                { label:"Sales Made",        val:report.sales,            color:COLORS.primary,    icon:<TrendingUp size={16} color={COLORS.primary}/> },
                { label:"Customers Reached", val:report.customersReached, color:COLORS.accentBlue, icon:<Users size={16} color={COLORS.accentBlue}/> },
                { label:"Samplers Given",    val:report.samplersGiven,    color:COLORS.success,    icon:<Gift size={16} color={COLORS.success}/> },
              ].map(s => (
                <View key={s.label} style={[repSt.detailStatCard, { borderTopWidth:3, borderTopColor:s.color }]}>
                  {s.icon}
                  <Text style={[repSt.detailStatVal, { color:s.color }]}>{s.val}</Text>
                  <Text style={repSt.detailStatLbl}>{s.label}</Text>
                </View>
              ))}
            </View>
            <Text style={repSt.detailSectionLabel}>Details</Text>
            <View style={repSt.detailInfoCard}>
              {[
                { label:"Employee",   val: report.employee?.fullName ?? "" },
                { label:"Role",       val: report.employee?.role ?? "" },
                { label:"Location",   val: report.location },
                { label:"Day",        val:`${report.dayName}, ${report.date}` },
                { label:"Submission", val: report.submitted ? "Submitted ✓" : "Pending ⏳" },
                { label:"Approved",   val: report.approved  ? "Yes ✅" : "Not yet" },
                { label:"Status",     val: report.flagged   ? "⚠️ Flagged" : "✅ Normal" },
              ].map((r,i) => (
                <View key={i} style={[repSt.detailInfoRow, i>0 && { borderTopWidth:1, borderTopColor:COLORS.border }]}>
                  <Text style={repSt.detailInfoLabel}>{r.label}</Text>
                  <Text style={repSt.detailInfoVal}>{r.val}</Text>
                </View>
              ))}
            </View>
            {report.notes ? (
              <>
                <Text style={repSt.detailSectionLabel}>Notes</Text>
                <View style={repSt.notesCard}>
                  <Text style={repSt.notesText}>{report.notes}</Text>
                </View>
              </>
            ) : null}
            <View style={repSt.exportRow}>
              <TouchableOpacity style={repSt.exportBtn}
                onPress={()=>Alert.alert("Export","Report PDF exported.")} activeOpacity={0.85}>
                <Download size={14} color={COLORS.white} />
                <Text style={repSt.exportBtnText}>Export PDF</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Monthly Detail Modal ─────────────────────────────────────────────────────
const MonthlyDetailModal: React.FC<{
  agg: EmployeeMonthlyAggregate | null; visible: boolean; onClose: () => void;
}> = ({ agg, visible, onClose }) => {
  if (!agg) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={repSt.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={repSt.detailSheet}>
          <View style={repSt.modalHandle} />
          <View style={repSt.detailHeader}>
            <View>
              <Text style={repSt.detailTitle}>Monthly Summary</Text>
              <Text style={repSt.detailSub}>{agg.employee.fullName}</Text>
            </View>
            <TouchableOpacity style={repSt.closeBtn} onPress={onClose}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={repSt.detailStatsGrid}>
              {[
                { label:"Total Sales",     val:agg.totalSales,     color:COLORS.primary,    icon:<TrendingUp size={16} color={COLORS.primary}/> },
                { label:"Total Customers", val:agg.totalCustomers, color:COLORS.accentBlue, icon:<Users size={16} color={COLORS.accentBlue}/> },
                { label:"Total Samplers",  val:agg.totalSamplers,  color:COLORS.success,    icon:<Gift size={16} color={COLORS.success}/> },
              ].map(s => (
                <View key={s.label} style={[repSt.detailStatCard, { borderTopWidth:3, borderTopColor:s.color }]}>
                  {s.icon}
                  <Text style={[repSt.detailStatVal, { color:s.color }]}>{s.val}</Text>
                  <Text style={repSt.detailStatLbl}>{s.label}</Text>
                </View>
              ))}
            </View>
            <Text style={repSt.detailSectionLabel}>Performance</Text>
            <View style={repSt.detailInfoCard}>
              {[
                { label:"Days Reported",  val:`${agg.daysReported}` },
                { label:"Sales Target",  val:`${agg.totalSales} / ${agg.target} (${agg.achievePct}%)` },
                { label:"Avg Sales/Day", val:`${agg.avgSalesPerDay}` },
                { label:"Best Day",      val: agg.bestDayDisplay },
                { label:"Trend",         val: agg.trend==="up" ? "↑ Improving" : agg.trend==="down" ? "↓ Declining" : "→ Stable" },
              ].map((r,i) => (
                <View key={i} style={[repSt.detailInfoRow, i>0 && { borderTopWidth:1, borderTopColor:COLORS.border }]}>
                  <Text style={repSt.detailInfoLabel}>{r.label}</Text>
                  <Text style={repSt.detailInfoVal}>{r.val}</Text>
                </View>
              ))}
            </View>
            <View style={repSt.exportRow}>
              <TouchableOpacity style={repSt.exportBtn}
                onPress={()=>Alert.alert("Export","Monthly PDF exported.")} activeOpacity={0.85}>
                <Download size={14} color={COLORS.white} />
                <Text style={repSt.exportBtnText}>Export Monthly PDF</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface ReportsScreenProps { navigation?: any }

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [tab,         setTab]         = useState<ReportTab>("daily");
  const [month,       setMonth]       = useState<Month>("Apr");
  const [year,        setYear]        = useState("2026");
  const [search,      setSearch]      = useState("");
  const [showPicker,  setShowPicker]  = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Data
  const [allDailyReports, setAllDailyReports] = useState<HydratedReport[]>([]);
  const [availableDates,  setAvailableDates]  = useState<string[]>([]);
  const [filterDate,      setFilterDate]      = useState<string>("");
  const [monthlyAggs,     setMonthlyAggs]     = useState<EmployeeMonthlyAggregate[]>([]);
  const [dailyLoading,    setDailyLoading]    = useState(true);
  const [monthlyLoading,  setMonthlyLoading]  = useState(false);

  // Modals
  const [viewDaily,   setViewDaily]   = useState<HydratedReport | null>(null);
  const [viewMonthly, setViewMonthly] = useState<EmployeeMonthlyAggregate | null>(null);

  // ── Load daily reports ────────────────────────────────────────────────────
  const loadDailyReports = useCallback(async () => {
    setDailyLoading(true);
    try {
      const reports = await getHydratedReports();  // all dates
      // Build unique sorted dates descending
      const dates = [...new Set(reports.map(r => r.date))];
      setAllDailyReports(reports);
      setAvailableDates(dates);
      if (dates.length && !filterDate) setFilterDate(dates[0]);
    } finally {
      setDailyLoading(false);
    }
  }, []);

  // ── Load monthly aggregates ───────────────────────────────────────────────
  const loadMonthly = useCallback(async (m: string, y: string) => {
    setMonthlyLoading(true);
    try {
      const aggs = await getMonthlyAggregates(m, y);
      setMonthlyAggs(aggs.sort((a, b) => b.totalSales - a.totalSales));
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  useEffect(() => { loadDailyReports(); }, [loadDailyReports]);
  useEffect(() => {
    if (tab === "monthly" || tab === "summary") loadMonthly(month, year);
  }, [tab, month, year, loadMonthly]);

  // ── Filtered daily reports ────────────────────────────────────────────────
  const filteredDaily = allDailyReports.filter(r => {
    if (r.date !== filterDate) return false;
    if (search && !r.employee?.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    if (flaggedOnly && !r.flagged) return false;
    return true;
  });

  const filteredMonthly = monthlyAggs.filter(a =>
    !search || a.employee.fullName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const totalSales     = filteredDaily.reduce((s,r) => s + r.sales, 0);
  const totalCustomers = filteredDaily.reduce((s,r) => s + r.customersReached, 0);
  const totalSamplers  = filteredDaily.reduce((s,r) => s + r.samplersGiven, 0);
  const submittedCount = filteredDaily.filter(r => r.submitted).length;
  const flaggedCount   = filteredDaily.filter(r => r.flagged).length;

  const mTotalSales     = monthlyAggs.reduce((s, a) => s + a.totalSales, 0);
  const mTotalCustomers = monthlyAggs.reduce((s, a) => s + a.totalCustomers, 0);
  const mTopPerformer   = monthlyAggs[0]; // already sorted desc
  const maxSales        = monthlyAggs[0]?.totalSales ?? 1;

  // ── Admin actions ─────────────────────────────────────────────────────────
  const handleApprove = async (reportId: string) => {
    await approveReport(reportId);
    await loadDailyReports();
  };

  const handleFlag = async (reportId: string, flagged: boolean) => {
    await flagReport(reportId, flagged);
    await loadDailyReports();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation?.openDrawer()} activeOpacity={0.7}>
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports Review</Text>
        <TouchableOpacity style={styles.addBtn}
          onPress={() => Alert.alert("Export","Full report PDF exported for " + month + " " + year)}
          activeOpacity={0.8}>
          <Download size={19} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Tab switcher */}
        <View style={repSt.tabBar}>
          {([
            { key:"daily",   label:"Daily",   icon:<Calendar size={13} color={tab==="daily" ? COLORS.white : COLORS.textMuted} /> },
            { key:"monthly", label:"Monthly", icon:<BarChart2 size={13} color={tab==="monthly" ? COLORS.white : COLORS.textMuted} /> },
            { key:"summary", label:"Summary", icon:<Award size={13} color={tab==="summary" ? COLORS.white : COLORS.textMuted} /> },
          ] as const).map(t => (
            <TouchableOpacity key={t.key} style={[repSt.tabBtn, tab===t.key && repSt.tabBtnActive]}
              onPress={() => setTab(t.key)} activeOpacity={0.8}>
              {t.icon}
              <Text style={[repSt.tabBtnText, tab===t.key && repSt.tabBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search + filter pill */}
        <View style={repSt.searchRow}>
          <View style={repSt.searchBox}>
            <Search size={14} color={COLORS.textMuted} />
            <TextInput style={repSt.searchInput} value={search} onChangeText={setSearch}
              placeholder="Search employee..." placeholderTextColor={COLORS.textMuted} />
            {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={13} color={COLORS.textMuted}/></TouchableOpacity> : null}
          </View>
          {tab === "daily" && (
            <TouchableOpacity
              style={[repSt.filterPillBtn, flaggedOnly && { backgroundColor: COLORS.danger }]}
              onPress={() => setFlaggedOnly(!flaggedOnly)} activeOpacity={0.8}>
              <AlertTriangle size={13} color={flaggedOnly ? COLORS.white : COLORS.danger} />
              <Text style={[repSt.filterPillBtnText, { color: flaggedOnly ? COLORS.white : COLORS.danger }]}>Flagged</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── DAILY TAB ── */}
        {tab === "daily" && (
          <>
            {/* Date chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={repSt.dateScroll} contentContainerStyle={repSt.dateScrollContent}>
              {availableDates.map(d => (
                <TouchableOpacity key={d}
                  style={[repSt.dateChip, filterDate === d && repSt.dateChipActive]}
                  onPress={() => setFilterDate(d)} activeOpacity={0.8}>
                  <Text style={[repSt.dateChipText, filterDate === d && repSt.dateChipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Daily KPI strip */}
            {!dailyLoading && (
              <View style={repSt.kpiStrip}>
                {[
                  { val: totalSales,     lbl: "Sales",     color: COLORS.primary },
                  { val: totalCustomers, lbl: "Reached",   color: COLORS.accentBlue },
                  { val: totalSamplers,  lbl: "Samplers",  color: COLORS.success },
                  { val: `${submittedCount}/${filteredDaily.length}`, lbl: "Submitted", color: flaggedCount > 0 ? COLORS.warning : COLORS.success },
                ].map(k => (
                  <View key={k.lbl} style={repSt.kpiItem}>
                    <Text style={[repSt.kpiVal, { color: k.color }]}>{k.val}</Text>
                    <Text style={repSt.kpiLbl}>{k.lbl}</Text>
                  </View>
                ))}
              </View>
            )}

            {flaggedCount > 0 && (
              <View style={repSt.flagAlert}>
                <AlertTriangle size={14} color={COLORS.danger} />
                <Text style={repSt.flagAlertText}>
                  {flaggedCount} report{flaggedCount > 1 ? "s" : ""} flagged for low performance
                </Text>
              </View>
            )}

            <View style={repSt.sectionRow}>
              <Text style={repSt.sectionTitle}>Reports · {filterDate}</Text>
              <Text style={repSt.sectionCount}>{filteredDaily.length} reports</Text>
            </View>

            {dailyLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : filteredDaily.length === 0 ? (
              <View style={repSt.emptyState}>
                <Text style={repSt.emptyText}>No reports for this date.</Text>
              </View>
            ) : (
              filteredDaily.map((r, i) => (
                <React.Fragment key={r.id}>
                  <DailyCard
                    report={r}
                    onView={() => setViewDaily(r)}
                    onApprove={() => handleApprove(r.id)}
                    onFlag={(flagged) => handleFlag(r.id, flagged)}
                  />
                  {i < filteredDaily.length - 1 && <View style={{ height: 10 }} />}
                </React.Fragment>
              ))
            )}
          </>
        )}

        {/* ── MONTHLY TAB ── */}
        {tab === "monthly" && (
          <>
            <TouchableOpacity style={repSt.monthSelector} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                <Calendar size={18} color={COLORS.primary} />
                <View>
                  <Text style={repSt.monthSelectorLabel}>Period</Text>
                  <Text style={repSt.monthSelectorValue}>{month} {year}</Text>
                </View>
              </View>
              <ChevronDown size={18} color={COLORS.primary} />
            </TouchableOpacity>

            {!monthlyLoading && monthlyAggs.length > 0 && (
              <View style={repSt.kpiStrip}>
                {[
                  { val: mTotalSales,     lbl: "Total Sales",  color: COLORS.primary },
                  { val: mTotalCustomers, lbl: "Customers",    color: COLORS.accentBlue },
                  { val: mTopPerformer?.employee.firstName ?? "—", lbl: "Top Rep", color: COLORS.success },
                ].map(k => (
                  <View key={k.lbl} style={repSt.kpiItem}>
                    <Text style={[repSt.kpiVal, { color: k.color, fontSize: k.lbl === "Top Rep" ? 13 : 18 }]}>{k.val}</Text>
                    <Text style={repSt.kpiLbl}>{k.lbl}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={repSt.sectionRow}>
              <Text style={repSt.sectionTitle}>{month} {year} — All Employees</Text>
              <TouchableOpacity style={repSt.exportSmallBtn}
                onPress={() => Alert.alert("Export","Monthly PDF exported.")} activeOpacity={0.85}>
                <Download size={12} color={COLORS.white} />
                <Text style={repSt.exportSmallText}>PDF</Text>
              </TouchableOpacity>
            </View>

            {monthlyLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : filteredMonthly.length === 0 ? (
              <View style={repSt.emptyState}>
                <Text style={repSt.emptyText}>No reports for {month} {year}.</Text>
              </View>
            ) : (
              <View style={repSt.monthlyList}>
                {filteredMonthly.map((agg, i) => (
                  <React.Fragment key={agg.employee.id}>
                    <MonthlyRow agg={agg} rank={i + 1} maxSales={maxSales} onView={() => setViewMonthly(agg)} />
                    {i < filteredMonthly.length - 1 && <View style={repSt.rowDivider} />}
                  </React.Fragment>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── SUMMARY TAB ── */}
        {tab === "summary" && (
          <>
            <View style={repSt.summaryHero}>
              <Text style={repSt.summaryHeroLabel}>Period Performance</Text>
              <Text style={repSt.summaryHeroValue}>{month} {year}</Text>
            </View>

            {monthlyLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : (
              <>
                <Text style={repSt.summarySection}>🏆 Top Performers</Text>
                {[...monthlyAggs].sort((a,b) => b.totalSales - a.totalSales).slice(0, 3).map((agg, i) => (
                  <View key={agg.employee.id} style={[repSt.topCard, {
                    borderLeftColor: i===0 ? COLORS.warning : i===1 ? "#9E9E9E" : "#CD7F32",
                  }]}>
                    <Text style={[repSt.topRank, {
                      color: i===0 ? COLORS.warning : i===1 ? "#9E9E9E" : "#CD7F32",
                    }]}>
                      {i===0 ? "🥇" : i===1 ? "🥈" : "🥉"}
                    </Text>
                    <View style={[repSt.initials, { width:40, height:40, borderRadius:20, backgroundColor:COLORS.primaryMuted }]}>
                      <Text style={[repSt.initialsText, { color:COLORS.primary }]}>{agg.employee.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={repSt.empName}>{agg.employee.fullName}</Text>
                      <Text style={repSt.empRole}>{agg.employee.role}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[repSt.topSales, { color: COLORS.primary }]}>{agg.totalSales}</Text>
                      <Text style={repSt.topSalesLbl}>sales</Text>
                    </View>
                  </View>
                ))}

                <Text style={repSt.summarySection}>⚠️ Needs Attention</Text>
                {monthlyAggs.filter(a => a.achievePct < 90).map(agg => (
                  <View key={agg.employee.id} style={[repSt.topCard, { borderLeftColor: COLORS.danger }]}>
                    <View style={[repSt.initials, { width:40, height:40, borderRadius:20, backgroundColor:COLORS.dangerLight }]}>
                      <Text style={[repSt.initialsText, { color: COLORS.danger }]}>{agg.employee.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={repSt.empName}>{agg.employee.fullName}</Text>
                      <Text style={repSt.empRole}>{agg.employee.role}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[repSt.topSales, { color: COLORS.danger }]}>{agg.achievePct}%</Text>
                      <Text style={repSt.topSalesLbl}>of target</Text>
                    </View>
                  </View>
                ))}

                {monthlyAggs.filter(a => a.achievePct < 90).length === 0 && (
                  <View style={repSt.emptyState}>
                    <Text style={repSt.emptyText}>🎉 All employees on target!</Text>
                  </View>
                )}

                <TouchableOpacity style={repSt.fullExportBtn}
                  onPress={() => Alert.alert("Export","Full summary PDF exported.")} activeOpacity={0.85}>
                  <Download size={15} color={COLORS.white} />
                  <Text style={repSt.fullExportBtnText}>Export Full Summary PDF</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Month picker */}
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={repSt.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={repSt.pickerSheet}>
            <View style={repSt.modalHandle} />
            <Text style={repSt.modalTitle}>Select Period</Text>
            <View style={repSt.yearRow}>
              {YEARS.map(y => (
                <TouchableOpacity key={y} style={[repSt.yearBtn, year===y && repSt.yearBtnActive]}
                  onPress={() => setYear(y)} activeOpacity={0.8}>
                  <Text style={[repSt.yearBtnText, year===y && repSt.yearBtnTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={repSt.monthGrid}>
              {MONTHS.map(m => (
                <TouchableOpacity key={m} style={[repSt.monthBtn, month===m && repSt.monthBtnActive]}
                  onPress={() => { setMonth(m); setShowPicker(false); }} activeOpacity={0.8}>
                  <Text style={[repSt.monthBtnText, month===m && repSt.monthBtnTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Detail Modals */}
      <ReportDetailModal  report={viewDaily}   visible={!!viewDaily}   onClose={() => setViewDaily(null)} />
      <MonthlyDetailModal agg={viewMonthly}    visible={!!viewMonthly} onClose={() => setViewMonthly(null)} />
    </SafeAreaView>
  );
};

// ─── Shared screen styles (header + scroll) ───────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: "800", color: COLORS.white,
    textAlign: "center", letterSpacing: 0.3,
  },
  addBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  scroll: {
    flex: 1, backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -8,
  },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16 },
});

// ─── Report-specific styles ───────────────────────────────────────────────────
const repSt = StyleSheet.create({
  // Tab bar
  tabBar: { flexDirection:"row", backgroundColor:COLORS.cardBg, borderRadius:16, padding:4, marginBottom:14, gap:4 },
  tabBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center",
    gap:5, paddingVertical:9, borderRadius:12,
  },
  tabBtnActive: { backgroundColor:COLORS.primary },
  tabBtnText: { fontSize:12, fontWeight:"700", color:COLORS.textMuted },
  tabBtnTextActive: { color:COLORS.white },

  // Search
  searchRow: { flexDirection:"row", alignItems:"center", gap:8, marginBottom:12 },
  searchBox: {
    flex:1, flexDirection:"row", alignItems:"center", gap:8,
    backgroundColor:COLORS.cardBg, borderRadius:14,
    paddingHorizontal:12, paddingVertical:10,
    borderWidth:1, borderColor:COLORS.border,
  },
  searchInput: { flex:1, fontSize:13, color:COLORS.textPrimary },
  filterPillBtn: {
    flexDirection:"row", alignItems:"center", gap:5,
    paddingHorizontal:12, paddingVertical:10, borderRadius:14,
    backgroundColor:COLORS.dangerLight,
  },
  filterPillBtnText: { fontSize:12, fontWeight:"700" },

  // Date chips
  dateScroll: { marginBottom:12 },
  dateScrollContent: { gap:8, paddingRight:4 },
  dateChip: {
    paddingHorizontal:14, paddingVertical:7, borderRadius:20,
    backgroundColor:COLORS.cardBg, borderWidth:1, borderColor:COLORS.border,
  },
  dateChipActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  dateChipText: { fontSize:12, fontWeight:"600", color:COLORS.textMuted },
  dateChipTextActive: { color:COLORS.white },

  // KPI strip
  kpiStrip: {
    flexDirection:"row", backgroundColor:COLORS.cardBg, borderRadius:16,
    paddingVertical:14, marginBottom:12,
  },
  kpiItem: { flex:1, alignItems:"center" },
  kpiVal: { fontSize:18, fontWeight:"800", letterSpacing:-0.5 },
  kpiLbl: { fontSize:10, fontWeight:"600", color:COLORS.textMuted, marginTop:2, textTransform:"uppercase" },

  // Flag alert
  flagAlert: {
    flexDirection:"row", alignItems:"center", gap:8,
    backgroundColor:COLORS.dangerLight, borderRadius:12,
    padding:12, marginBottom:12,
  },
  flagAlertText: { fontSize:13, color:COLORS.danger, fontWeight:"600", flex:1 },

  // Section row
  sectionRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  sectionTitle: { fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  sectionCount: { fontSize:11, color:COLORS.textMuted, fontWeight:"600" },

  // Daily card
  dailyCard: {
    backgroundColor:COLORS.cardBg, borderRadius:20, overflow:"hidden",
    shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:8,
    shadowOffset:{ width:0, height:2 }, elevation:2,
  },
  dailyBody: { padding:14, gap:10 },
  dailyTop: { flexDirection:"row", alignItems:"flex-start", gap:10 },
  initials: {
    width:36, height:36, borderRadius:10,
    alignItems:"center", justifyContent:"center",
  },
  initialsText: { fontSize:13, fontWeight:"800" },
  nameRow: { flexDirection:"row", alignItems:"center", gap:6, flexWrap:"wrap" },
  empName: { fontSize:13, fontWeight:"800", color:COLORS.textPrimary },
  empRole: { fontSize:11, color:COLORS.textMuted, marginTop:2, fontWeight:"500" },
  flagBadge: {
    flexDirection:"row", alignItems:"center", gap:3,
    backgroundColor:COLORS.dangerLight, borderRadius:8,
    paddingHorizontal:6, paddingVertical:2,
  },
  flagText: { fontSize:9, fontWeight:"700", color:COLORS.danger },
  dateBox: { alignItems:"flex-end" },
  dateDayName: { fontSize:10, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase" },
  dateShort: { fontSize:12, fontWeight:"800", color:COLORS.textPrimary },
  statsStrip: {
    flexDirection:"row", backgroundColor:COLORS.background,
    borderRadius:12, paddingVertical:10,
  },
  statItem: { flex:1, alignItems:"center", gap:3 },
  statLbl: { fontSize:10, color:COLORS.textMuted, fontWeight:"600", textTransform:"uppercase" },
  statVal: { fontSize:16, fontWeight:"800", color:COLORS.textPrimary },
  statDivider: { width:1, height:28, backgroundColor:COLORS.border, alignSelf:"center" },
  noteText: { fontSize:12, color:COLORS.textSecondary, fontStyle:"italic" },
  actionRow: { flexDirection:"row", gap:8, flexWrap:"wrap" },
  viewRowBtn: {
    flexDirection:"row", alignItems:"center", gap:4,
    backgroundColor:COLORS.accentBlueLight, borderRadius:10,
    paddingHorizontal:10, paddingVertical:6,
  },
  viewRowBtnText: { fontSize:11, fontWeight:"700", color:COLORS.accentBlue },

  // Monthly row
  monthlyList: { backgroundColor:COLORS.cardBg, borderRadius:20, overflow:"hidden" },
  monthlyRow: {
    flexDirection:"row", alignItems:"center",
    padding:14, gap:10,
  },
  rank: { fontSize:12, fontWeight:"700", color:COLORS.textMuted, width:22 },
  monthlyNameRow: { flexDirection:"row", alignItems:"center", gap:8 },
  progressRow: { flexDirection:"row", alignItems:"center", gap:8 },
  progressLabel: { fontSize:11, fontWeight:"700", color:COLORS.textMuted, minWidth:50 },
  monthlyMeta: { fontSize:10, color:COLORS.textMuted, fontWeight:"500" },
  trendChip: { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  trendChipText: { fontSize:10, fontWeight:"800" },
  eyeBtn: {
    width:30, height:30, borderRadius:15,
    backgroundColor:COLORS.background, alignItems:"center", justifyContent:"center",
  },
  rowDivider: { height:1, backgroundColor:COLORS.border, marginHorizontal:14 },

  // Month selector
  monthSelector: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    backgroundColor:COLORS.cardBg, borderRadius:16, padding:16, marginBottom:14,
    borderWidth:1.5, borderColor:COLORS.border,
  },
  monthSelectorLabel: { fontSize:10, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase" },
  monthSelectorValue: { fontSize:16, fontWeight:"800", color:COLORS.textPrimary },
  exportSmallBtn: {
    flexDirection:"row", alignItems:"center", gap:4,
    backgroundColor:COLORS.primary, borderRadius:10, paddingHorizontal:10, paddingVertical:5,
  },
  exportSmallText: { fontSize:11, fontWeight:"700", color:COLORS.white },

  // Summary tab
  summaryHero: {
    backgroundColor:COLORS.primaryMuted, borderRadius:20, padding:20,
    alignItems:"center", marginBottom:14,
  },
  summaryHeroLabel: { fontSize:12, color:COLORS.primary, fontWeight:"700", textTransform:"uppercase" },
  summaryHeroValue: { fontSize:26, fontWeight:"800", color:COLORS.primary, marginTop:4 },
  summarySection: { fontSize:14, fontWeight:"800", color:COLORS.textPrimary, marginBottom:10, marginTop:6 },
  topCard: {
    flexDirection:"row", alignItems:"center", gap:10,
    backgroundColor:COLORS.cardBg, borderRadius:16, padding:14,
    borderLeftWidth:4, marginBottom:8,
  },
  topRank: { fontSize:22 },
  topSales: { fontSize:18, fontWeight:"800" },
  topSalesLbl: { fontSize:10, color:COLORS.textMuted, fontWeight:"600" },
  fullExportBtn: {
    flexDirection:"row", alignItems:"center", justifyContent:"center",
    gap:8, backgroundColor:COLORS.primary, borderRadius:14,
    paddingVertical:15, marginTop:12,
  },
  fullExportBtnText: { fontSize:14, fontWeight:"800", color:COLORS.white },

  // Empty
  emptyState: { alignItems:"center", paddingVertical:30 },
  emptyText: { fontSize:14, color:COLORS.textMuted, fontWeight:"600" },

  // Modal
  modalOverlay: { flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  pickerSheet: {
    backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28,
    padding:24, paddingBottom: Platform.OS==="ios" ? 40 : 28,
  },
  modalHandle: {
    width:44, height:5, borderRadius:3, backgroundColor:COLORS.border,
    alignSelf:"center", marginBottom:20,
  },
  modalTitle: { fontSize:17, fontWeight:"800", color:COLORS.textPrimary, textAlign:"center", marginBottom:16 },
  yearRow: { flexDirection:"row", gap:8, marginBottom:16 },
  yearBtn: {
    flex:1, paddingVertical:10, borderRadius:12, borderWidth:1.5,
    borderColor:COLORS.border, alignItems:"center",
  },
  yearBtnActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  yearBtnText: { fontSize:13, fontWeight:"700", color:COLORS.textMuted },
  yearBtnTextActive: { color:COLORS.white },
  monthGrid: { flexDirection:"row", flexWrap:"wrap", gap:8 },
  monthBtn: {
    width:"22%", paddingVertical:10, borderRadius:12, borderWidth:1.5,
    borderColor:COLORS.border, alignItems:"center",
  },
  monthBtnActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  monthBtnText: { fontSize:12, fontWeight:"700", color:COLORS.textMuted },
  monthBtnTextActive: { color:COLORS.white },
  detailSheet: {
    backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28,
    padding:24, maxHeight:"88%",
  },
  detailHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 },
  detailTitle: { fontSize:18, fontWeight:"800", color:COLORS.textPrimary },
  detailSub: { fontSize:12, color:COLORS.textMuted, marginTop:3 },
  closeBtn: {
    width:32, height:32, borderRadius:16, backgroundColor:COLORS.background,
    alignItems:"center", justifyContent:"center",
  },
  detailStatsGrid: { flexDirection:"row", gap:8, marginBottom:16 },
  detailStatCard: {
    flex:1, backgroundColor:COLORS.background, borderRadius:14,
    padding:12, alignItems:"center", gap:6,
  },
  detailStatVal: { fontSize:22, fontWeight:"800" },
  detailStatLbl: { fontSize:10, fontWeight:"600", color:COLORS.textMuted, textAlign:"center" },
  detailSectionLabel: {
    fontSize:11, fontWeight:"700", color:COLORS.textMuted,
    textTransform:"uppercase", letterSpacing:0.5, marginBottom:8, marginTop:4,
  },
  detailInfoCard: { backgroundColor:COLORS.background, borderRadius:14, overflow:"hidden", marginBottom:12 },
  detailInfoRow: { flexDirection:"row", justifyContent:"space-between", padding:12 },
  detailInfoLabel: { fontSize:13, color:COLORS.textSecondary, fontWeight:"500" },
  detailInfoVal: { fontSize:13, color:COLORS.textPrimary, fontWeight:"700", flex:1, textAlign:"right" },
  notesCard: { backgroundColor:COLORS.background, borderRadius:14, padding:14, marginBottom:12 },
  notesText: { fontSize:13, color:COLORS.textSecondary, lineHeight:20 },
  exportRow: { alignItems:"center", marginTop:8 },
  exportBtn: {
    flexDirection:"row", alignItems:"center", gap:6,
    backgroundColor:COLORS.primary, borderRadius:12, paddingHorizontal:24, paddingVertical:12,
  },
  exportBtnText: { fontSize:13, fontWeight:"800", color:COLORS.white },
});

export default ReportsScreen;