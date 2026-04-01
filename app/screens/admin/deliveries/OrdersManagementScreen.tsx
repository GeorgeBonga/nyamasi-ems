import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, TextInput, Modal, Platform, Alert, KeyboardAvoidingView,
  Dimensions, Animated, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft, Search, X, Package,
  MapPin, Clock, CheckCircle, AlertTriangle, Navigation,
  ChevronDown, RefreshCw, Plus, Truck,
  User, Phone, Check, Map, Target, LocateFixed,
  Navigation2, Home, Navigation as NavigationIcon,Menu,
} from "lucide-react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

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

type OrderStatus = "assigned" | "in_transit" | "delivered" | "failed" | "cancelled";

interface Order {
  id:string; orderId:string;
  customerName:string; customerPhone:string;
  riderName:string; riderId:string;
  pickupAddress:string; dropoffAddress:string;
  items:string; itemCount:number; value:number;
  status:OrderStatus;
  createdAt:string; estimatedDelivery:string;
  distance:string; notes:string;
  gateCode?:string;
  assignedAt?:string;
  deliveredAt?:string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
}

interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "available" | "busy" | "offline";
  currentOrderId?: string;
  rating: number;
  totalDeliveries: number;
  lat?: number;
  lng?: number;
}

const RIDERS_LIST: Rider[] = [
  { id:"R01", name:"Kevin Otieno", phone:"+254 711 222 333", email:"kevin@example.com", status:"available", rating:4.8, totalDeliveries:245, lat:-1.2864, lng:36.8172 },
  { id:"R02", name:"Faith Wanjiru", phone:"+254 722 333 444", email:"faith@example.com", status:"available", rating:4.9, totalDeliveries:312, lat:-1.2921, lng:36.8219 },
  { id:"R03", name:"Dennis Kamau", phone:"+254 733 444 555", email:"dennis@example.com", status:"available", rating:4.7, totalDeliveries:178, lat:-1.2833, lng:36.8172 },
  { id:"R04", name:"Rose Adhiambo", phone:"+254 744 555 666", email:"rose@example.com", status:"available", rating:4.9, totalDeliveries:289, lat:-1.2892, lng:36.8214 },
];

const INITIAL_ORDERS: Order[] = [
  { id:"1",  orderId:"ORD-0050", customerName:"Mary Njoroge",  customerPhone:"+254 722 111 222", riderName:"Kevin Otieno",  riderId:"R01",
    pickupAddress:"Carrefour, The Hub Karen",      dropoffAddress:"Lang'ata Rd, House 14A",
    items:"Groceries", itemCount:6, value:3200, status:"in_transit",
    createdAt:"09:45 AM", estimatedDelivery:"10:30 AM", distance:"3.2 km", notes:"Gate code: 2244", gateCode:"2244",
    pickupLat:-1.2964, pickupLng:36.7972, dropoffLat:-1.3064, dropoffLng:36.8072 },
  { id:"2",  orderId:"ORD-0051", customerName:"James Kamau",   customerPhone:"+254 733 222 333", riderName:"Faith Wanjiru", riderId:"R02",
    pickupAddress:"Naivas, Westlands",             dropoffAddress:"Parklands Ave, Flat 5C",
    items:"Beverages", itemCount:4, value:1800, status:"in_transit",
    createdAt:"10:02 AM", estimatedDelivery:"10:50 AM", distance:"5.8 km", notes:"",
    pickupLat:-1.2624, pickupLng:36.8072, dropoffLat:-1.2724, dropoffLng:36.8172 },
  { id:"3",  orderId:"ORD-0052", customerName:"Aisha Mwangi",  customerPhone:"+254 744 333 444", riderName:"Dennis Kamau", riderId:"R03",
    pickupAddress:"QuickMart, CBD",               dropoffAddress:"Moi Ave, Office Block 3",
    items:"Office Supplies", itemCount:2, value:950, status:"assigned",
    createdAt:"10:20 AM", estimatedDelivery:"11:15 AM", distance:"7.1 km", notes:"Security sign-in required.",
    pickupLat:-1.2833, pickupLng:36.8172, dropoffLat:-1.2933, dropoffLng:36.8272 },
  { id:"4",  orderId:"ORD-0053", customerName:"David Omondi",  customerPhone:"+254 755 444 555", riderName:"Rose Adhiambo", riderId:"R04",
    pickupAddress:"Naivas, Kasarani",              dropoffAddress:"Roysambu Estate, B12",
    items:"Baby Products", itemCount:5, value:4500, status:"assigned",
    createdAt:"10:35 AM", estimatedDelivery:"11:30 AM", distance:"4.4 km", notes:"Fragile items.",
    pickupLat:-1.2164, pickupLng:36.8972, dropoffLat:-1.2264, dropoffLng:36.9072 },
];

