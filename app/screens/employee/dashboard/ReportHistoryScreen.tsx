import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  TrendingUp,
  Users,
  Gift,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Camera,
  Package,
} from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { getReportsByEmployee, Report } from "../../../data/dbService";

// ─── Navigation types ─────────────────────────────────────────────────────────
type HistoryRouteParams = {
  ReportHistoryScreen: { employeeId: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary:       "#8B0111",
  primaryDark:   "#8B0111",
  primaryMuted:  "rgba(139,1,17,0.08)",
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
  danger:        "#C62828",
  dangerLight:   "#FFEBEE",
  mpesa:         "#00A651",
};

// ─── Photo Viewer ─────────────────────────────────────────────────────────────
const PhotoViewer: React.FC<{ uri: string; onClose: () => void }> = ({ uri, onClose }) => (
  <Modal visible animationType="fade" transparent onRequestClose={onClose}>
    <TouchableOpacity style={pv.backdrop} activeOpacity={1} onPress={onClose}>
      <Image source={{ uri }} style={pv.image} resizeMode="contain" />
    </TouchableOpacity>
  </Modal>
);

const pv = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" },
  image:    { width: "90%", height: "70%" },
});

// ─── Report Card ──────────────────────────────────────────────────────────────
const ReportCard: React.FC<{ report: Report }> = ({ report }) => {
  const [showPhoto, setShowPhoto] = useState(false);
  const sb = report.salesBreakdown;

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        {/* Date row */}
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Calendar size={14} color={COLORS.primary} />
            <Text style={styles.cardDate}>{report.date}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={styles.cardDay}>{report.dayName.toUpperCase()}</Text>

            {/* Late flag */}
            {report.lateFlag && (
              <View style={[styles.statusPill, { backgroundColor: COLORS.warningLight }]}>
                <Clock size={9} color={COLORS.warning} />
                <Text style={[styles.statusPillText, { color: COLORS.warning }]}>Late</Text>
              </View>
            )}

            {/* Sales flag */}
            {report.flagged ? (
              <View style={[styles.statusPill, { backgroundColor: COLORS.dangerLight }]}>
                <AlertTriangle size={9} color={COLORS.danger} />
                <Text style={[styles.statusPillText, { color: COLORS.danger }]}>Low</Text>
              </View>
            ) : report.submitted ? (
              <View style={[styles.statusPill, { backgroundColor: COLORS.successLight }]}>
                <CheckCircle size={9} color={COLORS.success} />
                <Text style={[styles.statusPillText, { color: COLORS.success }]}>Done</Text>
              </View>
            ) : (
              <View style={[styles.statusPill, { backgroundColor: COLORS.warningLight }]}>
                <Clock size={9} color={COLORS.warning} />
                <Text style={[styles.statusPillText, { color: COLORS.warning }]}>Pending</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items total */}
        <View style={styles.itemsRow}>
          <View style={styles.itemsBadge}>
            <Package size={16} color={COLORS.primary} />
            <Text style={styles.itemsBadgeText}>{report.sales} items sold</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <TrendingUp size={14} color={COLORS.success} />
            <Text style={styles.statLabel}>Items</Text>
            <Text style={[styles.statValue, { color: report.flagged ? COLORS.danger : COLORS.textPrimary }]}>
              {report.sales}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Users size={14} color={COLORS.accentBlue} />
            <Text style={styles.statLabel}>Reached</Text>
            <Text style={styles.statValue}>{report.customersReached}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Gift size={14} color={COLORS.primary} />
            <Text style={styles.statLabel}>Samplers</Text>
            <Text style={styles.statValue}>{report.samplersGiven}</Text>
          </View>
        </View>

        {/* Product breakdown */}
        {sb?.items && sb.items.length > 0 && (
          <View style={styles.productsSection}>
            <View style={styles.productsSectionHeader}>
              <Package size={11} color={COLORS.textMuted} />
              <Text style={styles.productsSectionTitle}>Products Breakdown</Text>
            </View>
            {sb.items.map((item) => (
              <View key={item.sku} style={styles.productLine}>
                <Text style={styles.productLineName} numberOfLines={1}>
                  {item.sku.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
                <Text style={styles.productLineQty}>×{item.qty}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Photo proof thumbnail */}
        {report.photoUri && (
          <TouchableOpacity style={styles.photoRow} onPress={() => setShowPhoto(true)} activeOpacity={0.8}>
            <Image source={{ uri: report.photoUri }} style={styles.photoThumb} />
            <View style={styles.photoLabel}>
              <Camera size={12} color={COLORS.success} />
              <Text style={styles.photoLabelText}>Sales Photo · Tap to view</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Notes */}
        {!!report.notes && (
          <Text style={styles.notesPreview} numberOfLines={2}>
            {report.notes}
          </Text>
        )}

        <Text style={styles.locationText}>{report.location}</Text>

        {/* Time submitted */}
        {report.submittedAt && (
          <Text style={[
            styles.submittedAt,
            report.lateFlag && { color: COLORS.warning },
          ]}>
            {report.lateFlag ? "⚠ " : ""}Submitted: {new Date(report.submittedAt).toLocaleTimeString("en-KE", {
              hour: "2-digit", minute: "2-digit", hour12: true,
            })} EAT
          </Text>
        )}
      </View>

      {showPhoto && report.photoUri && (
        <PhotoViewer uri={report.photoUri} onClose={() => setShowPhoto(false)} />
      )}
    </View>
  );
};

// ─── Summary Bar ──────────────────────────────────────────────────────────────
const SummaryBar: React.FC<{ reports: Report[] }> = ({ reports }) => {
  const totalItems    = reports.reduce((s, r) => s + r.sales, 0);
  const totalCustomers = reports.reduce((s, r) => s + r.customersReached, 0);
  const totalSamplers = reports.reduce((s, r) => s + r.samplersGiven, 0);

  return (
    <View style={styles.summaryCard}>
      {/* Items / Customers / Samplers */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalItems}</Text>
          <Text style={styles.summaryLabel}>Total Items</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalCustomers}</Text>
          <Text style={styles.summaryLabel}>Customers</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalSamplers}</Text>
          <Text style={styles.summaryLabel}>Samplers</Text>
        </View>
      </View>

      {/* Reports count */}
      <View style={styles.reportsCountRow}>
        <Calendar size={14} color={COLORS.textMuted} />
        <Text style={styles.reportsCountText}>{reports.length} reports submitted</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ReportHistoryScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const route = useRoute<RouteProp<HistoryRouteParams, "ReportHistoryScreen">>();
  const employeeId = route.params?.employeeId ?? "e001";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReportsByEmployee(employeeId);
      setReports(data);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { loadReports(); }, [loadReports]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.headerTitle}>Report History</Text>
        </View>
        <View style={{ width: 46 }} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <SummaryBar reports={reports} />

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>All Reports</Text>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionCount}>{reports.length} entries</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {reports.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Reports Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Your daily reports will appear here once submitted.
                  </Text>
                </View>
              ) : (
                reports.map((report, index) => (
                  <React.Fragment key={report.id}>
                    <ReportCard report={report} />
                    {index < reports.length - 1 && <View style={styles.cardSeparator} />}
                  </React.Fragment>
                ))
              )}
              <View style={{ height: 32 }} />
            </ScrollView>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },

  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 16,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  center:      { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3, textAlign: "center" },

  body: {
    flex: 1, backgroundColor: COLORS.background,
    marginTop: -10, paddingTop: 20, paddingHorizontal: 18,
  },

  // Summary card
  summaryCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 20,
    padding: 16, marginBottom: 20,
    shadowColor: COLORS.primary, shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },

  summaryBar:     { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryItem:    { alignItems: "center", flex: 1 },
  summaryValue:   { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5 },
  summaryLabel:   { fontSize: 11, fontWeight: "600", color: COLORS.textMuted, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryDivider: { width: 1, height: 36, backgroundColor: COLORS.border },

  reportsCountRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 12 },
  reportsCountText: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },

  // Section row
  sectionRow:  { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  sectionLine:  { flex: 1, height: 1, backgroundColor: COLORS.border },
  sectionCount: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },

  listContent: { paddingBottom: 8 },

  // Card
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 20, overflow: "hidden",
    shadowColor: COLORS.textPrimary, shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardBody: { paddingVertical: 14, paddingHorizontal: 14, gap: 10 },

  cardHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  dateRow:         { flexDirection: "row", alignItems: "center", gap: 6 },
  cardDate:        { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: 0.1 },
  cardDay:         { fontSize: 10, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 0.4 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  statusPillText: { fontSize: 9, fontWeight: "700" },

  // Items row
  itemsRow:      { flexDirection: "row", alignItems: "center" },
  itemsBadge:    { 
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.primaryMuted, borderRadius: 8, 
    paddingHorizontal: 12, paddingVertical: 8 
  },
  itemsBadgeText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },

  // Stats row
  statsRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.background, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 8,
  },
  statItem:    { flex: 1, alignItems: "center", gap: 3 },
  statLabel:   { fontSize: 10, fontWeight: "600", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  statValue:   { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.3 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  // Products section
  productsSection:       { borderRadius: 10, backgroundColor: COLORS.background, padding: 10 },
  productsSectionHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  productsSectionTitle:  { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  productLine:           { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  productLineName:       { flex: 1, fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  productLineQty:        { fontSize: 12, fontWeight: "700", color: COLORS.primary, width: 40, textAlign: "right" },

  // Photo
  photoRow:       { flexDirection: "row", alignItems: "center", gap: 10 },
  photoThumb:     { width: 52, height: 40, borderRadius: 8, backgroundColor: COLORS.border },
  photoLabel:     { flexDirection: "row", alignItems: "center", gap: 5 },
  photoLabelText: { fontSize: 12, color: COLORS.success, fontWeight: "600" },

  notesPreview: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500", fontStyle: "italic" },
  locationText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },
  submittedAt:  { fontSize: 10, color: COLORS.textMuted, fontWeight: "500" },

  cardSeparator: { height: 10 },

  emptyState:    { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:    { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
});

export default ReportHistoryScreen;