import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  DollarSign,
  Users,
  Gift,
  ChevronRight,
  Plus,
  Camera,
  LogOut,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

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
  required: "#C62828",
  overlayBg: "rgba(13,33,55,0.6)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
}

interface DailyReportForm {
  sales: string;
  customers: string;
  samplers: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTodayFull = (): string =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// ─── StatCard Component ───────────────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => (
  <View style={styles.card}>
    <View style={styles.cardLeft}>
      <View style={styles.cardIconWrap}>{icon}</View>
      <Text style={styles.cardLabel}>{label}</Text>
      {trend ? (
        <View style={styles.trendBadge}>
          <Text style={styles.trendText}>{trend}</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

// ─── Report Modal ─────────────────────────────────────────────────────────────
interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: DailyReportForm) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<DailyReportForm>({
    sales: "",
    customers: "",
    samplers: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!form.sales || !form.customers || !form.samplers) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    onSubmit(form);
    setForm({ sales: "", customers: "", samplers: "", notes: "" });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Submit Daily Report</Text>
          {/* Today's date — e.g. "Tuesday, July 1, 2025" */}
          <Text style={styles.modalSubtitle}>{getTodayFull()}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
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
                placeholder="Any highlights or challenges from yesterday..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={form.notes}
                onChangeText={(t) => setForm({ ...form, notes: t })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>Submit Report</Text>
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
  const [modalVisible, setModalVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [profileUri, setProfileUri] = useState<string | null>(null);
  const navigation: any = useNavigation();

  const handleSubmit = (_form: DailyReportForm) => {
    setModalVisible(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library.",
      );
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      {/* ── Header ── */}
   <View style={styles.header}>
  <View style={styles.headerRow}>
    <View>
      <Text style={styles.headerTitle}>Jane Atieno</Text>
      <Text style={styles.headerSub}>{getTodayFull()}</Text>
    </View>
    <TouchableOpacity 
    style={styles.logoutButton}
      onPress={() => navigation.navigate("Login")}
      activeOpacity={0.7}
    >
      <LogOut size={24} color={COLORS.white} />
    </TouchableOpacity>
  </View>
</View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Welcome Banner ── */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeGreet}>Good morning,</Text>
            <Text style={styles.welcomeName}>Jane! 👋</Text>
          </View>

          {/* Tappable profile image stored locally */}
          <TouchableOpacity
            style={styles.profileWrap}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {profileUri ? (
              <Image source={{ uri: profileUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Camera size={24} color={COLORS.textMuted} />
              </View>
            )}
            {/* Small camera badge */}
            <View style={styles.cameraBadge}>
              <Camera size={9} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Section Header ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Yesterday's Sales</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* ── Stat Cards ── */}
        <View style={styles.cardsWrap}>
          <StatCard
            label="Sales Made"
            value={18}
            icon={<DollarSign size={20} color={COLORS.primary} />}
            trend="↑ 12%"
          />
          <StatCard
            label="Customers Reached"
            value={120}
            icon={<Users size={20} color={COLORS.primary} />}
            trend="↑ 8%"
          />
          <StatCard
            label="Samplers Given"
            value={75}
            icon={<Gift size={20} color={COLORS.primary} />}
          />
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ReportHistoryScreen")}
        >
          <Text style={styles.historyBtnText}>View History</Text>
          <ChevronRight size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* ── Create Daily Report ── */}
        <TouchableOpacity
          style={styles.createReportBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.88}
        >
          <Plus size={20} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.createReportLabel}>Create Daily Report</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Toast ── */}
      {submitted && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>✓ Daily report submitted!</Text>
        </View>
      )}

      {/* ── Modal ── */}
      <ReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    color: COLORS.white,
  },

  // Header
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
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
    logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll body
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 18,
  },

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
  welcomeText: {
    flex: 1,
  },
  welcomeGreet: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2,
    letterSpacing: -0.3,
  },

  // Profile image
  profileWrap: {
    position: "relative",
    width: 64,
    height: 64,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
  },
  profilePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },

  // Section row
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginRight: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Cards
  cardsWrap: {
    gap: 8,
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    backgroundColor: COLORS.cardBg,
  },
  cardLeft: {
    flex: 1,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 0.1,
  },
  trendBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.success,
  },
  cardValue: {
    fontSize: 44,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -2,
    lineHeight: 48,
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
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },

  // Create Report button
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
  createReportLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.3,
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
  toastText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBg,
  },
  modalSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  requiredStar: {
    color: COLORS.required,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    paddingVertical: 13,
  },
  textarea: {
    height: 90,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    flex: undefined,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});

export default EmployeeDashboardScreen;
