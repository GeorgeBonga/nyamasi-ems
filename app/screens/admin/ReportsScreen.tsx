import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, Platform, Alert, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft, Download, ChevronDown, Calendar,
  TrendingUp, Users, Gift, Filter, Eye,
  FileText, BarChart2, ChevronRight, Search, X,
  Star, Award, AlertTriangle, CheckCircle,
  Menu,
} from "lucide-react-native";

const COLORS = {
  primary:"#8B0111", primaryDark:"#8B0111",
  primaryMuted:"rgba(139,1,17,0.08)", primaryLight:"rgba(139,1,17,0.15)",
  white:"#FFFFFF", background:"#F0F5FB", cardBg:"#FFFFFF",
  textPrimary:"#0D2137", textSecondary:"#4A6580", textMuted:"#8FA3B8",
  border:"#D6E4F0", success:"#00897B", successLight:"#E0F2F1",
  warning:"#F57C00", warningLight:"#FFF3E0",
  accentBlue:"#1565C0", accentBlueLight:"#E3F0FF",
  danger:"#C62828", dangerLight:"#FFEBEE",
  overlayBg:"rgba(13,33,55,0.6)",
};

type ReportTab   = "daily" | "monthly" | "summary";
type Month = "Jan"|"Feb"|"Mar"|"Apr"|"May"|"Jun"|"Jul"|"Aug"|"Sep"|"Oct"|"Nov"|"Dec";
const MONTHS: Month[] = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = ["2026","2025","2024"];

interface DailyReport {
  id:string; employeeId:string; employeeName:string; role:string; initials:string;
  date:string; shortDate:string; dayName:string;
  sales:number; customersReached:number; samplersGiven:number;
  notes:string; location:string; submitted:boolean; flagged:boolean;
}

