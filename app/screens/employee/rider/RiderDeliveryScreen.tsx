import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, Platform, Alert, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Package, MapPin, Clock, CheckCircle, ChevronRight,
  Navigation, Phone, AlertTriangle, LogOut,
  Truck, Check, X, User, Star, XCircle,
  ChevronDown, Calendar, TrendingUp,
} from "lucide-react-native";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#8B0111", primaryDark: "#8B0111",
  primaryMuted: "rgba(139,1,17,0.08)", primaryLight: "rgba(139,1,17,0.15)",
  white: "#FFFFFF", background: "#F0F5FB", cardBg: "#FFFFFF",
  textPrimary: "#0D2137", textSecondary: "#4A6580", textMuted: "#8FA3B8",
  border: "#D6E4F0",
  success: "#00897B", successLight: "#E0F2F1",
  warning: "#F57C00", warningLight: "#FFF3E0",
  accentBlue: "#1565C0", accentBlueLight: "#E3F0FF",
  online: "#43A047", onlineLight: "#E8F5E9",
  danger: "#C62828", dangerLight: "#FFEBEE",
  inProgress: "#1565C0", inProgressLight: "#E3F0FF",
  overlayBg: "rgba(13,33,55,0.6)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type DeliveryStage = "assigned" | "pickup" | "on_way" | "completed";
type CancellationReason = "customer_request" | "store_closed" | "item_unavailable" | "wrong_address" | "vehicle_issue" | "other";

interface Delivery {
  id: string; orderId: string;
  customerName: string; customerPhone: string;
  pickupAddress: string; dropoffAddress: string;
  items: string; itemCount: number;
  stage: DeliveryStage; priority: "high" | "normal" | "low";
  distance: string;
  assignedAt: string;
  notes: string;
  zone: string;
  completedAt?: string;
  earnings?: number;
  cancellationReason?: CancellationReason;
}

interface CompletedDelivery {
  id: string;
  orderId: string;
  customerName: string;
  completedAt: string;
  earnings: number;
  distance: string;
  date: string;
}

