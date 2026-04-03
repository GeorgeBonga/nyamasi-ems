import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, TextInput, Modal, Platform, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search, Plus, Edit2, Trash2, X, Check,
  MapPin, Phone, Mail, Briefcase, TrendingUp, Users,
  UserCheck, UserX, Filter, ChevronDown, Star, Eye, Menu,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  Employee,
  EmpRole,
  EmpStatus,
  CreateEmployeeInput,
} from "../../data/dbService";

// ─── Constants (unchanged) ────────────────────────────────────────────────────
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

const ROLES: EmpRole[] = ["Field Rep", "Senior Rep", "Team Lead", "Supervisor"];

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 12 }) => (
  <View style={{ flexDirection: "row", gap: 1 }}>
    {[1, 2, 3, 4, 5].map((i) => (
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
  emp: Employee | null;
  visible: boolean;
  onClose: () => void;
  monthSales: number;    // passed from parent, computed from reports
}> = ({ emp, visible, onClose, monthSales }) => {
  if (!emp) return null;
  const achievePct = Math.min(100, Math.round((monthSales / emp.targets.monthly) * 100));

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
            <View style={{ flex: 1 }}>
              <Text style={empSt.detailName}>{emp.fullName}</Text>
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
            {/* Contact */}
            <Text style={empSt.sectionLabel}>Contact</Text>
            <View style={empSt.infoCard}>
              {[
                { icon: <MapPin  size={14} color={COLORS.primary} />,    label: emp.assignedArea },
                { icon: <Phone   size={14} color={COLORS.accentBlue} />, label: emp.phone },
                { icon: <Mail    size={14} color={COLORS.success} />,    label: emp.email },
                { icon: <Briefcase size={14} color={COLORS.warning} />,  label: `Joined ${emp.joinDate}` },
              ].map((row, i) => (
                <View key={i} style={[empSt.infoRow, i > 0 && empSt.infoRowBorder]}>
                  {row.icon}
                  <Text style={empSt.infoText}>{row.label}</Text>
                </View>
              ))}
            </View>

            {/* Target */}
            <Text style={empSt.sectionLabel}>Monthly Sales Target</Text>
            <View style={empSt.infoCard}>
              <View style={empSt.targetRow}>
                <Text style={empSt.targetLabel}>{monthSales} / {emp.targets.monthly} units</Text>
                <Text style={[empSt.targetPct, {
                  color: achievePct >= 100 ? COLORS.success : achievePct >= 70 ? COLORS.warning : COLORS.danger,
                }]}>
                  {achievePct}%
                </Text>
              </View>
              <ProgressBar
                value={monthSales}
                max={emp.targets.monthly}
                color={achievePct >= 100 ? COLORS.success : achievePct >= 70 ? COLORS.warning : COLORS.primary}
              />
            </View>

            {/* Salary */}
            <Text style={empSt.sectionLabel}>Compensation</Text>
            <View style={empSt.infoCard}>
              <View style={empSt.infoRow}>
                <Text style={empSt.infoLabel}>Monthly Base Salary</Text>
                <Text style={[empSt.infoValue, { color: COLORS.success }]}>
                  KES {emp.salary.base.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
interface FormState {
  firstName: string;
  lastName: string;
  role: EmpRole;
  assignedArea: string;
  phone: string;
  email: string;
  salary: string;
  dailyTarget: string;
  monthlyTarget: string;
  password: string;
}


const EMPTY_FORM: FormState = {
  firstName: "", lastName: "", role: "Field Rep",
  assignedArea: "", phone: "", email: "",
  salary: "", dailyTarget: "", monthlyTarget: "", password: "",
};

const AddEditModal: React.FC<{
  visible: boolean;
  emp: Employee | null;
  onClose: () => void;
  onSave: (form: FormState) => void;
  saving: boolean;
}> = ({ visible, emp, onClose, onSave, saving }) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showRoles, setShowRoles] = useState(false);

  useEffect(() => {
    if (emp) {
      setForm({
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: emp.role,
        assignedArea: emp.assignedArea,
        phone: emp.phone,
        email: emp.email,
        salary: String(emp.salary.base),
        dailyTarget: String(emp.targets.daily),
        monthlyTarget: String(emp.targets.monthly),
        password: "",                         // never pre-fill passwords
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [emp, visible]);


   const updateField = useCallback((key: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  
 

 const Field: React.FC<{
    label: string; 
    value: string; 
    fieldKey: keyof FormState;
    placeholder: string; 
    keyboardType?: any; 
    secure?: boolean;
  }> = useCallback(({ label, value, fieldKey, placeholder, keyboardType, secure }) => (
    <View style={empSt.fieldGroup}>
      <Text style={empSt.fieldLabel}>{label}</Text>
      <TextInput
        style={empSt.fieldInput} 
        value={value} 
        onChangeText={(text) => updateField(fieldKey, text)}
        placeholder={placeholder} 
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType ?? "default"} 
        secureTextEntry={!!secure}
      />
    </View>
  ), [updateField]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={empSt.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[empSt.detailSheet, { paddingBottom: Platform.OS === "ios" ? 40 : 28 }]}>
          <View style={empSt.modalHandle} />
          <View style={empSt.modalTitleRow}>
            <Text style={empSt.modalTitle}>{emp ? "Edit Employee" : "Add Employee"}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={COLORS.textMuted} /></TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false} // Important for TextInput performance
          >
            <Field 
              label="First Name *"    
              value={form.firstName}    
              fieldKey="firstName"
              placeholder="e.g. Jane" 
            />
            <Field 
              label="Last Name *"     
              value={form.lastName}     
              fieldKey="lastName"
              placeholder="e.g. Mwangi" 
            />
            <Field 
              label="Phone *"         
              value={form.phone}        
              fieldKey="phone"
              placeholder="+254 7XX XXX XXX" 
              keyboardType="phone-pad" 
            />
            <Field 
              label="Email"           
              value={form.email}        
              fieldKey="email"
              placeholder="jane@company.co.ke" 
              keyboardType="email-address" 
            />
            <Field 
              label="Assigned Area *" 
              value={form.assignedArea} 
              fieldKey="assignedArea"
              placeholder="e.g. Westlands" 
            />
            <Field 
              label="Base Salary (KES) *" 
              value={form.salary}  
              fieldKey="salary"
              placeholder="e.g. 28000" 
              keyboardType="numeric" 
            />
            <Field 
              label="Daily Target *"  
              value={form.dailyTarget}  
              fieldKey="dailyTarget"
              placeholder="units/day" 
              keyboardType="numeric" 
            />
            <Field 
              label="Monthly Target *" 
              value={form.monthlyTarget} 
              fieldKey="monthlyTarget"
              placeholder="units/month" 
              keyboardType="numeric" 
            />
            {!emp && (
              <Field 
                label="Initial Password *" 
                value={form.password} 
                fieldKey="password"
                placeholder="Min 6 characters" 
                secure 
              />
            )}

            {/* Role picker */}
            <View style={empSt.fieldGroup}>
              <Text style={empSt.fieldLabel}>Role *</Text>
              <TouchableOpacity
                style={[empSt.fieldInput, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
                onPress={() => setShowRoles(!showRoles)}
              >
                <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>{form.role}</Text>
                <ChevronDown size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
              {showRoles && (
                <View style={empSt.roleDropdown}>
                  {ROLES.map((r) => (
                    <TouchableOpacity key={r} style={empSt.roleOption}
                      onPress={() => { setForm((f) => ({ ...f, role: r })); setShowRoles(false); }}
                    >
                      <Text style={[empSt.roleOptionText, form.role === r && { color: COLORS.primary, fontWeight: "800" }]}>{r}</Text>
                      {form.role === r && <Check size={14} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[empSt.saveBtn, saving && { opacity: 0.7 }]}
              onPress={() => onSave(form)}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} size="small" />
                : <Text style={empSt.saveBtnText}>{emp ? "Save Changes" : "Create Employee"}</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const EmployeesScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving,  setSaving]      = useState(false);
  const [search, setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedEmp,  setSelectedEmp]  = useState<Employee | null>(null);
  const [editEmp,      setEditEmp]      = useState<Employee | null>(null);
  const [showDetail,   setShowDetail]   = useState(false);
  const [showAddEdit,  setShowAddEdit]  = useState(false);

  // ── Load employees on mount ──────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  // ── Filter logic ─────────────────────────────────────────────────────────
  const displayed = employees.filter((e) => {
    const matchSearch =
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.assignedArea.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === "all" ? true : e.status === activeFilter;
    return matchSearch && matchFilter;
  });

  // ── Save (create or update) ──────────────────────────────────────────────
  const handleSave = async (form: FormState) => {
    if (!form.firstName || !form.lastName || !form.phone || !form.salary) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (editEmp) {
        // Update existing
        await updateEmployee(editEmp.id, {
          firstName:    form.firstName,
          lastName:     form.lastName,
          role:         form.role,
          phone:        form.phone,
          email:        form.email,
          assignedArea: form.assignedArea,
          baseSalary:   Number(form.salary),
          dailyTarget:  Number(form.dailyTarget),
          monthlyTarget: Number(form.monthlyTarget),
        });
      } else {
        // Create new employee + user account
        if (!form.password || form.password.length < 6) {
          Alert.alert("Password", "Password must be at least 6 characters.");
          setSaving(false);
          return;
        }
        const input: CreateEmployeeInput = {
          firstName:    form.firstName,
          lastName:     form.lastName,
          role:         form.role,
          phone:        form.phone,
          email:        form.email,
          assignedArea: form.assignedArea,
          baseSalary:   Number(form.salary),
          dailyTarget:  Number(form.dailyTarget),
          monthlyTarget: Number(form.monthlyTarget),
          password:     form.password,
          createdBy:    "u001",     // inject from auth context in production
        };
        await createEmployee(input);
      }
      await loadEmployees();          // refresh list from source of truth
      setShowAddEdit(false);
      setEditEmp(null);
    } catch (e) {
      Alert.alert("Error", "Could not save employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete (deactivate) ──────────────────────────────────────────────────
  const handleDelete = (emp: Employee) => {
    Alert.alert(
      "Deactivate Employee",
      `Deactivate ${emp.fullName}? They will lose access but their data is preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate", style: "destructive",
          onPress: async () => {
            await deactivateEmployee(emp.id);
            await loadEmployees();
          },
        },
      ]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const onlineCount = employees.filter((e) => e.online).length;
  const activeCount = employees.filter((e) => e.status === "active").length;

  return (
    <SafeAreaView style={empSt.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={empSt.header}>
                <TouchableOpacity
                  style={empSt.menuBtn}
                  onPress={() => navigation?.openDrawer()}
                  activeOpacity={0.7}
                >
                  <Menu size={22} color={COLORS.white} />
                </TouchableOpacity>
        <View style={empSt.headerLeft}>
          <Text style={empSt.headerTitle}>Employees</Text>
          <Text style={empSt.headerSub}>
            {activeCount} active · {onlineCount} online
          </Text>
        </View>
        <TouchableOpacity
          style={empSt.addBtn}
          onPress={() => { setEditEmp(null); setShowAddEdit(true); }}
        >
          <Plus size={18} color={COLORS.white} strokeWidth={2.5} />
          <Text style={empSt.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={empSt.body}>
        {/* Search */}
        <View style={empSt.searchRow}>
          <View style={empSt.searchBox}>
            <Search size={16} color={COLORS.textMuted} />
            <TextInput
              style={empSt.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search employees…"
              placeholderTextColor={COLORS.textMuted}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter pills */}
        <View style={empSt.filterRow}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[empSt.filterPill, activeFilter === f && empSt.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[empSt.filterPillText, activeFilter === f && empSt.filterPillTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Employee list */}
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {displayed.length === 0 ? (
              <Text style={empSt.emptyText}>No employees match your search.</Text>
            ) : (
              displayed.map((emp, idx) => (
                <React.Fragment key={emp.id}>
                  <TouchableOpacity
                    style={empSt.empRow}
                    onPress={() => { setSelectedEmp(emp); setShowDetail(true); }}
                    activeOpacity={0.75}
                  >
                    {/* Avatar */}
                    <View style={empSt.empAvatarWrap}>
                      <View style={[empSt.empAvatar, { backgroundColor: emp.status === "active" ? COLORS.primaryMuted : COLORS.offlineLight }]}>
                        <Text style={[empSt.empInitials, { color: emp.status === "active" ? COLORS.primary : COLORS.offline }]}>
                          {emp.initials}
                        </Text>
                      </View>
                      <View style={[empSt.onlineDot, { backgroundColor: emp.online ? COLORS.online : COLORS.offline }]} />
                    </View>

                    {/* Info */}
                    <View style={empSt.empInfo}>
                      <Text style={empSt.empName}>{emp.fullName}</Text>
                      <Text style={empSt.empMeta}>{emp.role} · {emp.assignedArea}</Text>
                      <StarRating rating={emp.rating} size={11} />
                    </View>

                    {/* Status badge */}
                    <View style={[
                      empSt.statusBadge,
                      { backgroundColor: emp.status === "active" ? COLORS.onlineLight : COLORS.offlineLight },
                    ]}>
                      {emp.status === "active"
                        ? <UserCheck size={11} color={COLORS.online} />
                        : <UserX size={11} color={COLORS.offline} />
                      }
                      <Text style={[empSt.statusText, { color: emp.status === "active" ? COLORS.online : COLORS.offline }]}>
                        {emp.status === "active" ? "Active" : "Off"}
                      </Text>
                    </View>

                    {/* Actions */}
                    <TouchableOpacity
                      style={empSt.actionBtn}
                      onPress={() => { setEditEmp(emp); setShowAddEdit(true); }}
                    >
                      <Edit2 size={14} color={COLORS.accentBlue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={empSt.actionBtn}
                      onPress={() => handleDelete(emp)}
                    >
                      <Trash2 size={14} color={COLORS.danger} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {idx < displayed.length - 1 && <View style={empSt.divider} />}
                </React.Fragment>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Detail Modal */}
      <DetailModal
        emp={selectedEmp}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        monthSales={0}   // wire: pass from getMonthlyAggregates for selectedEmp
      />

      {/* Add / Edit Modal */}
      <AddEditModal
        visible={showAddEdit}
        emp={editEmp}
        onClose={() => { setShowAddEdit(false); setEditEmp(null); }}
        onSave={handleSave}
        saving={saving}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const empSt = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 16,
  },
  headerLeft: { flex: 1 },
    menuBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.white },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
  },
  addBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },

  body: {
    flex: 1, backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 16, paddingHorizontal: 16, marginTop: -8,
  },

  searchRow: { marginBottom: 12 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.cardBg, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterPillText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  filterPillTextActive: { color: COLORS.white },

  empRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, gap: 10,
  },
  empAvatarWrap: { position: "relative", width: 42, height: 42 },
  empAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  empInitials: { fontSize: 14, fontWeight: "800" },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2, borderColor: COLORS.cardBg,
  },
  empInfo: { flex: 1 },
  empName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  empMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  actionBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.background,
    alignItems: "center", justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: COLORS.border, opacity: 0.5 },
  emptyText: {
    textAlign: "center", color: COLORS.textMuted,
    marginTop: 40, fontSize: 14,
  },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: COLORS.overlayBg, justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "88%",
  },
  modalHandle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },

  detailHero: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  detailAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center", justifyContent: "center",
  },
  detailAvatarText: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  detailName: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  detailRoleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 4 },
  rolePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  rolePillText: { fontSize: 11, fontWeight: "700" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: "600" },

  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5,
    marginTop: 16, marginBottom: 8,
  },
  infoCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14, overflow: "hidden",
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  infoText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "500", flex: 1 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "700" },

  targetRow: { flexDirection: "row", justifyContent: "space-between", padding: 12, paddingBottom: 8 },
  targetLabel: { fontSize: 13, color: COLORS.textSecondary },
  targetPct: { fontSize: 15, fontWeight: "800" },
  progressBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginHorizontal: 12, marginBottom: 12 },
  progressFill: { height: 6, borderRadius: 3 },

  // Form
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase" },
  fieldInput: {
    backgroundColor: COLORS.background, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary,
  },
  roleDropdown: {
    backgroundColor: COLORS.cardBg, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, marginTop: 4, overflow: "hidden",
  },
  roleOption: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  roleOptionText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },

  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: COLORS.white },
});

export default EmployeesScreen;