/**
 * ReportsScreen.tsx — REFACTORED
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from original:
 *  • Removed DAILY_REPORTS[], MONTHLY_SUMMARY[] — all from dbService
 *  • getHydratedReports(dateISO) drives Daily tab (employee profile joined in)
 *  • getMonthlyAggregates(month, year) drives Monthly tab — computed dynamically
 *  • getYearlyAggregates(year) drives Yearly tab — computed dynamically
 *  • Available dates for the date filter pills built from real report data
 *  • approveReport() / flagReport() wire admin actions to the data store
 *  • MonthlyRow reads from EmployeeMonthlyAggregate (no more direct mock fields)
 *  • Yearly tab shows yearly performance for last 5 years
 *  • Removed flagged button and all related functionality
 *  • Removed download icon from header
 *  • Made search bar smaller and functional
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, Platform, Image, TextInput, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronDown, Calendar, TrendingUp, Users, Gift,
  Filter, Eye, FileText, BarChart2, ChevronRight, Search, X,Camera,Package,
  Award, CheckCircle, Menu,
} from "lucide-react-native";

import {
  getHydratedReports,
  getMonthlyAggregates,
  getYearlyAggregates,
  approveReport,
  HydratedReport,
  EmployeeMonthlyAggregate,
  EmployeeYearlyAggregate,
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
   mpesa:         "#00A651",


};
const formatKES = (n: number) =>
  `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
type ReportTab = "daily" | "monthly" | "yearly";
type Month = "Jan"|"Feb"|"Mar"|"Apr"|"May"|"Jun"|"Jul"|"Aug"|"Sep"|"Oct"|"Nov"|"Dec";

const MONTHS: Month[] = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS  = ["2026","2025","2024","2023","2022"];

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
// const DailyCard: React.FC<{
//   report: HydratedReport;
//   onView: () => void;
//   onApprove: () => void;
// }> = ({ report, onView, onApprove }) => (
//   <View style={repSt.dailyCard}>
//     <View style={repSt.dailyBody}>
//       {/* Top row */}
//       <View style={repSt.dailyTop}>
//         <View style={[repSt.initials, {
//           backgroundColor: COLORS.primaryMuted,
//         }]}>
//           <Text style={[repSt.initialsText, {
//             color: COLORS.primary,
//           }]}>
//             {report.employee?.initials ?? "??"}
//           </Text>
//         </View>
//         <View style={{ flex: 1 }}>
//           <View style={repSt.nameRow}>
//             <Text style={repSt.empName}>{report.employee?.fullName ?? "Unknown"}</Text>
//             {!report.submitted && (
//               <View style={[repSt.flagBadge, { backgroundColor: COLORS.warningLight }]}>
//                 <Clock size={10} color={COLORS.warning} />
//                 <Text style={[repSt.flagText, { color: COLORS.warning }]}>Pending</Text>
//               </View>
//             )}
//             {report.approved && (
//               <View style={[repSt.flagBadge, { backgroundColor: COLORS.successLight }]}>
//                 <CheckCircle size={10} color={COLORS.success} />
//                 <Text style={[repSt.flagText, { color: COLORS.success }]}>Approved</Text>
//               </View>
//             )}
//           </View>
//           <Text style={repSt.empRole}>
//             {report.employee?.role ?? ""} · {report.location}
//           </Text>
//         </View>
//         <View style={repSt.dateBox}>
//           <Text style={repSt.dateDayName}>{report.dayName.slice(0, 3)}</Text>
//           <Text style={repSt.dateShort}>{report.shortDate}</Text>
//         </View>
//       </View>

