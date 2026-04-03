import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
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
} from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { getReportsByEmployee, Report } from "../../../data/dbService";

// ─── Navigation types ─────────────────────────────────────────────────────────
type HistoryRouteParams = {
  ReportHistoryScreen: { employeeId: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#8B0111",
  primaryDark: "#8B0111",
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
  danger: "#C62828",
  dangerLight: "#FFEBEE",
};

// ─── Report Card ──────────────────────────────────────────────────────────────
const ReportCard: React.FC<{ report: Report }> = ({ report }) => (
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
          {/* Status pill */}
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

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <TrendingUp size={14} color={COLORS.success} />
          <Text style={styles.statLabel}>Sales</Text>
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

      {/* Notes preview */}
      {!!report.notes && (
        <Text style={styles.notesPreview} numberOfLines={1}>
         {report.notes}
        </Text>
      )}

      {/* Location */}
      <Text style={styles.locationText}>{report.location}</Text>
    </View>
  </View>
);

// ─── Summary Bar ──────────────────────────────────────────────────────────────
interface SummaryBarProps {
  reports: Report[];
}

const SummaryBar: React.FC<SummaryBarProps> = ({ reports }) => {
  const totalSales     = reports.reduce((s, r) => s + r.sales, 0);
  const totalCustomers = reports.reduce((s, r) => s + r.customersReached, 0);
  const totalSamplers  = reports.reduce((s, r) => s + r.samplersGiven, 0);

  return (
    <View style={styles.summaryBar}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{totalSales}</Text>
        <Text style={styles.summaryLabel}>Total Sales</Text>
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
        {/* Spacer to balance back button */}
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
            {/* Summary totals */}
            <SummaryBar reports={reports} />

            {/* Section label */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>All Reports</Text>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionCount}>{reports.length} entries</Text>
            </View>

            {/* Report list */}
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
                    {index < reports.length - 1 && (
                      <View style={styles.cardSeparator} />
                    )}
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

  // Header
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  center: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 18, fontWeight: "800", color: COLORS.white,
    letterSpacing: 0.3, textAlign: "center",
  },

  // Body
  body: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
    paddingTop: 20,
    paddingHorizontal: 18,
  },

  // Summary bar
  summaryBar: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: {
    fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 11, fontWeight: "600", color: COLORS.textMuted,
    marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5,
  },
  summaryDivider: { width: 1, height: 36, backgroundColor: COLORS.border },

  // Section row
  sectionRow: {
    flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  sectionCount: {
    fontSize: 11, fontWeight: "600", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.4,
  },

  listContent: { paddingBottom: 8 },

  // Card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardDate: {
    fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: 0.1,
  },
  cardDay: {
    fontSize: 10, fontWeight: "600", color: COLORS.textMuted,
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  statusPillText: { fontSize: 9, fontWeight: "700" },

  // Stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statLabel: {
    fontSize: 10, fontWeight: "600", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 17, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.3,
  },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  notesPreview: {
    fontSize: 12, color: COLORS.textSecondary, fontWeight: "500",
    fontStyle: "italic",
  },
  locationText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },

  cardSeparator: { height: 10 },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20,
  },
});

export default ReportHistoryScreen;