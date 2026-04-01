import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, TextInput, Modal, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft, Search, Plus, Edit2, Trash2, X, Check,
  MapPin, Phone, Mail, Briefcase, TrendingUp, Users,
  UserCheck, UserX, Filter, ChevronDown, Star, Eye,
  Menu,
} from "lucide-react-native";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#8B0111", primaryDark: "#8B0111", primaryDeep: "#6B0009",
  primaryMuted: "rgba(139,1,17,0.08)", primaryLight: "rgba(139,1,17,0.15)",
  white: "#FFFFFF", background: "#F0F5FB", cardBg: "#FFFFFF",
  textPrimary: "#0D2137", textSecondary: "#4A6580", textMuted: "#8FA3B8",
  border: "#D6E4F0", success: "#00897B", successLight: "#E0F2F1",
  warning: "#F57C00", warningLight: "#FFF3E0",
  accentBlue: "#1565C0", accentBlueLight: "#E3F0FF",
  online: "#43A047", onlineLight: "#E8F5E9",
  offline: "#9E9E9E", offlineLight: "#F5F5F5",
  danger: "#C62828", dangerLight: "#FFEBEE",
  overlayBg: "rgba(13,33,55,0.6)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "Field Rep" | "Senior Rep" | "Team Lead" | "Supervisor";
type EmpStatus = "active" | "inactive";