//       {/* Stats strip */}
//       <View style={repSt.statsStrip}>
//         {[
//           { icon: <TrendingUp size={12} color={COLORS.primary} />, lbl: "Sales",    val: report.sales,             color: COLORS.primary    },
//           { icon: <Users     size={12} color={COLORS.accentBlue} />, lbl: "Reached", val: report.customersReached,  color: COLORS.accentBlue },
//           { icon: <Gift      size={12} color={COLORS.success} />, lbl: "Samplers", val: report.samplersGiven,     color: COLORS.success    },
//         ].map((s, i) => (
//           <React.Fragment key={s.lbl}>
//             {i > 0 && <View style={repSt.statDivider} />}
//             <View style={repSt.statItem}>
//               {s.icon}
//               <Text style={repSt.statLbl}>{s.lbl}</Text>
//               <Text style={[repSt.statVal, { color: s.color }]}>{s.val}</Text>
//             </View>
//           </React.Fragment>
//         ))}
//       </View>

//       {report.notes ? (
//         <Text style={repSt.noteText} numberOfLines={2}>{report.notes}</Text>
//       ) : null}

//       {/* Action row */}
//       <View style={repSt.actionRow}>
//         <TouchableOpacity style={repSt.viewRowBtn} onPress={onView} activeOpacity={0.8}>
//           <Eye size={13} color={COLORS.accentBlue} />
//           <Text style={repSt.viewRowBtnText}>View</Text>
//         </TouchableOpacity>
//         {!report.approved && (
//           <TouchableOpacity
//             style={[repSt.viewRowBtn, { backgroundColor: COLORS.successLight }]}
//             onPress={onApprove} activeOpacity={0.8}
//           >
//             <CheckCircle size={13} color={COLORS.success} />
//             <Text style={[repSt.viewRowBtnText, { color: COLORS.success }]}>Approve</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   </View>
// );
// ─── Daily Card (Full Detail - matches Employee Report History) ─────────────────
const DailyCard: React.FC<{
  report: HydratedReport;
  onView: () => void;
  onApprove: () => void;
}> = ({ report, onView, onApprove }) => {
  const sb = report.salesBreakdown;
  const [showPhoto, setShowPhoto] = useState(false);

  return (
    <View style={repSt.dailyCard}>
      <View style={repSt.dailyBody}>
        {/* Date row */}
        <View style={repSt.cardHeader}>
          <View style={repSt.dateRow}>
            <Calendar size={14} color={COLORS.primary} />
            <Text style={repSt.cardDate}>{report.date}</Text>
          </View>
          <View style={repSt.cardHeaderRight}>
            <Text style={repSt.cardDay}>{report.dayName.toUpperCase()}</Text>

            {/* Late flag */}
            {report.lateFlag && (
              <View style={[repSt.statusPill, { backgroundColor: COLORS.warningLight }]}>
                <Clock size={9} color={COLORS.warning} />
                <Text style={[repSt.statusPillText, { color: COLORS.warning }]}>Late</Text>
              </View>
            )}

            {/* Status */}
            {!report.submitted ? (
              <View style={[repSt.statusPill, { backgroundColor: COLORS.warningLight }]}>
                <Clock size={9} color={COLORS.warning} />
                <Text style={[repSt.statusPillText, { color: COLORS.warning }]}>Pending</Text>
              </View>
            ) : report.approved ? (
              <View style={[repSt.statusPill, { backgroundColor: COLORS.successLight }]}>
                <CheckCircle size={9} color={COLORS.success} />
                <Text style={[repSt.statusPillText, { color: COLORS.success }]}>Approved</Text>
              </View>
            ) : (
              <View style={[repSt.statusPill, { backgroundColor: COLORS.accentBlueLight }]}>
                <CheckCircle size={9} color={COLORS.accentBlue} />
                <Text style={[repSt.statusPillText, { color: COLORS.accentBlue }]}>Submitted</Text>
              </View>
            )}
          </View>
        </View>

        {/* Employee info */}
        <View style={repSt.employeeRow}>
          <View style={[repSt.initials, { backgroundColor: COLORS.primaryMuted }]}>
            <Text style={[repSt.initialsText, { color: COLORS.primary }]}>
              {report.employee?.initials ?? "??"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={repSt.empName}>{report.employee?.fullName ?? "Unknown"}</Text>
            <Text style={repSt.empRole}>
              {report.employee?.role ?? ""} · {report.location}
            </Text>
          </View>
        </View>

        {/* KES total */}
        <View style={repSt.kesRow}>
          <Text style={repSt.kesTotal}>{formatKES(report.totalSalesKES)}</Text>
          <View style={repSt.kesBadge}>
            <Text style={repSt.kesBadgeText}>{report.sales} items</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={repSt.statsRow}>
          <View style={repSt.statItemFull}>
            <TrendingUp size={14} color={COLORS.success} />
            <Text style={repSt.statLabelFull}>Items</Text>
            <Text style={[repSt.statValueFull, { color: report.flagged ? COLORS.danger : COLORS.textPrimary }]}>
              {report.sales}
            </Text>
          </View>
          <View style={repSt.statDividerFull} />
          <View style={repSt.statItemFull}>
            <Users size={14} color={COLORS.accentBlue} />
            <Text style={repSt.statLabelFull}>Reached</Text>
            <Text style={repSt.statValueFull}>{report.customersReached}</Text>
          </View>
          <View style={repSt.statDividerFull} />
          <View style={repSt.statItemFull}>
            <Gift size={14} color={COLORS.primary} />
            <Text style={repSt.statLabelFull}>Samplers</Text>
            <Text style={repSt.statValueFull}>{report.samplersGiven}</Text>
          </View>
        </View>

        {/* Payment breakdown */}
        {sb && (
          <View style={repSt.paymentMini}>
            <View style={repSt.paymentMiniItem}>
              <Text style={repSt.paymentMiniLabel}>Cash</Text>
              <Text style={[repSt.paymentMiniVal, { color: COLORS.textPrimary }]}>
                {formatKES(sb.cash)}
              </Text>
            </View>
            <View style={repSt.paymentMiniDivider} />
            <View style={repSt.paymentMiniItem}>
              <Text style={repSt.paymentMiniLabel}>M-Pesa</Text>
              <Text style={[repSt.paymentMiniVal, { color: COLORS.mpesa }]}>
                {formatKES(sb.mpesa)}
              </Text>
            </View>
            {sb.debt > 0 && (
              <>
                <View style={repSt.paymentMiniDivider} />
                <View style={repSt.paymentMiniItem}>
                  <Text style={repSt.paymentMiniLabel}>Debt</Text>
                  <Text style={[repSt.paymentMiniVal, { color: COLORS.warning }]}>
                    {formatKES(sb.debt)}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Product breakdown */}
        {sb?.items && sb.items.length > 0 && (
          <View style={repSt.productsSection}>
            <View style={repSt.productsSectionHeader}>
              <Package size={11} color={COLORS.textMuted} />
              <Text style={repSt.productsSectionTitle}>Products Sold</Text>
            </View>
            {sb.items.map((item) => (
              <View key={item.sku} style={repSt.productLine}>
                <Text style={repSt.productLineName} numberOfLines={1}>
                  {item.sku.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
                <Text style={repSt.productLineQty}>×{item.qty}</Text>
                <Text style={repSt.productLineAmt}>{formatKES(item.subtotal)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Photo proof thumbnail */}
        {report.photoUri && (
          <TouchableOpacity style={repSt.photoRow} onPress={() => setShowPhoto(true)} activeOpacity={0.8}>
            <Image source={{ uri: report.photoUri }} style={repSt.photoThumb} />
            <View style={repSt.photoLabel}>
              <Camera size={12} color={COLORS.success} />
              <Text style={repSt.photoLabelText}>Sales Photo · Tap to view</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Notes */}
        {!!report.notes && (
          <Text style={repSt.notesPreview} numberOfLines={2}>
            {report.notes}
          </Text>
        )}

        {/* Submitted time */}
        {report.submittedAt && (
          <Text style={[
            repSt.submittedAt,
            report.lateFlag && { color: COLORS.warning },
          ]}>
            {report.lateFlag ? "⚠ " : ""}Submitted: {new Date(report.submittedAt).toLocaleTimeString("en-KE", {
              hour: "2-digit", minute: "2-digit", hour12: true,
            })} EAT
          </Text>
        )}

        {/* Action row */}
        <View style={repSt.actionRow}>
          <TouchableOpacity style={repSt.viewRowBtn} onPress={onView} activeOpacity={0.8}>
            <Eye size={13} color={COLORS.accentBlue} />
            <Text style={repSt.viewRowBtnText}>View Details</Text>
          </TouchableOpacity>
          {!report.approved && report.submitted && (
            <TouchableOpacity
              style={[repSt.viewRowBtn, { backgroundColor: COLORS.successLight }]}
              onPress={onApprove} activeOpacity={0.8}
            >
              <CheckCircle size={13} color={COLORS.success} />
              <Text style={[repSt.viewRowBtnText, { color: COLORS.success }]}>Approve</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Photo Viewer Modal */}
      {showPhoto && report.photoUri && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setShowPhoto(false)}>
          <TouchableOpacity style={repSt.photoBackdrop} activeOpacity={1} onPress={() => setShowPhoto(false)}>
            <Image source={{ uri: report.photoUri }} style={repSt.photoFullImage} resizeMode="contain" />
            
            <TouchableOpacity style={repSt.photoCloseBtn} onPress={() => setShowPhoto(false)}>
              <X size={20} color={COLORS.white} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};
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

// ─── Yearly Row ──────────────────────────────────────────────────────────────
const YearlyRow: React.FC<{
  agg: EmployeeYearlyAggregate;
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
        {agg.monthsReported} months · Avg {agg.avgSalesPerMonth}/month · Best: {agg.bestMonthDisplay}
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
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Yearly Detail Modal ─────────────────────────────────────────────────────
const YearlyDetailModal: React.FC<{
  agg: EmployeeYearlyAggregate | null; visible: boolean; onClose: () => void;
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
              <Text style={repSt.detailTitle}>Yearly Summary</Text>
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
                { label:"Months Reported",  val:`${agg.monthsReported}` },
                { label:"Sales Target",  val:`${agg.totalSales} / ${agg.target} (${agg.achievePct}%)` },
                { label:"Avg Sales/Month", val:`${agg.avgSalesPerMonth}` },
                { label:"Best Month",      val: agg.bestMonthDisplay },
                { label:"Trend",         val: agg.trend==="up" ? "↑ Improving" : agg.trend==="down" ? "↓ Declining" : "→ Stable" },
              ].map((r,i) => (
                <View key={i} style={[repSt.detailInfoRow, i>0 && { borderTopWidth:1, borderTopColor:COLORS.border }]}>
                  <Text style={repSt.detailInfoLabel}>{r.label}</Text>
                  <Text style={repSt.detailInfoVal}>{r.val}</Text>
                </View>
              ))}
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
  const [yearlyYear,  setYearlyYear]  = useState("2026");
  const [search,      setSearch]      = useState("");
  const [showPicker,  setShowPicker]  = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Data
  const [allDailyReports, setAllDailyReports] = useState<HydratedReport[]>([]);
  const [availableDates,  setAvailableDates]  = useState<string[]>([]);
  const [filterDate,      setFilterDate]      = useState<string>("");
  const [monthlyAggs,     setMonthlyAggs]     = useState<EmployeeMonthlyAggregate[]>([]);
  const [yearlyAggs,      setYearlyAggs]      = useState<EmployeeYearlyAggregate[]>([]);
  const [dailyLoading,    setDailyLoading]    = useState(true);
  const [monthlyLoading,  setMonthlyLoading]  = useState(false);
  const [yearlyLoading,   setYearlyLoading]   = useState(false);

  // Modals
  const [viewDaily,   setViewDaily]   = useState<HydratedReport | null>(null);
  const [viewMonthly, setViewMonthly] = useState<EmployeeMonthlyAggregate | null>(null);
  const [viewYearly,  setViewYearly]  = useState<EmployeeYearlyAggregate | null>(null);

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

  // ── Load yearly aggregates ───────────────────────────────────────────────
  const loadYearly = useCallback(async (y: string) => {
    setYearlyLoading(true);
    try {
      const aggs = await getYearlyAggregates(y);
      setYearlyAggs(aggs.sort((a, b) => b.totalSales - a.totalSales));
    } finally {
      setYearlyLoading(false);
    }
  }, []);

  useEffect(() => { loadDailyReports(); }, [loadDailyReports]);
  useEffect(() => {
    if (tab === "monthly") loadMonthly(month, year);
  }, [tab, month, year, loadMonthly]);
  
  useEffect(() => {
    if (tab === "yearly") loadYearly(yearlyYear);
  }, [tab, yearlyYear, loadYearly]);

  // ── Filtered daily reports ────────────────────────────────────────────────
  const filteredDaily = allDailyReports.filter(r => {
    if (r.date !== filterDate) return false;
    if (search && !r.employee?.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredMonthly = monthlyAggs.filter(a =>
    !search || a.employee.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredYearly = yearlyAggs.filter(a =>
    !search || a.employee.fullName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const totalSales     = filteredDaily.reduce((s,r) => s + r.sales, 0);
  const totalCustomers = filteredDaily.reduce((s,r) => s + r.customersReached, 0);
  const totalSamplers  = filteredDaily.reduce((s,r) => s + r.samplersGiven, 0);
  const submittedCount = filteredDaily.filter(r => r.submitted).length;

  const mTotalSales     = monthlyAggs.reduce((s, a) => s + a.totalSales, 0);
  const mTotalCustomers = monthlyAggs.reduce((s, a) => s + a.totalCustomers, 0);
  const mTopPerformer   = monthlyAggs[0];
  const maxSales        = monthlyAggs[0]?.totalSales ?? 1;

  const yTotalSales     = yearlyAggs.reduce((s, a) => s + a.totalSales, 0);
  const yTotalCustomers = yearlyAggs.reduce((s, a) => s + a.totalCustomers, 0);
  const yTopPerformer   = yearlyAggs[0];
  const yMaxSales       = yearlyAggs[0]?.totalSales ?? 1;

  // ── Admin actions ─────────────────────────────────────────────────────────
  const handleApprove = async (reportId: string) => {
    await approveReport(reportId);
    await loadDailyReports();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}  edges={["top", "left", "right"]}>
      
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation?.openDrawer()} activeOpacity={0.7}>
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports Review</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Tab switcher */}
        <View style={repSt.tabBar}>
          {([
            { key:"daily",   label:"Daily",   icon:<Calendar size={13} color={tab==="daily" ? COLORS.white : COLORS.textMuted} /> },
            { key:"monthly", label:"Monthly", icon:<BarChart2 size={13} color={tab==="monthly" ? COLORS.white : COLORS.textMuted} /> },
            { key:"yearly",  label:"Yearly",  icon:<Award size={13} color={tab==="yearly" ? COLORS.white : COLORS.textMuted} /> },
          ] as const).map(t => (
            <TouchableOpacity key={t.key} style={[repSt.tabBtn, tab===t.key && repSt.tabBtnActive]}
              onPress={() => setTab(t.key)} activeOpacity={0.8}>
              {t.icon}
              <Text style={[repSt.tabBtnText, tab===t.key && repSt.tabBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar - smaller */}
        <View style={repSt.searchRow}>
          <View style={repSt.searchBox}>
            <Search size={12} color={COLORS.textMuted} />
            <TextInput 
              style={repSt.searchInput} 
              value={search} 
              onChangeText={setSearch}
              placeholder="Search employee..." 
              placeholderTextColor={COLORS.textMuted} 
            />
            {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={12} color={COLORS.textMuted}/></TouchableOpacity> : null}
          </View>
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
                  { val: `${submittedCount}/${filteredDaily.length}`, lbl: "Submitted", color: COLORS.success },
                ].map(k => (
                  <View key={k.lbl} style={repSt.kpiItem}>
                    <Text style={[repSt.kpiVal, { color: k.color }]}>{k.val}</Text>
                    <Text style={repSt.kpiLbl}>{k.lbl}</Text>
                  </View>
                ))}
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

        {/* ── YEARLY TAB ── */}
        {tab === "yearly" && (
          <>
            <TouchableOpacity style={repSt.monthSelector} onPress={() => setShowYearPicker(true)} activeOpacity={0.85}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                <Calendar size={18} color={COLORS.primary} />
                <View>
                  <Text style={repSt.monthSelectorLabel}>Year</Text>
                  <Text style={repSt.monthSelectorValue}>{yearlyYear}</Text>
                </View>
              </View>
              <ChevronDown size={18} color={COLORS.primary} />
            </TouchableOpacity>

            {!yearlyLoading && yearlyAggs.length > 0 && (
              <View style={repSt.kpiStrip}>
                {[
                  { val: yTotalSales,     lbl: "Total Sales",  color: COLORS.primary },
                  { val: yTotalCustomers, lbl: "Customers",    color: COLORS.accentBlue },
                  { val: yTopPerformer?.employee.firstName ?? "—", lbl: "Top Rep", color: COLORS.success },
                ].map(k => (
                  <View key={k.lbl} style={repSt.kpiItem}>
                    <Text style={[repSt.kpiVal, { color: k.color, fontSize: k.lbl === "Top Rep" ? 13 : 18 }]}>{k.val}</Text>
                    <Text style={repSt.kpiLbl}>{k.lbl}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={repSt.sectionRow}>
              <Text style={repSt.sectionTitle}>{yearlyYear} — All Employees</Text>
            </View>

            {yearlyLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : filteredYearly.length === 0 ? (
              <View style={repSt.emptyState}>
                <Text style={repSt.emptyText}>No reports for {yearlyYear}.</Text>
              </View>
            ) : (
              <View style={repSt.monthlyList}>
                {filteredYearly.map((agg, i) => (
                  <React.Fragment key={agg.employee.id}>
                    <YearlyRow agg={agg} rank={i + 1} maxSales={yMaxSales} onView={() => setViewYearly(agg)} />
                    {i < filteredYearly.length - 1 && <View style={repSt.rowDivider} />}
                  </React.Fragment>
                ))}
              </View>
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

      {/* Year picker */}
      <Modal visible={showYearPicker} transparent animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
        <TouchableOpacity style={repSt.modalOverlay} activeOpacity={1} onPress={() => setShowYearPicker(false)}>
          <View style={repSt.pickerSheet}>
            <View style={repSt.modalHandle} />
            <Text style={repSt.modalTitle}>Select Year</Text>
            <View style={repSt.yearRow}>
              {YEARS.map(y => (
                <TouchableOpacity key={y} style={[repSt.yearBtn, yearlyYear===y && repSt.yearBtnActive]}
                  onPress={() => { setYearlyYear(y); setShowYearPicker(false); }} activeOpacity={0.8}>
                  <Text style={[repSt.yearBtnText, yearlyYear===y && repSt.yearBtnTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Detail Modals */}
      <ReportDetailModal  report={viewDaily}   visible={!!viewDaily}   onClose={() => setViewDaily(null)} />
      <MonthlyDetailModal agg={viewMonthly}    visible={!!viewMonthly} onClose={() => setViewMonthly(null)} />
      <YearlyDetailModal  agg={viewYearly}     visible={!!viewYearly}  onClose={() => setViewYearly(null)} />
    </SafeAreaView>
  );
};

// ─── Shared screen styles (header + scroll) ───────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  placeholderBtn: {
    width: 42, height: 42,
  },
  headerTitle: {
    fontSize: 18, fontWeight: "800", color: COLORS.white,
    textAlign: "center", letterSpacing: 0.3,
  },
  scroll: {
    flex: 1, backgroundColor: COLORS.background,
    // borderTopLeftRadius: 24, borderTopRightRadius: 24,
     marginTop: -8,paddingBottom:8,
  },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16,paddingBottom:16, },
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
  searchRow: { marginBottom:12 },
  searchBox: {
    flexDirection:"row", alignItems:"center", gap:8,
    backgroundColor:COLORS.cardBg, borderRadius:12,
    paddingHorizontal:10, paddingVertical:6,
    borderWidth:1, borderColor:COLORS.border,
  },
  searchInput: { flex:1, fontSize:12, color:COLORS.textPrimary, paddingVertical:6 },
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
  dailyBody: { padding:14, gap:0 },
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

  // Empty
  emptyState: { alignItems:"center", paddingVertical:30 },
  emptyText: { fontSize:14, color:COLORS.textMuted, fontWeight:"600" },

  // Modal
  modalOverlay: { flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  pickerSheet: {
    backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28,
    padding:24, paddingBottom: Platform.OS==="ios" ? 58 : 58,
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


  // Card header (matching employee history)
cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 5 },
dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
cardDate: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
cardDay: { fontSize: 10, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 0.4 },
statusPill: {
  flexDirection: "row", alignItems: "center", gap: 3,
  paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
},
statusPillText: { fontSize: 9, fontWeight: "700" },

// Employee row
employeeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },

// KES row
kesRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
kesTotal: { fontSize: 20, fontWeight: "900", color: COLORS.primary },
kesBadge: { backgroundColor: COLORS.primaryMuted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
kesBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },

// Stats row (full width)
statsRow: {
  flexDirection: "row", alignItems: "center",
  backgroundColor: COLORS.background, borderRadius: 12,
  paddingVertical: 10, paddingHorizontal: 8, marginBottom: 8,
},
statItemFull: { flex: 1, alignItems: "center", gap: 3 },
statLabelFull: { fontSize: 10, fontWeight: "600", color: COLORS.textMuted, textTransform: "uppercase" },
statValueFull: { fontSize: 16, fontWeight: "800" },
statDividerFull: { width: 1, height: 30, backgroundColor: COLORS.border },

// Payment mini
paymentMini: {
  flexDirection: "row", alignItems: "center",
  backgroundColor: COLORS.background, borderRadius: 10,
  paddingVertical: 8, paddingHorizontal: 10, marginBottom: 8,
},
paymentMiniItem: { flex: 1, alignItems: "center" },
paymentMiniLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600", textTransform: "uppercase" },
paymentMiniVal: { fontSize: 12, fontWeight: "800", marginTop: 2 },
paymentMiniDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

// Products section
productsSection: { borderRadius: 10, backgroundColor: COLORS.background, padding: 10, marginBottom: 8 },
productsSectionHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
productsSectionTitle: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase" },
productLine: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
productLineName: { flex: 1, fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
productLineQty: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, width: 28, textAlign: "center" },
productLineAmt: { fontSize: 11, fontWeight: "800", color: COLORS.primary, width: 75, textAlign: "right" },

// Photo
photoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
photoThumb: { width: 52, height: 40, borderRadius: 8, backgroundColor: COLORS.border },
photoLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
photoLabelText: { fontSize: 11, color: COLORS.success, fontWeight: "600" },
photoBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" },
photoFullImage: { width: "90%", height: "70%" },
photoCloseBtn: { position: "absolute", top: 50, right: 20, padding: 10 },

// Notes & submitted
notesPreview: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "500", fontStyle: "italic", marginBottom: 6 },
submittedAt: { fontSize: 10, color: COLORS.textMuted, fontWeight: "500", marginBottom: 8 },
});

export default ReportsScreen;