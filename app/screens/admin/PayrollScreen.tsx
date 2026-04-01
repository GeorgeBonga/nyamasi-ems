import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Download,
  ChevronDown,
  Check,
  Plus,
  Minus,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Eye,
  FileText,
  CheckCircle,
  Menu,
  Clock,
  X,
  Edit2,
  Printer,
} from "lucide-react-native";

const COLORS = {
  primary: "#8B0111",
  primaryDark: "#8B0111",
  primaryDeep: "#6B0009",
  primaryMuted: "rgba(139,1,17,0.08)",
  primaryLight: "rgba(139,1,17,0.15)",
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
  danger: "#C62828",
  dangerLight: "#FFEBEE",
  overlayBg: "rgba(13,33,55,0.6)",
  paid: "#00897B",
  paidBg: "#E0F2F1",
  pending: "#F57C00",
  pendingBg: "#FFF3E0",
  draft: "#8FA3B8",
  draftBg: "#F5F5F5",
};

type PayStatus = "paid" | "pending" | "draft";
type Month =
  | "Jan"
  | "Feb"
  | "Mar"
  | "Apr"
  | "May"
  | "Jun"
  | "Jul"
  | "Aug"
  | "Sep"
  | "Oct"
  | "Nov"
  | "Dec";
const MONTHS: Month[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const YEARS = ["2026", "2025", "2024"];

interface Allowance {
  label: string;
  amount: number;
}
interface Deduction {
  label: string;
  amount: number;
}

interface PayrollEntry {
  id: string;
  name: string;
  role: string;
  initials: string;
  baseSalary: number;
  salesBonus: number;
  allowances: Allowance[];
  deductions: Deduction[];
  status: PayStatus;
  daysWorked: number;
  totalDays: number;
}

interface AdjustState {
  bonus: string;
  advance: string;
  overtime: string;
  otherAllowance: string;
  note: string;
}

const calcGross = (e: PayrollEntry) =>
  e.baseSalary + e.salesBonus + e.allowances.reduce((s, a) => s + a.amount, 0);
const calcDeductions = (e: PayrollEntry) =>
  e.deductions.reduce((s, d) => s + d.amount, 0);
const calcNet = (e: PayrollEntry) => calcGross(e) - calcDeductions(e);

const PAYROLL: PayrollEntry[] = [
  {
    id: "1",
    name: "Lydia Wanjiku",
    role: "Team Lead",
    initials: "LW",
    baseSalary: 52000,
    salesBonus: 6200,
    allowances: [
      { label: "Transport", amount: 3000 },
      { label: "Airtime", amount: 1000 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 8200 },
    ],
    status: "paid",
    daysWorked: 22,
    totalDays: 22,
  },
  {
    id: "2",
    name: "Faith Adhiambo",
    role: "Supervisor",
    initials: "FA",
    baseSalary: 58000,
    salesBonus: 5700,
    allowances: [
      { label: "Transport", amount: 3500 },
      { label: "Airtime", amount: 1500 },
      { label: "Housing", amount: 5000 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 11500 },
    ],
    status: "paid",
    daysWorked: 22,
    totalDays: 22,
  },
  {
    id: "3",
    name: "Amina Hassan",
    role: "Senior Rep",
    initials: "AH",
    baseSalary: 38000,
    salesBonus: 4620,
    allowances: [
      { label: "Transport", amount: 2500 },
      { label: "Airtime", amount: 800 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 5800 },
    ],
    status: "pending",
    daysWorked: 20,
    totalDays: 22,
  },
  {
    id: "4",
    name: "Samuel Ndung'u",
    role: "Senior Rep",
    initials: "SN",
    baseSalary: 36000,
    salesBonus: 3760,
    allowances: [
      { label: "Transport", amount: 2500 },
      { label: "Airtime", amount: 800 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 5100 },
    ],
    status: "pending",
    daysWorked: 19,
    totalDays: 22,
  },
  {
    id: "5",
    name: "Grace Akinyi",
    role: "Field Rep",
    initials: "GA",
    baseSalary: 29000,
    salesBonus: 3280,
    allowances: [
      { label: "Transport", amount: 2000 },
      { label: "Airtime", amount: 500 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 3100 },
    ],
    status: "pending",
    daysWorked: 21,
    totalDays: 22,
  },
  {
    id: "6",
    name: "Jane Mwangi",
    role: "Field Rep",
    initials: "JM",
    baseSalary: 28000,
    salesBonus: 2840,
    allowances: [
      { label: "Transport", amount: 2000 },
      { label: "Airtime", amount: 500 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 2900 },
    ],
    status: "draft",
    daysWorked: 22,
    totalDays: 22,
  },
  {
    id: "7",
    name: "Brian Ochieng",
    role: "Field Rep",
    initials: "BO",
    baseSalary: 26000,
    salesBonus: 2360,
    allowances: [
      { label: "Transport", amount: 2000 },
      { label: "Airtime", amount: 500 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 2500 },
    ],
    status: "draft",
    daysWorked: 18,
    totalDays: 22,
  },
  {
    id: "8",
    name: "Peter Karanja",
    role: "Field Rep",
    initials: "PK",
    baseSalary: 24000,
    salesBonus: 1920,
    allowances: [
      { label: "Transport", amount: 1800 },
      { label: "Airtime", amount: 500 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 2000 },
    ],
    status: "draft",
    daysWorked: 20,
    totalDays: 22,
  },
  {
    id: "9",
    name: "David Mutua",
    role: "Field Rep",
    initials: "DM",
    baseSalary: 22000,
    salesBonus: 1240,
    allowances: [
      { label: "Transport", amount: 1500 },
      { label: "Airtime", amount: 500 },
    ],
    deductions: [
      { label: "NHIF", amount: 1700 },
      { label: "NSSF", amount: 1080 },
      { label: "PAYE", amount: 1600 },
    ],
    status: "draft",
    daysWorked: 14,
    totalDays: 22,
  },
];

// ─── Payslip Detail Modal ─────────────────────────────────────────────────────
const PayslipModal: React.FC<{
  entry: PayrollEntry | null;
  month: Month;
  year: string;
  visible: boolean;
  onClose: () => void;
  onMarkPaid: () => void;
}> = ({ entry, month, year, visible, onClose, onMarkPaid }) => {
  if (!entry) return null;
  const gross = calcGross(entry);
  const totalDed = calcDeductions(entry);
  const net = calcNet(entry);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={st.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <View style={st.payslipSheet}>
          <View style={st.modalHandle} />

          {/* Payslip header */}
          <View style={st.payslipHeader}>
            <View style={st.payslipHeroLeft}>
              <View style={st.payslipAvatar}>
                <Text style={st.payslipAvatarText}>{entry.initials}</Text>
              </View>
              <View>
                <Text style={st.payslipName}>{entry.name}</Text>
                <Text style={st.payslipRole}>{entry.role}</Text>
                <Text style={st.payslipPeriod}>
                  {month} {year} · {entry.daysWorked}/{entry.totalDays} days
                </Text>
              </View>
            </View>
            <View
              style={[
                st.statusChip,
                {
                  backgroundColor:
                    entry.status === "paid"
                      ? COLORS.paidBg
                      : entry.status === "pending"
                        ? COLORS.pendingBg
                        : COLORS.draftBg,
                },
              ]}
            >
              <Text
                style={[
                  st.statusChipText,
                  {
                    color:
                      entry.status === "paid"
                        ? COLORS.paid
                        : entry.status === "pending"
                          ? COLORS.pending
                          : COLORS.draft,
                  },
                ]}
              >
                {entry.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Earnings */}
            <Text style={st.slipSection}>Earnings</Text>
            <View style={st.slipCard}>
              <View style={st.slipRow}>
                <Text style={st.slipLabel}>Basic Salary</Text>
                <Text style={st.slipValue}>
                  KES {entry.baseSalary.toLocaleString()}
                </Text>
              </View>
              <View style={[st.slipRow, st.slipRowBorder]}>
                <Text style={st.slipLabel}>Sales Bonus</Text>
                <Text style={[st.slipValue, { color: COLORS.success }]}>
                  KES {entry.salesBonus.toLocaleString()}
                </Text>
              </View>
              {entry.allowances.map((a, i) => (
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
              {entry.deductions.map((d, i) => (
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

            {/* Action buttons */}
            <View style={st.slipActions}>
              <TouchableOpacity
                style={st.downloadBtn}
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert(
                    "PDF Export",
                    "Payslip PDF generated and ready to share.",
                  )
                }
              >
                <Download size={15} color={COLORS.white} />
                <Text style={st.downloadBtnText}>Export PDF</Text>
              </TouchableOpacity>
              {entry.status !== "paid" && (
                <TouchableOpacity
                  style={st.markPaidBtn}
                  onPress={onMarkPaid}
                  activeOpacity={0.85}
                >
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
const AdjustModal: React.FC<{
  entry: PayrollEntry | null;
  visible: boolean;
  onClose: () => void;
  onApply: (adj: AdjustState) => void;
}> = ({ entry, visible, onClose, onApply }) => {
  const [adj, setAdj] = useState<AdjustState>({
    bonus: "",
    advance: "",
    overtime: "",
    otherAllowance: "",
    note: "",
  });
  if (!entry) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={st.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <View
          style={[
            st.payslipSheet,
            { paddingBottom: Platform.OS === "ios" ? 40 : 28 },
          ]}
        >
          <View style={st.modalHandle} />
          <View style={st.adjustTitleRow}>
            <Text style={st.modalTitle}>Adjust Payroll</Text>
            <Text style={st.adjustSub}>{entry.name}</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              {
                label: "Performance Bonus (KES)",
                key: "bonus",
                placeholder: "e.g. 2000",
              },
              {
                label: "Salary Advance (KES)",
                key: "advance",
                placeholder: "e.g. 5000",
              },
              {
                label: "Overtime Pay (KES)",
                key: "overtime",
                placeholder: "e.g. 1500",
              },
              {
                label: "Other Allowance (KES)",
                key: "otherAllowance",
                placeholder: "e.g. 1000",
              },
            ].map((f) => (
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
                style={[
                  st.adjInput,
                  { height: 72, textAlignVertical: "top", paddingTop: 10 },
                ]}
                placeholder="Reason for adjustment..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={adj.note}
                onChangeText={(v) => setAdj({ ...adj, note: v })}
              />
            </View>
            <View style={st.slipActions}>
              <TouchableOpacity
                style={[
                  st.downloadBtn,
                  {
                    backgroundColor: COLORS.background,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text
                  style={[st.downloadBtnText, { color: COLORS.textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={st.markPaidBtn}
                onPress={() => {
                  onApply(adj);
                  onClose();
                }}
                activeOpacity={0.85}
              >
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
  entry: PayrollEntry;
  onView: () => void;
  onAdjust: () => void;
  onMarkPaid: () => void;
}> = ({ entry, onView, onAdjust, onMarkPaid }) => {
  const net = calcNet(entry);
  return (
    <View style={st.payRow}>
      <View style={st.payRowLeft}>
        <View
          style={[
            st.payAvatar,
            {
              backgroundColor:
                entry.status === "paid"
                  ? COLORS.successLight
                  : entry.status === "pending"
                    ? COLORS.warningLight
                    : COLORS.accentBlueLight,
            },
          ]}
        >
          <Text
            style={[
              st.payAvatarText,
              {
                color:
                  entry.status === "paid"
                    ? COLORS.success
                    : entry.status === "pending"
                      ? COLORS.warning
                      : COLORS.accentBlue,
              },
            ]}
          >
            {entry.initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.payName}>{entry.name}</Text>
          <Text style={st.payRole}>
            {entry.role} · {entry.daysWorked}/{entry.totalDays}d
          </Text>
        </View>
      </View>
      <View style={st.payRowRight}>
        <Text
          style={[
            st.payNet,
            {
              color:
                entry.status === "paid" ? COLORS.success : COLORS.textPrimary,
            },
          ]}
        >
          KES {net.toLocaleString()}
        </Text>
        <View
          style={[
            st.statusChip,
            {
              backgroundColor:
                entry.status === "paid"
                  ? COLORS.paidBg
                  : entry.status === "pending"
                    ? COLORS.pendingBg
                    : COLORS.draftBg,
            },
          ]}
        >
          <Text
            style={[
              st.statusChipText,
              {
                color:
                  entry.status === "paid"
                    ? COLORS.paid
                    : entry.status === "pending"
                      ? COLORS.pending
                      : COLORS.draft,
                fontSize: 9,
              },
            ]}
          >
            {entry.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={st.rowActions}>
        <TouchableOpacity
          style={st.rowActionBtn}
          onPress={onView}
          activeOpacity={0.8}
        >
          <Eye size={13} color={COLORS.accentBlue} />
        </TouchableOpacity>
        <TouchableOpacity
          style={st.rowActionBtn}
          onPress={onAdjust}
          activeOpacity={0.8}
        >
          <Edit2 size={13} color={COLORS.warning} />
        </TouchableOpacity>
        {entry.status !== "paid" && (
          <TouchableOpacity
            style={[st.rowActionBtn, { backgroundColor: COLORS.successLight }]}
            onPress={onMarkPaid}
            activeOpacity={0.8}
          >
            <CheckCircle size={13} color={COLORS.success} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface PayrollScreenProps {
  navigation?: any;
}

const PayrollScreen: React.FC<PayrollScreenProps> = ({ navigation }) => {
  const [month, setMonth] = useState<Month>("Apr");
  const [year, setYear] = useState("2026");
  const [entries, setEntries] = useState<PayrollEntry[]>(PAYROLL);
  const [viewEntry, setViewEntry] = useState<PayrollEntry | null>(null);
  const [adjustEntry, setAdjustEntry] = useState<PayrollEntry | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | PayStatus>("all");

  const filtered =
    filterStatus === "all"
      ? entries
      : entries.filter((e) => e.status === filterStatus);
  const totalNet = entries.reduce((s, e) => s + calcNet(e), 0);
  const totalGross = entries.reduce((s, e) => s + calcGross(e), 0);
  const paidCount = entries.filter((e) => e.status === "paid").length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;
  const draftCount = entries.filter((e) => e.status === "draft").length;

  const markPaid = (id: string) =>
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "paid" } : e)),
    );

  const markAllPending = () =>
    Alert.alert("Process Payroll", "Process all pending payroll entries?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Process",
        onPress: () =>
          setEntries((prev) =>
            prev.map((e) =>
              e.status === "draft" ? { ...e, status: "pending" } : e,
            ),
          ),
      },
    ]);

  const generateAll = () =>
    Alert.alert(
      "Generate PDF",
      "Full payroll PDF for " + month + " " + year + " will be downloaded.",
    );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation?.openDrawer()}
          activeOpacity={0.7}
        >
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payroll</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={generateAll}
          activeOpacity={0.8}
        >
          <Download size={19} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month/Year selector */}
        <TouchableOpacity
          style={st.monthSelector}
          onPress={() => setShowMonthPicker(true)}
          activeOpacity={0.85}
        >
          <View style={st.monthSelectorLeft}>
            <FileText size={18} color={COLORS.primary} />
            <View>
              <Text style={st.monthSelectorLabel}>Payroll Period</Text>
              <Text style={st.monthSelectorValue}>
                {month} {year}
              </Text>
            </View>
          </View>
          <ChevronDown size={18} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Summary cards */}
        <View style={st.summaryGrid}>
          <View style={[st.summaryCard, st.summaryCardFull]}>
            <Text style={st.summaryCardLabel}>Total Net Payroll</Text>
            <Text style={[st.summaryCardBig, { color: COLORS.success }]}>
              KES {totalNet.toLocaleString()}
            </Text>
            <Text style={st.summaryCardSub}>
              Gross: KES {totalGross.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={st.summaryRow}>
          {[
            {
              label: "Paid",
              val: paidCount,
              color: COLORS.paid,
              bg: COLORS.paidBg,
            },
            {
              label: "Pending",
              val: pendingCount,
              color: COLORS.pending,
              bg: COLORS.pendingBg,
            },
            {
              label: "Draft",
              val: draftCount,
              color: COLORS.draft,
              bg: COLORS.draftBg,
            },
            {
              label: "Total",
              val: entries.length,
              color: COLORS.accentBlue,
              bg: COLORS.accentBlueLight,
            },
          ].map((s) => (
            <View
              key={s.label}
              style={[st.summaryMini, { backgroundColor: s.bg }]}
            >
              <Text style={[st.summaryMiniVal, { color: s.color }]}>
                {s.val}
              </Text>
              <Text style={[st.summaryMiniLbl, { color: s.color }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={st.actionRow}>
          <TouchableOpacity
            style={st.processBtn}
            onPress={markAllPending}
            activeOpacity={0.85}
          >
            <Clock size={14} color={COLORS.white} />
            <Text style={st.processBtnText}>Process Drafts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.exportAllBtn}
            onPress={generateAll}
            activeOpacity={0.85}
          >
            <Printer size={14} color={COLORS.accentBlue} />
            <Text style={st.exportAllBtnText}>Full Payroll PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View style={st.filterTabs}>
          {(["all", "paid", "pending", "draft"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[st.filterTab, filterStatus === s && st.filterTabActive]}
              onPress={() => setFilterStatus(s)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  st.filterTabText,
                  filterStatus === s && st.filterTabTextActive,
                ]}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== "all" &&
                  ` (${entries.filter((e) => e.status === s).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section label */}
        <View style={st.sectionRow}>
          <Text style={st.sectionTitle}>
            {month} {year} Payroll
          </Text>
          <Text style={st.sectionCount}>{filtered.length} employees</Text>
        </View>

        {/* Payroll list */}
        <View style={st.payList}>
          {filtered.map((entry, i) => (
            <React.Fragment key={entry.id}>
              <PayrollRow
                entry={entry}
                onView={() => setViewEntry(entry)}
                onAdjust={() => setAdjustEntry(entry)}
                onMarkPaid={() => markPaid(entry.id)}
              />
              {i < filtered.length - 1 && <View style={st.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Month Picker */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={st.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={st.pickerSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Select Period</Text>
            <View style={st.yearRow}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[st.yearBtn, year === y && st.yearBtnActive]}
                  onPress={() => setYear(y)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[st.yearBtnText, year === y && st.yearBtnTextActive]}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={st.monthGrid}>
              {MONTHS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[st.monthBtn, month === m && st.monthBtnActive]}
                  onPress={() => {
                    setMonth(m);
                    setShowMonthPicker(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      st.monthBtnText,
                      month === m && st.monthBtnTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <PayslipModal
        entry={viewEntry}
        month={month}
        year={year}
        visible={!!viewEntry}
        onClose={() => setViewEntry(null)}
        onMarkPaid={() => {
          if (viewEntry) markPaid(viewEntry.id);
          setViewEntry(null);
        }}
      />
      <AdjustModal
        entry={adjustEntry}
        visible={!!adjustEntry}
        onClose={() => setAdjustEntry(null)}
        onApply={(adj) =>
          Alert.alert("Applied", "Adjustments saved for " + adjustEntry?.name)
        }
      />
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayBg,
    justifyContent: "flex-end",
  },
  payslipSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: "92%",
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  payslipHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  payslipHeroLeft: { flexDirection: "row", gap: 12, flex: 1 },
  payslipAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  payslipAvatarText: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  payslipName: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  payslipRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  payslipPeriod: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },

  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusChipText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  slipSection: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  slipCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
  },
  slipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  slipRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  slipLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  slipValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "700" },
  grossRow: { marginTop: 4 },
  grossLabel: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  grossValue: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary },

  netPayCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  netPayLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },
  netPayValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
  },

  slipActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  downloadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.accentBlue,
    shadowColor: COLORS.accentBlue,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  downloadBtnText: { fontSize: 13, fontWeight: "800", color: COLORS.white },
  markPaidBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  markPaidBtnText: { fontSize: 13, fontWeight: "800", color: COLORS.white },

  adjustTitleRow: { marginBottom: 16 },
  adjustSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  adjField: { marginBottom: 14 },
  adjLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  adjInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },


  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  monthSelectorLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  monthSelectorLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  monthSelectorValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.3,
  },

  summaryGrid: { marginBottom: 10 },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
  },
  summaryCardFull: { width: "100%" },
  summaryCardLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryCardBig: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  summaryCardSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    fontWeight: "500",
  },

  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  summaryMini: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  summaryMiniVal: { fontSize: 18, fontWeight: "900" },
  summaryMiniLbl: { fontSize: 10, fontWeight: "700", marginTop: 2 },

  actionRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  processBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  processBtnText: { fontSize: 13, fontWeight: "800", color: COLORS.white },
  exportAllBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.accentBlueLight,
    borderWidth: 1,
    borderColor: "rgba(21,101,192,0.2)",
  },
  exportAllBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.accentBlue,
  },

  filterTabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  filterTabTextActive: { color: COLORS.white },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  sectionCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },

  payList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  rowDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 62 },
  payRowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  payAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  payAvatarText: { fontSize: 13, fontWeight: "800" },
  payName: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  payRole: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 1,
  },
  payRowRight: { alignItems: "flex-end", gap: 4 },
  payNet: { fontSize: 14, fontWeight: "800" },
  rowActions: { flexDirection: "row", gap: 6 },
  rowActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  pickerSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },
  yearRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  yearBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  yearBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yearBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  yearBtnTextActive: { color: COLORS.white },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  monthBtn: {
    width: "22%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  monthBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  monthBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  monthBtnTextActive: { color: COLORS.white },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 8,
    paddingBottom: 20,
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
  },
  scrollContent: { paddingTop: 20, paddingHorizontal: 18 },
});

export default PayrollScreen;