interface MonthlyReport {
  employeeId:string; employeeName:string; role:string; initials:string;
  totalSales:number; totalCustomers:number; totalSamplers:number;
  daysReported:number; target:number; achievePct:number;
  trend:"up"|"down"|"flat"; avgSalesPerDay:number; bestDay:string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const DAILY_REPORTS: DailyReport[] = [
  { id:"d1",  employeeId:"1", employeeName:"Lydia Wanjiku",  role:"Team Lead",  initials:"LW", date:"Apr 12, 2026", shortDate:"Apr 12", dayName:"Sun", sales:22, customersReached:138, samplersGiven:72,  notes:"Strong day at Upperhill. Key decision makers met.", location:"Upperhill",  submitted:true,  flagged:false },
  { id:"d2",  employeeId:"2", employeeName:"Amina Hassan",   role:"Senior Rep", initials:"AH", date:"Apr 12, 2026", shortDate:"Apr 12", dayName:"Sun", sales:18, customersReached:112, samplersGiven:58,  notes:"Kilimani area performing well this quarter.",      location:"Kilimani",   submitted:true,  flagged:false },
  { id:"d3",  employeeId:"3", employeeName:"Grace Akinyi",   role:"Field Rep",  initials:"GA", date:"Apr 12, 2026", shortDate:"Apr 12", dayName:"Sun", sales:14, customersReached:89,  samplersGiven:45,  notes:"Slow start but improved afternoon.",               location:"Ngong Rd",   submitted:true,  flagged:false },
  { id:"d4",  employeeId:"4", employeeName:"Brian Ochieng",  role:"Field Rep",  initials:"BO", date:"Apr 12, 2026", shortDate:"Apr 12", dayName:"Sun", sales:20, customersReached:121, samplersGiven:63,  notes:"Good penetration around CBD market.",              location:"CBD",        submitted:true,  flagged:false },
  { id:"d5",  employeeId:"5", employeeName:"Samuel Ndung'u", role:"Senior Rep", initials:"SN", date:"Apr 12, 2026", shortDate:"Apr 12", dayName:"Sun", sales:16, customersReached:98,  samplersGiven:51,  notes:"",                                                 location:"Ruiru",      submitted:true,  flagged:false },
  { id:"d6",  employeeId:"6", employeeName:"Jane Mwangi",    role:"Field Rep",  initials:"JM", date:"Apr 12, 2026", shortDate:"Apr 12", dayName:"Sun", sales:12, customersReached:78,  samplersGiven:40,  notes:"",                                                 location:"Westlands",  submitted:true,  flagged:false },
  { id:"d7",  employeeId:"7", employeeName:"Peter Karanja",  role:"Field Rep",  initials:"PK", date:"Apr 12, 2026", shortDate:"Apr 12", dayName:"Sun", sales:8,  customersReached:51,  samplersGiven:28,  notes:"Difficult day. Customer resistance high.",          location:"Kasarani",   submitted:true,  flagged:true  },
  { id:"d8",  employeeId:"8", employeeName:"David Mutua",    role:"Field Rep",  initials:"DM", date:"Apr 12, 2026", shortDate:"Apr 12", dayName:"Sun", sales:5,  customersReached:33,  samplersGiven:18,  notes:"Late start.",                                      location:"Embakasi",   submitted:true,  flagged:true  },
  { id:"d9",  employeeId:"1", employeeName:"Lydia Wanjiku",  role:"Team Lead",  initials:"LW", date:"Apr 11, 2026", shortDate:"Apr 11", dayName:"Sat", sales:28, customersReached:165, samplersGiven:88,  notes:"Excellent performance. Closed major account.",     location:"Upperhill",  submitted:true,  flagged:false },
  { id:"d10", employeeId:"2", employeeName:"Amina Hassan",   role:"Senior Rep", initials:"AH", date:"Apr 11, 2026", shortDate:"Apr 11", dayName:"Sat", sales:21, customersReached:130, samplersGiven:67,  notes:"Good coverage of Kilimani and surroundings.",      location:"Kilimani",   submitted:true,  flagged:false },
  { id:"d11", employeeId:"9", employeeName:"Faith Adhiambo", role:"Supervisor", initials:"FA", date:"Apr 11, 2026", shortDate:"Apr 11", dayName:"Sat", sales:30, customersReached:180, samplersGiven:95,  notes:"Team briefing completed. Targets reviewed.",       location:"Gigiri",     submitted:true,  flagged:false },
  { id:"d12", employeeId:"3", employeeName:"Grace Akinyi",   role:"Field Rep",  initials:"GA", date:"Apr 11, 2026", shortDate:"Apr 11", dayName:"Sat", sales:17, customersReached:105, samplersGiven:54,  notes:"",                                                 location:"Ngong Rd",   submitted:true,  flagged:false },
  { id:"d13", employeeId:"5", employeeName:"Samuel Ndung'u", role:"Senior Rep", initials:"SN", date:"Apr 10, 2026", shortDate:"Apr 10", dayName:"Fri", sales:19, customersReached:118, samplersGiven:61,  notes:"",                                                 location:"Ruiru",      submitted:false, flagged:false },
  { id:"d14", employeeId:"6", employeeName:"Jane Mwangi",    role:"Field Rep",  initials:"JM", date:"Apr 10, 2026", shortDate:"Apr 10", dayName:"Fri", sales:15, customersReached:93,  samplersGiven:48,  notes:"",                                                 location:"Westlands",  submitted:false, flagged:false },
];

const MONTHLY_SUMMARY: MonthlyReport[] = [
  { employeeId:"9", employeeName:"Faith Adhiambo", role:"Supervisor", initials:"FA", totalSales:285, totalCustomers:1650, totalSamplers:880, daysReported:22, target:260, achievePct:109, trend:"up",   avgSalesPerDay:13.0, bestDay:"Apr 11" },
  { employeeId:"5", employeeName:"Lydia Wanjiku",  role:"Team Lead",  initials:"LW", totalSales:310, totalCustomers:1850, totalSamplers:980, daysReported:22, target:280, achievePct:110, trend:"up",   avgSalesPerDay:14.1, bestDay:"Apr 11" },
  { employeeId:"2", employeeName:"Amina Hassan",   role:"Senior Rep", initials:"AH", totalSales:231, totalCustomers:1380, totalSamplers:750, daysReported:20, target:200, achievePct:115, trend:"up",   avgSalesPerDay:11.5, bestDay:"Apr 8"  },
  { employeeId:"7", employeeName:"Samuel Ndung'u", role:"Senior Rep", initials:"SN", totalSales:188, totalCustomers:1100, totalSamplers:600, daysReported:19, target:180, achievePct:104, trend:"flat", avgSalesPerDay:9.9,  bestDay:"Apr 7"  },
  { employeeId:"6", employeeName:"Grace Akinyi",   role:"Field Rep",  initials:"GA", totalSales:164, totalCustomers:960,  totalSamplers:510, daysReported:21, target:160, achievePct:102, trend:"up",   avgSalesPerDay:7.8,  bestDay:"Apr 9"  },
  { employeeId:"3", employeeName:"Brian Ochieng",  role:"Field Rep",  initials:"BO", totalSales:118, totalCustomers:690,  totalSamplers:370, daysReported:18, target:120, achievePct:98,  trend:"flat", avgSalesPerDay:6.6,  bestDay:"Apr 6"  },
  { employeeId:"1", employeeName:"Jane Mwangi",    role:"Field Rep",  initials:"JM", totalSales:142, totalCustomers:820,  totalSamplers:440, daysReported:22, target:150, achievePct:94,  trend:"up",   avgSalesPerDay:6.5,  bestDay:"Apr 5"  },
  { employeeId:"4", employeeName:"Peter Karanja",  role:"Field Rep",  initials:"PK", totalSales:96,  totalCustomers:540,  totalSamplers:280, daysReported:20, target:100, achievePct:96,  trend:"down", avgSalesPerDay:4.8,  bestDay:"Apr 3"  },
  { employeeId:"8", employeeName:"David Mutua",    role:"Field Rep",  initials:"DM", totalSales:62,  totalCustomers:380,  totalSamplers:190, daysReported:14, target:80,  achievePct:77,  trend:"down", avgSalesPerDay:4.4,  bestDay:"Apr 2"  },
];

// ─── Mini Trend Bar ───────────────────────────────────────────────────────────
const TrendBar: React.FC<{ value:number; max:number; color:string }> = ({ value, max, color }) => (
  <View style={{ height:4, backgroundColor:COLORS.border, borderRadius:2, overflow:"hidden", flex:1 }}>
    <View style={{ height:4, width:`${Math.min(100,(value/max)*100)}%` as any, backgroundColor:color, borderRadius:2 }} />
  </View>
);

// ─── Daily Report Card ────────────────────────────────────────────────────────
const DailyCard: React.FC<{ report:DailyReport; onView:()=>void }> = ({ report, onView }) => (
  <View style={repSt.dailyCard}>
    <View style={repSt.dailyBody}>
      <View style={repSt.dailyTop}>
        <View style={[repSt.initials, { backgroundColor: report.flagged ? COLORS.dangerLight : COLORS.primaryMuted }]}>
          <Text style={[repSt.initialsText, { color: report.flagged ? COLORS.danger : COLORS.primary }]}>{report.initials}</Text>
        </View>
        <View style={{ flex:1 }}>
          <View style={repSt.nameRow}>
            <Text style={repSt.empName}>{report.employeeName}</Text>
            {report.flagged && (
              <View style={repSt.flagBadge}>
                <AlertTriangle size={10} color={COLORS.danger} />
                <Text style={repSt.flagText}>Low</Text>
              </View>
            )}
            {!report.submitted && (
              <View style={[repSt.flagBadge, { backgroundColor:COLORS.warningLight }]}>
                <Clock size={10} color={COLORS.warning} />
                <Text style={[repSt.flagText, { color:COLORS.warning }]}>Pending</Text>
              </View>
            )}
          </View>
          <Text style={repSt.empRole}>{report.role} · {report.location}</Text>
        </View>
        <View style={repSt.dateBox}>
          <Text style={repSt.dateDayName}>{report.dayName}</Text>
          <Text style={repSt.dateShort}>{report.shortDate}</Text>
        </View>
      </View>

      <View style={repSt.statsStrip}>
        <View style={repSt.statItem}>
          <TrendingUp size={12} color={COLORS.primary} />
          <Text style={repSt.statLbl}>Sales</Text>
          <Text style={[repSt.statVal, { color:COLORS.primary }]}>{report.sales}</Text>
        </View>
        <View style={repSt.statDivider} />
        <View style={repSt.statItem}>
          <Users size={12} color={COLORS.accentBlue} />
          <Text style={repSt.statLbl}>Reached</Text>
          <Text style={[repSt.statVal, { color:COLORS.accentBlue }]}>{report.customersReached}</Text>
        </View>
        <View style={repSt.statDivider} />
        <View style={repSt.statItem}>
          <Gift size={12} color={COLORS.success} />
          <Text style={repSt.statLbl}>Samplers</Text>
          <Text style={[repSt.statVal, { color:COLORS.success }]}>{report.samplersGiven}</Text>
        </View>
      </View>

      {report.notes ? (
        <Text style={repSt.noteText} numberOfLines={2}>📝 {report.notes}</Text>
      ) : null}

      <TouchableOpacity style={repSt.viewRowBtn} onPress={onView} activeOpacity={0.8}>
        <Eye size={13} color={COLORS.accentBlue} />
        <Text style={repSt.viewRowBtnText}>View Full Report</Text>
        <ChevronRight size={13} color={COLORS.accentBlue} />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Monthly Row ──────────────────────────────────────────────────────────────
const MonthlyRow: React.FC<{ rep:MonthlyReport; rank:number; onView:()=>void }> = ({ rep, rank, onView }) => {
  const maxSales = Math.max(...MONTHLY_SUMMARY.map(r=>r.totalSales));
  return (
    <View style={repSt.monthlyRow}>
      <Text style={repSt.rank}>#{rank}</Text>
      <View style={[repSt.initials, { width:38, height:38, borderRadius:19,
        backgroundColor: rep.achievePct>=100 ? COLORS.successLight : COLORS.primaryMuted }]}>
        <Text style={[repSt.initialsText, {
          color: rep.achievePct>=100 ? COLORS.success : COLORS.primary
        }]}>{rep.initials}</Text>
      </View>
      <View style={{ flex:1, gap:4 }}>
        <View style={repSt.monthlyNameRow}>
          <Text style={repSt.empName}>{rep.employeeName}</Text>
          <View style={[repSt.trendChip, {
            backgroundColor: rep.trend==="up" ? COLORS.successLight : rep.trend==="down" ? COLORS.dangerLight : COLORS.warningLight
          }]}>
            <Text style={[repSt.trendChipText, {
              color: rep.trend==="up" ? COLORS.success : rep.trend==="down" ? COLORS.danger : COLORS.warning
            }]}>
              {rep.trend==="up" ? "↑" : rep.trend==="down" ? "↓" : "→"} {rep.achievePct}%
            </Text>
          </View>
        </View>
        <View style={repSt.progressRow}>
          <TrendBar value={rep.totalSales} max={maxSales} color={rep.achievePct>=100 ? COLORS.success : COLORS.primary} />
          <Text style={repSt.progressLabel}>{rep.totalSales}/{rep.target}</Text>
        </View>
        <Text style={repSt.monthlyMeta}>{rep.daysReported}d · Avg {rep.avgSalesPerDay}/day · Best: {rep.bestDay}</Text>
      </View>
      <TouchableOpacity onPress={onView} style={repSt.eyeBtn} activeOpacity={0.8}>
        <Eye size={15} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Report Detail Modal ──────────────────────────────────────────────────────
const ReportDetailModal: React.FC<{
  report:DailyReport|null; visible:boolean; onClose:()=>void;
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
              <Text style={repSt.detailSub}>{report.employeeName} · {report.date}</Text>
            </View>
            <TouchableOpacity style={repSt.closeBtn} onPress={onClose}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={repSt.detailStatsGrid}>
              {[
                { label:"Sales Made",       val:report.sales,             color:COLORS.primary,    icon:<TrendingUp size={16} color={COLORS.primary}/> },
                { label:"Customers Reached",val:report.customersReached,  color:COLORS.accentBlue, icon:<Users size={16} color={COLORS.accentBlue}/> },
                { label:"Samplers Given",   val:report.samplersGiven,     color:COLORS.success,    icon:<Gift size={16} color={COLORS.success}/> },
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
                { label:"Location", val:report.location },
                { label:"Day",      val:`${report.dayName}, ${report.date}` },
                { label:"Submission", val: report.submitted ? "Submitted ✓" : "Pending ⏳" },
                { label:"Status",   val: report.flagged ? "⚠️ Flagged for review" : "✅ Normal" },
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
            <View style={{ height:20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Monthly Detail Modal ─────────────────────────────────────────────────────
const MonthlyDetailModal: React.FC<{
  rep:MonthlyReport|null; visible:boolean; onClose:()=>void; month:Month; year:string;
}> = ({ rep, visible, onClose, month, year }) => {
  if (!rep) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={repSt.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={repSt.detailSheet}>
          <View style={repSt.modalHandle} />
          <View style={repSt.detailHeader}>
            <View>
              <Text style={repSt.detailTitle}>{month} {year} Report</Text>
              <Text style={repSt.detailSub}>{rep.employeeName} · {rep.role}</Text>
            </View>
            <TouchableOpacity style={repSt.closeBtn} onPress={onClose}><X size={18} color={COLORS.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={repSt.detailStatsGrid}>
              {[
                { label:"Total Sales",     val:rep.totalSales,     color:COLORS.primary,    icon:<TrendingUp size={16} color={COLORS.primary}/> },
                { label:"Customers",       val:rep.totalCustomers, color:COLORS.accentBlue, icon:<Users size={16} color={COLORS.accentBlue}/> },
                { label:"Samplers",        val:rep.totalSamplers,  color:COLORS.success,    icon:<Gift size={16} color={COLORS.success}/> },
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
                { label:"Days Reported",    val:`${rep.daysReported} / 22` },
                { label:"Sales Target",     val:`${rep.totalSales} / ${rep.target} (${rep.achievePct}%)` },
                { label:"Avg Sales/Day",    val:`${rep.avgSalesPerDay}` },
                { label:"Best Day",         val:rep.bestDay },
                { label:"Performance",      val: rep.trend==="up" ? "↑ Improving" : rep.trend==="down" ? "↓ Declining" : "→ Stable" },
              ].map((r,i) => (
                <View key={i} style={[repSt.detailInfoRow, i>0 && { borderTopWidth:1, borderTopColor:COLORS.border }]}>
                  <Text style={repSt.detailInfoLabel}>{r.label}</Text>
                  <Text style={repSt.detailInfoVal}>{r.val}</Text>
                </View>
              ))}
            </View>

            <View style={repSt.exportRow}>
              <TouchableOpacity style={repSt.exportBtn}
                onPress={()=>Alert.alert("Export","Monthly report PDF exported.")} activeOpacity={0.85}>
                <Download size={14} color={COLORS.white} />
                <Text style={repSt.exportBtnText}>Export Monthly PDF</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height:20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// tiny Clock icon shim (not in lucide-react-native older versions)
const Clock: React.FC<{ size:number; color:string }> = ({ size, color }) => (
  <View style={{ width:size, height:size, borderRadius:size/2, borderWidth:1.5, borderColor:color, alignItems:"center", justifyContent:"center" }}>
    <View style={{ width:1.5, height:size*0.28, backgroundColor:color, position:"absolute", bottom:"50%", right:"48%" }} />
    <View style={{ width:size*0.28, height:1.5, backgroundColor:color, position:"absolute", left:"50%", top:"50%" }} />
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface ReportsScreenProps { navigation?:any }

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [tab,           setTab]           = useState<ReportTab>("daily");
  const [month,         setMonth]         = useState<Month>("Apr");
  const [year,          setYear]          = useState("2026");
  const [search,        setSearch]        = useState("");
  const [showPicker,    setShowPicker]    = useState(false);
  const [viewDaily,     setViewDaily]     = useState<DailyReport|null>(null);
  const [viewMonthly,   setViewMonthly]   = useState<MonthlyReport|null>(null);
  const [filterDate,    setFilterDate]    = useState("Apr 12, 2026");
  const [flaggedOnly,   setFlaggedOnly]   = useState(false);
  const [showDateFilter,setShowDateFilter]= useState(false);

  const DATES = [...new Set(DAILY_REPORTS.map(r=>r.date))];

  const filteredDaily = DAILY_REPORTS.filter(r => {
    if (r.date !== filterDate) return false;
    if (search && !r.employeeName.toLowerCase().includes(search.toLowerCase())) return false;
    if (flaggedOnly && !r.flagged) return false;
    return true;
  });

  const filteredMonthly = MONTHLY_SUMMARY.filter(r =>
    !search || r.employeeName.toLowerCase().includes(search.toLowerCase())
  );

  const totalSales     = filteredDaily.reduce((s,r)=>s+r.sales,0);
  const totalCustomers = filteredDaily.reduce((s,r)=>s+r.customersReached,0);
  const totalSamplers  = filteredDaily.reduce((s,r)=>s+r.samplersGiven,0);
  const submitted      = filteredDaily.filter(r=>r.submitted).length;
  const flaggedCount   = filteredDaily.filter(r=>r.flagged).length;

  const mTotalSales     = MONTHLY_SUMMARY.reduce((s,r)=>s+r.totalSales,0);
  const mTotalCustomers = MONTHLY_SUMMARY.reduce((s,r)=>s+r.totalCustomers,0);
  const mTopPerformer   = [...MONTHLY_SUMMARY].sort((a,b)=>b.totalSales-a.totalSales)[0];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation?.openDrawer()}
          activeOpacity={0.7}
        >
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports Review</Text>
        <TouchableOpacity style={styles.addBtn}
          onPress={()=>Alert.alert("Export","Full report PDF exported for "+month+" "+year)} activeOpacity={0.8}>
          <Download size={19} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Tab switcher */}
        <View style={repSt.tabBar}>
          {([
            { key:"daily",   label:"Daily",   icon:<Calendar size={13} color={tab==="daily" ? COLORS.white : COLORS.textMuted} /> },
            { key:"monthly", label:"Monthly", icon:<BarChart2 size={13} color={tab==="monthly" ? COLORS.white : COLORS.textMuted} /> },
            { key:"summary", label:"Summary", icon:<Award size={13} color={tab==="summary" ? COLORS.white : COLORS.textMuted} /> },
          ] as const).map(t => (
            <TouchableOpacity key={t.key} style={[repSt.tabBtn, tab===t.key && repSt.tabBtnActive]}
              onPress={()=>setTab(t.key)} activeOpacity={0.8}>
              {t.icon}
              <Text style={[repSt.tabBtnText, tab===t.key && repSt.tabBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={repSt.searchRow}>
          <View style={repSt.searchBox}>
            <Search size={14} color={COLORS.textMuted} />
            <TextInput style={repSt.searchInput} value={search} onChangeText={setSearch}
              placeholder="Search employee..." placeholderTextColor={COLORS.textMuted} />
            {search ? <TouchableOpacity onPress={()=>setSearch("")}><X size={13} color={COLORS.textMuted}/></TouchableOpacity> : null}
          </View>
          {tab==="daily" && (
            <TouchableOpacity style={repSt.filterPillBtn}
              onPress={()=>setFlaggedOnly(!flaggedOnly)} activeOpacity={0.8}>
              <AlertTriangle size={13} color={flaggedOnly ? COLORS.white : COLORS.danger} />
              <Text style={[repSt.filterPillBtnText, { color: flaggedOnly ? COLORS.white : COLORS.danger }]}>Flagged</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── DAILY TAB ── */}
        {tab === "daily" && (
          <>
            {/* Date filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={repSt.dateScroll}
              contentContainerStyle={repSt.dateScrollContent}>
              {DATES.map(d => (
                <TouchableOpacity key={d} style={[repSt.dateChip, filterDate===d && repSt.dateChipActive]}
                  onPress={()=>setFilterDate(d)} activeOpacity={0.8}>
                  <Text style={[repSt.dateChipText, filterDate===d && repSt.dateChipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Daily KPI strip */}
            <View style={repSt.kpiStrip}>
              {[
                { val:totalSales,     lbl:"Sales",    color:COLORS.primary },
                { val:totalCustomers, lbl:"Reached",  color:COLORS.accentBlue },
                { val:totalSamplers,  lbl:"Samplers", color:COLORS.success },
                { val:`${submitted}/${filteredDaily.length}`, lbl:"Submitted", color:flaggedCount>0 ? COLORS.warning : COLORS.success },
              ].map(k => (
                <View key={k.lbl} style={repSt.kpiItem}>
                  <Text style={[repSt.kpiVal, { color:k.color }]}>{k.val}</Text>
                  <Text style={repSt.kpiLbl}>{k.lbl}</Text>
                </View>
              ))}
            </View>

            {flaggedCount > 0 && (
              <View style={repSt.flagAlert}>
                <AlertTriangle size={14} color={COLORS.danger} />
                <Text style={repSt.flagAlertText}>{flaggedCount} report{flaggedCount>1?"s":""} flagged for low performance</Text>
              </View>
            )}

            <View style={repSt.sectionRow}>
              <Text style={repSt.sectionTitle}>Reports · {filterDate}</Text>
              <Text style={repSt.sectionCount}>{filteredDaily.length} reports</Text>
            </View>

            {filteredDaily.map((r,i) => (
              <React.Fragment key={r.id}>
                <DailyCard report={r} onView={()=>setViewDaily(r)} />
                {i < filteredDaily.length-1 && <View style={{ height:10 }} />}
              </React.Fragment>
            ))}
          </>
        )}

        {/* ── MONTHLY TAB ── */}
        {tab === "monthly" && (
          <>
            <TouchableOpacity style={repSt.monthSelector} onPress={()=>setShowPicker(true)} activeOpacity={0.85}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                <Calendar size={18} color={COLORS.primary} />
                <View>
                  <Text style={repSt.monthSelectorLabel}>Period</Text>
                  <Text style={repSt.monthSelectorValue}>{month} {year}</Text>
                </View>
              </View>
              <ChevronDown size={18} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Monthly KPI */}
            <View style={repSt.kpiStrip}>
              {[
                { val:mTotalSales,     lbl:"Total Sales",  color:COLORS.primary },
                { val:mTotalCustomers, lbl:"Customers",    color:COLORS.accentBlue },
                { val:mTopPerformer.employeeName.split(" ")[0], lbl:"Top Rep", color:COLORS.success },
              ].map(k => (
                <View key={k.lbl} style={repSt.kpiItem}>
                  <Text style={[repSt.kpiVal, { color:k.color, fontSize:k.lbl==="Top Rep"?13:18 }]}>{k.val}</Text>
                  <Text style={repSt.kpiLbl}>{k.lbl}</Text>
                </View>
              ))}
            </View>

            <View style={repSt.sectionRow}>
              <Text style={repSt.sectionTitle}>{month} {year} — All Employees</Text>
              <TouchableOpacity style={repSt.exportSmallBtn}
                onPress={()=>Alert.alert("Export","Monthly PDF exported.")} activeOpacity={0.85}>
                <Download size={12} color={COLORS.white} />
                <Text style={repSt.exportSmallText}>PDF</Text>
              </TouchableOpacity>
            </View>

            <View style={repSt.monthlyList}>
              {filteredMonthly.map((r,i) => (
                <React.Fragment key={r.employeeId}>
                  <MonthlyRow rep={r} rank={i+1} onView={()=>setViewMonthly(r)} />
                  {i < filteredMonthly.length-1 && <View style={repSt.rowDivider} />}
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* ── SUMMARY TAB ── */}
        {tab === "summary" && (
          <>
            <View style={repSt.summaryHero}>
              <Text style={repSt.summaryHeroLabel}>Period Performance</Text>
              <Text style={repSt.summaryHeroValue}>Apr 2026</Text>
            </View>

            {/* Top 3 performers */}
            <Text style={repSt.summarySection}>🏆 Top Performers</Text>
            {[...MONTHLY_SUMMARY].sort((a,b)=>b.totalSales-a.totalSales).slice(0,3).map((r,i) => (
              <View key={r.employeeId} style={[repSt.topCard, { borderLeftColor: i===0?COLORS.warning : i===1?"#9E9E9E" : "#CD7F32" }]}>
                <Text style={[repSt.topRank, { color: i===0?COLORS.warning : i===1?"#9E9E9E" : "#CD7F32" }]}>
                  {i===0?"🥇":i===1?"🥈":"🥉"}
                </Text>
                <View style={[repSt.initials, { width:40, height:40, borderRadius:20, backgroundColor:COLORS.primaryMuted }]}>
                  <Text style={[repSt.initialsText, { color:COLORS.primary }]}>{r.initials}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={repSt.empName}>{r.employeeName}</Text>
                  <Text style={repSt.empRole}>{r.role}</Text>
                </View>
                <View style={{ alignItems:"flex-end" }}>
                  <Text style={[repSt.topSales, { color:COLORS.primary }]}>{r.totalSales}</Text>
                  <Text style={repSt.topSalesLbl}>sales</Text>
                </View>
              </View>
            ))}

            {/* Needs attention */}
            <Text style={repSt.summarySection}>⚠️ Needs Attention</Text>
            {[...MONTHLY_SUMMARY].filter(r=>r.achievePct<90).map(r => (
              <View key={r.employeeId} style={[repSt.topCard, { borderLeftColor:COLORS.danger }]}>
                <View style={[repSt.initials, { width:40, height:40, borderRadius:20, backgroundColor:COLORS.dangerLight }]}>
                  <Text style={[repSt.initialsText, { color:COLORS.danger }]}>{r.initials}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={repSt.empName}>{r.employeeName}</Text>
                  <Text style={repSt.empRole}>{r.role}</Text>
                </View>
                <View style={{ alignItems:"flex-end" }}>
                  <Text style={[repSt.topSales, { color:COLORS.danger }]}>{r.achievePct}%</Text>
                  <Text style={repSt.topSalesLbl}>of target</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={repSt.fullExportBtn}
              onPress={()=>Alert.alert("Export","Full summary report PDF exported.")} activeOpacity={0.85}>
              <Download size={15} color={COLORS.white} />
              <Text style={repSt.fullExportBtnText}>Export Full Summary PDF</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height:40 }} />
      </ScrollView>

      {/* Month picker */}
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={()=>setShowPicker(false)}>
        <TouchableOpacity style={repSt.modalOverlay} activeOpacity={1} onPress={()=>setShowPicker(false)}>
          <View style={repSt.pickerSheet}>
            <View style={repSt.modalHandle} />
            <Text style={repSt.modalTitle}>Select Period</Text>
            <View style={repSt.yearRow}>
              {YEARS.map(y => (
                <TouchableOpacity key={y} style={[repSt.yearBtn, year===y && repSt.yearBtnActive]}
                  onPress={()=>setYear(y)} activeOpacity={0.8}>
                  <Text style={[repSt.yearBtnText, year===y && repSt.yearBtnTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={repSt.monthGrid}>
              {MONTHS.map(m => (
                <TouchableOpacity key={m} style={[repSt.monthBtn, month===m && repSt.monthBtnActive]}
                  onPress={()=>{ setMonth(m); setShowPicker(false); }} activeOpacity={0.8}>
                  <Text style={[repSt.monthBtnText, month===m && repSt.monthBtnTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ReportDetailModal  report={viewDaily}   visible={!!viewDaily}   onClose={()=>setViewDaily(null)} />
      <MonthlyDetailModal rep={viewMonthly}    visible={!!viewMonthly} onClose={()=>setViewMonthly(null)} month={month} year={year} />
    </SafeAreaView>
  );
};

const repSt = StyleSheet.create({
  tabBar:{ flexDirection:"row", backgroundColor:COLORS.cardBg, borderRadius:16, padding:4,
           marginBottom:14, shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2 },
  tabBtn:{ flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
           paddingVertical:9, borderRadius:12 },
  tabBtnActive:{ backgroundColor:COLORS.primary },
  tabBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.textMuted },
  tabBtnTextActive:{ color:COLORS.white },

  searchRow:{ flexDirection:"row", gap:8, marginBottom:12 },
  searchBox:{ flex:1, flexDirection:"row", alignItems:"center", backgroundColor:COLORS.cardBg,
              borderRadius:14, paddingHorizontal:12, paddingVertical:10, gap:8,
              borderWidth:1, borderColor:COLORS.border },
  searchInput:{ flex:1, fontSize:13, color:COLORS.textPrimary, fontWeight:"600", padding:0 },
  filterPillBtn:{ flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:12, paddingVertical:10,
                  borderRadius:14, backgroundColor:COLORS.dangerLight,
                  borderWidth:1, borderColor:"rgba(198,40,40,0.2)" },
  filterPillBtnText:{ fontSize:12, fontWeight:"700" },

  dateScroll:{ marginBottom:12, marginHorizontal:-18 },
  dateScrollContent:{ paddingHorizontal:18, gap:8 },
  dateChip:{ paddingHorizontal:14, paddingVertical:7, borderRadius:20,
             backgroundColor:COLORS.background, borderWidth:1, borderColor:COLORS.border },
  dateChipActive:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  dateChipText:{ fontSize:12, fontWeight:"700", color:COLORS.textMuted },
  dateChipTextActive:{ color:COLORS.white },

  kpiStrip:{ flexDirection:"row", backgroundColor:COLORS.cardBg, borderRadius:16,
             paddingVertical:12, paddingHorizontal:8, marginBottom:12,
             shadowColor:COLORS.textPrimary, shadowOpacity:0.04, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2 },
  kpiItem: { flex:1, alignItems:"center" },
  kpiVal:  { fontSize:18, fontWeight:"900", letterSpacing:-0.5 },
  kpiLbl:  { fontSize:9, fontWeight:"600", color:COLORS.textMuted, marginTop:2, textTransform:"uppercase", letterSpacing:0.4 },

  flagAlert:{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:COLORS.dangerLight,
              borderRadius:12, padding:12, marginBottom:12, borderWidth:1, borderColor:"rgba(198,40,40,0.2)" },
  flagAlertText:{ fontSize:12, fontWeight:"700", color:COLORS.danger, flex:1 },

  sectionRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  sectionTitle:{ fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  sectionCount:{ fontSize:12, color:COLORS.textMuted, fontWeight:"600" },

  dailyCard:{ backgroundColor:COLORS.cardBg, borderRadius:18, flexDirection:"row", overflow:"hidden",
              shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  dailyBody:{ flex:1, padding:14, gap:10 },
  dailyTop:{ flexDirection:"row", alignItems:"flex-start", gap:10 },
  initials:{ width:40, height:40, alignItems:"center", justifyContent:"center" },
  initialsText:{ fontSize:13, fontWeight:"800" },
  nameRow:{ flexDirection:"row", alignItems:"center", gap:6, flexWrap:"wrap" },
  empName:{ fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  empRole:{ fontSize:11, color:COLORS.textMuted, fontWeight:"500", marginTop:1 },
  flagBadge:{ flexDirection:"row", alignItems:"center", gap:3, backgroundColor:COLORS.dangerLight,
              borderRadius:10, paddingHorizontal:6, paddingVertical:2 },
  flagText:{ fontSize:9, fontWeight:"700", color:COLORS.danger },
  dateBox:{ alignItems:"flex-end" },
  dateDayName:{ fontSize:10, color:COLORS.textMuted, fontWeight:"600", textTransform:"uppercase" },
  dateShort:{ fontSize:12, fontWeight:"800", color:COLORS.primary, marginTop:1 },

  statsStrip:{ flexDirection:"row", backgroundColor:COLORS.background, borderRadius:12, paddingVertical:8 },
  statItem:{ flex:1, alignItems:"center", gap:3 },
  statDivider:{ width:1, backgroundColor:COLORS.border },
  statLbl:{ fontSize:9, color:COLORS.textMuted, fontWeight:"600", textTransform:"uppercase" },
  statVal:{ fontSize:15, fontWeight:"900" },

  noteText:{ fontSize:12, color:COLORS.textSecondary, fontWeight:"500", lineHeight:16 },
  viewRowBtn:{ flexDirection:"row", alignItems:"center", gap:5 },
  viewRowBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.accentBlue, flex:1 },

  monthlyList:{ backgroundColor:COLORS.cardBg, borderRadius:18, overflow:"hidden",
                shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  monthlyRow:{ flexDirection:"row", alignItems:"center", paddingVertical:12, paddingHorizontal:14, gap:8 },
  rowDivider:{ height:1, backgroundColor:COLORS.border, marginLeft:60 },
  rank:{ fontSize:11, fontWeight:"700", color:COLORS.textMuted, width:20 },
  monthlyNameRow:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  progressRow:{ flexDirection:"row", alignItems:"center", gap:8 },
  progressLabel:{ fontSize:10, color:COLORS.textMuted, fontWeight:"600", width:52 },
  monthlyMeta:{ fontSize:10, color:COLORS.textMuted, fontWeight:"500" },
  trendChip:{ paddingHorizontal:7, paddingVertical:2, borderRadius:20 },
  trendChipText:{ fontSize:10, fontWeight:"800" },
  eyeBtn:{ width:30, height:30, borderRadius:10, backgroundColor:COLORS.background, alignItems:"center", justifyContent:"center" },

  monthSelector:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center",
                  backgroundColor:COLORS.cardBg, borderRadius:18, padding:16, marginBottom:14,
                  borderWidth:1.5, borderColor:COLORS.primaryLight,
                  shadowColor:COLORS.primary, shadowOpacity:0.08, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  monthSelectorLabel:{ fontSize:11, color:COLORS.textMuted, fontWeight:"600" },
  monthSelectorValue:{ fontSize:18, fontWeight:"900", color:COLORS.primary },

  exportSmallBtn:{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:COLORS.primary,
                   paddingHorizontal:10, paddingVertical:6, borderRadius:20 },
  exportSmallText:{ fontSize:11, fontWeight:"800", color:COLORS.white },

  summaryHero:{ backgroundColor:COLORS.primary, borderRadius:18, padding:18, marginBottom:14, alignItems:"center" },
  summaryHeroLabel:{ fontSize:12, color:"rgba(255,255,255,0.7)", fontWeight:"600" },
  summaryHeroValue:{ fontSize:24, fontWeight:"900", color:COLORS.white, letterSpacing:-0.5, marginTop:4 },
  summarySection:{ fontSize:14, fontWeight:"800", color:COLORS.textPrimary, marginBottom:10, marginTop:4 },
  topCard:{ backgroundColor:COLORS.cardBg, borderRadius:14, padding:14, flexDirection:"row",
            alignItems:"center", gap:10, marginBottom:8, borderLeftWidth:4,
            shadowColor:COLORS.textPrimary, shadowOpacity:0.04, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2 },
  topRank:{ fontSize:20 },
  topSales:{ fontSize:18, fontWeight:"900" },
  topSalesLbl:{ fontSize:9, color:COLORS.textMuted, fontWeight:"600", textTransform:"uppercase" },
  fullExportBtn:{ flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8,
                  backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:15, marginTop:8,
                  shadowColor:COLORS.primary, shadowOpacity:0.35, shadowRadius:10, shadowOffset:{width:0,height:4}, elevation:6 },
  fullExportBtnText:{ fontSize:14, fontWeight:"800", color:COLORS.white, letterSpacing:0.3 },

  modalOverlay:{ flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  detailSheet:{ backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28,
                padding:22, maxHeight:"90%" },
  modalHandle:{ width:44, height:5, borderRadius:3, backgroundColor:COLORS.border, alignSelf:"center", marginBottom:18 },
  modalTitle:{ fontSize:16, fontWeight:"800", color:COLORS.textPrimary, marginBottom:12 },
  detailHeader:{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 },
  detailTitle:{ fontSize:18, fontWeight:"800", color:COLORS.textPrimary },
  detailSub:{ fontSize:12, color:COLORS.textMuted, fontWeight:"500", marginTop:2 },
  closeBtn:{ width:32, height:32, borderRadius:16, backgroundColor:COLORS.background,
             alignItems:"center", justifyContent:"center" },

  detailStatsGrid:{ flexDirection:"row", gap:8, marginBottom:4 },
  detailStatCard:{ flex:1, backgroundColor:COLORS.background, borderRadius:14, padding:12, gap:4, alignItems:"center" },
  detailStatVal:{ fontSize:22, fontWeight:"900" },
  detailStatLbl:{ fontSize:9, color:COLORS.textMuted, fontWeight:"600", textTransform:"uppercase", textAlign:"center" },

  detailSectionLabel:{ fontSize:11, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase",
                       letterSpacing:0.5, marginTop:14, marginBottom:8 },
  detailInfoCard:{ backgroundColor:COLORS.background, borderRadius:14, paddingHorizontal:12 },
  detailInfoRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:10 },
  detailInfoLabel:{ fontSize:13, color:COLORS.textSecondary, fontWeight:"600" },
  detailInfoVal:{ fontSize:13, color:COLORS.textPrimary, fontWeight:"700" },
  notesCard:{ backgroundColor:COLORS.background, borderRadius:14, padding:14 },
  notesText:{ fontSize:13, color:COLORS.textSecondary, lineHeight:20, fontWeight:"500" },

  exportRow:{ marginTop:16 },
  exportBtn:{ flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8,
              backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:14,
              shadowColor:COLORS.primary, shadowOpacity:0.35, shadowRadius:10, shadowOffset:{width:0,height:4}, elevation:6 },
  exportBtnText:{ fontSize:14, fontWeight:"800", color:COLORS.white },

  pickerSheet:{ backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28,
                padding:22, paddingBottom:Platform.OS==="ios"?40:28 },
  yearRow:{ flexDirection:"row", gap:10, marginBottom:14 },
  yearBtn:{ flex:1, paddingVertical:10, borderRadius:12, backgroundColor:COLORS.background,
            borderWidth:1, borderColor:COLORS.border, alignItems:"center" },
  yearBtnActive:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  yearBtnText:{ fontSize:13, fontWeight:"700", color:COLORS.textSecondary },
  yearBtnTextActive:{ color:COLORS.white },
  monthGrid:{ flexDirection:"row", flexWrap:"wrap", gap:8 },
  monthBtn:{ width:"22%", paddingVertical:12, borderRadius:12, backgroundColor:COLORS.background,
             borderWidth:1, borderColor:COLORS.border, alignItems:"center" },
  monthBtnActive:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  monthBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.textSecondary },
  monthBtnTextActive:{ color:COLORS.white },
});

const styles = StyleSheet.create({
  safe:{ flex:1, backgroundColor:COLORS.primaryDark },
  header:{ backgroundColor:COLORS.primaryDark, paddingTop:8, paddingBottom:20, paddingHorizontal:16,
           flexDirection:"row", alignItems:"center", gap:10 },
  backBtn:{ width:38, height:38, borderRadius:12, backgroundColor:"rgba(255,255,255,0.12)",
            alignItems:"center", justifyContent:"center" },
  headerTitle:{ flex:1, fontSize:18, fontWeight:"800", color:COLORS.white, letterSpacing:0.2 },
  addBtn:{ width:38, height:38, borderRadius:12, backgroundColor:"rgba(255,255,255,0.18)",
           alignItems:"center", justifyContent:"center" },
  scroll:{ flex:1, backgroundColor:COLORS.background, borderTopLeftRadius:24, borderTopRightRadius:24, marginTop:-10 },
  scrollContent:{ paddingTop:20, paddingHorizontal:18 },
    menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ReportsScreen;