interface Employee {
  id: string; name: string; role: Role; initials: string;
  online: boolean; status: EmpStatus;
  sales: number; customers: number; samplers: number;
  location: string; phone: string; email: string;
  joinDate: string; salary: number; target: number;
  rating: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_EMPLOYEES: Employee[] = [
  { id:"1", name:"Jane Mwangi",    role:"Field Rep",  initials:"JM", online:true,  status:"active",   sales:142, customers:820,  samplers:440, location:"Westlands",  phone:"+254 712 345 678", email:"jane.mwangi@co.ke",    joinDate:"Jan 2025", salary:28000, target:150, rating:4.8 },
  { id:"2", name:"Brian Ochieng",  role:"Field Rep",  initials:"BO", online:true,  status:"active",   sales:118, customers:690,  samplers:370, location:"CBD",        phone:"+254 723 456 789", email:"brian.o@co.ke",         joinDate:"Mar 2025", salary:26000, target:120, rating:4.2 },
  { id:"3", name:"Amina Hassan",   role:"Senior Rep", initials:"AH", online:true,  status:"active",   sales:231, customers:1380, samplers:750, location:"Kilimani",   phone:"+254 734 567 890", email:"amina.h@co.ke",         joinDate:"Jun 2024", salary:38000, target:200, rating:4.9 },
  { id:"4", name:"Peter Karanja",  role:"Field Rep",  initials:"PK", online:false, status:"active",   sales:96,  customers:540,  samplers:280, location:"Kasarani",   phone:"+254 745 678 901", email:"peter.k@co.ke",         joinDate:"Feb 2025", salary:24000, target:100, rating:3.9 },
  { id:"5", name:"Lydia Wanjiku",  role:"Team Lead",  initials:"LW", online:true,  status:"active",   sales:310, customers:1850, samplers:980, location:"Upperhill",  phone:"+254 756 789 012", email:"lydia.w@co.ke",         joinDate:"Sep 2023", salary:52000, target:280, rating:5.0 },
  { id:"6", name:"David Mutua",    role:"Field Rep",  initials:"DM", online:false, status:"inactive", sales:62,  customers:380,  samplers:190, location:"Embakasi",   phone:"+254 767 890 123", email:"david.m@co.ke",         joinDate:"Apr 2025", salary:22000, target:80,  rating:3.4 },
  { id:"7", name:"Grace Akinyi",   role:"Field Rep",  initials:"GA", online:true,  status:"active",   sales:164, customers:960,  samplers:510, location:"Ngong Rd",   phone:"+254 778 901 234", email:"grace.a@co.ke",         joinDate:"Nov 2024", salary:29000, target:160, rating:4.5 },
  { id:"8", name:"Samuel Ndung'u", role:"Senior Rep", initials:"SN", online:false, status:"active",   sales:188, customers:1100, samplers:600, location:"Ruiru",      phone:"+254 789 012 345", email:"samuel.n@co.ke",        joinDate:"Jul 2024", salary:36000, target:180, rating:4.3 },
  { id:"9", name:"Faith Adhiambo", role:"Supervisor", initials:"FA", online:true,  status:"active",   sales:285, customers:1650, samplers:880, location:"Gigiri",     phone:"+254 790 123 456", email:"faith.a@co.ke",         joinDate:"Mar 2023", salary:58000, target:260, rating:4.7 },
];

const ROLES: Role[] = ["Field Rep", "Senior Rep", "Team Lead", "Supervisor"];

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 12 }) => (
  <View style={{ flexDirection:"row", gap:1 }}>
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        color={i <= Math.round(rating) ? COLORS.warning : COLORS.border}
        fill={i <= Math.round(rating) ? COLORS.warning : "transparent"}
      />
    ))}
  </View>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={empSt.progressBg}>
      <View style={[empSt.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
};

// ─── Employee Detail Modal ────────────────────────────────────────────────────
const DetailModal: React.FC<{
  emp: Employee | null; visible: boolean; onClose: () => void;
}> = ({ emp, visible, onClose }) => {
  if (!emp) return null;
  const achievePct = Math.min(100, Math.round((emp.sales / emp.target) * 100));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={empSt.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={empSt.detailSheet}>
          <View style={empSt.modalHandle} />

          {/* Profile hero */}
          <View style={empSt.detailHero}>
            <View style={empSt.detailAvatar}>
              <Text style={empSt.detailAvatarText}>{emp.initials}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={empSt.detailName}>{emp.name}</Text>
              <View style={empSt.detailRoleRow}>
                <View style={[empSt.rolePill, { backgroundColor: COLORS.primaryMuted }]}>
                  <Text style={[empSt.rolePillText, { color: COLORS.primary }]}>{emp.role}</Text>
                </View>
                <View style={[empSt.statusDot, { backgroundColor: emp.online ? COLORS.online : COLORS.offline }]} />
                <Text style={[empSt.statusLabel, { color: emp.online ? COLORS.online : COLORS.offline }]}>
                  {emp.online ? "Online" : "Offline"}
                </Text>
              </View>
              <StarRating rating={emp.rating} size={13} />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Contact info */}
            <Text style={empSt.sectionLabel}>Contact</Text>
            <View style={empSt.infoCard}>
              {[
                { icon:<MapPin size={14} color={COLORS.primary}/>,  label: emp.location },
                { icon:<Phone  size={14} color={COLORS.accentBlue}/>, label: emp.phone    },
                { icon:<Mail   size={14} color={COLORS.success}/>,   label: emp.email    },
                { icon:<Briefcase size={14} color={COLORS.warning}/>, label: `Joined ${emp.joinDate}` },
              ].map((row,i) => (
                <View key={i} style={[empSt.infoRow, i>0 && empSt.infoRowBorder]}>
                  {row.icon}
                  <Text style={empSt.infoText}>{row.label}</Text>
                </View>
              ))}
            </View>

            {/* KPI Strip */}
            <Text style={empSt.sectionLabel}>Performance (This Month)</Text>
            <View style={empSt.kpiStrip}>
              {[
                { label:"Sales",     val: emp.sales,     color: COLORS.primary     },
                { label:"Customers", val: emp.customers, color: COLORS.accentBlue  },
                { label:"Samplers",  val: emp.samplers,  color: COLORS.success     },
              ].map(k => (
                <View key={k.label} style={empSt.kpiItem}>
                  <Text style={[empSt.kpiVal, { color: k.color }]}>{k.val}</Text>
                  <Text style={empSt.kpiLbl}>{k.label}</Text>
                </View>
              ))}
            </View>

            {/* Target progress */}
            <Text style={empSt.sectionLabel}>Sales Target</Text>
            <View style={empSt.infoCard}>
              <View style={empSt.targetRow}>
                <Text style={empSt.targetLabel}>{emp.sales} / {emp.target} units</Text>
                <Text style={[empSt.targetPct, { color: achievePct >= 100 ? COLORS.success : achievePct >= 70 ? COLORS.warning : COLORS.danger }]}>
                  {achievePct}%
                </Text>
              </View>
              <ProgressBar value={emp.sales} max={emp.target} color={achievePct >= 100 ? COLORS.success : achievePct >= 70 ? COLORS.warning : COLORS.primary} />
            </View>

            {/* Salary */}
            <Text style={empSt.sectionLabel}>Compensation</Text>
            <View style={empSt.infoCard}>
              <View style={empSt.infoRow}>
                <Text style={empSt.infoLabel}>Monthly Salary</Text>
                <Text style={[empSt.infoValue, { color: COLORS.success }]}>KES {emp.salary.toLocaleString()}</Text>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
interface FormState { name:string; role:Role; location:string; phone:string; email:string; salary:string; target:string; }
const EMPTY_FORM: FormState = { name:"", role:"Field Rep", location:"", phone:"", email:"", salary:"", target:"" };

const AddEditModal: React.FC<{
  visible:boolean; emp:Employee|null; onClose:()=>void;
  onSave:(form:FormState)=>void;
}> = ({ visible, emp, onClose, onSave }) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showRoles, setShowRoles] = useState(false);

  React.useEffect(() => {
    if (emp) {
      setForm({ name:emp.name, role:emp.role, location:emp.location,
        phone:emp.phone, email:emp.email, salary:String(emp.salary), target:String(emp.target) });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [emp, visible]);

  const Field: React.FC<{ label:string; value:string; onChange:(v:string)=>void; placeholder:string; keyboardType?:any }> =
    ({ label, value, onChange, placeholder, keyboardType }) => (
    <View style={empSt.fieldGroup}>
      <Text style={empSt.fieldLabel}>{label}</Text>
      <TextInput style={empSt.fieldInput} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || "default"} />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={empSt.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[empSt.detailSheet, { paddingBottom: Platform.OS==="ios"?40:28 }]}>
          <View style={empSt.modalHandle} />
          <View style={empSt.modalTitleRow}>
            <Text style={empSt.modalTitle}>{emp ? "Edit Employee" : "Add Employee"}</Text>
            <TouchableOpacity onPress={onClose} style={empSt.closeBtn}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Full Name *"    value={form.name}     onChange={v=>setForm({...form,name:v})}     placeholder="e.g. Jane Mwangi" />
            <Field label="Location *"     value={form.location} onChange={v=>setForm({...form,location:v})} placeholder="e.g. Westlands" />
            <Field label="Phone"          value={form.phone}    onChange={v=>setForm({...form,phone:v})}    placeholder="+254 7xx xxx xxx" keyboardType="phone-pad" />
            <Field label="Email"          value={form.email}    onChange={v=>setForm({...form,email:v})}    placeholder="name@company.ke" keyboardType="email-address" />
            <Field label="Salary (KES)"   value={form.salary}   onChange={v=>setForm({...form,salary:v})}   placeholder="e.g. 28000" keyboardType="numeric" />
            <Field label="Monthly Target" value={form.target}   onChange={v=>setForm({...form,target:v})}   placeholder="e.g. 150" keyboardType="numeric" />

            <View style={empSt.fieldGroup}>
              <Text style={empSt.fieldLabel}>Role *</Text>
              <TouchableOpacity style={empSt.roleDropdown} onPress={()=>setShowRoles(!showRoles)} activeOpacity={0.8}>
                <Text style={empSt.roleDropdownText}>{form.role}</Text>
                <ChevronDown size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              {showRoles && (
                <View style={empSt.roleOptions}>
                  {ROLES.map(r => (
                    <TouchableOpacity key={r} style={[empSt.roleOption, form.role===r && empSt.roleOptionActive]}
                      onPress={()=>{ setForm({...form,role:r}); setShowRoles(false); }} activeOpacity={0.8}>
                      <Text style={[empSt.roleOptionText, form.role===r && empSt.roleOptionTextActive]}>{r}</Text>
                      {form.role===r && <Check size={14} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={empSt.modalActions}>
              <TouchableOpacity style={empSt.cancelBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={empSt.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={empSt.saveBtn} onPress={()=>onSave(form)} activeOpacity={0.85}>
                <Text style={empSt.saveBtnText}>{emp ? "Save Changes" : "Add Employee"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Employee Card ────────────────────────────────────────────────────────────
const EmployeeCard: React.FC<{
  emp: Employee; onEdit:()=>void; onRemove:()=>void; onView:()=>void;
}> = ({ emp, onEdit, onRemove, onView }) => {
  const achievePct = Math.min(100, Math.round((emp.sales / emp.target) * 100));
  return (
    <View style={empSt.card}>
  
      <View style={empSt.cardBody}>
        {/* Top row */}
        <View style={empSt.cardTop}>
          <View style={empSt.avatarWrap}>
            <View style={[empSt.avatar, { backgroundColor: emp.online ? COLORS.accentBlueLight : COLORS.offlineLight }]}>
              <Text style={[empSt.avatarText, { color: emp.online ? COLORS.accentBlue : COLORS.offline }]}>{emp.initials}</Text>
            </View>
            <View style={[empSt.onlineDot, { backgroundColor: emp.online ? COLORS.online : COLORS.offline }]} />
          </View>
          <View style={empSt.cardInfo}>
            <Text style={empSt.cardName}>{emp.name}</Text>
            <View style={empSt.cardMeta}>
              <View style={[empSt.rolePill, { backgroundColor: COLORS.primaryMuted }]}>
                <Text style={[empSt.rolePillText, { color: COLORS.primary }]}>{emp.role}</Text>
              </View>
              <View style={empSt.locationRow}>
                <MapPin size={10} color={COLORS.textMuted} />
                <Text style={empSt.locationText}>{emp.location}</Text>
              </View>
            </View>
            <StarRating rating={emp.rating} />
          </View>
          <View style={[empSt.statusBadge, { backgroundColor: emp.status==="active" ? COLORS.successLight : COLORS.offlineLight }]}>
            <Text style={[empSt.statusText, { color: emp.status==="active" ? COLORS.success : COLORS.offline }]}>
              {emp.status==="active" ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={empSt.statsRow}>
          {[
            { label:"Sales", val:emp.sales, color:COLORS.primary },
            { label:"Reach",  val:emp.customers, color:COLORS.accentBlue },
            { label:"Samplers", val:emp.samplers, color:COLORS.success },
          ].map(s => (
            <View key={s.label} style={empSt.statItem}>
              <Text style={[empSt.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={empSt.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Target progress */}
        <View style={empSt.targetSection}>
          <View style={empSt.targetRow}>
            <Text style={empSt.targetLabel}>Target: {emp.sales}/{emp.target}</Text>
            <Text style={[empSt.targetPct, {
              color: achievePct>=100 ? COLORS.success : achievePct>=70 ? COLORS.warning : COLORS.primary
            }]}>{achievePct}%</Text>
          </View>
          <ProgressBar value={emp.sales} max={emp.target}
            color={achievePct>=100 ? COLORS.success : achievePct>=70 ? COLORS.warning : COLORS.primary} />
        </View>

        {/* Actions */}
        <View style={empSt.cardActions}>
          <TouchableOpacity style={empSt.viewBtn} onPress={onView} activeOpacity={0.8}>
            <Eye size={13} color={COLORS.accentBlue} />
            <Text style={empSt.viewBtnText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={empSt.editBtn} onPress={onEdit} activeOpacity={0.8}>
            <Edit2 size={13} color={COLORS.primary} />
            <Text style={empSt.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={empSt.removeBtn} onPress={onRemove} activeOpacity={0.8}>
            <Trash2 size={13} color={COLORS.danger} />
            <Text style={empSt.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface EmployeesScreenProps { navigation?: any }

const EmployeesScreen: React.FC<EmployeesScreenProps> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [search,    setSearch]    = useState("");
  const [roleFilter, setRoleFilter] = useState<Role|"All">("All");
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"inactive"|"online">("all");
  const [sortBy,    setSortBy]    = useState<"name"|"sales"|"rating">("sales");
  const [showAdd,   setShowAdd]   = useState(false);
  const [editEmp,   setEditEmp]   = useState<Employee|null>(null);
  const [viewEmp,   setViewEmp]   = useState<Employee|null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const totalSales    = employees.reduce((s,e) => s + e.sales, 0);
  const onlineCount   = employees.filter(e=>e.online).length;
  const activeCount   = employees.filter(e=>e.status==="active").length;
  const avgRating     = (employees.reduce((s,e)=>s+e.rating,0)/employees.length).toFixed(1);

  const filtered = employees
    .filter(e => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.location.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter !== "All" && e.role !== roleFilter) return false;
      if (statusFilter === "active"   && e.status !== "active")   return false;
      if (statusFilter === "inactive" && e.status !== "inactive") return false;
      if (statusFilter === "online"   && !e.online)               return false;
      return true;
    })
    .sort((a,b) => sortBy==="name" ? a.name.localeCompare(b.name) : sortBy==="sales" ? b.sales-a.sales : b.rating-a.rating);

  const handleSave = (form: FormState) => {
    if (!form.name || !form.location) {
      Alert.alert("Required", "Name and location are required."); return;
    }
    if (editEmp) {
      setEmployees(prev => prev.map(e => e.id===editEmp.id ? {
        ...e, name:form.name, role:form.role, location:form.location,
        phone:form.phone, email:form.email,
        salary:Number(form.salary)||e.salary, target:Number(form.target)||e.target,
      } : e));
    } else {
      const newEmp: Employee = {
        id: String(Date.now()), name:form.name, role:form.role,
        initials: form.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
        online:false, status:"active", sales:0, customers:0, samplers:0,
        location:form.location, phone:form.phone, email:form.email,
        joinDate: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
        salary:Number(form.salary)||0, target:Number(form.target)||100, rating:0,
      };
      setEmployees(prev => [...prev, newEmp]);
    }
    setShowAdd(false); setEditEmp(null);
  };

  const handleRemove = (emp: Employee) => {
    Alert.alert("Remove Employee", `Remove ${emp.name} from the system?`, [
      { text:"Cancel", style:"cancel" },
      { text:"Remove", style:"destructive", onPress:()=>setEmployees(prev=>prev.filter(e=>e.id!==emp.id)) },
    ]);
  };

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
        <Text style={styles.headerTitle}>Employee Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={()=>{setEditEmp(null);setShowAdd(true);}} activeOpacity={0.8}>
          <Plus size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Strip */}
        <View style={empSt.kpiStrip}>
          {[
            { val:employees.length, lbl:"Total",   color:COLORS.primary },
            { val:activeCount,       lbl:"Active",  color:COLORS.success },
            { val:onlineCount,       lbl:"Online",  color:COLORS.online  },
            { val:totalSales,        lbl:"Sales",   color:COLORS.accentBlue },
          ].map(k => (
            <View key={k.lbl} style={empSt.kpiItem}>
              <Text style={[empSt.kpiVal, { color:k.color }]}>{k.val}</Text>
              <Text style={empSt.kpiLbl}>{k.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Search + Filter */}
        <View style={empSt.searchRow}>
          <View style={empSt.searchBox}>
            <Search size={15} color={COLORS.textMuted} />
            <TextInput style={empSt.searchInput} value={search} onChangeText={setSearch}
              placeholder="Search name or location..." placeholderTextColor={COLORS.textMuted} />
            {search ? <TouchableOpacity onPress={()=>setSearch("")}><X size={14} color={COLORS.textMuted}/></TouchableOpacity> : null}
          </View>
          <TouchableOpacity style={empSt.filterBtn} onPress={()=>setShowFilter(!showFilter)} activeOpacity={0.8}>
            <Filter size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter panel */}
        {showFilter && (
          <View style={empSt.filterPanel}>
            <View style={empSt.filterSection}>
              <Text style={empSt.filterSectionLabel}>Status</Text>
              <View style={empSt.filterPills}>
                {(["all","active","inactive","online"] as const).map(s => (
                  <TouchableOpacity key={s} style={[empSt.pill, statusFilter===s && empSt.pillActive]}
                    onPress={()=>setStatusFilter(s)} activeOpacity={0.8}>
                    <Text style={[empSt.pillText, statusFilter===s && empSt.pillTextActive]}>
                      {s.charAt(0).toUpperCase()+s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={empSt.filterSection}>
              <Text style={empSt.filterSectionLabel}>Role</Text>
              <View style={empSt.filterPills}>
                {(["All",...ROLES] as const).map(r => (
                  <TouchableOpacity key={r} style={[empSt.pill, roleFilter===r && empSt.pillActive]}
                    onPress={()=>setRoleFilter(r as any)} activeOpacity={0.8}>
                    <Text style={[empSt.pillText, roleFilter===r && empSt.pillTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={empSt.filterSection}>
              <Text style={empSt.filterSectionLabel}>Sort By</Text>
              <View style={empSt.filterPills}>
                {(["sales","name","rating"] as const).map(s => (
                  <TouchableOpacity key={s} style={[empSt.pill, sortBy===s && empSt.pillActive]}
                    onPress={()=>setSortBy(s)} activeOpacity={0.8}>
                    <Text style={[empSt.pillText, sortBy===s && empSt.pillTextActive]}>
                      {s.charAt(0).toUpperCase()+s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Results count */}
        <View style={empSt.resultRow}>
          <Text style={empSt.resultText}>{filtered.length} employee{filtered.length!==1?"s":""}</Text>
          <View style={empSt.avgRatingRow}>
            <Star size={12} color={COLORS.warning} fill={COLORS.warning} />
            <Text style={empSt.avgRatingText}>Avg {avgRating}</Text>
          </View>
        </View>

        {/* Employee cards */}
        {filtered.map((emp,i) => (
          <React.Fragment key={emp.id}>
            <EmployeeCard
              emp={emp}
              onEdit={()=>{ setEditEmp(emp); setShowAdd(true); }}
              onRemove={()=>handleRemove(emp)}
              onView={()=>setViewEmp(emp)}
            />
            {i < filtered.length-1 && <View style={{ height:10 }} />}
          </React.Fragment>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <DetailModal emp={viewEmp} visible={!!viewEmp} onClose={()=>setViewEmp(null)} />
      <AddEditModal visible={showAdd} emp={editEmp} onClose={()=>{setShowAdd(false);setEditEmp(null);}} onSave={handleSave} />
    </SafeAreaView>
  );
};

// ─── Shared header styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex:1, backgroundColor:COLORS.primaryDark },
  header: { backgroundColor:COLORS.primaryDark, paddingTop:8, paddingBottom:20, paddingHorizontal:16,
            flexDirection:"row", alignItems:"center", gap:10 },
                menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn:{ width:38, height:38, borderRadius:12, backgroundColor:"rgba(255,255,255,0.12)",
            alignItems:"center", justifyContent:"center" },
  headerTitle:{ flex:1, fontSize:18, fontWeight:"800", color:COLORS.white, letterSpacing:0.2 },
  addBtn: { width:38, height:38, borderRadius:12, backgroundColor:"rgba(255,255,255,0.18)",
            alignItems:"center", justifyContent:"center" },
  scroll: { flex:1, backgroundColor:COLORS.background, borderTopLeftRadius:24, borderTopRightRadius:24, marginTop:-10 },
  scrollContent: { paddingTop:20, paddingHorizontal:18 },
});

// ─── Employee-specific styles ─────────────────────────────────────────────────
const empSt = StyleSheet.create({
  kpiStrip:{ flexDirection:"row", backgroundColor:COLORS.cardBg, borderRadius:18,
             paddingVertical:14, paddingHorizontal:10, marginBottom:16,
             shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  kpiItem: { flex:1, alignItems:"center" },
  kpiVal:  { fontSize:20, fontWeight:"900", letterSpacing:-0.5 },
  kpiLbl:  { fontSize:10, fontWeight:"600", color:COLORS.textMuted, marginTop:2, textTransform:"uppercase", letterSpacing:0.4 },

  searchRow: { flexDirection:"row", gap:10, marginBottom:12 },
  searchBox: { flex:1, flexDirection:"row", alignItems:"center", backgroundColor:COLORS.cardBg,
               borderRadius:14, paddingHorizontal:12, paddingVertical:10, gap:8,
               borderWidth:1, borderColor:COLORS.border },
  searchInput:{ flex:1, fontSize:13, color:COLORS.textPrimary, fontWeight:"600", padding:0 },
  filterBtn:  { width:44, height:44, borderRadius:14, backgroundColor:COLORS.primaryMuted,
                alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:COLORS.border },

  filterPanel: { backgroundColor:COLORS.cardBg, borderRadius:16, padding:14, marginBottom:12,
                 borderWidth:1, borderColor:COLORS.border },
  filterSection:{ marginBottom:12 },
  filterSectionLabel:{ fontSize:10, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase",
                       letterSpacing:0.6, marginBottom:8 },
  filterPills: { flexDirection:"row", gap:6, flexWrap:"wrap" },
  pill:  { paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor:COLORS.background,
           borderWidth:1, borderColor:COLORS.border },
  pillActive:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  pillText:{ fontSize:11, fontWeight:"600", color:COLORS.textMuted },
  pillTextActive:{ color:COLORS.white },

  resultRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  resultText:{ fontSize:13, fontWeight:"700", color:COLORS.textSecondary },
  avgRatingRow:{ flexDirection:"row", alignItems:"center", gap:4 },
  avgRatingText:{ fontSize:12, fontWeight:"700", color:COLORS.warning },

  card:{ backgroundColor:COLORS.cardBg, borderRadius:18, flexDirection:"row", overflow:"hidden",
         shadowColor:COLORS.textPrimary, shadowOpacity:0.06, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  cardBody:{ flex:1, padding:14, gap:10 },
  cardTop: { flexDirection:"row", alignItems:"flex-start", gap:10 },
  avatarWrap:{ position:"relative", width:44, height:44 },
  avatar:  { width:44, height:44, borderRadius:22, alignItems:"center", justifyContent:"center" },
  avatarText:{ fontSize:15, fontWeight:"800" },
  onlineDot:{ position:"absolute", bottom:1, right:1, width:12, height:12, borderRadius:6,
              borderWidth:2, borderColor:COLORS.cardBg },
  cardInfo:{ flex:1, gap:4 },
  cardName:{ fontSize:15, fontWeight:"800", color:COLORS.textPrimary },
  cardMeta:{ flexDirection:"row", alignItems:"center", gap:8, flexWrap:"wrap" },
  rolePill:{ paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  rolePillText:{ fontSize:10, fontWeight:"700" },
  locationRow:{ flexDirection:"row", alignItems:"center", gap:3 },
  locationText:{ fontSize:10, color:COLORS.textMuted, fontWeight:"500" },
  statusBadge:{ paddingHorizontal:8, paddingVertical:4, borderRadius:20 },
  statusText:{ fontSize:10, fontWeight:"700" },

  statsRow:{ flexDirection:"row", backgroundColor:COLORS.background, borderRadius:12,
             paddingVertical:8, paddingHorizontal:4 },
  statItem:{ flex:1, alignItems:"center" },
  statVal: { fontSize:16, fontWeight:"800" },
  statLbl: { fontSize:9, color:COLORS.textMuted, fontWeight:"600", textTransform:"uppercase", marginTop:1 },

  targetSection:{ gap:4 },
  targetRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  targetLabel:{ fontSize:11, color:COLORS.textMuted, fontWeight:"600" },
  targetPct:{ fontSize:12, fontWeight:"800" },
  progressBg:{ height:5, backgroundColor:COLORS.background, borderRadius:3, overflow:"hidden" },
  progressFill:{ height:5, borderRadius:3 },

  cardActions:{ flexDirection:"row", gap:8 },
  viewBtn:  { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
              paddingVertical:8, borderRadius:10, backgroundColor:COLORS.accentBlueLight,
              borderWidth:1, borderColor:"rgba(21,101,192,0.15)" },
  viewBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.accentBlue },
  editBtn:  { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
              paddingVertical:8, borderRadius:10, backgroundColor:COLORS.primaryMuted,
              borderWidth:1, borderColor:COLORS.primaryLight },
  editBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.primary },
  removeBtn:{ flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
              paddingVertical:8, borderRadius:10, backgroundColor:COLORS.dangerLight,
              borderWidth:1, borderColor:"rgba(198,40,40,0.15)" },
  removeBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.danger },

  modalOverlay:{ flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  detailSheet:{ backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28,
                padding:24, maxHeight:"90%" },
  modalHandle:{ width:44, height:5, borderRadius:3, backgroundColor:COLORS.border, alignSelf:"center", marginBottom:20 },
  modalTitleRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
  modalTitle:{ fontSize:18, fontWeight:"800", color:COLORS.textPrimary },
  closeBtn:{ width:32, height:32, borderRadius:16, backgroundColor:COLORS.background,
             alignItems:"center", justifyContent:"center" },

  detailHero:{ flexDirection:"row", gap:14, marginBottom:20 },
  detailAvatar:{ width:60, height:60, borderRadius:30, backgroundColor:COLORS.primaryMuted,
                 alignItems:"center", justifyContent:"center", borderWidth:2, borderColor:COLORS.primaryLight },
  detailAvatarText:{ fontSize:20, fontWeight:"900", color:COLORS.primary },
  detailName:{ fontSize:18, fontWeight:"800", color:COLORS.textPrimary, marginBottom:6 },
  detailRoleRow:{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:6 },
  statusDot:{ width:8, height:8, borderRadius:4 },
  statusLabel:{ fontSize:12, fontWeight:"600" },

  sectionLabel:{ fontSize:11, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase",
                 letterSpacing:0.6, marginTop:16, marginBottom:8 },
  infoCard:{ backgroundColor:COLORS.background, borderRadius:14, padding:12, gap:0 },
  infoRow: { flexDirection:"row", alignItems:"center", gap:10, paddingVertical:8 },
  infoRowBorder:{ borderTopWidth:1, borderTopColor:COLORS.border },
  infoText:{ fontSize:13, color:COLORS.textPrimary, fontWeight:"600", flex:1 },
  infoLabel:{ flex:1, fontSize:13, color:COLORS.textSecondary, fontWeight:"600" },
  infoValue:{ fontSize:14, fontWeight:"800" },

  fieldGroup:{ marginBottom:14 },
  fieldLabel:{ fontSize:11, fontWeight:"700", color:COLORS.textSecondary, textTransform:"uppercase",
               letterSpacing:0.5, marginBottom:6 },
  fieldInput:{ backgroundColor:COLORS.background, borderRadius:12, borderWidth:1.5, borderColor:COLORS.border,
               paddingHorizontal:14, paddingVertical:12, fontSize:14, fontWeight:"600", color:COLORS.textPrimary },
  roleDropdown:{ backgroundColor:COLORS.background, borderRadius:12, borderWidth:1.5, borderColor:COLORS.border,
                 paddingHorizontal:14, paddingVertical:12, flexDirection:"row", justifyContent:"space-between" },
  roleDropdownText:{ fontSize:14, fontWeight:"600", color:COLORS.textPrimary },
  roleOptions:{ backgroundColor:COLORS.cardBg, borderRadius:12, borderWidth:1, borderColor:COLORS.border,
                marginTop:4, overflow:"hidden" },
  roleOption:{ paddingVertical:12, paddingHorizontal:14, flexDirection:"row", justifyContent:"space-between" },
  roleOptionActive:{ backgroundColor:COLORS.primaryMuted },
  roleOptionText:{ fontSize:13, fontWeight:"600", color:COLORS.textSecondary },
  roleOptionTextActive:{ color:COLORS.primary, fontWeight:"800" },

  modalActions:{ flexDirection:"row", gap:12, marginTop:20 },
  cancelBtn:{ flex:1, paddingVertical:14, borderRadius:14, backgroundColor:COLORS.background,
              borderWidth:1.5, borderColor:COLORS.border, alignItems:"center" },
  cancelBtnText:{ fontSize:14, fontWeight:"700", color:COLORS.textSecondary },
  saveBtn:{ flex:2, paddingVertical:14, borderRadius:14, backgroundColor:COLORS.primary,
            alignItems:"center", shadowColor:COLORS.primary, shadowOpacity:0.4,
            shadowRadius:10, shadowOffset:{width:0,height:4}, elevation:6 },
  saveBtnText:{ fontSize:14, fontWeight:"800", color:COLORS.white, letterSpacing:0.3 },

});

export default EmployeesScreen;