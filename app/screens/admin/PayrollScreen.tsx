/**
 * PayrollScreen.tsx — REFACTORED
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from original:
 *  • Removed PAYROLL[] constant — all records from getPayrollByPeriod()
 *  • Period summary (gross, net, paid/pending/draft counts) from getPayrollPeriodSummary()
 *  • calcGross / calcTotalDeductions / calcNet imported from dbService
 *  • markPayrollPaid() writes to the data store
 *  • updatePayrollRecord() saves adjustments (bonus, advance, overtime)
 *  • PayrollRow reads from PayrollRecord — employee name/initials from employee field
 *  • Payslip modal reads from PayrollRecord — all fields correctly mapped
 *  • Loading state and empty state for each period change
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
  Modal,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Download, ChevronDown, Check, DollarSign, TrendingUp,
  Users, AlertCircle, Eye, FileText, CheckCircle,
  Menu, X, Edit2, Printer,
} from "lucide-react-native";

import {
  getPayrollByPeriod,
  getPayrollPeriodSummary,
  markPayrollPaid,
  updatePayrollRecord,
  calcGross,
  calcTotalDeductions,
  calcNet,
  getEmployeeById,
  PayrollRecord,
  PayrollPeriodSummary,
  Employee,
  PayStatus,
} from "../../data/dbService";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary:         "#8B0111",
  primaryDark:     "#8B0111",
  primaryDeep:     "#6B0009",
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
  paid:            "#00897B",
  paidBg:          "#E0F2F1",
  pending:         "#F57C00",
  pendingBg:       "#FFF3E0",
  draft:           "#8FA3B8",
  draftBg:         "#F5F5F5",
};

type Month = "Jan"|"Feb"|"Mar"|"Apr"|"May"|"Jun"|"Jul"|"Aug"|"Sep"|"Oct"|"Nov"|"Dec";
const MONTHS: Month[] = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = ["2026","2025","2024"];

// ─── Tiny Clock icon shim ─────────────────────────────────────────────────────
const Clock: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <View style={{ width:size, height:size, borderRadius:size/2, borderWidth:1.5, borderColor:color, alignItems:"center", justifyContent:"center" }}>
    <View style={{ width:1.5, height:size*0.28, backgroundColor:color, position:"absolute", bottom:"50%", right:"48%" }} />
    <View style={{ width:size*0.28, height:1.5, backgroundColor:color, position:"absolute", left:"50%", top:"50%" }} />
  </View>
);

// ─── Hydrated payroll — PayrollRecord + employee profile joined ───────────────
interface HydratedPayroll extends PayrollRecord {
  employee: Employee | null;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusColor = (s: PayStatus) =>
  s === "paid" ? COLORS.paid : s === "pending" ? COLORS.pending : COLORS.draft;
const statusBg = (s: PayStatus) =>
  s === "paid" ? COLORS.paidBg : s === "pending" ? COLORS.pendingBg : COLORS.draftBg;
const statusAvatarBg = (s: PayStatus) =>
  s === "paid" ? COLORS.successLight : s === "pending" ? COLORS.warningLight : COLORS.accentBlueLight;

// ─── Payslip Detail Modal ─────────────────────────────────────────────────────
const PayslipModal: React.FC<{
  record: HydratedPayroll | null;
  visible: boolean;
  onClose: () => void;
  onMarkPaid: () => void;
}> = ({ record, visible, onClose, onMarkPaid }) => {
  if (!record) return null;
  const gross    = calcGross(record);
  const totalDed = calcTotalDeductions(record);
  const net      = calcNet(record);
  const emp      = record.employee;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={st.payslipSheet}>
          <View style={st.modalHandle} />

          {/* Payslip header */}
          <View style={st.payslipHeader}>
            <View style={st.payslipHeroLeft}>
              <View style={st.payslipAvatar}>
                <Text style={st.payslipAvatarText}>{emp?.initials ?? "??"}</Text>
              </View>
              <View>
                <Text style={st.payslipName}>{emp?.fullName ?? "Employee"}</Text>
                <Text style={st.payslipRole}>{emp?.role ?? ""}</Text>
                <Text style={st.payslipPeriod}>
                  {record.period.label} · {record.attendance.daysWorked}/{record.attendance.totalDays} days
                </Text>
              </View>
            </View>
            <View style={[st.statusChip, { backgroundColor: statusBg(record.status) }]}>
              <Text style={[st.statusChipText, { color: statusColor(record.status) }]}>
                {record.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Earnings */}
            <Text style={st.slipSection}>Earnings</Text>
            <View style={st.slipCard}>
              <View style={st.slipRow}>
                <Text style={st.slipLabel}>Basic Salary</Text>
                <Text style={st.slipValue}>KES {record.baseSalary.toLocaleString()}</Text>
              </View>
              <View style={[st.slipRow, st.slipRowBorder]}>
                <Text style={st.slipLabel}>Sales Bonus</Text>
                <Text style={[st.slipValue, { color: COLORS.success }]}>
                  KES {record.bonuses.salesBonus.toLocaleString()}
                </Text>
              </View>
              {record.bonuses.performanceBonus > 0 && (
                <View style={[st.slipRow, st.slipRowBorder]}>
                  <Text style={st.slipLabel}>Performance Bonus</Text>
                  <Text style={[st.slipValue, { color: COLORS.success }]}>
                    KES {record.bonuses.performanceBonus.toLocaleString()}
                  </Text>
                </View>
              )}
              {record.allowances.map((a, i) => (
                <View key={i} style={[st.slipRow, st.slipRowBorder]}>
                  <Text style={st.slipLabel}>{a.label} Allowance</Text>
                  <Text style={[st.slipValue, { color: COLORS.accentBlue }]}>
                    KES {a.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={[st.slipRow, st.slipRowBorder, st.grossRow]}>
                <Text style={st.grossLabel}>Gross Pay</Text>
                <Text style={st.grossValue}>KES {gross.toLocaleString()}</Text>
              </View>
            </View>

            {/* Deductions */}
            <Text style={st.slipSection}>Deductions</Text>
            <View style={st.slipCard}>
              {record.deductions.map((d, i) => (
                <View key={i} style={[st.slipRow, i > 0 && st.slipRowBorder]}>
                  <Text style={st.slipLabel}>{d.label}</Text>
                  <Text style={[st.slipValue, { color: COLORS.danger }]}>
                    - KES {d.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={[st.slipRow, st.slipRowBorder, st.grossRow]}>
                <Text style={st.grossLabel}>Total Deductions</Text>
                <Text style={[st.grossValue, { color: COLORS.danger }]}>
                  KES {totalDed.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Net pay */}
            <View style={st.netPayCard}>
              <Text style={st.netPayLabel}>Net Pay</Text>
              <Text style={st.netPayValue}>KES {net.toLocaleString()}</Text>
            </View>

            {/* Notes */}
            {!!record.notes && (
              <View style={[st.slipCard, { marginTop: 0 }]}>
                <Text style={[st.slipLabel, { color: COLORS.textMuted }]}>Notes: {record.notes}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={st.slipActions}>
              <TouchableOpacity style={st.downloadBtn} activeOpacity={0.85}
                onPress={() => Alert.alert("PDF Export","Payslip PDF generated and ready to share.")}>
                <Download size={15} color={COLORS.white} />
                <Text style={st.downloadBtnText}>Export PDF</Text>
              </TouchableOpacity>
              {record.status !== "paid" && (
                <TouchableOpacity style={st.markPaidBtn} onPress={onMarkPaid} activeOpacity={0.85}>
                  <CheckCircle size={15} color={COLORS.white} />
                  <Text style={st.markPaidBtnText}>Mark as Paid</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Adjust Modal ─────────────────────────────────────────────────────────────
interface AdjustState {
  bonus: string; advance: string; overtime: string; otherAllowance: string; note: string;
}

const AdjustModal: React.FC<{
  record: HydratedPayroll | null;
  visible: boolean;
  onClose: () => void;
  onApply: (adj: AdjustState) => void;
}> = ({ record, visible, onClose, onApply }) => {
  const [adj, setAdj] = useState<AdjustState>({
    bonus: "", advance: "", overtime: "", otherAllowance: "", note: "",
  });
  if (!record) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[st.payslipSheet, { paddingBottom: Platform.OS === "ios" ? 40 : 28 }]}>
          <View style={st.modalHandle} />
          <View style={st.adjustTitleRow}>
            <Text style={st.modalTitle}>Adjust Payroll</Text>
            <Text style={st.adjustSub}>{record.employee?.fullName ?? "Employee"}</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {[
              { label:"Performance Bonus (KES)",  key:"bonus",          placeholder:"e.g. 2000" },
              { label:"Salary Advance (KES)",      key:"advance",        placeholder:"e.g. 5000" },
              { label:"Overtime Pay (KES)",        key:"overtime",       placeholder:"e.g. 1500" },
              { label:"Other Allowance (KES)",     key:"otherAllowance", placeholder:"e.g. 1000" },
            ].map(f => (
              <View key={f.key} style={st.adjField}>
                <Text style={st.adjLabel}>{f.label}</Text>
                <TextInput
                  style={st.adjInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={(adj as any)[f.key]}
                  onChangeText={(v) => setAdj({ ...adj, [f.key]: v })}
                />
              </View>
            ))}
            <View style={st.adjField}>
              <Text style={st.adjLabel}>Notes</Text>
              <TextInput
                style={[st.adjInput, { height:72, textAlignVertical:"top", paddingTop:10 }]}
                placeholder="Reason for adjustment..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={adj.note}
                onChangeText={(v) => setAdj({ ...adj, note: v })}
              />
            </View>
            <View style={st.slipActions}>
              <TouchableOpacity
                style={[st.downloadBtn, { backgroundColor:COLORS.background, borderWidth:1, borderColor:COLORS.border }]}
                onPress={onClose} activeOpacity={0.8}>
                <Text style={[st.downloadBtnText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.markPaidBtn}
                onPress={() => { onApply(adj); onClose(); }}
                activeOpacity={0.85}>
                <Check size={15} color={COLORS.white} />
                <Text style={st.markPaidBtnText}>Apply Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Payroll Row ──────────────────────────────────────────────────────────────
const PayrollRow: React.FC<{
  record: HydratedPayroll;
  onView: () => void;
  onAdjust: () => void;
  onMarkPaid: () => void;
}> = ({ record, onView, onAdjust, onMarkPaid }) => {
  const net = calcNet(record);
  const emp = record.employee;

  return (
    <View style={st.payRow}>
      <View style={st.payRowLeft}>
        <View style={[st.payAvatar, { backgroundColor: statusAvatarBg(record.status) }]}>
          <Text style={[st.payAvatarText, { color: statusColor(record.status) }]}>
            {emp?.initials ?? "??"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.payName}>{emp?.fullName ?? "Employee"}</Text>
          <Text style={st.payRole}>
            {emp?.role ?? ""} · {record.attendance.daysWorked}/{record.attendance.totalDays}d
          </Text>
        </View>
      </View>
      <View style={st.payRowRight}>
        <Text style={[st.payNet, { color: record.status === "paid" ? COLORS.success : COLORS.textPrimary }]}>
          KES {net.toLocaleString()}
        </Text>
        <View style={[st.statusChip, { backgroundColor: statusBg(record.status) }]}>
          <Text style={[st.statusChipText, { color: statusColor(record.status), fontSize: 9 }]}>
            {record.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={st.rowActions}>
        <TouchableOpacity style={st.rowActionBtn} onPress={onView} activeOpacity={0.8}>
          <Eye size={13} color={COLORS.accentBlue} />
        </TouchableOpacity>
        <TouchableOpacity style={st.rowActionBtn} onPress={onAdjust} activeOpacity={0.8}>
          <Edit2 size={13} color={COLORS.warning} />
        </TouchableOpacity>
        {record.status !== "paid" && (
          <TouchableOpacity
            style={[st.rowActionBtn, { backgroundColor: COLORS.successLight }]}
            onPress={onMarkPaid} activeOpacity={0.8}>
            <CheckCircle size={13} color={COLORS.success} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface PayrollScreenProps { navigation?: any }

const PayrollScreen: React.FC<PayrollScreenProps> = ({ navigation }) => {
  const [month,          setMonth]         = useState<Month>("Apr");
  const [year,           setYear]          = useState("2026");
  const [records,        setRecords]       = useState<HydratedPayroll[]>([]);
  const [summary,        setSummary]       = useState<PayrollPeriodSummary | null>(null);
  const [loading,        setLoading]       = useState(true);
  const [viewRecord,     setViewRecord]    = useState<HydratedPayroll | null>(null);
  const [adjustRecord,   setAdjustRecord]  = useState<HydratedPayroll | null>(null);
  const [showMonthPicker,setShowMonthPicker] = useState(false);
  const [filterStatus,   setFilterStatus]  = useState<"all" | PayStatus>("all");

  // ── Load payroll for period ───────────────────────────────────────────────
  const loadPayroll = useCallback(async (m: string, y: string) => {
    setLoading(true);
    try {
      const [rawRecords, periodSummary] = await Promise.all([
        getPayrollByPeriod(m, y),
        getPayrollPeriodSummary(m, y),
      ]);

      // Hydrate each record with employee profile
      const hydrated: HydratedPayroll[] = await Promise.all(
        rawRecords.map(async (r) => ({
          ...r,
          employee: await getEmployeeById(r.employeeId),
        }))
      );

      // Sort: paid first, then pending, then draft; within status sort by net desc
      hydrated.sort((a, b) => {
        const order: Record<PayStatus, number> = { paid: 0, pending: 1, draft: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return calcNet(b) - calcNet(a);
      });

      setRecords(hydrated);
      setSummary(periodSummary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayroll(month, year); }, [month, year, loadPayroll]);

  // ── Mark paid ─────────────────────────────────────────────────────────────
  const handleMarkPaid = async (id: string) => {
    await markPayrollPaid(id);
    await loadPayroll(month, year);
    setViewRecord(null);
  };

  // ── Apply adjustment ──────────────────────────────────────────────────────
  const handleApplyAdjust = async (id: string, adj: AdjustState) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    const perf    = Number(adj.bonus)          || 0;
    const advance = Number(adj.advance)        || 0;
    const overtime= Number(adj.overtime)       || 0;
    const other   = Number(adj.otherAllowance) || 0;

    const newDeductions = advance > 0
      ? [...record.deductions.filter(d => d.label !== "Advance"), { label:"Advance", amount: advance }]
      : record.deductions;

    const newAllowances = [
      ...record.allowances,
      ...(overtime > 0 ? [{ label:"Overtime", amount: overtime }] : []),
      ...(other    > 0 ? [{ label:"Other",    amount: other    }] : []),
    ];

    await updatePayrollRecord(id, {
      performanceBonus: record.bonuses.performanceBonus + perf,
      allowances: newAllowances,
      deductions: newDeductions,
      notes: adj.note || record.notes,
    });
    await loadPayroll(month, year);
  };

  // ── Process all drafts → pending ──────────────────────────────────────────
  const processDrafts = () => {
    Alert.alert("Process Payroll", "Move all draft entries to pending?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Process",
        onPress: async () => {
          await Promise.all(
            records
              .filter(r => r.status === "draft")
              .map(r => updatePayrollRecord(r.id, {}))
          );
          // Reload — in production this would batch-update status
          await loadPayroll(month, year);
        },
      },
    ]);
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = filterStatus === "all"
    ? records
    : records.filter(r => r.status === filterStatus);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation?.openDrawer()} activeOpacity={0.7}>
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payroll</Text>
        <TouchableOpacity style={styles.addBtn}
          onPress={() => Alert.alert("Generate PDF","Full payroll PDF for " + month + " " + year + " will be downloaded.")}
          activeOpacity={0.8}>
          <Download size={19} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Month selector */}
        <TouchableOpacity style={st.monthSelector}
          onPress={() => setShowMonthPicker(true)} activeOpacity={0.85}>
          <View style={st.monthSelectorLeft}>
            <FileText size={18} color={COLORS.primary} />
            <View>
              <Text style={st.monthSelectorLabel}>Payroll Period</Text>
              <Text style={st.monthSelectorValue}>{month} {year}</Text>
            </View>
          </View>
          <ChevronDown size={18} color={COLORS.primary} />
        </TouchableOpacity>

        {loading ? (
          <View style={{ alignItems:"center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <>
                <View style={st.summaryGrid}>
                  <View style={[st.summaryCard, st.summaryCardFull]}>
                    <Text style={st.summaryCardLabel}>Total Net Payroll</Text>
                    <Text style={[st.summaryCardBig, { color: COLORS.success }]}>
                      KES {summary.totalNet.toLocaleString()}
                    </Text>
                    <Text style={st.summaryCardSub}>
                      Gross: KES {summary.totalGross.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={st.summaryRow}>
                  {[
                    { label:"Paid",    val: summary.paidCount,    color: COLORS.paid,       bg: COLORS.paidBg    },
                    { label:"Pending", val: summary.pendingCount, color: COLORS.pending,    bg: COLORS.pendingBg },
                    { label:"Draft",   val: summary.draftCount,   color: COLORS.draft,      bg: COLORS.draftBg   },
                    { label:"Total",   val: records.length,       color: COLORS.accentBlue, bg: COLORS.accentBlueLight },
                  ].map(s => (
                    <View key={s.label} style={[st.summaryMini, { backgroundColor: s.bg }]}>
                      <Text style={[st.summaryMiniVal, { color: s.color }]}>{s.val}</Text>
                      <Text style={[st.summaryMiniLbl, { color: s.color }]}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Action buttons */}
            <View style={st.actionRow}>
              <TouchableOpacity style={st.processBtn} onPress={processDrafts} activeOpacity={0.85}>
                <Clock size={14} color={COLORS.white} />
                <Text style={st.processBtnText}>Process Drafts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.exportAllBtn}
                onPress={() => Alert.alert("PDF","Full payroll PDF generated.")} activeOpacity={0.85}>
                <Printer size={14} color={COLORS.accentBlue} />
                <Text style={st.exportAllBtnText}>Full Payroll PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Filter tabs */}
            <View style={st.filterTabs}>
              {(["all","paid","pending","draft"] as const).map(s => (
                <TouchableOpacity key={s}
                  style={[st.filterTab, filterStatus===s && st.filterTabActive]}
                  onPress={() => setFilterStatus(s)} activeOpacity={0.8}>
                  <Text style={[st.filterTabText, filterStatus===s && st.filterTabTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s !== "all" && ` (${records.filter(r=>r.status===s).length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Section label */}
            <View style={st.sectionRow}>
              <Text style={st.sectionTitle}>{month} {year} Payroll</Text>
              <Text style={st.sectionCount}>{filtered.length} employees</Text>
            </View>

            {/* Payroll list */}
            {filtered.length === 0 ? (
              <View style={st.emptyState}>
                <Text style={st.emptyText}>No payroll records for this period.</Text>
              </View>
            ) : (
              <View style={st.payList}>
                {filtered.map((record, i) => (
                  <React.Fragment key={record.id}>
                    <PayrollRow
                      record={record}
                      onView={() => setViewRecord(record)}
                      onAdjust={() => setAdjustRecord(record)}
                      onMarkPaid={() => handleMarkPaid(record.id)}
                    />
                    {i < filtered.length - 1 && <View style={st.rowDivider} />}
                  </React.Fragment>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}>
          <View style={st.pickerSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Select Period</Text>
            <View style={st.yearRow}>
              {YEARS.map(y => (
                <TouchableOpacity key={y} style={[st.yearBtn, year===y && st.yearBtnActive]}
                  onPress={() => setYear(y)} activeOpacity={0.8}>
                  <Text style={[st.yearBtnText, year===y && st.yearBtnTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={st.monthGrid}>
              {MONTHS.map(m => (
                <TouchableOpacity key={m} style={[st.monthBtn, month===m && st.monthBtnActive]}
                  onPress={() => { setMonth(m); setShowMonthPicker(false); }} activeOpacity={0.8}>
                  <Text style={[st.monthBtnText, month===m && st.monthBtnTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payslip Modal */}
      <PayslipModal
        record={viewRecord}
        visible={!!viewRecord}
        onClose={() => setViewRecord(null)}
        onMarkPaid={() => viewRecord && handleMarkPaid(viewRecord.id)}
      />

      {/* Adjust Modal */}
      <AdjustModal
        record={adjustRecord}
        visible={!!adjustRecord}
        onClose={() => setAdjustRecord(null)}
        onApply={(adj) => adjustRecord && handleApplyAdjust(adjustRecord.id, adj)}
      />
    </SafeAreaView>
  );
};

// ─── Shared screen styles ─────────────────────────────────────────────────────
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

// ─── Payroll-specific styles ──────────────────────────────────────────────────
const st = StyleSheet.create({
  // Month selector
  monthSelector: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    backgroundColor:COLORS.cardBg, borderRadius:16, padding:16, marginBottom:16,
    borderWidth:1.5, borderColor:COLORS.border,
  },
  monthSelectorLeft: { flexDirection:"row", alignItems:"center", gap:12 },
  monthSelectorLabel: { fontSize:10, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase" },
  monthSelectorValue: { fontSize:16, fontWeight:"800", color:COLORS.textPrimary },

  // Summary
  summaryGrid: { marginBottom:8 },
  summaryCard: { backgroundColor:COLORS.cardBg, borderRadius:16, padding:16, alignItems:"center" },
  summaryCardFull: { borderWidth:1, borderColor:COLORS.border },
  summaryCardLabel: { fontSize:11, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase", marginBottom:4 },
  summaryCardBig: { fontSize:28, fontWeight:"800", letterSpacing:-1 },
  summaryCardSub: { fontSize:12, color:COLORS.textMuted, marginTop:4, fontWeight:"500" },
  summaryRow: { flexDirection:"row", gap:8, marginBottom:16 },
  summaryMini: { flex:1, borderRadius:14, padding:12, alignItems:"center" },
  summaryMiniVal: { fontSize:18, fontWeight:"800" },
  summaryMiniLbl: { fontSize:10, fontWeight:"700", marginTop:2, textTransform:"uppercase" },

  // Action row
  actionRow: { flexDirection:"row", gap:10, marginBottom:14 },
  processBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6,
    backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:12,
  },
  processBtnText: { fontSize:13, fontWeight:"800", color:COLORS.white },
  exportAllBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6,
    backgroundColor:COLORS.cardBg, borderRadius:12, paddingVertical:12,
    borderWidth:1.5, borderColor:COLORS.accentBlue,
  },
  exportAllBtnText: { fontSize:13, fontWeight:"700", color:COLORS.accentBlue },

  // Filter tabs
  filterTabs: { flexDirection:"row", gap:6, marginBottom:14 },
  filterTab: {
    flex:1, paddingVertical:9, borderRadius:12, alignItems:"center",
    backgroundColor:COLORS.background, borderWidth:1, borderColor:COLORS.border,
  },
  filterTabActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  filterTabText: { fontSize:11, fontWeight:"700", color:COLORS.textMuted },
  filterTabTextActive: { color:COLORS.white },

  // Section
  sectionRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  sectionTitle: { fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  sectionCount: { fontSize:11, color:COLORS.textMuted, fontWeight:"600" },

  // Payroll list
  payList: { backgroundColor:COLORS.cardBg, borderRadius:20, overflow:"hidden" },
  payRow: {
    flexDirection:"row", alignItems:"center",
    paddingVertical:12, paddingHorizontal:14, gap:10,
  },
  payRowLeft: { flexDirection:"row", alignItems:"center", gap:10, flex:1 },
  payAvatar: {
    width:42, height:42, borderRadius:21,
    alignItems:"center", justifyContent:"center",
  },
  payAvatarText: { fontSize:14, fontWeight:"800" },
  payName: { fontSize:13, fontWeight:"700", color:COLORS.textPrimary },
  payRole: { fontSize:11, color:COLORS.textMuted, fontWeight:"500", marginTop:1 },
  payRowRight: { alignItems:"flex-end", gap:4 },
  payNet: { fontSize:14, fontWeight:"800" },
  statusChip: { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  statusChipText: { fontSize:10, fontWeight:"800" },
  rowActions: { flexDirection:"row", gap:6 },
  rowActionBtn: {
    width:30, height:30, borderRadius:15,
    backgroundColor:COLORS.accentBlueLight,
    alignItems:"center", justifyContent:"center",
  },
  rowDivider: { height:1, backgroundColor:COLORS.border, marginHorizontal:14 },

  // Empty
  emptyState: { alignItems:"center", paddingVertical:40 },
  emptyText: { fontSize:14, color:COLORS.textMuted, fontWeight:"600" },

  // Payslip modal
  modalOverlay: { flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  payslipSheet: {
    backgroundColor:COLORS.cardBg,
    borderTopLeftRadius:28, borderTopRightRadius:28,
    padding:24, paddingBottom: Platform.OS==="ios" ? 40 : 28,
    maxHeight:"90%",
  },
  modalHandle: {
    width:44, height:5, borderRadius:3,
    backgroundColor:COLORS.border, alignSelf:"center", marginBottom:20,
  },
  payslipHeader: {
    flexDirection:"row", alignItems:"flex-start",
    justifyContent:"space-between", marginBottom:16,
  },
  payslipHeroLeft: { flexDirection:"row", alignItems:"flex-start", gap:12, flex:1 },
  payslipAvatar: {
    width:48, height:48, borderRadius:24,
    backgroundColor:COLORS.primaryMuted,
    alignItems:"center", justifyContent:"center",
  },
  payslipAvatarText: { fontSize:16, fontWeight:"800", color:COLORS.primary },
  payslipName: { fontSize:16, fontWeight:"800", color:COLORS.textPrimary },
  payslipRole: { fontSize:12, color:COLORS.textMuted, fontWeight:"500", marginTop:2 },
  payslipPeriod: { fontSize:11, color:COLORS.textMuted, marginTop:2 },
  slipSection: {
    fontSize:12, fontWeight:"700", color:COLORS.textMuted,
    textTransform:"uppercase", letterSpacing:0.5,
    marginTop:14, marginBottom:8,
  },
  slipCard: { backgroundColor:COLORS.background, borderRadius:14, overflow:"hidden" },
  slipRow: { flexDirection:"row", justifyContent:"space-between", padding:12 },
  slipRowBorder: { borderTopWidth:1, borderTopColor:COLORS.border },
  slipLabel: { fontSize:13, color:COLORS.textSecondary },
  slipValue: { fontSize:13, fontWeight:"700", color:COLORS.textPrimary },
  grossRow: { backgroundColor:COLORS.primaryMuted },
  grossLabel: { fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  grossValue: { fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  netPayCard: {
    backgroundColor:COLORS.primary, borderRadius:16,
    paddingVertical:18, paddingHorizontal:20,
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    marginVertical:14,
  },
  netPayLabel: { fontSize:15, fontWeight:"700", color:"rgba(255,255,255,0.8)" },
  netPayValue: { fontSize:24, fontWeight:"900", color:COLORS.white, letterSpacing:-1 },
  slipActions: { flexDirection:"row", gap:10, marginTop:8 },
  downloadBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center",
    gap:6, backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:13,
  },
  downloadBtnText: { fontSize:13, fontWeight:"800", color:COLORS.white },
  markPaidBtn: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center",
    gap:6, backgroundColor:COLORS.success, borderRadius:12, paddingVertical:13,
  },
  markPaidBtnText: { fontSize:13, fontWeight:"800", color:COLORS.white },

  // Adjust modal
  adjustTitleRow: { marginBottom:20 },
  modalTitle: { fontSize:17, fontWeight:"800", color:COLORS.textPrimary },
  adjustSub: { fontSize:12, color:COLORS.textMuted, marginTop:3 },
  adjField: { marginBottom:14 },
  adjLabel: {
    fontSize:11, fontWeight:"700", color:COLORS.textMuted,
    textTransform:"uppercase", letterSpacing:0.5, marginBottom:6,
  },
  adjInput: {
    backgroundColor:COLORS.background, borderRadius:12,
    borderWidth:1.5, borderColor:COLORS.border,
    paddingHorizontal:14, paddingVertical:12,
    fontSize:14, color:COLORS.textPrimary,
  },

  // Picker
  pickerSheet: {
    backgroundColor:COLORS.cardBg,
    borderTopLeftRadius:28, borderTopRightRadius:28,
    padding:24, paddingBottom: Platform.OS==="ios" ? 40 : 28,
  },
  yearRow: { flexDirection:"row", gap:8, marginBottom:16 },
  yearBtn: {
    flex:1, paddingVertical:10, borderRadius:12,
    borderWidth:1.5, borderColor:COLORS.border, alignItems:"center",
  },
  yearBtnActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  yearBtnText: { fontSize:13, fontWeight:"700", color:COLORS.textMuted },
  yearBtnTextActive: { color:COLORS.white },
  monthGrid: { flexDirection:"row", flexWrap:"wrap", gap:8 },
  monthBtn: {
    width:"22%", paddingVertical:10, borderRadius:12,
    borderWidth:1.5, borderColor:COLORS.border, alignItems:"center",
  },
  monthBtnActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  monthBtnText: { fontSize:12, fontWeight:"700", color:COLORS.textMuted },
  monthBtnTextActive: { color:COLORS.white },
});

export default PayrollScreen;