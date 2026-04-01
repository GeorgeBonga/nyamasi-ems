import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, TrendingUp, Users, Gift, Calendar, Navigation } from "lucide-react-native";
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
  accentBlue: "#1565C0",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportEntry {
  id: string;
  date: string;          // display label  e.g. "Apr 12, 2026"
  dayLabel: string;      // e.g. "Monday"
  sales: number;
  customers: number;
  samplers: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const REPORT_DATA: ReportEntry[] = [
  { id: "1", date: "Apr 12, 2026", dayLabel: "Sunday",    sales: 20, customers: 110, samplers: 60 },
  { id: "2", date: "Apr 11, 2026", dayLabel: "Saturday",  sales: 15, customers: 95,  samplers: 45 },
  { id: "3", date: "Apr 10, 2026", dayLabel: "Friday",    sales: 22, customers: 130, samplers: 80 },
  { id: "4", date: "Apr 9, 2026",  dayLabel: "Thursday",  sales: 18, customers: 102, samplers: 55 },
  { id: "5", date: "Apr 8, 2026",  dayLabel: "Wednesday", sales: 25, customers: 145, samplers: 90 },
  { id: "6", date: "Apr 7, 2026",  dayLabel: "Tuesday",   sales: 12, customers: 78,  samplers: 38 },
  { id: "7", date: "Apr 6, 2026",  dayLabel: "Monday",    sales: 30, customers: 160, samplers: 100 },
];

// ─── Report Card ──────────────────────────────────────────────────────────────
interface ReportCardProps {
  entry: ReportEntry;
  onPress: (entry: ReportEntry) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ entry, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(entry)}
    activeOpacity={0.75}
  >
    {/* Left accent bar */}

    <View style={styles.cardBody}>
      {/* Date row */}
      <View style={styles.cardHeader}>
        <View style={styles.dateRow}>
          <Calendar size={14} color={COLORS.primary} />
          <Text style={styles.cardDate}>{entry.date}</Text>
        </View>
        <Text style={styles.cardDay}>{entry.dayLabel}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <TrendingUp size={14} color={COLORS.success} />
          <Text style={styles.statLabel}>Sales</Text>
          <Text style={styles.statValue}>{entry.sales}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Users size={14} color={COLORS.accentBlue} />
          <Text style={styles.statLabel}>Reached</Text>
          <Text style={styles.statValue}>{entry.customers}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Gift size={14} color={COLORS.primary} />
          <Text style={styles.statLabel}>Samplers</Text>
          <Text style={styles.statValue}>{entry.samplers}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Summary Bar ──────────────────────────────────────────────────────────────
const SummaryBar: React.FC = () => {
  const totalSales     = REPORT_DATA.reduce((s, r) => s + r.sales, 0);
  const totalCustomers = REPORT_DATA.reduce((s, r) => s + r.customers, 0);
  const totalSamplers  = REPORT_DATA.reduce((s, r) => s + r.samplers, 0);

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
interface ReportHistoryScreenProps {
  onBack?: () => void;
}

const ReportHistoryScreen: React.FC<ReportHistoryScreenProps> = ({ onBack }) => {
   const navigation: any = useNavigation();
  const handleCardPress = (entry: ReportEntry) => {
    // Navigate to detail or expand — wire up as needed
    console.log("Pressed report:", entry.id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ── Header ── */}
    <View style={styles.header}>
  {/* LEFT */}
  <TouchableOpacity
    style={styles.backBtn}
     onPress={() => navigation.goBack()}
    activeOpacity={0.7}
  >
    <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
  </TouchableOpacity>

  {/* CENTER */}
  <View style={styles.center}>
    <Text style={styles.headerTitle}>Report History</Text>
  </View>

 
</View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Summary totals */}
        <SummaryBar />

        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionCount}>{REPORT_DATA.length} entries</Text>
        </View>

        {/* Report list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {REPORT_DATA.map((entry, index) => (
            <React.Fragment key={entry.id}>
              <ReportCard entry={entry} onPress={handleCardPress} />
              {index < REPORT_DATA.length - 1 && (
                <View style={styles.cardSeparator} />
              )}
            </React.Fragment>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

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
    justifyContent: "space-between",
  paddingVertical: 16,
  },
   backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },




center: {
  flex: 1,
  alignItems: "center",
},

headerTitle: {
  fontSize: 18,
  fontWeight: "800",
  color: COLORS.white,
  letterSpacing: 0.3,
  textAlign: "center",
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
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  // Section row
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // List
  listContent: {
    paddingBottom: 8,
  },

  // Card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: COLORS.textPrimary,
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: 0.1,
  },
  cardDay: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Stats row inside card
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  cardSeparator: {
    height: 10,
  },
});

export default ReportHistoryScreen;