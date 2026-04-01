import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, TextInput, Modal, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft, Plus, Search, X, Filter, Edit2, Trash2,
  Eye, MapPin, Phone, Truck, Star, TrendingUp,
  CheckCircle, Clock, AlertTriangle, Navigation,
  Wifi, WifiOff, DollarSign, Check, ChevronDown,
  Package, BarChart2,
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
  online:"#43A047", onlineLight:"#E8F5E9",
  offline:"#9E9E9E", offlineLight:"#F5F5F5",
  danger:"#C62828", dangerLight:"#FFEBEE",
  overlayBg:"rgba(13,33,55,0.6)",
};

type RiderStatus = "active"|"inactive"|"suspended";
type VehicleType = "Motorcycle"|"Bicycle"|"Van"|"Tuk-tuk";

interface Rider {
  id:string; name:string; initials:string; phone:string; email:string;
  zone:string; vehicle:VehicleType; plateNo:string;
  online:boolean; status:RiderStatus;
  deliveriesToday:number; deliveriesMonth:number;
  completionRate:number; onTimeRate:number; rating:number;
  earningsToday:number; earningsMonth:number;
  joinDate:string; currentLocation:string;
  activeDeliveries:number;
}

const RIDERS: Rider[] = [
  { id:"R01", name:"Kevin Otieno",    initials:"KO", phone:"+254 711 222 333", email:"kevin.o@co.ke",
    zone:"Westlands/CBD",   vehicle:"Motorcycle", plateNo:"KCD 234B",
    online:true,  status:"active", deliveriesToday:8,  deliveriesMonth:142, completionRate:96, onTimeRate:91, rating:4.7,
    earningsToday:1840, earningsMonth:32600, joinDate:"Feb 2025", currentLocation:"Westlands", activeDeliveries:2 },
  { id:"R02", name:"Faith Wanjiru",   initials:"FW", phone:"+254 722 333 444", email:"faith.w@co.ke",
    zone:"Karen/Lang'ata",  vehicle:"Motorcycle", plateNo:"KDB 567C",
    online:true,  status:"active", deliveriesToday:11, deliveriesMonth:168, completionRate:98, onTimeRate:94, rating:4.9,
    earningsToday:2420, earningsMonth:38900, joinDate:"Dec 2024", currentLocation:"Karen", activeDeliveries:1 },
  { id:"R03", name:"Dennis Kamau",    initials:"DK", phone:"+254 733 444 555", email:"dennis.k@co.ke",
    zone:"Kilimani/Hurlingham", vehicle:"Bicycle", plateNo:"—",
    online:true,  status:"active", deliveriesToday:6,  deliveriesMonth:98,  completionRate:92, onTimeRate:88, rating:4.3,
    earningsToday:1200, earningsMonth:22400, joinDate:"Apr 2025", currentLocation:"Kilimani", activeDeliveries:1 },
  { id:"R04", name:"Rose Adhiambo",   initials:"RA", phone:"+254 744 555 666", email:"rose.a@co.ke",
    zone:"Kasarani/Roysambu", vehicle:"Motorcycle", plateNo:"KDC 890D",
    online:false, status:"active", deliveriesToday:4,  deliveriesMonth:115, completionRate:90, onTimeRate:85, rating:4.1,
    earningsToday:880,  earningsMonth:26500, joinDate:"Jan 2025", currentLocation:"Last seen: Kasarani", activeDeliveries:0 },
  { id:"R05", name:"Brian Mwenda",    initials:"BM", phone:"+254 755 666 777", email:"brian.m@co.ke",
    zone:"CBD/Upperhill",   vehicle:"Van",        plateNo:"KDD 123E",
    online:true,  status:"active", deliveriesToday:5,  deliveriesMonth:88,  completionRate:94, onTimeRate:90, rating:4.5,
    earningsToday:1650, earningsMonth:29800, joinDate:"Mar 2025", currentLocation:"CBD", activeDeliveries:3 },
  { id:"R06", name:"Alice Njoki",     initials:"AN", phone:"+254 766 777 888", email:"alice.n@co.ke",
    zone:"Embakasi/Ruiru",  vehicle:"Tuk-tuk",   plateNo:"KDE 456F",
    online:false, status:"inactive", deliveriesToday:0,  deliveriesMonth:62,  completionRate:78, onTimeRate:72, rating:3.8,
    earningsToday:0,    earningsMonth:14200, joinDate:"Jun 2025", currentLocation:"—", activeDeliveries:0 },
  { id:"R07", name:"Tom Gitonga",     initials:"TG", phone:"+254 777 888 999", email:"tom.g@co.ke",
    zone:"Ngong Rd",        vehicle:"Motorcycle", plateNo:"KDF 789G",
    online:false, status:"suspended", deliveriesToday:0, deliveriesMonth:44, completionRate:65, onTimeRate:60, rating:3.2,
    earningsToday:0, earningsMonth:10100, joinDate:"Aug 2025", currentLocation:"—", activeDeliveries:0 },
];