const STATUS_CONFIG: Record<OrderStatus, { label:string; color:string; bg:string }> = {
  assigned:   { label:"Assigned",   color:COLORS.accentBlue, bg:COLORS.accentBlueLight },
  in_transit: { label:"On The Way", color:COLORS.online,     bg:COLORS.onlineLight     },
  delivered:  { label:"Delivered",  color:COLORS.success,    bg:COLORS.successLight    },
  failed:     { label:"Failed",     color:COLORS.danger,     bg:COLORS.dangerLight     },
  cancelled:  { label:"Cancelled",  color:COLORS.offline,    bg:COLORS.offlineLight    },
};

// ─── Full Page Live Tracking Modal ───────────────────────────────────────────
const FullPageLiveTracking: React.FC<{
  visible: boolean;
  onClose: () => void;
  rider: Rider | null;
  order: Order | null;
}> = ({ visible, onClose, rider, order }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentLat, setCurrentLat] = useState(rider?.lat || -1.2864);
  const [currentLng, setCurrentLng] = useState(rider?.lng || 36.8172);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setCurrentLat((prev) => prev + 0.001);
      setCurrentLng((prev) => prev + 0.001);
      setRefreshing(false);
      Alert.alert("Location Updated", "Rider location has been refreshed");
    }, 1500);
  };

  if (!rider || !order) return null;

  const region = {
    latitude: currentLat,
    longitude: currentLng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={lt.fullContainer}>
        <Animated.View style={[lt.fullContent, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={lt.fullHeader}>
            <TouchableOpacity onPress={onClose} style={lt.closeButton}>
              <X size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={lt.fullTitle}>Live Rider Tracking</Text>
            <TouchableOpacity onPress={handleRefresh} style={lt.refreshButtonFull}>
              <RefreshCw size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Full Screen Map */}
          <View style={lt.fullMapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={lt.fullMap}
              region={region}
              showsUserLocation
              showsMyLocationButton
            >
              <Marker
                coordinate={{ latitude: currentLat, longitude: currentLng }}
                title={rider.name}
                description="Rider current location"
              >
                <View style={lt.riderMarker}>
                  <Truck size={24} color={COLORS.white} />
                </View>
              </Marker>
              
              {order.pickupLat && order.pickupLng && (
                <Marker
                  coordinate={{ latitude: order.pickupLat, longitude: order.pickupLng }}
                  title="Pickup Location"
                >
                  <View style={lt.pickupMarker}>
                    <MapPin size={20} color={COLORS.warning} />
                  </View>
                </Marker>
              )}
              
              {order.dropoffLat && order.dropoffLng && (
                <Marker
                  coordinate={{ latitude: order.dropoffLat, longitude: order.dropoffLng }}
                  title="Dropoff Location"
                >
                  <View style={lt.dropoffMarker}>
                    <NavigationIcon size={20} color={COLORS.success} />
                  </View>
                </Marker>
              )}
            </MapView>
          </View>

          {/* Bottom Info Card */}
          <View style={lt.bottomCard}>
            <View style={lt.cardSection}>
              <View style={lt.riderInfoRow}>
                <View style={lt.riderIcon}>
                  <User size={20} color={COLORS.white} />
                </View>
                <View style={lt.riderDetails}>
                  <Text style={lt.riderNameFull}>{rider.name}</Text>
                  <Text style={lt.riderVehicleFull}>Motorcycle • KCD 234B</Text>
                </View>
                <View style={lt.onlineBadge}>
                  <View style={lt.onlineDot} />
                  <Text style={lt.onlineText}>Moving</Text>
                </View>
              </View>
            </View>

            <View style={lt.divider} />

            <View style={lt.cardSection}>
              <Text style={lt.sectionTitle}>Current Delivery</Text>
              <Text style={lt.orderIdFull}>{order.orderId}</Text>
              
              <View style={lt.locationRow}>
                <MapPin size={16} color={COLORS.warning} />
                <Text style={lt.locationText} numberOfLines={2}>
                  Pickup: {order.pickupAddress}
                </Text>
              </View>
              
              <View style={lt.locationRow}>
                <NavigationIcon size={16} color={COLORS.success} />
                <Text style={lt.locationText} numberOfLines={2}>
                  Dropoff: {order.dropoffAddress}
                </Text>
              </View>

              {order.gateCode && (
                <View style={lt.gateCodeRow}>
                  <Text style={lt.gateCodeLabel}>Gate Code:</Text>
                  <Text style={lt.gateCodeValue}>{order.gateCode}</Text>
                </View>
              )}

              <View style={lt.statsRow}>
                <View style={lt.statBox}>
                  <Clock size={16} color={COLORS.primary} />
                  <Text style={lt.statBoxValue}>{order.estimatedDelivery}</Text>
                  <Text style={lt.statBoxLabel}>ETA</Text>
                </View>
                <View style={lt.statBox}>
                  <Navigation size={16} color={COLORS.primary} />
                  <Text style={lt.statBoxValue}>2.3 km</Text>
                  <Text style={lt.statBoxLabel}>Remaining</Text>
                </View>
              </View>
            </View>

            {refreshing && (
              <View style={lt.refreshingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={lt.refreshingText}>Updating location...</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Create Order Modal with Rider Assignment ─────────────────────────────────
const CreateOrderModal: React.FC<{
  visible:boolean; onClose:()=>void; onCreate:(order:Omit<Order, 'id'>)=>void;
  riders:Rider[];
}> = ({ visible, onClose, onCreate, riders }) => {
  const [formData, setFormData] = useState({
    customerName: "", customerPhone: "", pickupAddress: "", dropoffAddress: "",
    items: "", itemCount: "", value: "", notes: "", gateCode: "",
    selectedRiderId: "",
  });
  const [showRiders, setShowRiders] = useState(false);

  const availableRiders = riders.filter(r => r.status === "available");

  const handleCreate = () => {
    if (!formData.customerName || !formData.customerPhone || !formData.pickupAddress || 
        !formData.dropoffAddress || !formData.items || !formData.itemCount || !formData.value) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    
    if (!formData.selectedRiderId) {
      Alert.alert("Error", "Please select a rider to assign");
      return;
    }

    const selectedRider = riders.find(r => r.id === formData.selectedRiderId);
    if (!selectedRider) {
      Alert.alert("Error", "Invalid rider selected");
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const estimatedTime = new Date(now.getTime() + 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    onCreate({
      orderId: `ORD-${Math.floor(Math.random() * 10000)}`,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      riderName: selectedRider.name,
      riderId: selectedRider.id,
      pickupAddress: formData.pickupAddress,
      dropoffAddress: formData.dropoffAddress,
      items: formData.items,
      itemCount: parseInt(formData.itemCount),
      value: parseInt(formData.value),
      status: "assigned",
      createdAt: timeStr,
      estimatedDelivery: estimatedTime,
      distance: `${Math.floor(Math.random() * 10) + 2}.${Math.floor(Math.random() * 9)} km`,
      notes: formData.notes,
      gateCode: formData.gateCode,
    });
    
    onClose();
    setFormData({
      customerName: "", customerPhone: "", pickupAddress: "", dropoffAddress: "",
      items: "", itemCount: "", value: "", notes: "", gateCode: "",
      selectedRiderId: "",
    });
  };

  const selectedRider = riders.find(r => r.id === formData.selectedRiderId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cm.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={cm.sheet}>
          <View style={cm.handle} />
          <View style={cm.sheetHeader}>
            <Text style={cm.sheetTitle}>Create Order & Assign Rider</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={cm.formContainer}>
            <Text style={cm.sectionLabel}>Rider Assignment *</Text>
            <TouchableOpacity style={cm.riderDropdown} onPress={() => setShowRiders(!showRiders)}>
              <User size={18} color={COLORS.textMuted} />
              <Text style={cm.riderDropdownText}>
                {selectedRider ? selectedRider.name : `Select Rider (${availableRiders.length} available)`}
              </Text>
              <ChevronDown size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
            
            {showRiders && (
              <View style={cm.riderOptions}>
                {availableRiders.length === 0 ? (
                  <Text style={cm.noRidersText}>No available riders at the moment</Text>
                ) : (
                  availableRiders.map(r => (
                    <TouchableOpacity 
                      key={r.id} 
                      style={cm.riderOption}
                      onPress={() => {
                        setFormData({...formData, selectedRiderId: r.id});
                        setShowRiders(false);
                      }}
                    >
                      <View>
                        <Text style={cm.riderOptionName}>{r.name}</Text>
                        <Text style={cm.riderOptionDetail}>⭐ {r.rating} • {r.totalDeliveries} deliveries</Text>
                      </View>
                      {selectedRider?.id === r.id && <Check size={16} color={COLORS.success} />}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <Text style={[cm.sectionLabel, { marginTop: 16 }]}>Customer Information</Text>
            <View style={cm.inputGroup}>
              <View style={cm.inputWrapper}>
                <User size={16} color={COLORS.textMuted} />
                <TextInput style={cm.input} placeholder="Customer Name *" 
                  value={formData.customerName} onChangeText={v=>setFormData({...formData,customerName:v})} />
              </View>
              <View style={cm.inputWrapper}>
                <Phone size={16} color={COLORS.textMuted} />
                <TextInput style={cm.input} placeholder="Phone Number *" keyboardType="phone-pad"
                  value={formData.customerPhone} onChangeText={v=>setFormData({...formData,customerPhone:v})} />
              </View>
            </View>

            <Text style={cm.sectionLabel}>Order Details</Text>
            <View style={cm.inputGroup}>
              <View style={cm.inputWrapper}>
                <Package size={16} color={COLORS.textMuted} />
                <TextInput style={cm.input} placeholder="Items *" 
                  value={formData.items} onChangeText={v=>setFormData({...formData,items:v})} />
              </View>
              <View style={cm.rowInputs}>
                <View style={[cm.inputWrapper, {flex:1}]}>
                  <TextInput style={cm.input} placeholder="Quantity *" keyboardType="numeric"
                    value={formData.itemCount} onChangeText={v=>setFormData({...formData,itemCount:v})} />
                </View>
                <View style={[cm.inputWrapper, {flex:1}]}>
                  <TextInput style={cm.input} placeholder="Value (KES) *" keyboardType="numeric"
                    value={formData.value} onChangeText={v=>setFormData({...formData,value:v})} />
                </View>
              </View>
            </View>

            <Text style={cm.sectionLabel}>Delivery Information</Text>
            <View style={cm.inputGroup}>
              <View style={cm.inputWrapper}>
                <MapPin size={16} color={COLORS.textMuted} />
                <TextInput style={cm.input} placeholder="Pickup Address *" 
                  value={formData.pickupAddress} onChangeText={v=>setFormData({...formData,pickupAddress:v})} />
              </View>
              <View style={cm.inputWrapper}>
                <Navigation size={16} color={COLORS.textMuted} />
                <TextInput style={cm.input} placeholder="Dropoff Address *" 
                  value={formData.dropoffAddress} onChangeText={v=>setFormData({...formData,dropoffAddress:v})} />
              </View>
            </View>

            <View style={cm.inputWrapper}>
              <TextInput style={cm.input} placeholder="Gate Code / Access Code (Optional)" 
                value={formData.gateCode} onChangeText={v=>setFormData({...formData,gateCode:v})} />
            </View>

            <View style={cm.inputWrapper}>
              <TextInput style={[cm.input, cm.textArea]} placeholder="Notes (Optional)" multiline numberOfLines={3}
                value={formData.notes} onChangeText={v=>setFormData({...formData,notes:v})} />
            </View>

            <TouchableOpacity style={cm.createButton} onPress={handleCreate}>
              <Text style={cm.createButtonText}>Create & Assign Order</Text>
            </TouchableOpacity>
            <View style={{height:20}} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── Order Detail Modal ──────────────────────────────────────────────────────
const OrderDetailModal: React.FC<{
  order:Order|null; visible:boolean; onClose:()=>void;
  riders:Rider[];
}> = ({ order, visible, onClose, riders }) => {
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  
  if (!order) return null;
  const sc = STATUS_CONFIG[order.status];
  const assignedRider = riders.find(r => r.id === order.riderId);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={od.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
          <View style={od.sheet}>
            <View style={od.handle} />
            <View style={od.sheetHeader}>
              <View>
                <Text style={od.sheetTitle}>{order.orderId}</Text>
                <Text style={od.sheetSub}>{order.createdAt}</Text>
              </View>
              <View style={{ flexDirection:"row", gap:8, alignItems:"center" }}>
                <View style={[od.statusBadge, { backgroundColor:sc.bg }]}>
                  <Text style={[od.statusText, { color:sc.color }]}>{sc.label}</Text>
                </View>
                <TouchableOpacity style={od.closeBtn} onPress={onClose}>
                  <X size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={od.sectionLabel}>Customer</Text>
              <View style={od.infoCard}>
                <View style={od.infoRow}><Text style={od.infoLabel}>Name</Text><Text style={od.infoVal}>{order.customerName}</Text></View>
                <View style={[od.infoRow, od.infoRowBorder]}><Text style={od.infoLabel}>Phone</Text>
                  <Text style={[od.infoVal, { color:COLORS.accentBlue }]}>{order.customerPhone}</Text>
                </View>
              </View>

              <Text style={od.sectionLabel}>Route</Text>
              <View style={od.routeBox}>
                <View style={od.routeRow}><View style={[od.routeDot, { backgroundColor:COLORS.warning }]}/><Text style={od.routeText}>{order.pickupAddress}</Text></View>
                <View style={od.routeLine} />
                <View style={od.routeRow}><View style={[od.routeDot, { backgroundColor:COLORS.success }]}/><Text style={od.routeText}>{order.dropoffAddress}</Text></View>
              </View>

              {order.gateCode && (
                <View style={od.gateCodeCard}>
                  <Text style={od.gateCodeLabel}>Gate/Access Code</Text>
                  <Text style={od.gateCodeValue}>{order.gateCode}</Text>
                </View>
              )}

              <Text style={od.sectionLabel}>Details</Text>
              <View style={od.detailGrid}>
                {[
                  { l:"Items", v:`${order.items} (${order.itemCount})` },
                  { l:"Value", v:`KES ${order.value.toLocaleString()}` },
                  { l:"Distance", v:order.distance },
                  { l:"Est. Time", v:order.estimatedDelivery },
                ].map((r,i) => (
                  <View key={i} style={od.detailGridItem}>
                    <Text style={od.detailGridLabel}>{r.l}</Text>
                    <Text style={od.detailGridVal}>{r.v}</Text>
                  </View>
                ))}
              </View>

              {order.status === "in_transit" && assignedRider && (
                <TouchableOpacity 
                  style={od.liveTrackingButton} 
                  onPress={() => setShowLiveTracking(true)}
                  activeOpacity={0.85}
                >
                  <Target size={18} color={COLORS.white} />
                  <Text style={od.liveTrackingButtonText}>Live Tracking</Text>
                </TouchableOpacity>
              )}

              <Text style={od.sectionLabel}>Assigned Rider</Text>
              <View style={od.infoCard}>
                <View style={od.infoRow}>
                  <Text style={od.infoLabel}>Rider</Text>
                  <Text style={[od.infoVal, { color: COLORS.success }]}>
                    {order.riderName}
                  </Text>
                </View>
              </View>

              {order.notes ? (
                <View style={od.noteBanner}>
                  <AlertTriangle size={12} color={COLORS.warning} />
                  <Text style={od.noteText}>{order.notes}</Text>
                </View>
              ) : null}

              <View style={{ height:20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FullPageLiveTracking
        visible={showLiveTracking}
        onClose={() => setShowLiveTracking(false)}
        rider={assignedRider || null}
        order={order}
      />
    </>
  );
};

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard: React.FC<{ order:Order; onView:()=>void }> = ({ order, onView }) => {
  const sc = STATUS_CONFIG[order.status];
  return (
    <TouchableOpacity style={od.card} onPress={onView} activeOpacity={0.85}>
      <View style={[od.cardAccent, { backgroundColor:
        order.status==="delivered" ? COLORS.success :
        order.status==="in_transit" ? COLORS.online :
        order.status==="failed" || order.status==="cancelled" ? COLORS.danger : COLORS.accentBlue
      }]} />
      <View style={od.cardBody}>
        <View style={od.cardTop}>
          <Text style={od.orderId}>{order.orderId}</Text>
          <View style={[od.statusBadge, { backgroundColor:sc.bg }]}>
            <Text style={[od.statusText, { color:sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        <View style={od.customerRow}>
          <View style={od.custAvatar}>
            <Text style={od.custAvatarText}>{order.customerName.split(" ").map(w=>w[0]).join("")}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={od.custName}>{order.customerName}</Text>
            <Text style={od.custItems}>{order.items} · {order.itemCount} items · KES {order.value.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems:"flex-end" }}>
            <Text style={od.distText}>{order.distance}</Text>
            <Text style={od.timeText}>{order.estimatedDelivery}</Text>
          </View>
        </View>

        <View style={od.routeBox}>
          <View style={od.routeRow}><View style={[od.routeDot, { backgroundColor:COLORS.warning }]}/><Text style={od.routeText} numberOfLines={1}>{order.pickupAddress}</Text></View>
          <View style={od.routeLine}/>
          <View style={od.routeRow}><View style={[od.routeDot, { backgroundColor:COLORS.success }]}/><Text style={od.routeText} numberOfLines={1}>{order.dropoffAddress}</Text></View>
        </View>

        <View style={od.riderRow}>
          <Truck size={11} color={COLORS.accentBlue} />
          <Text style={[od.riderText, { color: COLORS.accentBlue }]}>
            {order.riderName}
          </Text>
          <Clock size={11} color={COLORS.textMuted} style={{ marginLeft:"auto" }} />
          <Text style={od.createdText}>{order.createdAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface OrdersManagementScreenProps { navigation?:any }

const OrdersManagementScreen: React.FC<OrdersManagementScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [riders, setRiders] = useState<Rider[]>(RIDERS_LIST);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus|"all">("all");
  const [viewOrder, setViewOrder] = useState<Order|null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const counts = {
    total: orders.length,
    assigned: orders.filter(o=>o.status==="assigned").length,
    inTransit: orders.filter(o=>o.status==="in_transit").length,
    delivered: orders.filter(o=>o.status==="delivered").length,
    failed: orders.filter(o=>o.status==="failed"||o.status==="cancelled").length,
  };
  const totalValue = orders.filter(o=>o.status==="delivered").reduce((s,o)=>s+o.value,0);

  const filtered = orders.filter(o => {
    if (search && !o.orderId.toLowerCase().includes(search.toLowerCase()) &&
        !o.customerName.toLowerCase().includes(search.toLowerCase()) &&
        !o.riderName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter!=="all" && o.status!==statusFilter) return false;
    return true;
  });

  const handleCreateOrder = (newOrder: Omit<Order, 'id'>) => {
    const orderWithId = {
      ...newOrder,
      id: Date.now().toString(),
    };
    setOrders(prev => [orderWithId, ...prev]);
    // Update rider status to busy
    setRiders(prev => prev.map(r => 
      r.id === newOrder.riderId ? { ...r, status: "busy" as const, currentOrderId: orderWithId.id } : r
    ));
    Alert.alert("Success", `Order ${newOrder.orderId} assigned to ${newOrder.riderName}`);
  };

  const STATUS_TABS: Array<{key:OrderStatus|"all";label:string;count:number}> = [
    { key:"all",        label:"All",       count:orders.length },
    { key:"assigned",   label:"Assigned",  count:counts.assigned },
    { key:"in_transit", label:"Transit",   count:counts.inTransit },
    { key:"delivered",  label:"Done",      count:counts.delivered },
    { key:"failed",     label:"Failed",    count:counts.failed },
  ];

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
        <Text style={s.headerTitle}>Dispatch Hub</Text>
        <TouchableOpacity style={s.addBtn} onPress={()=>setShowCreateModal(true)} activeOpacity={0.8}>
          <Plus size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI strip */}
        <View style={od.kpiStrip}>
          {[
            { v:counts.total,    l:"Total",   c:COLORS.primary    },
            { v:counts.inTransit,l:"Active",  c:COLORS.online     },
            { v:counts.delivered,l:"Done",    c:COLORS.success    },
            { v:`KES ${(totalValue/1000).toFixed(1)}k`, l:"Value", c:COLORS.accentBlue },
          ].map(k => (
            <View key={k.l} style={od.kpiItem}>
              <Text style={[od.kpiVal, { color:k.c, fontSize: k.l==="Value" ? 13 : 18 }]}>{k.v}</Text>
              <Text style={od.kpiLbl}>{k.l}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={od.searchRow}>
          <View style={od.searchBox}>
            <Search size={15} color={COLORS.textMuted} />
            <TextInput style={od.searchInput} value={search} onChangeText={setSearch}
              placeholder="Search orders, customers, riders..." placeholderTextColor={COLORS.textMuted} />
            {search ? <TouchableOpacity onPress={()=>setSearch("")}><X size={14} color={COLORS.textMuted}/></TouchableOpacity> : null}
          </View>
        </View>

        {/* Status tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}
          contentContainerStyle={{ gap:6, paddingRight:8 }}>
          {STATUS_TABS.map(t => (
            <TouchableOpacity key={t.key} style={[od.statusTab, statusFilter===t.key && od.statusTabActive]}
              onPress={()=>setStatusFilter(t.key)} activeOpacity={0.8}>
              <Text style={[od.statusTabText, statusFilter===t.key && od.statusTabTextActive]}>
                {t.label} ({t.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={od.resultRow}>
          <Text style={od.resultText}>{filtered.length} order{filtered.length!==1?"s":""}</Text>
        </View>

        {filtered.map((o,i) => (
          <React.Fragment key={o.id}>
            <OrderCard order={o} onView={()=>setViewOrder(o)} />
            {i<filtered.length-1 && <View style={{height:10}}/>}
          </React.Fragment>
        ))}
        <View style={{ height:40 }} />
      </ScrollView>

      <CreateOrderModal
        visible={showCreateModal}
        onClose={()=>setShowCreateModal(false)}
        onCreate={handleCreateOrder}
        riders={riders}
      />

      <OrderDetailModal
        order={viewOrder} 
        visible={!!viewOrder}
        onClose={()=>setViewOrder(null)}
        riders={riders}
      />
    </SafeAreaView>
  );
};

// Styles (keeping existing styles and adding new ones)
const s = StyleSheet.create({
  safe:{ flex:1, backgroundColor:COLORS.primaryDark },
  header:{ backgroundColor:COLORS.primaryDark, paddingTop:8, paddingBottom:20, paddingHorizontal:20,
           flexDirection:"row", alignItems:"center", gap:10 },
             menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn:{ width:40, height:40, borderRadius:12, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center" },
  headerTitle:{ flex:1, fontSize:20, fontWeight:"800", color:COLORS.white, letterSpacing:0.2 },
  addBtn:{ width:40, height:40, borderRadius:12, backgroundColor:"rgba(255,255,255,0.18)", alignItems:"center", justifyContent:"center" },
  scroll:{ flex:1, backgroundColor:COLORS.background, borderTopLeftRadius:24, borderTopRightRadius:24, marginTop:-10 },
  scrollContent:{ paddingTop:20, paddingHorizontal:18 },
});

// Live Tracking Full Page Styles
const lt = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.overlayBg },
  fullContent: { flex: 1, backgroundColor: COLORS.primaryDark },
  fullHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16, backgroundColor: COLORS.primaryDark },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  fullTitle: { fontSize: 18, fontWeight: "800", color: COLORS.white },
  refreshButtonFull: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  fullMapContainer: { flex: 1, position: "relative" },
  fullMap: { width: width, height: height * 0.5 },
  riderMarker: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white },
  pickupMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.warningLight, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.warning },
  dropoffMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.successLight, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.success },
  bottomCard: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: height * 0.45 },
  cardSection: { marginBottom: 12 },
  riderInfoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  riderIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  riderDetails: { flex: 1 },
  riderNameFull: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  riderVehicleFull: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.onlineLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.online },
  onlineText: { fontSize: 11, fontWeight: "700", color: COLORS.online },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 8 },
  orderIdFull: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 12 },
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  locationText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  gateCodeRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.accentBlueLight, padding: 10, borderRadius: 10, marginTop: 8 },
  gateCodeLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },
  gateCodeValue: { fontSize: 14, fontWeight: "800", color: COLORS.accentBlue, letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  statBox: { flex: 1, backgroundColor: COLORS.background, borderRadius: 12, padding: 10, alignItems: "center", gap: 4 },
  statBoxValue: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  statBoxLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  refreshingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center", gap: 12 },
  refreshingText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },
});

const od = StyleSheet.create({
  kpiStrip:{ flexDirection:"row", backgroundColor:COLORS.cardBg, borderRadius:18, paddingVertical:14, paddingHorizontal:10, marginBottom:12, shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  kpiItem:{ flex:1, alignItems:"center" },
  kpiVal:{ fontSize:18, fontWeight:"900", letterSpacing:-0.5 },
  kpiLbl:{ fontSize:10, fontWeight:"600", color:COLORS.textMuted, marginTop:2, textTransform:"uppercase" },
  searchRow:{ marginBottom:10 },
  searchBox:{ flexDirection:"row", alignItems:"center", backgroundColor:COLORS.cardBg, borderRadius:14, paddingHorizontal:12, paddingVertical:10, gap:8, borderWidth:1, borderColor:COLORS.border },
  searchInput:{ flex:1, fontSize:13, color:COLORS.textPrimary, fontWeight:"600", padding:0 },
  statusTab:{ paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:COLORS.background, borderWidth:1, borderColor:COLORS.border },
  statusTabActive:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  statusTabText:{ fontSize:11, fontWeight:"700", color:COLORS.textMuted },
  statusTabTextActive:{ color:COLORS.white },
  resultRow:{ marginBottom:10 },
  resultText:{ fontSize:13, fontWeight:"700", color:COLORS.textSecondary },
  card:{ backgroundColor:COLORS.cardBg, borderRadius:18, flexDirection:"row", overflow:"hidden", shadowColor:COLORS.textPrimary, shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:3 },
  cardAccent:{ width:4, borderTopLeftRadius:18, borderBottomLeftRadius:18 },
  cardBody:{ flex:1, padding:14, gap:9 },
  cardTop:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  orderId:{ fontSize:14, fontWeight:"800", color:COLORS.textPrimary },
  statusBadge:{ paddingHorizontal:9, paddingVertical:4, borderRadius:20 },
  statusText:{ fontSize:10, fontWeight:"700" },
  customerRow:{ flexDirection:"row", alignItems:"center", gap:10 },
  custAvatar:{ width:34, height:34, borderRadius:17, backgroundColor:COLORS.primaryMuted, alignItems:"center", justifyContent:"center" },
  custAvatarText:{ fontSize:11, fontWeight:"800", color:COLORS.primary },
  custName:{ fontSize:13, fontWeight:"700", color:COLORS.textPrimary },
  custItems:{ fontSize:10, color:COLORS.textMuted, fontWeight:"500", marginTop:1 },
  distText:{ fontSize:12, fontWeight:"800", color:COLORS.textPrimary },
  timeText:{ fontSize:10, color:COLORS.textMuted, fontWeight:"600", marginTop:1 },
  routeBox:{ backgroundColor:COLORS.background, borderRadius:11, padding:9, gap:1 },
  routeRow:{ flexDirection:"row", alignItems:"center", gap:7 },
  routeDot:{ width:7, height:7, borderRadius:3.5 },
  routeText:{ flex:1, fontSize:11, color:COLORS.textSecondary, fontWeight:"600" },
  routeLine:{ width:1.5, height:8, backgroundColor:COLORS.border, marginLeft:3 },
  riderRow:{ flexDirection:"row", alignItems:"center", gap:5 },
  riderText:{ fontSize:11, fontWeight:"700" },
  createdText:{ fontSize:10, color:COLORS.textMuted, fontWeight:"600" },
  modalOverlay:{ flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  sheet:{ backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28, padding:22, maxHeight:"90%" },
  handle:{ width:44, height:5, borderRadius:3, backgroundColor:COLORS.border, alignSelf:"center", marginBottom:18 },
  sheetHeader:{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 },
  sheetTitle:{ fontSize:18, fontWeight:"800", color:COLORS.textPrimary },
  sheetSub:{ fontSize:12, color:COLORS.textMuted, fontWeight:"500", marginTop:2 },
  closeBtn:{ width:32, height:32, borderRadius:16, backgroundColor:COLORS.background, alignItems:"center", justifyContent:"center" },
  sectionLabel:{ fontSize:11, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginTop:14, marginBottom:8 },
  infoCard:{ backgroundColor:COLORS.background, borderRadius:14, paddingHorizontal:12 },
  infoRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:10 },
  infoRowBorder:{ borderTopWidth:1, borderTopColor:COLORS.border },
  infoLabel:{ fontSize:13, color:COLORS.textSecondary, fontWeight:"600" },
  infoVal:{ fontSize:13, color:COLORS.textPrimary, fontWeight:"700" },
  detailGrid:{ flexDirection:"row", flexWrap:"wrap", backgroundColor:COLORS.background, borderRadius:14, overflow:"hidden", marginBottom:4 },
  detailGridItem:{ width:"50%", padding:12, borderWidth:0.5, borderColor:COLORS.border },
  detailGridLabel:{ fontSize:10, color:COLORS.textMuted, fontWeight:"600", textTransform:"uppercase", marginBottom:3 },
  detailGridVal:{ fontSize:13, fontWeight:"700", color:COLORS.textPrimary },
  gateCodeCard:{ backgroundColor:COLORS.accentBlueLight, borderRadius:12, padding:12, marginBottom:10 },
  gateCodeLabel:{ fontSize:11, color:COLORS.textMuted, fontWeight:"600", marginBottom:4 },
  gateCodeValue:{ fontSize:16, fontWeight:"800", color:COLORS.accentBlue, letterSpacing:1 },
  liveTrackingButton:{ flexDirection:"row", backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:12, alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 },
  liveTrackingButtonText:{ fontSize:14, fontWeight:"800", color:COLORS.white },
  noteBanner:{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:COLORS.warningLight, borderRadius:12, padding:12, marginTop:10 },
  noteText:{ flex:1, fontSize:12, fontWeight:"600", color:COLORS.warning },
});

const cm = StyleSheet.create({
  modalOverlay:{ flex:1, backgroundColor:COLORS.overlayBg, justifyContent:"flex-end" },
  sheet:{ backgroundColor:COLORS.cardBg, borderTopLeftRadius:28, borderTopRightRadius:28, padding:22, maxHeight:"90%" },
  handle:{ width:44, height:5, borderRadius:3, backgroundColor:COLORS.border, alignSelf:"center", marginBottom:18 },
  sheetHeader:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
  sheetTitle:{ fontSize:20, fontWeight:"800", color:COLORS.textPrimary },
  formContainer:{ maxHeight: "100%" },
  sectionLabel:{ fontSize:12, fontWeight:"700", color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginTop:16, marginBottom:8 },
  inputGroup:{ gap:10, marginBottom:10 },
  inputWrapper:{ flexDirection:"row", alignItems:"center", backgroundColor:COLORS.background, borderRadius:12, paddingHorizontal:12, borderWidth:1, borderColor:COLORS.border, gap:8 },
  input:{ flex:1, fontSize:14, color:COLORS.textPrimary, paddingVertical:12 },
  rowInputs:{ flexDirection:"row", gap:10 },
  textArea:{ minHeight:80, textAlignVertical:"top", paddingTop:12 },
  createButton:{ backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:14, alignItems:"center", marginTop:20 },
  createButtonText:{ fontSize:16, fontWeight:"800", color:COLORS.white },
  riderDropdown:{ flexDirection:"row", alignItems:"center", backgroundColor:COLORS.background, borderRadius:12, paddingHorizontal:14, paddingVertical:12, borderWidth:1.5, borderColor:COLORS.primary, gap:10 },
  riderDropdownText:{ flex:1, fontSize:14, fontWeight:"600", color:COLORS.textPrimary },
  riderOptions:{ backgroundColor:COLORS.cardBg, borderRadius:12, borderWidth:1, borderColor:COLORS.border, marginTop:4 },
  riderOption:{ paddingVertical:12, paddingHorizontal:14, flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  riderOptionName:{ fontSize:13, fontWeight:"600", color:COLORS.textPrimary },
  riderOptionDetail:{ fontSize:10, color:COLORS.textMuted, marginTop:2 },
  noRidersText:{ padding:12, textAlign:"center", fontSize:12, color:COLORS.textMuted },
  
});

export default OrdersManagementScreen;