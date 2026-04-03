
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  TrendingUp,
  Users,
  Gift,
  ChevronRight,
  Plus,
  Camera,
  LogOut,
  CheckCircle,
} from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import {
  getEmployeeById,
  getEmployeeTodaySummary,
  getReportsByEmployee,
  addReport,
  Employee,
  EmployeeTodaySummary,
} from "../../../data/dbService";

// ─── Navigation types ─────────────────────────────────────────────────────────
type DashRouteParams = {
  EmployeeDashboard: { employeeId: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#8B0111",
  primaryDark: "#8B0111",
  white: "#FFFFFF",
  background: "#F0F5FB",
  cardBg: "#FFFFFF",
  textPrimary: "#0D2137",
  textSecondary: "#4A6580",
  textMuted: "#8FA3B8",
  border: "#D6E4F0",
  success: "#00897B",
  successLight: "#E0F2F1",
  required: "#C62828",
  overlayBg: "rgba(13,33,55,0.6)",
  warning: "#F57C00",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTodayFull = (): string =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
}

interface DailyReportForm {
  sales: string;
  customers: string;
  samplers: string;
  notes: string;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, trendColor }) => (
  <View style={styles.card}>
    <View style={styles.cardLeft}>
      <View style={styles.cardIconWrap}>{icon}</View>
      <Text style={styles.cardLabel}>{label}</Text>
      {trend ? (
        <View style={styles.trendBadge}>
          <Text style={[styles.trendText, trendColor ? { color: trendColor } : {}]}>{trend}</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

// ─── Monthly Target Progress Bar ──────────────────────────────────────────────
const MonthlyProgress: React.FC<{ sales: number; target: number }> = ({ sales, target }) => {
  const pct = target > 0 ? Math.min(100, Math.round((sales / target) * 100)) : 0;
  const color = pct >= 100 ? COLORS.success : pct >= 70 ? COLORS.warning : COLORS.primary;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Monthly Target</Text>
        <Text style={[styles.progressPct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressSub}>{sales} / {target} units</Text>
    </View>
  );
};

// ─── Report Modal ─────────────────────────────────────────────────────────────
interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: DailyReportForm) => void;
  submitting: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState<DailyReportForm>({
    sales: "", customers: "", samplers: "", notes: "",
  });

  const handleSubmit = () => {
    if (!form.sales || !form.customers || !form.samplers) {
      Alert.alert("Missing Fields", "Please fill in Sales, Customers, and Samplers.");
      return;
    }
    if (isNaN(Number(form.sales)) || isNaN(Number(form.customers)) || isNaN(Number(form.samplers))) {
      Alert.alert("Invalid Input", "Please enter numbers only.");
      return;
    }
    onSubmit(form);
    setForm({ sales: "", customers: "", samplers: "", notes: "" });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Submit Daily Report</Text>
          <Text style={styles.modalSubtitle}>{getTodayFull()}</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Sales */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Sales Made <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter number of sales"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={form.sales}
                  onChangeText={(t) => setForm({ ...form, sales: t })}
                />
              </View>
            </View>

            {/* Customers */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Customers Reached <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter customers reached"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={form.customers}
                  onChangeText={(t) => setForm({ ...form, customers: t })}
                />
              </View>
            </View>

            {/* Samplers */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Samplers Given <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter samplers given"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={form.samplers}
                  onChangeText={(t) => setForm({ ...form, samplers: t })}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Observations</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Any highlights or challenges today..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={form.notes}
                onChangeText={(t) => setForm({ ...form, notes: t })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.submitBtnText}>Submit Report</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const EmployeeDashboardScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const route = useRoute<RouteProp<DashRouteParams, "EmployeeDashboard">>();
  const employeeId = route.params?.employeeId ?? "e001";

  // ── State ─────────────────────────────────────────────────────────────────
  const [employee,    setEmployee]    = useState<Employee | null>(null);
  const [summary,     setSummary]     = useState<EmployeeTodaySummary | null>(null);
  const [reportCount, setReportCount] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [modalVisible,setModalVisible]= useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [profileUri,  setProfileUri]  = useState<string | null>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [emp, sum, reports] = await Promise.all([
        getEmployeeById(employeeId),
        getEmployeeTodaySummary(employeeId),
        getReportsByEmployee(employeeId),
      ]);
      setEmployee(emp);
      setSummary(sum);
      setReportCount(reports.length);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Submit daily report ───────────────────────────────────────────────────
  const handleSubmit = async (form: DailyReportForm) => {
    setSubmitting(true);
    setModalVisible(false);
    try {
      await addReport({
        employeeId,
        sales:            Number(form.sales),
        customersReached: Number(form.customers),
        samplersGiven:    Number(form.samplers),
        notes:            form.notes,
        location:         employee?.assignedArea ?? "Unknown",
        coords:           employee?.lastKnownLocation
          ? { latitude: employee.lastKnownLocation.latitude, longitude: employee.lastKnownLocation.longitude }
          : null,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3500);
      // Refresh summary to reflect the new submission
      await loadData();
    } catch {
      Alert.alert("Error", "Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pick profile image ────────────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setProfileUri(result.assets[0].uri);
    }
  };

  // ── Already submitted today? ──────────────────────────────────────────────
  const alreadySubmittedToday = !!summary?.todayReport;

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{employee?.fullName ?? "Employee"}</Text>
            <Text style={styles.headerSub}>{getTodayFull()}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => navigation.replace("Login")}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeGreet}>{getGreeting()},</Text>
            <Text style={styles.welcomeName}>{employee?.firstName ?? "there"}! 👋</Text>
            <Text style={styles.welcomeRole}>{employee?.role} · {employee?.assignedArea}</Text>
          </View>

          {/* Profile image */}
          <TouchableOpacity style={styles.profileWrap} onPress={handlePickImage} activeOpacity={0.8}>
            {profileUri ? (
              <Image source={{ uri: profileUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitials}>{employee?.initials ?? "?"}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Camera size={9} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Monthly target progress */}
        {summary && (
          <MonthlyProgress sales={summary.monthSales} target={summary.monthTarget} />
        )}

        {/* Today submitted badge */}
        {alreadySubmittedToday && (
          <View style={styles.submittedBanner}>
            <CheckCircle size={16} color={COLORS.success} />
            <Text style={styles.submittedBannerText}>
              Today's report submitted · {summary?.todayReport?.sales} sales
            </Text>
          </View>
        )}

        {/* Section Header */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Stat Cards — real data from summary */}
        <View style={styles.cardsWrap}>
          <StatCard
            label="Sales Made"
            value={summary?.weekSales ?? 0}
            icon={<TrendingUp size={20} color={COLORS.primary} />}
          />
          <StatCard
            label="Customers Reached"
            value={summary?.weekCustomers ?? 0}
            icon={<Users size={20} color={COLORS.primary} />}
          />
          <StatCard
            label="Samplers Given"
            value={summary?.weekSamplers ?? 0}
            icon={<Gift size={20} color={COLORS.primary} />}
          />
        </View>

        {/* View History */}
        <TouchableOpacity
          style={styles.historyBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ReportHistoryScreen", { employeeId })}
        >
          <View>
            <Text style={styles.historyBtnText}>View Report History</Text>
            <Text style={styles.historyBtnSub}>{reportCount} reports logged</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Create Daily Report */}
        <TouchableOpacity
          style={[
            styles.createReportBtn,
            alreadySubmittedToday && styles.createReportBtnDisabled,
          ]}
          onPress={() => {
            if (alreadySubmittedToday) {
              Alert.alert(
                "Already Submitted",
                "You have already submitted today's report. You can submit again tomorrow."
              );
              return;
            }
            setModalVisible(true);
          }}
          activeOpacity={0.88}
        >
          <Plus size={20} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.createReportLabel}>
            {alreadySubmittedToday ? "Report Submitted Today ✓" : "Create Daily Report"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Toast */}
      {submitted && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>✓ Daily report submitted!</Text>
        </View>
      )}

      {/* Report Modal */}
      <ReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </SafeAreaView>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2, fontWeight: "500",
  },
  logoutButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
  },
  scrollContent: { paddingTop: 24, paddingHorizontal: 18 },

  // Welcome card
  welcomeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeText: { flex: 1 },
  welcomeGreet: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },
  welcomeName: {
    fontSize: 24, fontWeight: "800", color: COLORS.textPrimary,
    marginTop: 2, letterSpacing: -0.3,
  },
  welcomeRole: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, fontWeight: "500" },

  // Profile
  profileWrap: { position: "relative", width: 64, height: 64 },
  profileImage: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2.5, borderColor: COLORS.primary,
  },
  profilePlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.background,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  profileInitials: {
    fontSize: 20, fontWeight: "800", color: COLORS.primary,
  },
  cameraBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.cardBg,
  },

  // Monthly progress
  progressWrap: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 8,
  },
  progressTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  progressPct: { fontSize: 14, fontWeight: "800" },
  progressBg: {
    height: 7, backgroundColor: COLORS.border, borderRadius: 4, overflow: "hidden",
  },
  progressFill: { height: 7, borderRadius: 4 },
  progressSub: {
    fontSize: 11, color: COLORS.textMuted, marginTop: 6, fontWeight: "500",
  },

  // Submitted today banner
  submittedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  submittedBannerText: {
    fontSize: 13, color: COLORS.success, fontWeight: "600", flex: 1,
  },

  // Section row
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, marginRight: 10,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  // Stat cards
  cardsWrap: { gap: 8, marginBottom: 12 },
  card: {
    borderRadius: 20, padding: 14,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBg,
  },
  cardLeft: { flex: 1 },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  cardLabel: {
    fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, letterSpacing: 0.1,
  },
  trendBadge: {
    marginTop: 8, alignSelf: "flex-start",
    backgroundColor: COLORS.background,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  trendText: { fontSize: 11, fontWeight: "700", color: COLORS.success },
  cardValue: {
    fontSize: 44, fontWeight: "900", color: COLORS.textPrimary,
    letterSpacing: -2, lineHeight: 48,
  },

  // History button
  historyBtn: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyBtnText: {
    flex: 1, fontSize: 15, fontWeight: "700",
    color: COLORS.textPrimary, letterSpacing: 0.2,
  },
  historyBtnSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Create report button
  createReportBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    gap: 10,
  },
  createReportBtnDisabled: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOpacity: 0.25,
  },
  createReportLabel: {
    fontSize: 16, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3,
  },

  // Toast
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: COLORS.success,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: COLORS.success,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  toastText: { color: COLORS.white, fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlayBg },
  modalSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 22,
  },
  modalTitle: {
    fontSize: 20, fontWeight: "800", color: COLORS.textPrimary,
    textAlign: "center", marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13, color: COLORS.textMuted, textAlign: "center",
    marginBottom: 24, fontWeight: "500",
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 12, fontWeight: "700", color: COLORS.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8,
  },
  requiredStar: { color: COLORS.required },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1, fontSize: 15, fontWeight: "600",
    color: COLORS.textPrimary, paddingVertical: 13,
  },
  textarea: {
    height: 90, backgroundColor: COLORS.background,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingTop: 12, flex: undefined,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, backgroundColor: COLORS.background,
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", borderWidth: 1.5, borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  submitBtn: {
    flex: 2, backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 15, alignItems: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  submitBtnText: { fontSize: 14, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },
});

export default EmployeeDashboardScreen;