const VEHICLE_TYPES: VehicleType[] = ["Motorcycle","Bicycle","Van","Tuk-tuk"];

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const Bar: React.FC<{ value:number; color:string }> = ({ value, color }) => (
  <View style={{ height:4, backgroundColor:COLORS.background, borderRadius:2, overflow:"hidden", flex:1 }}>
    <View style={{ height:4, width:`${value}%` as any, backgroundColor:color, borderRadius:2 }} />
  </View>
);

// ─── Rider Detail Modal ───────────────────────────────────────────────────────
const RiderDetailModal: React.FC<{
  rider:Rider|null; visible:boolean; onClose:()=>void;
  onSuspend:()=>void; onActivate:()=>void;
}> = ({ rider, visible, onClose, onSuspend, onActivate }) => {
  if (!rider) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rm.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={rm.sheet}>
          <View style={rm.handle} />
          <View style={rm.sheetHeader}>
            <View style={[rm.avatar, { backgroundColor: rider.online ? COLORS.accentBlueLight : COLORS.offlineLight }]}>
              <Text style={[rm.avatarText, { color: rider.online ? COLORS.accentBlue : COLORS.offline }]}>{rider.initials}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={rm.sheetName}>{rider.name}</Text>
              <Text style={rm.sheetSub}>{rider.vehicle} · {rider.plateNo}</Text>
              <View style={[rm.statusPill, {
                backgroundColor: rider.status==="active" ? COLORS.successLight : rider.status==="suspended" ? COLORS.dangerLight : COLORS.offlineLight
              }]}>
                <Text style={[rm.statusPillText, {
                  color: rider.status==="active" ? COLORS.success : rider.status==="suspended" ? COLORS.danger : COLORS.offline
                }]}>{rider.status.toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity style={rm.closeBtn} onPress={onClose}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Contact */}
            <Text style={rm.sectionLabel}>Contact & Location</Text>
            <View style={rm.infoCard}>
              {[
                { label:"Phone",    val:rider.phone },
                { label:"Email",    val:rider.email },
                { label:"Zone",     val:rider.zone },
                { label:"Location", val:rider.currentLocation },
                { label:"Joined",   val:rider.joinDate },
              ].map((r,i) => (
                <View key={i} style={[rm.infoRow, i>0 && rm.infoRowBorder]}>
                  <Text style={rm.infoLabel}>{r.label}</Text>
                  <Text style={rm.infoVal}>{r.val}</Text>
                </View>
              ))}
            </View>

            {/* KPIs */}
            <Text style={rm.sectionLabel}>Performance</Text>
            <View style={rm.kpiGrid}>
              {[
                { l:"Today",   v:rider.deliveriesToday,  color:COLORS.primary },
                { l:"Monthly", v:rider.deliveriesMonth,  color:COLORS.accentBlue },
                { l:"Rating",  v:rider.rating,           color:COLORS.warning },
                { l:"Active",  v:rider.activeDeliveries, color:COLORS.success },
              ].map(k => (
                <View key={k.l} style={rm.kpiItem}>
                  <Text style={[rm.kpiVal, { color:k.color }]}>{k.v}</Text>
                  <Text style={rm.kpiLbl}>{k.l}</Text>
                </View>
              ))}
            </View>
            <View style={rm.infoCard}>
              {[
                { l:"Completion Rate", v:rider.completionRate, color:COLORS.success },
                { l:"On-Time Rate",    v:rider.onTimeRate,     color:COLORS.accentBlue },
              ].map((r,i) => (
                <View key={i} style={[{ paddingVertical:10 }, i>0 && { borderTopWidth:1, borderTopColor:COLORS.border }]}>
                  <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:6 }}>
                    <Text style={rm.infoLabel}>{r.l}</Text>
                    <Text style={[rm.infoVal, { color:r.color }]}>{r.v}%</Text>
                  </View>
                  <Bar value={r.v} color={r.color} />
                </View>
              ))}
            </View>

            {/* Earnings */}
            <Text style={rm.sectionLabel}>Earnings</Text>
            <View style={rm.earningsCard}>
              <View style={rm.earningsItem}>
                <Text style={rm.earningsVal}>KES {rider.earningsToday.toLocaleString()}</Text>
                <Text style={rm.earningsLbl}>Today</Text>
              </View>
              <View style={rm.earningsDivider} />
              <View style={rm.earningsItem}>
                <Text style={rm.earningsVal}>KES {rider.earningsMonth.toLocaleString()}</Text>
                <Text style={rm.earningsLbl}>This Month</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={rm.sheetActions}>
              {rider.status==="active" ? (
                <TouchableOpacity style={rm.suspendBtn} onPress={onSuspend} activeOpacity={0.85}>
                  <AlertTriangle size={14} color={COLORS.white} />
                  <Text style={rm.suspendBtnText}>Suspend Rider</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={rm.activateBtn} onPress={onActivate} activeOpacity={0.85}>
                  <CheckCircle size={14} color={COLORS.white} />
                  <Text style={rm.activateBtnText}>Activate Rider</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ height:20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
interface RiderForm { name:string; phone:string; email:string; zone:string; vehicle:VehicleType; plateNo:string }
const EMPTY_FORM: RiderForm = { name:"", phone:"", email:"", zone:"", vehicle:"Motorcycle", plateNo:"" };

const AddEditModal: React.FC<{
  visible:boolean; rider:Rider|null; onClose:()=>void; onSave:(f:RiderForm)=>void;
}> = ({ visible, rider, onClose, onSave }) => {
  const [form, setForm] = useState<RiderForm>(EMPTY_FORM);
  const [showVehicles, setShowVehicles] = useState(false);

  React.useEffect(()=>{
    setForm(rider ? { name:rider.name, phone:rider.phone, email:rider.email,
      zone:rider.zone, vehicle:rider.vehicle, plateNo:rider.plateNo } : EMPTY_FORM);
  }, [rider, visible]);

  const F: React.FC<{ label:string; value:string; onChange:(v:string)=>void; placeholder:string; kb?:any }> =
    ({ label, value, onChange, placeholder, kb }) => (
    <View style={rm.fieldGroup}>
      <Text style={rm.fieldLabel}>{label}</Text>
      <TextInput style={rm.fieldInput} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={COLORS.textMuted} keyboardType={kb||"default"} />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rm.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[rm.sheet, { paddingBottom:Platform.OS==="ios"?40:28 }]}>
          <View style={rm.handle} />
          <View style={rm.modalTitleRow}>
            <Text style={rm.modalTitle}>{rider ? "Edit Rider" : "Add Rider"}</Text>
            <TouchableOpacity style={rm.closeBtn} onPress={onClose}><X size={18} color={COLORS.textSecondary}/></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <F label="Full Name *"  value={form.name}    onChange={v=>setForm({...form,name:v})}    placeholder="e.g. Kevin Otieno" />
            <F label="Phone *"      value={form.phone}   onChange={v=>setForm({...form,phone:v})}   placeholder="+254 7xx xxx xxx" kb="phone-pad" />
            <F label="Email"        value={form.email}   onChange={v=>setForm({...form,email:v})}   placeholder="name@co.ke" kb="email-address" />
            <F label="Zone *"       value={form.zone}    onChange={v=>setForm({...form,zone:v})}    placeholder="e.g. Westlands/CBD" />
            <F label="Plate Number" value={form.plateNo} onChange={v=>setForm({...form,plateNo:v})} placeholder="e.g. KCD 234B" />
            <View style={rm.fieldGroup}>
              <Text style={rm.fieldLabel}>Vehicle Type *</Text>
              <TouchableOpacity style={rm.dropdown} onPress={()=>setShowVehicles(!showVehicles)} activeOpacity={0.8}>
                <Text style={rm.dropdownText}>{form.vehicle}</Text>
                <ChevronDown size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              {showVehicles && (
                <View style={rm.dropdownOptions}>
                  {VEHICLE_TYPES.map(v => (
                    <TouchableOpacity key={v} style={[rm.dropdownOption, form.vehicle===v && rm.dropdownOptionActive]}
                      onPress={()=>{ setForm({...form,vehicle:v}); setShowVehicles(false); }} activeOpacity={0.8}>
                      <Text style={[rm.dropdownOptionText, form.vehicle===v && rm.dropdownOptionTextActive]}>{v}</Text>
                      {form.vehicle===v && <Check size={14} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={rm.sheetActions}>
              <TouchableOpacity style={rm.cancelBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={rm.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={rm.saveBtn} onPress={()=>{ if(!form.name||!form.phone||!form.zone){Alert.alert("Required","Name, phone and zone are required.");return;} onSave(form); }} activeOpacity={0.85}>
                <Text style={rm.saveBtnText}>{rider?"Save Changes":"Add Rider"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Rider Card ───────────────────────────────────────────────────────────────
const RiderCard: React.FC<{
  rider:Rider; onView:()=>void; onEdit:()=>void; onRemove:()=>void;
}> = ({ rider, onView, onEdit, onRemove }) => (
  <View style={rm.card}>
    <View style={rm.cardBody}>
      <View style={rm.cardTop}>
        <View style={rm.avatarWrap}>
          <View style={[rm.avatar, { backgroundColor: rider.online ? COLORS.accentBlueLight : COLORS.offlineLight }]}>
            <Text style={[rm.avatarText, { color: rider.online ? COLORS.accentBlue : COLORS.offline }]}>{rider.initials}</Text>
          </View>
          <View style={[rm.onlineDot, { backgroundColor: rider.online ? COLORS.online : COLORS.offline }]} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={rm.cardName}>{rider.name}</Text>
          <View style={rm.cardMeta}>
            <Truck size={10} color={COLORS.textMuted} />
            <Text style={rm.metaText}>{rider.vehicle} · {rider.plateNo}</Text>
          </View>
          <View style={rm.cardMeta}>
            <MapPin size={10} color={COLORS.textMuted} />
            <Text style={rm.metaText}>{rider.zone}</Text>
          </View>
        </View>
        <View style={{ alignItems:"flex-end", gap:4 }}>
          <View style={[rm.statusPill, {
            backgroundColor: rider.status==="active" ? COLORS.successLight : rider.status==="suspended" ? COLORS.dangerLight : COLORS.offlineLight
          }]}>
            <Text style={[rm.statusPillText, {
              color: rider.status==="active" ? COLORS.success : rider.status==="suspended" ? COLORS.danger : COLORS.offline
            }]}>{rider.status.toUpperCase()}</Text>
          </View>
          {rider.activeDeliveries>0 && (
            <View style={rm.activeBadge}>
              <Text style={rm.activeBadgeText}>{rider.activeDeliveries} active</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={rm.statsRow}>
        {[
          { l:"Today",    v:rider.deliveriesToday,  color:COLORS.primary    },
          { l:"Monthly",  v:rider.deliveriesMonth,  color:COLORS.accentBlue },
          { l:"Rate",     v:`${rider.completionRate}%`, color:COLORS.success },
          { l:"Rating",   v:rider.rating,           color:COLORS.warning    },
        ].map(s => (
          <View key={s.l} style={rm.statItem}>
            <Text style={[rm.statVal, { color:s.color }]}>{s.v}</Text>
            <Text style={rm.statLbl}>{s.l}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={rm.cardActions}>
        <TouchableOpacity style={rm.viewBtn} onPress={onView} activeOpacity={0.8}>
          <Eye size={13} color={COLORS.accentBlue} />
          <Text style={rm.viewBtnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={rm.editBtn} onPress={onEdit} activeOpacity={0.8}>
          <Edit2 size={13} color={COLORS.primary} />
          <Text style={rm.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={rm.removeBtn} onPress={onRemove} activeOpacity={0.8}>
          <Trash2 size={13} color={COLORS.danger} />
          <Text style={rm.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface RidersManagementScreenProps { navigation?:any }

const RidersManagementScreen: React.FC<RidersManagementScreenProps> = ({ navigation }) => {
  const [riders,       setRiders]       = useState<Rider[]>(RIDERS);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|RiderStatus>("all");
  const [onlineFilter, setOnlineFilter] = useState<"all"|"online"|"offline">("all");
  const [viewRider,    setViewRider]    = useState<Rider|null>(null);
  const [editRider,    setEditRider]    = useState<Rider|null>(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [showFilter,   setShowFilter]   = useState(false);

  const onlineCount  = riders.filter(r=>r.online).length;
  const activeCount  = riders.filter(r=>r.status==="active").length;
  const totalToday   = riders.reduce((s,r)=>s+r.deliveriesToday,0);
  const avgRating    = (riders.reduce((s,r)=>s+r.rating,0)/riders.length).toFixed(1);

  const filtered = riders
    .filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.zone.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter!=="all" && r.status!==statusFilter) return false;
      if (onlineFilter==="online" && !r.online) return false;
      if (onlineFilter==="offline" && r.online) return false;
      return true;
    })
    .sort((a,b)=>b.deliveriesMonth-a.deliveriesMonth);

  const handleSave = (form: RiderForm) => {
    if (editRider) {
      setRiders(prev=>prev.map(r=>r.id===editRider.id ? { ...r, ...form } : r));
    } else {
      const n: Rider = {
        id:`R0${riders.length+1}`, ...form,
        initials: form.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
        online:false, status:"active", deliveriesToday:0, deliveriesMonth:0,
        completionRate:0, onTimeRate:0, rating:0, earningsToday:0, earningsMonth:0,
        joinDate: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
        currentLocation:"—", activeDeliveries:0,
      };
      setRiders(prev=>[...prev,n]);
    }
    setShowAdd(false); setEditRider(null);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <View style={s.header}>
           <TouchableOpacity
          style={s.menuBtn}
          onPress={() => navigation?.openDrawer()}
          activeOpacity={0.7}
        >
          <Menu size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Riders Management</Text>
        <TouchableOpacity style={s.addBtn} onPress={()=>{setEditRider(null);setShowAdd(true);}} activeOpacity={0.8}>
          <Plus size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI strip */}
        <View style={rm.kpiStrip}>
          {[
            { v:riders.length, l:"Total",   c:COLORS.primary    },
            { v:onlineCount,   l:"Online",  c:COLORS.online     },
            { v:totalToday,    l:"Today",   c:COLORS.accentBlue },
            { v:avgRating,     l:"Avg ⭐",  c:COLORS.warning    },
          ].map(k => (
            <View key={k.l} style={rm.kpiItem}>
              <Text style={[rm.kpiVal, { color:k.c }]}>{k.v}</Text>
              <Text style={rm.kpiLbl}>{k.l}</Text>
            </View>
          ))}
        </View>

        {/* Search + Filter */}
        <View style={rm.searchRow}>
          <View style={rm.searchBox}>
            <Search size={15} color={COLORS.textMuted} />
            <TextInput style={rm.searchInput} value={search} onChangeText={setSearch}
              placeholder="Search name or zone..." placeholderTextColor={COLORS.textMuted} />
            {search ? <TouchableOpacity onPress={()=>setSearch("")}><X size={14} color={COLORS.textMuted}/></TouchableOpacity> : null}
          </View>
          <TouchableOpacity style={rm.filterBtn} onPress={()=>setShowFilter(!showFilter)} activeOpacity={0.8}>
            <Filter size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {showFilter && (
          <View style={rm.filterPanel}>
            <Text style={rm.filterPanelLabel}>Status</Text>
            <View style={rm.filterPills}>
              {(["all","active","inactive","suspended"] as const).map(s => (
                <TouchableOpacity key={s} style={[rm.pill, statusFilter===s && rm.pillActive]}
                  onPress={()=>setStatusFilter(s)} activeOpacity={0.8}>
                  <Text style={[rm.pillText, statusFilter===s && rm.pillTextActive]}>{s.charAt(0).toUpperCase()+s.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[rm.filterPanelLabel, { marginTop:10 }]}>Availability</Text>
            <View style={rm.filterPills}>
              {(["all","online","offline"] as const).map(s => (
                <TouchableOpacity key={s} style={[rm.pill, onlineFilter===s && rm.pillActive]}
                  onPress={()=>setOnlineFilter(s)} activeOpacity={0.8}>
                  <Text style={[rm.pillText, onlineFilter===s && rm.pillTextActive]}>{s.charAt(0).toUpperCase()+s.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={rm.resultRow}>
          <Text style={rm.resultText}>{filtered.length} rider{filtered.length!==1?"s":""}</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor:COLORS.online }} />
            <Text style={{ fontSize:11, fontWeight:"700", color:COLORS.online }}>{onlineCount} online</Text>
          </View>
        </View>

        {filtered.map((r,i) => (
          <React.Fragment key={r.id}>
            <RiderCard
              rider={r}
              onView={()=>setViewRider(r)}
              onEdit={()=>{ setEditRider(r); setShowAdd(true); }}
              onRemove={()=>Alert.alert("Remove Rider",`Remove ${r.name}?`,[
                {text:"Cancel",style:"cancel"},
                {text:"Remove",style:"destructive",onPress:()=>setRiders(prev=>prev.filter(x=>x.id!==r.id))},
              ])}
            />
            {i<filtered.length-1 && <View style={{height:10}}/>}
          </React.Fragment>
        ))}
        <View style={{ height:40 }} />
      </ScrollView>

      <RiderDetailModal rider={viewRider} visible={!!viewRider} onClose={()=>setViewRider(null)}
        onSuspend={()=>{ setRiders(prev=>prev.map(r=>r.id===viewRider?.id?{...r,status:"suspended"}:r)); setViewRider(null); }}
        onActivate={()=>{ setRiders(prev=>prev.map(r=>r.id===viewRider?.id?{...r,status:"active"}:r)); setViewRider(null); }}
      />
      <AddEditModal visible={showAdd} rider={editRider} onClose={()=>{setShowAdd(false);setEditRider(null);}} onSave={handleSave} />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:{ flex:1, backgroundColor:COLORS.primaryDark },
  header:{ backgroundColor:COLORS.primaryDark, paddingTop:8, paddingBottom:20, paddingHorizontal:16,
           flexDirection:"row", alignItems:"center", gap:10 },
               menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  backBtn:{ width:38, height:38, borderRadius:12, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center" },
  headerTitle:{ flex:1, fontSize:18, fontWeight:"800", color:COLORS.white, letterSpacing:0.2 },
  addBtn:{ width:38, height:38, borderRadius:12, backgroundColor:"rgba(255,255,255,0.18)", alignItems:"center", justifyContent:"center" },
  scroll:{ flex:1, backgroundColor:COLORS.background, borderTopLeftRadius:24, borderTopRightRadius:24, marginTop:-10 },
  scrollContent:{ paddingTop:20, paddingHorizontal:18 },
});

const rm = StyleSheet.create({
  kpiStrip:{ flexDirection:"row", backgroundColor:COLORS.cardBg, borderRadius:18, paddingVertical:14, paddingHorizontal:10,
             marginBottom:16, shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  kpiItem:{ flex:1, alignItems:"center" },
  kpiVal:{ fontSize:20, fontWeight:"900", letterSpacing:-0.5 },
  kpiLbl:{ fontSize:10, fontWeight:"600", color:COLORS.textMuted, marginTop:2, textTransform:"uppercase" },

  searchRow:{ flexDirection:"row", gap:10, marginBottom:10 },
  searchBox:{ flex:1, flexDirection:"row", alignItems:"center", backgroundColor:COLORS.cardBg,
              borderRadius:14, paddingHorizontal:12, paddingVertical:10, gap:8,
              borderWidth:1, borderColor:COLORS.border },
  searchInput:{ flex:1, fontSize:13, color:COLORS.textPrimary, fontWeight:"600", padding:0 },
  filterBtn:{ width:44, height:44, borderRadius:14, backgroundColor:COLORS.primaryMuted,
              alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:COLORS.border },
  filterPanel:{ backgroundColor:COLORS.cardBg, borderRadius:16, padding:14, marginBottom:12,
                borderWidth:1, borderColor:COLORS.border },
  filterPanelLabel:{ fontSize:10, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:8 },
  filterPills:{ flexDirection:"row", gap:6, flexWrap:"wrap" },
  pill:{ paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor:COLORS.background, borderWidth:1, borderColor:COLORS.border },
  pillActive:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  pillText:{ fontSize:11, fontWeight:"600", color:COLORS.textMuted },
  pillTextActive:{ color:COLORS.white },

  resultRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  resultText:{ fontSize:13, fontWeight:"700", color:COLORS.textSecondary },

  card:{ backgroundColor:COLORS.cardBg, borderRadius:18, flexDirection:"row", overflow:"hidden",
         shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  cardBody:{ flex:1, padding:14, gap:10 },
  cardTop:{ flexDirection:"row", alignItems:"flex-start", gap:10 },
  avatarWrap:{ position:"relative", width:44, height:44 },
  avatar:{ width:44, height:44, borderRadius:22, alignItems:"center", justifyContent:"center" },
  avatarText:{ fontSize:15, fontWeight:"800" },
  onlineDot:{ position:"absolute", bottom:1, right:1, width:12, height:12, borderRadius:6, borderWidth:2, borderColor:COLORS.cardBg },
  cardName:{ fontSize:15, fontWeight:"800", color:COLORS.textPrimary },
  cardMeta:{ flexDirection:"row", alignItems:"center", gap:4, marginTop:2 },
  metaText:{ fontSize:11, color:COLORS.textMuted, fontWeight:"500" },
  statusPill:{ paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  statusPillText:{ fontSize:9, fontWeight:"800", letterSpacing:0.4 },
  activeBadge:{ backgroundColor:COLORS.accentBlueLight, paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  activeBadgeText:{ fontSize:9, fontWeight:"700", color:COLORS.accentBlue },

  statsRow:{ flexDirection:"row", backgroundColor:COLORS.background, borderRadius:12, paddingVertical:8 },
  statItem:{ flex:1, alignItems:"center" },
  statVal:{ fontSize:15, fontWeight:"800" },
  statLbl:{ fontSize:9, color:COLORS.textMuted, fontWeight:"600", textTransform:"uppercase", marginTop:1 },

  cardActions:{ flexDirection:"row", gap:8 },
  viewBtn:{ flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
            paddingVertical:8, borderRadius:10, backgroundColor:COLORS.accentBlueLight, borderWidth:1, borderColor:"rgba(21,101,192,0.15)" },
  viewBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.accentBlue },
  editBtn:{ flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
            paddingVertical:8, borderRadius:10, backgroundColor:COLORS.primaryMuted, borderWidth:1, borderColor:COLORS.primaryLight },
  editBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.primary },
  removeBtn:{ flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
              paddingVertical:8, borderRadius:10, backgroundColor:COLORS.dangerLight, borderWidth:1, borderColor:"rgba(198,40,40,0.15)" },
  removeBtnText:{ fontSize:12, fontWeight:"700", color:COLORS.danger },

  modalOverlay:{ flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  sheet:{ backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28, padding:22, maxHeight:"90%" },
  handle:{ width:44, height:5, borderRadius:3, backgroundColor:COLORS.border, alignSelf:"center", marginBottom:18 },
  sheetHeader:{ flexDirection:"row", gap:12, alignItems:"flex-start", marginBottom:16 },
  sheetName:{ fontSize:18, fontWeight:"800", color:COLORS.textPrimary },
  sheetSub:{ fontSize:12, color:COLORS.textMuted, fontWeight:"600", marginTop:2 },
  closeBtn:{ width:32, height:32, borderRadius:16, backgroundColor:COLORS.background, alignItems:"center", justifyContent:"center" },
  sectionLabel:{ fontSize:11, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginTop:14, marginBottom:8 },
  infoCard:{ backgroundColor:COLORS.background, borderRadius:14, paddingHorizontal:12 },
  infoRow:{ flexDirection:"row", justifyContent:"space-between", paddingVertical:10 },
  infoRowBorder:{ borderTopWidth:1, borderTopColor:COLORS.border },
  infoLabel:{ fontSize:13, color:COLORS.textSecondary, fontWeight:"600" },
  infoVal:{ fontSize:13, color:COLORS.textPrimary, fontWeight:"700", flex:1, textAlign:"right" },
  kpiGrid:{ flexDirection:"row", backgroundColor:COLORS.background, borderRadius:14, paddingVertical:12, marginBottom:10 },
  earningsCard:{ flexDirection:"row", backgroundColor:COLORS.successLight, borderRadius:14, padding:16 },
  earningsItem:{ flex:1, alignItems:"center" },
  earningsDivider:{ width:1, backgroundColor:COLORS.success, opacity:0.3 },
  earningsVal:{ fontSize:16, fontWeight:"800", color:COLORS.success },
  earningsLbl:{ fontSize:10, color:COLORS.success, fontWeight:"600", marginTop:2 },
  sheetActions:{ flexDirection:"row", gap:12, marginTop:16 },
  suspendBtn:{ flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8,
               paddingVertical:14, borderRadius:14, backgroundColor:COLORS.danger,
               shadowColor:COLORS.danger, shadowOpacity:0.3, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:4 },
  suspendBtnText:{ fontSize:13, fontWeight:"800", color:COLORS.white },
  activateBtn:{ flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8,
                paddingVertical:14, borderRadius:14, backgroundColor:COLORS.success,
                shadowColor:COLORS.success, shadowOpacity:0.3, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:4 },
  activateBtnText:{ fontSize:13, fontWeight:"800", color:COLORS.white },
  cancelBtn:{ flex:1, paddingVertical:14, borderRadius:14, backgroundColor:COLORS.background,
              borderWidth:1.5, borderColor:COLORS.border, alignItems:"center" },
  cancelBtnText:{ fontSize:14, fontWeight:"700", color:COLORS.textSecondary },
  saveBtn:{ flex:2, paddingVertical:14, borderRadius:14, backgroundColor:COLORS.primary, alignItems:"center",
            shadowColor:COLORS.primary, shadowOpacity:0.4, shadowRadius:10, shadowOffset:{width:0,height:4}, elevation:6 },
  saveBtnText:{ fontSize:14, fontWeight:"800", color:COLORS.white, letterSpacing:0.3 },
  modalTitleRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:18 },
  modalTitle:{ fontSize:18, fontWeight:"800", color:COLORS.textPrimary },
  fieldGroup:{ marginBottom:14 },
  fieldLabel:{ fontSize:11, fontWeight:"700", color:COLORS.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 },
  fieldInput:{ backgroundColor:COLORS.background, borderRadius:12, borderWidth:1.5, borderColor:COLORS.border,
               paddingHorizontal:14, paddingVertical:12, fontSize:14, fontWeight:"600", color:COLORS.textPrimary },
  dropdown:{ backgroundColor:COLORS.background, borderRadius:12, borderWidth:1.5, borderColor:COLORS.border,
             paddingHorizontal:14, paddingVertical:12, flexDirection:"row", justifyContent:"space-between" },
  dropdownText:{ fontSize:14, fontWeight:"600", color:COLORS.textPrimary },
  dropdownOptions:{ backgroundColor:COLORS.cardBg, borderRadius:12, borderWidth:1, borderColor:COLORS.border, marginTop:4 },
  dropdownOption:{ paddingVertical:12, paddingHorizontal:14, flexDirection:"row", justifyContent:"space-between" },
  dropdownOptionActive:{ backgroundColor:COLORS.primaryMuted },
  dropdownOptionText:{ fontSize:13, fontWeight:"600", color:COLORS.textSecondary },
  dropdownOptionTextActive:{ color:COLORS.primary, fontWeight:"800" },

});

export default RidersManagementScreen;