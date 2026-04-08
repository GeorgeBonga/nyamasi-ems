import React, { useState, useEffect, useCallback, useRef } from "react";
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
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import {
  TrendingUp,
  Users,
  Gift,
  ChevronRight,
  Plus,
  Camera,
  LogOut,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
} from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import {
  getEmployeeById,
  getEmployeeTodaySummary,
  getReportsByEmployee,
  addReport,
  PRODUCTS,
  Employee,
  EmployeeTodaySummary,
  ProductSKU,
} from "../../../data/dbService";
import { useLoader } from "../../../context/LoaderContext";
import GlobalLoader from "../../../../components/GlobalLoader"; 

// ─── Navigation types ─────────────────────────────────────────────────────────
type DashRouteParams = {
  EmployeeDashboard: { employeeId: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary:       "#8B0111",
  primaryDark:   "#8B0111",
  white:         "#FFFFFF",
  background:    "#F0F5FB",
  cardBg:        "#FFFFFF",
  textPrimary:   "#0D2137",
  textSecondary: "#4A6580",
  textMuted:     "#8FA3B8",
  border:        "#D6E4F0",
  success:       "#00897B",
  successLight:  "#E0F2F1",
  required:      "#C62828",
  overlayBg:     "rgba(13,33,55,0.6)",
  warning:       "#F57C00",
  warningLight:  "#FFF3E0",
  mpesa:         "#00A651",
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

const formatKES = (n: number): string =>
  `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;

// ─── Setup notifications ───────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,

    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface ProductQtys {
  [sku: string]: string; // raw text input
}

interface PaymentForm {
  cash:  string;
  mpesa: string;
  debt:  string;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({ label, value, icon, sub }) => (
  <View style={styles.card}>
    <View style={styles.cardLeft}>
      <View style={styles.cardIconWrap}>{icon}</View>
      <Text style={styles.cardLabel}>{label}</Text>
      {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

// ─── Monthly Target Progress Bar ──────────────────────────────────────────────
const MonthlyProgress: React.FC<{ sales: number; salesKES: number; target: number }> = ({
  sales, salesKES, target,
}) => {
  const pct   = target > 0 ? Math.min(100, Math.round((sales / target) * 100)) : 0;
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
      <View style={styles.progressFooter}>
        <Text style={styles.progressSub}>{sales} / {target} units</Text>
        <Text style={styles.progressKES}>{formatKES(salesKES)}</Text>
      </View>
    </View>
  );
};

// ─── Report Modal ─────────────────────────────────────────────────────────────
interface ReportModalProps {
  visible:    boolean;
  onClose:    () => void;
  onSubmit:   (
    products:  { sku: ProductSKU; qty: number }[],
    payment:   { cash: number; mpesa: number; debt: number },
    customers: number,
    samplers:  number,
    notes:     string,
    photoUri:  string
  ) => Promise<void>;
  submitting: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, onSubmit, submitting }) => {
  const initialQtys = (): ProductQtys => {
    const m: ProductQtys = {};
    PRODUCTS.forEach((p) => { m[p.sku] = ""; });
    return m;
  };

  const [qtys,      setQtys]      = useState<ProductQtys>(initialQtys);
  const [payment,   setPayment]   = useState<PaymentForm>({ cash: "", mpesa: "", debt: "" });
  const [customers, setCustomers] = useState("");
  const [samplers,  setSamplers]  = useState("");
  const [notes,     setNotes]     = useState("");
  const [photoUri,  setPhotoUri]  = useState<string | null>(null);

  // ── Computed totals ───────────────────────────────────────────────────────
  const lineItems = PRODUCTS.map((p) => {
    const qty = parseInt(qtys[p.sku] || "0", 10) || 0;
    return { sku: p.sku, name: p.name, qty, unitPrice: p.unitPrice, subtotal: p.unitPrice * qty };
  });
  const totalItems  = lineItems.reduce((s, l) => s + l.qty, 0);
  const totalAmount = lineItems.reduce((s, l) => s + l.subtotal, 0);
  const paymentEntered =
    (parseInt(payment.cash  || "0", 10) || 0) +
    (parseInt(payment.mpesa || "0", 10) || 0) +
    (parseInt(payment.debt  || "0", 10) || 0);
  const paymentBalance = totalAmount - paymentEntered;

  // ── Photo picker ──────────────────────────────────────────────────────────
  const handlePickPhoto = async () => {
    const camResult = await ImagePicker.requestCameraPermissionsAsync();
    if (camResult.status !== "granted") {
      const libResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libResult.status !== "granted") {
        Alert.alert("Permission required", "Camera or photo library access is needed.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
         quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) setPhotoUri(result.assets[0].uri);
      return;
    }
    Alert.alert("Upload Photo", "Choose how to add your sales photo:", [
      {
        text: "Take Photo",
        onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({
           quality: 1,
          });
          if (!r.canceled && r.assets.length > 0) setPhotoUri(r.assets[0].uri);
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
             quality: 0.8,
          });
          if (!r.canceled && r.assets.length > 0) setPhotoUri(r.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // 1. Photo required
    if (!photoUri) {
      Alert.alert("Photo Required", "Please upload a sales photo before submitting.");
      return;
    }

    // 2. At least one product
    if (totalItems === 0) {
      Alert.alert("No Products", "Enter at least one product quantity.");
      return;
    }

    // 3. Numeric fields
    const cust = parseInt(customers || "0", 10);
    const samp = parseInt(samplers  || "0", 10);
    if (isNaN(cust) || isNaN(samp)) {
      Alert.alert("Invalid Input", "Customers and Samplers must be numbers.");
      return;
    }

    // 4. Payment
    const cash  = parseInt(payment.cash  || "0", 10) || 0;
    const mpesa = parseInt(payment.mpesa || "0", 10) || 0;
    const debt  = parseInt(payment.debt  || "0", 10) || 0;

    if (cash + mpesa + debt !== totalAmount) {
      Alert.alert(
        "Payment Mismatch",
        `Cash + M-Pesa + Debt must equal ${formatKES(totalAmount)}.\n\nCurrent: ${formatKES(cash + mpesa + debt)}\nRemaining: ${formatKES(paymentBalance)}`
      );
      return;
    }

    const products = lineItems
      .filter((l) => l.qty > 0)
      .map(({ sku, qty }) => ({ sku: sku as ProductSKU, qty }));

    await onSubmit(products, { cash, mpesa, debt }, cust, samp, notes, photoUri);

    // Reset form
    setQtys(initialQtys());
    setPayment({ cash: "", mpesa: "", debt: "" });
    setCustomers("");
    setSamplers("");
    setNotes("");
    setPhotoUri(null);
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
          <Text style={styles.modalTitle}>Daily Sales Report</Text>
          <Text style={styles.modalSubtitle}>{getTodayFull()}</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── PHOTO PROOF ── */}
            <View style={styles.sectionHeader}>
              <Camera size={14} color={COLORS.primary} />
              <Text style={styles.sectionHeaderText}>Sales Photo <Text style={styles.requiredStar}>*</Text></Text>
            </View>

            <TouchableOpacity style={styles.photoBox} onPress={handlePickPhoto} activeOpacity={0.8}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera size={32} color={COLORS.textMuted} />
                  <Text style={styles.photoPlaceholderText}>Tap to take / upload photo</Text>
                  <Text style={styles.photoPlaceholderSub}>Required before submission</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ── PRODUCTS ── */}
            <View style={styles.sectionHeader}>
              <Package size={14} color={COLORS.primary} />
              <Text style={styles.sectionHeaderText}>Products Sold <Text style={styles.requiredStar}>*</Text></Text>
            </View>

            {PRODUCTS.map((product) => {
              const qty      = parseInt(qtys[product.sku] || "0", 10) || 0;
              const subtotal = product.unitPrice * qty;
              return (
                <View key={product.sku} style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>{formatKES(product.unitPrice)} / unit</Text>
                  </View>
                  <View style={styles.productInput}>
                    <TextInput
                      style={styles.productQtyInput}
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={qtys[product.sku]}
                      onChangeText={(t) => setQtys({ ...qtys, [product.sku]: t })}
                    />
                  </View>
                  {qty > 0 && (
                    <Text style={styles.productSubtotal}>{formatKES(subtotal)}</Text>
                  )}
                </View>
              );
            })}

            {/* Totals summary */}
            <View style={styles.totalsSummary}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total Items:</Text>
                <Text style={styles.totalsValue}>{totalItems}</Text>
              </View>
              <View style={[styles.totalsRow, styles.totalAmountRow]}>
                <Text style={styles.totalAmountLabel}>Total Amount:</Text>
                <Text style={styles.totalAmountValue}>{formatKES(totalAmount)}</Text>
              </View>
            </View>

            {/* ── PAYMENT BREAKDOWN ── */}
            <View style={styles.sectionHeader}>
              <TrendingUp size={14} color={COLORS.primary} />
              <Text style={styles.sectionHeaderText}>
                Payment Breakdown <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>
            <Text style={styles.paymentHint}>
              Cash + M-Pesa + Debt must equal {formatKES(totalAmount)}
            </Text>

            {/* Cash */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cash Received (KES)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={payment.cash}
                onChangeText={(t) => setPayment({ ...payment, cash: t })}
              />
            </View>

            {/* M-Pesa */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: COLORS.mpesa }]}>M-Pesa Received (KES)</Text>
              <TextInput
                style={[styles.input, { borderColor: COLORS.mpesa + "60" }]}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={payment.mpesa}
                onChangeText={(t) => setPayment({ ...payment, mpesa: t })}
              />
            </View>

            {/* Debt */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: COLORS.warning }]}>Debt / Credit (KES)</Text>
              <TextInput
                style={[styles.input, { borderColor: COLORS.warning + "60" }]}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={payment.debt}
                onChangeText={(t) => setPayment({ ...payment, debt: t })}
              />
            </View>

            {/* Payment balance indicator */}
            {totalAmount > 0 && (
              <View style={[
                styles.balanceIndicator,
                {
                  backgroundColor: paymentBalance === 0
                    ? COLORS.successLight
                    : COLORS.warningLight,
                },
              ]}>
                <Text style={[
                  styles.balanceText,
                  { color: paymentBalance === 0 ? COLORS.success : COLORS.warning },
                ]}>
                  {paymentBalance === 0
                    ? "✓ Payment balanced"
                    : paymentBalance > 0
                      ? `Still needs ${formatKES(paymentBalance)}`
                      : `Over by ${formatKES(Math.abs(paymentBalance))}`}
                </Text>
              </View>
            )}

            {/* ── CUSTOMERS & SAMPLERS ── */}
            <View style={styles.twoCol}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Customers <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={customers}
                  onChangeText={setCustomers}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Samplers Given <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={samplers}
                  onChangeText={setSamplers}
                />
              </View>
            </View>

            {/* ── NOTES ── */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Observations</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Any highlights or challenges today…"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* ── ACTIONS ── */}
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

            <View style={{ height: 16 }} />
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

  const [employee,     setEmployee]     = useState<Employee | null>(null);
  const [summary,      setSummary]      = useState<EmployeeTodaySummary | null>(null);
  const [reportCount,  setReportCount]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [profileUri,   setProfileUri]   = useState<string | null>(null);
  const { isloading } = useLoader();

  // Track late-flag state for live indicator
  const [isLateNow, setIsLateNow] = useState(false);

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

  // ── Late flag indicator (updates every minute) ────────────────────────────
  useEffect(() => {
    const checkLate = () => {
      const nowUTC  = new Date();
      const eatHour = (nowUTC.getUTCHours() + 3) % 24;
      setIsLateNow(eatHour >= 19);
    };
    checkLate();
    const interval = setInterval(checkLate, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    // 6:00 PM EAT
    const reminder = new Date(now);
    reminder.setHours(18, 0, 0, 0);
    if (reminder.getTime() <= now.getTime()) {
      reminder.setDate(reminder.getDate() + 1);
    }

 
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Report Reminder",
        body: "It's 6 PM — remember to submit your daily sales report before 7 PM!",
        sound: true,
      },
      trigger: { date: reminder } as any,
    });
  };

  setupNotifications();
}, []);


  // ── Submit daily report ───────────────────────────────────────────────────
  const handleSubmit = async (
    products:  { sku: ProductSKU; qty: number }[],
    payment:   { cash: number; mpesa: number; debt: number },
    customers: number,
    samplers:  number,
    notes:     string,
    photoUri:  string
  ) => {
    setSubmitting(true);
    setModalVisible(false);
    try {
      const result = await addReport({
        employeeId,
        products,
        cash:             payment.cash,
        mpesa:            payment.mpesa,
        debt:             payment.debt,
        customersReached: customers,
        samplersGiven:    samplers,
        notes,
        location:         employee?.assignedArea ?? "Unknown",
        coords:           employee?.lastKnownLocation
          ? { latitude: employee.lastKnownLocation.latitude, longitude: employee.lastKnownLocation.longitude }
          : null,
        photoUri,
      });

      if (!result.success) {
        Alert.alert("Submission Error", result.error ?? "Please try again.");
        return;
      }

      if (result.report?.lateFlag) {
        Alert.alert(
          "⚠️ Late Submission",
          "Your report has been submitted but flagged as late (after 7 PM EAT). Your manager will be notified."
        );
      } else {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3500);
      }

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
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setProfileUri(result.assets[0].uri);
    }
  };

  const alreadySubmittedToday = !!summary?.todayReport;

  // ─── Loading ──────────────────────────────────────────────────────────────
  // if (loading) {
  //   return (
  //     <SafeAreaView style={styles.safe} edges={["top"]}>
       
  //            {isloading && <GlobalLoader />}
       
  //     </SafeAreaView>
  //   );
  // }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
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
        {/* Welcome banner */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeGreet}>{getGreeting()},</Text>
            <Text style={styles.welcomeName}>{employee?.firstName ?? "User"} 👋</Text>
            <Text style={styles.welcomeRole}>
              {employee?.role} · {employee?.assignedArea}
            </Text>
          </View>
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

        {/* Late warning banner */}
        {isLateNow && !alreadySubmittedToday && (
          <View style={styles.lateBanner}>
            <AlertTriangle size={16} color={COLORS.warning} />
            <Text style={styles.lateBannerText}>
              It's past 7 PM — submitting now will be flagged as a late report.
            </Text>
          </View>
        )}

        {/* Monthly target */}
        {summary && (
          <MonthlyProgress
            sales={summary.monthSales}
            salesKES={summary.monthSalesKES}
            target={summary.monthTarget}
          />
        )}

        {/* Submitted today badge */}
        {alreadySubmittedToday && (
          <View style={styles.submittedBanner}>
            <CheckCircle size={16} color={COLORS.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.submittedBannerText}>
                Today's report submitted · {summary?.todayReport?.sales} items · {formatKES(summary?.todayReport?.totalSalesKES ?? 0)}
              </Text>
              {summary?.todayReport?.lateFlag && (
                <Text style={styles.lateFlagText}>⚠ Flagged as late submission</Text>
              )}
            </View>
          </View>
        )}

        {/* Payment breakdown for today */}
        {alreadySubmittedToday && summary?.todayReport && (
          <View style={styles.paymentBreakdownCard}>
            <Text style={styles.paymentBreakdownTitle}>Today's Payment Breakdown</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Cash</Text>
              <Text style={styles.paymentCash}>{formatKES(summary.todayReport.salesBreakdown.cash)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>M-Pesa</Text>
              <Text style={styles.paymentMpesa}>{formatKES(summary.todayReport.salesBreakdown.mpesa)}</Text>
            </View>
            {summary.todayReport.salesBreakdown.debt > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Debt</Text>
                <Text style={styles.paymentDebt}>{formatKES(summary.todayReport.salesBreakdown.debt)}</Text>
              </View>
            )}
            <View style={[styles.paymentRow, { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 6, paddingTop: 8 }]}>
              <Text style={[styles.paymentLabel, { fontWeight: "800", color: COLORS.textPrimary }]}>Total</Text>
              <Text style={[styles.paymentCash, { color: COLORS.textPrimary, fontSize: 16 }]}>
                {formatKES(summary.todayReport.totalSalesKES)}
              </Text>
            </View>
          </View>
        )}

        {/* Section header */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Stat cards */}
        <View style={styles.cardsWrap}>
          <StatCard
            label="Sales (items)"
            value={summary?.weekSales ?? 0}
            icon={<TrendingUp size={20} color={COLORS.primary} />}
            sub={formatKES(summary?.weekSalesKES ?? 0)}
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
            {alreadySubmittedToday ? "Daily report submitted" : "Create Daily Report"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Toast */}
      {submitted && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>Daily report submitted!</Text>
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
    paddingTop: 8, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2, fontWeight: "500" },
  logoutButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  scroll: {
    flex: 1, backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -10,
  },
  scrollContent: { paddingTop: 24, paddingHorizontal: 18 },

  // Welcome
  welcomeCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 20,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 12,
  },
  welcomeText:  { flex: 1 },
  welcomeGreet: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },
  welcomeName:  { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, marginTop: 2, letterSpacing: -0.3 },
  welcomeRole:  { fontSize: 12, color: COLORS.textMuted, marginTop: 3, fontWeight: "500" },

  // Profile
  profileWrap:    { position: "relative", width: 64, height: 64 },
  profileImage:   { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: COLORS.primary },
  profilePlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.background, borderWidth: 2, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  profileInitials: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  cameraBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.cardBg,
  },

  // Late banner
  lateBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.warningLight, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.warning + "50",
  },
  lateBannerText: { flex: 1, fontSize: 12, color: COLORS.warning, fontWeight: "600" },

  // Monthly progress
  progressWrap: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, marginBottom: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressTitle:  { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  progressPct:    { fontSize: 14, fontWeight: "800" },
  progressBg:     { height: 7, backgroundColor: COLORS.border, borderRadius: 4, overflow: "hidden" },
  progressFill:   { height: 7, borderRadius: 4 },
  progressFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressSub:    { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },
  progressKES:    { fontSize: 11, color: COLORS.textSecondary, fontWeight: "700" },

  // Submitted banner
  submittedBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.successLight, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10,
  },
  submittedBannerText: { fontSize: 13, color: COLORS.success, fontWeight: "600" },
  lateFlagText:        { fontSize: 11, color: COLORS.warning, fontWeight: "600", marginTop: 3 },

  // Payment breakdown card
  paymentBreakdownCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, marginBottom: 12,
  },
  paymentBreakdownTitle: {
    fontSize: 13, fontWeight: "700", color: COLORS.textSecondary,
    marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5,
  },
  paymentRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  paymentLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  paymentCash:  { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  paymentMpesa: { fontSize: 13, fontWeight: "700", color: COLORS.mpesa },
  paymentDebt:  { fontSize: 13, fontWeight: "700", color: COLORS.warning },

  // Section
  sectionRow:  { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, marginRight: 10 },
  sectionLine:  { flex: 1, height: 1, backgroundColor: COLORS.border },

  // Stat cards
  cardsWrap:    { gap: 8, marginBottom: 12 },
  card: {
    borderRadius: 20, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.cardBg,
  },
  cardLeft:     { flex: 1 },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  cardLabel:  { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, letterSpacing: 0.1 },
  cardSub:    { fontSize: 11, color: COLORS.textMuted, marginTop: 3, fontWeight: "500" },
  cardValue:  { fontSize: 44, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -2, lineHeight: 48 },

  // History button
  historyBtn: {
    backgroundColor: COLORS.cardBg, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center",
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  historyBtnText: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, letterSpacing: 0.2 },
  historyBtnSub:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Create report button
  createReportBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 17, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
    shadowColor: COLORS.primary, shadowOpacity: 0.42,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8, gap: 10,
  },
  createReportBtnDisabled: { backgroundColor: COLORS.success, shadowColor: COLORS.success, shadowOpacity: 0.25 },
  createReportLabel: { fontSize: 16, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },

  // Toast
  toast: {
    position: "absolute", bottom: 40, alignSelf: "center",
    backgroundColor: COLORS.success, borderRadius: 30,
    paddingHorizontal: 24, paddingVertical: 14,
    shadowColor: COLORS.success, shadowOpacity: 0.45,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  toastText: { color: COLORS.white, fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },

  // Modal
  modalOverlay:  { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlayBg },
  modalSheet: {
    backgroundColor: COLORS.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 58 : 48, maxHeight: "92%",
  },
  modalHandle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 22,
  },
  modalTitle:    { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginBottom: 20, fontWeight: "500" },

  // Section headers inside modal
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 10, marginTop: 4,
  },
  sectionHeaderText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.6 },

  // Photo
  photoBox: {
    borderRadius: 14, overflow: "hidden",
    borderWidth: 2, borderColor: COLORS.border,
    borderStyle: "dashed", marginBottom: 16, height: 140,
  },
  photoPreview:        { width: "100%", height: "100%", resizeMode: "cover" },
  photoPlaceholder:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  photoPlaceholderText: { fontSize: 14, color: COLORS.textMuted, fontWeight: "600" },
  photoPlaceholderSub:  { fontSize: 11, color: COLORS.textMuted },

  // Products
  productRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  productInfo:     { flex: 1 },
  productName:     { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  productPrice:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  productInput:    { width: 64 },
  productQtyInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 8,
    textAlign: "center", fontSize: 16, fontWeight: "700",
    color: COLORS.textPrimary, paddingVertical: 8,
    backgroundColor: COLORS.background,
  },
  productSubtotal: { fontSize: 12, fontWeight: "700", color: COLORS.primary, width: 80, textAlign: "right" },

  // Totals
  totalsSummary:  { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginVertical: 12 },
  totalsRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsLabel:    { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  totalsValue:    { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  totalAmountRow: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalAmountLabel: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  totalAmountValue: { fontSize: 16, fontWeight: "900", color: COLORS.primary },

  // Payment
  paymentHint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12, fontStyle: "italic" },
  balanceIndicator: { borderRadius: 10, padding: 10, marginBottom: 12, marginTop: 4 },
  balanceText:      { fontSize: 13, fontWeight: "700", textAlign: "center" },

  // Inputs
  twoCol:     { flexDirection: "row" },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 12, fontWeight: "700", color: COLORS.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6,
  },
  requiredStar: { color: COLORS.required },
  input: {
    fontSize: 15, fontWeight: "600", color: COLORS.textPrimary,
    paddingVertical: 13, paddingHorizontal: 14,
    backgroundColor: COLORS.background,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
  },
  textarea: { height: 90, textAlignVertical: "top", paddingTop: 12 },

  // Modal actions
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 14,
    paddingVertical: 15, alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  submitBtn: {
    flex: 2, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  submitBtnText: { fontSize: 14, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },
});

export default EmployeeDashboardScreen;