const CANCEL_REASONS: { value: CancellationReason; label: string }[] = [
  { value: "customer_request", label: "Customer Requested Cancellation" },
  { value: "store_closed", label: "Store/Outlet Closed" },
  { value: "item_unavailable", label: "Item Unavailable" },
  { value: "wrong_address", label: "Wrong Address Provided" },
  { value: "vehicle_issue", label: "Vehicle/Mechanical Issue" },
  { value: "other", label: "Other Reason" },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const RIDER = {
  id: "R01", 
  name: "Kevin Otieno", 
  phone: "+254 711 222 333",
  vehicle: "Motorcycle • KCD 234B",
  zone: "Westlands / CBD",
  email: "kevin.otieno@example.com",
};

const CURRENT_DELIVERY: Delivery = {
  id: "1", 
  orderId: "ORD-0042", 
  customerName: "Mary Njoroge", 
  customerPhone: "+254 722 111 222",
  pickupAddress: "Carrefour, The Hub Karen", 
  dropoffAddress: "Lang'ata Rd, House 14A",
  items: "Groceries & Household Items", 
  itemCount: 6,
  stage: "assigned", 
  priority: "high",
  distance: "3.2 km",
  assignedAt: "10:15 AM",
  notes: "Gate code: 2244. Call on arrival. Fragile items - handle with care.",
  zone: "Karen",
};

const COMPLETED_DELIVERIES: CompletedDelivery[] = [
  { id: "1", orderId: "ORD-0039", customerName: "Peter Omondi", completedAt: "08:30 AM", earnings: 165, distance: "2.9 km", date: "2024-01-15" },
  { id: "2", orderId: "ORD-0040", customerName: "Sarah Wambui", completedAt: "09:10 AM", earnings: 195, distance: "4.4 km", date: "2024-01-15" },
  { id: "3", orderId: "ORD-0041", customerName: "James Kamau", completedAt: "10:45 AM", earnings: 210, distance: "5.8 km", date: "2024-01-14" },
  { id: "4", orderId: "ORD-0043", customerName: "Aisha Mwangi", completedAt: "11:30 AM", earnings: 190, distance: "7.1 km", date: "2024-01-14" },
  { id: "5", orderId: "ORD-0044", customerName: "John Mburu", completedAt: "02:15 PM", earnings: 175, distance: "3.2 km", date: "2024-01-13" },
];

// ─── Cancel Order Modal ───────────────────────────────────────────────────────
const CancelOrderModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: CancellationReason, note: string) => void;
}> = ({ visible, onClose, onConfirm }) => {
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
  const [note, setNote] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConfirm = () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for cancellation");
      return;
    }
    onConfirm(selectedReason, note);
    setSelectedReason(null);
    setNote("");
    setShowDropdown(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cm.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={cm.modalSheet}>
          <View style={cm.modalHandle} />
          <View style={cm.modalHeader}>
            <View style={cm.modalTitleIcon}>
              <XCircle size={24} color={COLORS.danger} />
              <Text style={cm.modalTitle}>Cancel Order</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={cm.label}>Reason for Cancellation *</Text>
            <TouchableOpacity style={cm.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={cm.dropdownText}>
                {selectedReason ? CANCEL_REASONS.find(r => r.value === selectedReason)?.label : "Select a reason"}
              </Text>
              <ChevronDown size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
            
            {showDropdown && (
              <View style={cm.dropdownOptions}>
                {CANCEL_REASONS.map(reason => (
                  <TouchableOpacity
                    key={reason.value}
                    style={cm.dropdownOption}
                    onPress={() => {
                      setSelectedReason(reason.value);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={cm.dropdownOptionText}>{reason.label}</Text>
                    {selectedReason === reason.value && <Check size={14} color={COLORS.success} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[cm.label, { marginTop: 16 }]}>Additional Note (Optional)</Text>
            <TextInput
              style={cm.textArea}
              placeholder="Provide more details about the cancellation..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
            />

            <View style={cm.buttonContainer}>
              <TouchableOpacity style={cm.cancelButton} onPress={onClose}>
                <Text style={cm.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cm.confirmButton} onPress={handleConfirm}>
                <Text style={cm.confirmButtonText}>Confirm Cancellation</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Assigned Card ────────────────────────────────────────────────────────────
const AssignedCard: React.FC<{
  delivery: Delivery;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ delivery, onConfirm, onCancel }) => {
  return (
    <View style={rd.deliveryCard}>
      <View style={rd.cardHeader}>
        <View style={rd.priorityBadge}>
          <AlertTriangle size={12} color={delivery.priority === "high" ? COLORS.danger : COLORS.warning} />
          <Text style={[rd.priorityText, { color: delivery.priority === "high" ? COLORS.danger : COLORS.warning }]}>
            {delivery.priority.toUpperCase()} PRIORITY
          </Text>
        </View>
        <Text style={rd.orderId}>{delivery.orderId}</Text>
      </View>

      <View style={rd.infoSection}>
        <View style={rd.infoRow}>
          <Package size={16} color={COLORS.textMuted} />
          <Text style={rd.infoText}>{delivery.items} • {delivery.itemCount} items</Text>
        </View>
        <View style={rd.infoRow}>
          <MapPin size={16} color={COLORS.textMuted} />
          <Text style={rd.infoText} numberOfLines={2}>{delivery.pickupAddress}</Text>
        </View>
        <View style={rd.infoRow}>
          <Navigation size={16} color={COLORS.textMuted} />
          <Text style={rd.infoText} numberOfLines={2}>{delivery.dropoffAddress}</Text>
        </View>
        <View style={rd.infoRow}>
          <Truck size={16} color={COLORS.textMuted} />
          <Text style={rd.infoText}>{delivery.distance} • Assigned at {delivery.assignedAt}</Text>
        </View>
      </View>

      <View style={rd.buttonGroup}>
        <TouchableOpacity style={rd.cancelButton} onPress={onCancel}>
          <XCircle size={18} color={COLORS.danger} />
          <Text style={rd.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={rd.confirmButton} onPress={onConfirm}>
          <CheckCircle size={18} color={COLORS.white} />
          <Text style={rd.confirmButtonText}>Confirm & Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Pickup Card ──────────────────────────────────────────────────────────────
const PickupCard: React.FC<{
  delivery: Delivery;
  onConfirmPickup: () => void;
  onCall: () => void;
}> = ({ delivery, onConfirmPickup, onCall }) => {
  return (
    <View style={rd.deliveryCard}>
      <View style={rd.cardHeader}>
        <View style={rd.stageBadge}>
          <MapPin size={14} color={COLORS.warning} />
          <Text style={rd.stageText}>Pickup Stage</Text>
        </View>
        <Text style={rd.orderId}>{delivery.orderId}</Text>
      </View>

      <View style={rd.locationCard}>
        <View style={rd.locationHeader}>
          <MapPin size={18} color={COLORS.warning} />
          <Text style={rd.locationTitle}>Pickup Location</Text>
        </View>
        <Text style={rd.locationAddress}>{delivery.pickupAddress}</Text>
        <TouchableOpacity style={rd.callVendorButton} onPress={onCall}>
          <Phone size={14} color={COLORS.success} />
          <Text style={rd.callVendorText}>Call Store/Vendor</Text>
        </TouchableOpacity>
      </View>

      <View style={rd.itemsCard}>
        <Text style={rd.itemsTitle}>Items to Pickup</Text>
        <Text style={rd.itemsDescription}>{delivery.items} ({delivery.itemCount} items)</Text>
        {delivery.notes && (
          <View style={rd.noteBox}>
            <AlertTriangle size={12} color={COLORS.warning} />
            <Text style={rd.noteText}>{delivery.notes}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={rd.pickupButton} onPress={onConfirmPickup}>
        <CheckCircle size={20} color={COLORS.white} />
        <Text style={rd.pickupButtonText}>Confirm Package Collected</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── On The Way Card ──────────────────────────────────────────────────────────
const OnTheWayCard: React.FC<{
  delivery: Delivery;
  onMarkDelivered: () => void;
  onCall: () => void;
  onNavigate: () => void;
}> = ({ delivery, onMarkDelivered, onCall, onNavigate }) => {
  return (
    <View style={rd.deliveryCard}>
      <View style={rd.cardHeader}>
        <View style={rd.stageBadge}>
          <Truck size={14} color={COLORS.online} />
          <Text style={[rd.stageText, { color: COLORS.online }]}>On The Way</Text>
        </View>
        <Text style={rd.orderId}>{delivery.orderId}</Text>
      </View>

      <View style={rd.locationCard}>
        <View style={rd.locationHeader}>
          <MapPin size={18} color={COLORS.warning} />
          <Text style={rd.locationTitle}>Pickup Location</Text>
        </View>
        <Text style={rd.locationAddress}>{delivery.pickupAddress}</Text>
      </View>

      <View style={[rd.locationCard, { marginTop: 12 }]}>
        <View style={rd.locationHeader}>
          <Navigation size={18} color={COLORS.success} />
          <Text style={rd.locationTitle}>Dropoff Location</Text>
        </View>
        <Text style={rd.locationAddress}>{delivery.dropoffAddress}</Text>
        <Text style={rd.distanceText}>{delivery.distance} away</Text>
      </View>

      <View style={rd.customerCard}>
        <Text style={rd.customerName}>{delivery.customerName}</Text>
        <Text style={rd.customerPhone}>{delivery.customerPhone}</Text>
      </View>

      <View style={rd.buttonGroup}>
        <TouchableOpacity style={rd.callButtonSmall} onPress={onCall}>
          <Phone size={16} color={COLORS.success} />
          <Text style={rd.callButtonTextSmall}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={rd.navigateButton} onPress={onNavigate}>
          <Navigation size={16} color={COLORS.white} />
          <Text style={rd.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={rd.deliverButton} onPress={onMarkDelivered}>
          <CheckCircle size={16} color={COLORS.white} />
          <Text style={rd.deliverButtonText}>Mark Delivered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Completed Delivery Item ──────────────────────────────────────────────────
const CompletedDeliveryItem: React.FC<{ delivery: CompletedDelivery }> = ({ delivery }) => {
  return (
    <View style={rd.completedItem}>
      <View style={rd.completedIcon}>
        <CheckCircle size={20} color={COLORS.success} />
      </View>
      <View style={rd.completedContent}>
        <Text style={rd.completedOrderId}>{delivery.orderId}</Text>
        <Text style={rd.completedCustomer}>{delivery.customerName}</Text>
        <View style={rd.completedDetails}>
          <Text style={rd.completedTime}>{delivery.completedAt}</Text>
          <Text style={rd.completedDistance}>{delivery.distance}</Text>
          <Text style={rd.completedEarnings}>KES {delivery.earnings}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface RiderDeliveryScreenProps { navigation?: any }

const RiderDeliveryScreen: React.FC<RiderDeliveryScreenProps> = ({ navigation }) => {
  const [currentDelivery, setCurrentDelivery] = useState<Delivery>(CURRENT_DELIVERY);
  const [completedDeliveries, setCompletedDeliveries] = useState<CompletedDelivery[]>(COMPLETED_DELIVERIES);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<"today" | "all">("today");

  const today = new Date().toISOString().split('T')[0];
  const filteredDeliveries = selectedDate === "today" 
    ? completedDeliveries.filter(d => d.date === today)
    : completedDeliveries;

  const handleConfirmOrder = () => {
    setCurrentDelivery({ ...currentDelivery, stage: "pickup" });
  };

  const handleConfirmPickup = () => {
    Alert.alert(
      "Confirm Pickup",
      "Have you collected all items from the pickup location?",
      [
        { text: "Not Yet", style: "cancel" },
        { 
          text: "Yes, Collected", 
          onPress: () => {
            setCurrentDelivery({ ...currentDelivery, stage: "on_way" });
            Alert.alert("Success", "Items collected! You're now on the way to delivery location.");
          }
        }
      ]
    );
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      "Confirm Delivery",
      "Has the order been successfully delivered to the customer?",
      [
        { text: "Not Yet", style: "cancel" },
        { 
          text: "Yes, Delivered", 
          onPress: () => {
            const newCompleted: CompletedDelivery = {
              id: currentDelivery.id,
              orderId: currentDelivery.orderId,
              customerName: currentDelivery.customerName,
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              earnings: Math.floor(Math.random() * 200) + 150,
              distance: currentDelivery.distance,
              date: new Date().toISOString().split('T')[0],
            };
            setCompletedDeliveries([newCompleted, ...completedDeliveries]);
            Alert.alert("Success", "Delivery completed! 🎉");
            // Reset to a new assigned delivery (mock)
            setCurrentDelivery({
              ...CURRENT_DELIVERY,
              id: Math.random().toString(),
              orderId: `ORD-${Math.floor(Math.random() * 10000)}`,
              customerName: "Next Customer",
              stage: "assigned",
            });
          }
        }
      ]
    );
  };

  const handleCancelOrder = (reason: CancellationReason, note: string) => {
    Alert.alert(
      "Order Cancelled",
      `Order has been cancelled.\nReason: ${CANCEL_REASONS.find(r => r.value === reason)?.label}\n${note ? `Note: ${note}` : ''}`,
      [{ text: "OK", onPress: () => {
        // Reset to a new delivery (mock)
        setCurrentDelivery({
          ...CURRENT_DELIVERY,
          id: Math.random().toString(),
          orderId: `ORD-${Math.floor(Math.random() * 10000)}`,
          stage: "assigned",
        });
      }}]
    );
    setShowCancelModal(false);
  };

  const handleCall = () => {
    Alert.alert("Call Customer", `Calling ${currentDelivery.customerPhone}`);
  };

  const handleNavigate = () => {
    Alert.alert("Navigation", `Opening maps to ${currentDelivery.dropoffAddress}`);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => navigation?.replace("Login") }
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.riderAvatar}>
            <User size={22} color={COLORS.white} />
          </View>
          <View>
            <Text style={s.headerGreet}>Welcome back,</Text>
            <Text style={s.headerName}>{RIDER.name}</Text>
            <Text style={s.headerDetail}>{RIDER.vehicle}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Current Delivery Card */}
        {currentDelivery.stage === "assigned" && (
          <AssignedCard
            delivery={currentDelivery}
            onConfirm={handleConfirmOrder}
            onCancel={() => setShowCancelModal(true)}
          />
        )}
        
        {currentDelivery.stage === "pickup" && (
          <PickupCard
            delivery={currentDelivery}
            onConfirmPickup={handleConfirmPickup}
            onCall={handleCall}
          />
        )}
        
        {currentDelivery.stage === "on_way" && (
          <OnTheWayCard
            delivery={currentDelivery}
            onMarkDelivered={handleMarkDelivered}
            onCall={handleCall}
            onNavigate={handleNavigate}
          />
        )}
        
        {/* Completed Deliveries Section */}
        <View style={rd.historySection}>
          <View style={rd.historyHeader}>
            <Text style={rd.sectionTitle}>Delivery History</Text>
            <View style={rd.dateToggle}>
              <TouchableOpacity
                style={[rd.toggleButton, selectedDate === "today" && rd.toggleButtonActive]}
                onPress={() => setSelectedDate("today")}
              >
                <Text style={[rd.toggleText, selectedDate === "today" && rd.toggleTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[rd.toggleButton, selectedDate === "all" && rd.toggleButtonActive]}
                onPress={() => setSelectedDate("all")}
              >
                <Text style={[rd.toggleText, selectedDate === "all" && rd.toggleTextActive]}>
                  All Time
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {filteredDeliveries.length === 0 ? (
            <View style={rd.emptyState}>
              <Package size={48} color={COLORS.border} />
              <Text style={rd.emptyText}>No deliveries completed yet</Text>
            </View>
          ) : (
            filteredDeliveries.map((delivery, index) => (
              <React.Fragment key={delivery.id}>
                <CompletedDeliveryItem delivery={delivery} />
                {index < filteredDeliveries.length - 1 && <View style={rd.divider} />}
              </React.Fragment>
            ))
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
      
      <CancelOrderModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  riderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerGreet: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  headerName: { fontSize: 18, fontWeight: "800", color: COLORS.white, marginTop: 2 },
  headerDetail: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1, backgroundColor: COLORS.background, marginTop: -10 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 18 },
});

const rd = StyleSheet.create({
  deliveryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.dangerLight,
  },
  priorityText: { fontSize: 10, fontWeight: "800" },
  stageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.accentBlueLight,
  },
  stageText: { fontSize: 10, fontWeight: "800", color: COLORS.accentBlue },
  orderId: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  infoSection: { gap: 12, marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, fontWeight: "500", lineHeight: 18 },
  buttonGroup: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  cancelButtonText: { fontSize: 13, fontWeight: "700", color: COLORS.danger },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  confirmButtonText: { fontSize: 13, fontWeight: "800", color: COLORS.white },
  
  locationCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  locationHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  locationTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  locationAddress: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, marginLeft: 24, marginBottom: 8 },
  callVendorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.successLight,
    marginTop: 8,
    marginLeft: 24,
  },
  callVendorText: { fontSize: 12, fontWeight: "700", color: COLORS.success },
  
  itemsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  itemsTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginBottom: 6 },
  itemsDescription: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 8 },
  noteBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.warningLight, borderRadius: 8, padding: 8, marginTop: 8 },
  noteText: { flex: 1, fontSize: 11, color: COLORS.warning, fontWeight: "600" },
  
  pickupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pickupButtonText: { fontSize: 14, fontWeight: "800", color: COLORS.white },
  
  distanceText: { fontSize: 11, color: COLORS.textMuted, marginLeft: 24, marginTop: 4 },
  customerCard: { backgroundColor: COLORS.accentBlueLight, borderRadius: 12, padding: 14, marginBottom: 16 },
  customerName: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 4 },
  customerPhone: { fontSize: 12, color: COLORS.accentBlue, fontWeight: "600" },
  callButtonSmall: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.successLight,
  },
  callButtonTextSmall: { fontSize: 12, fontWeight: "700", color: COLORS.success },
  navigateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.accentBlue,
  },
  navigateButtonText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  deliverButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.success,
  },
  deliverButtonText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  
  historySection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  dateToggle: { flexDirection: "row", gap: 8 },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.background },
  toggleButtonActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
  toggleTextActive: { color: COLORS.white },
  completedItem: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  completedIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.successLight, alignItems: "center", justifyContent: "center" },
  completedContent: { flex: 1 },
  completedOrderId: { fontSize: 13, fontWeight: "800", color: COLORS.textPrimary },
  completedCustomer: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  completedDetails: { flexDirection: "row", gap: 12, marginTop: 4 },
  completedTime: { fontSize: 11, color: COLORS.textMuted },
  completedDistance: { fontSize: 11, color: COLORS.textMuted },
  completedEarnings: { fontSize: 11, fontWeight: "700", color: COLORS.success },
  divider: { height: 1, backgroundColor: COLORS.border },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
});

const cm = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlayBg, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "85%",
  },
  modalHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 18 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitleIcon: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 8 },
  dropdown: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "500" },
  dropdownOptions: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownOptionText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonContainer: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  confirmButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.danger, alignItems: "center" },
  confirmButtonText: { fontSize: 14, fontWeight: "800", color: COLORS.white },
});

export default RiderDeliveryScreen;