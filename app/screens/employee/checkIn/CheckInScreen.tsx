import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { MapPin, CheckCircle2, User, ChevronLeft, AlertTriangle, LogOut } from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import {
  recordCheckIn,
  getEmployeeById,
  haversineDistance,
  Employee,
} from "../../../data/dbService";

// ─── Navigation types ─────────────────────────────────────────────────────────
type CheckInRouteParams = {
  CheckIn: { employeeId: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────
const BRAND      = "#8b0111";
const BRAND_DARK = "#6a000d";
const SUCCESS    = "#00897B";
const WARNING    = "#F57C00";
const { height }  = Dimensions.get("window");

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
const CheckInScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const route = useRoute<RouteProp<CheckInRouteParams, "CheckIn">>();

  const employeeId = route.params?.employeeId ?? "e001";

  const [coords,          setCoords]          = useState<Coords | null>(null);
  const [locationName,    setLocationName]     = useState("Getting location…");
  const [locLoading,      setLocLoading]       = useState(true);
  const [checkingIn,      setCheckingIn]       = useState(false);
  const [employee,        setEmployee]         = useState<Employee | null>(null);
  const [loadingEmployee, setLoadingEmployee]  = useState(true);

  // Distance from assigned location (live)
  const [distanceMeters, setDistanceMeters]   = useState<number | null>(null);
  const [withinRadius,   setWithinRadius]     = useState<boolean | null>(null);

  // ── Entrance animation ────────────────────────────────────────────────────
  const cardAnim    = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true, delay: 120,
      }),
      Animated.spring(cardAnim, {
        toValue: 0, useNativeDriver: true, tension: 55, friction: 11, delay: 120,
      }),
    ]).start();

    loadEmployee();
    fetchLocation();
  }, []);

  // ── Update distance whenever coords or employee change ────────────────────
  useEffect(() => {
    if (coords && employee) {
      const dist = haversineDistance(
        coords.latitude, coords.longitude,
        employee.assignedLocation.latitude, employee.assignedLocation.longitude
      );
      const rounded = Math.round(dist);
      setDistanceMeters(rounded);
      setWithinRadius(rounded <= employee.assignedLocation.radiusMeters);
    }
  }, [coords, employee]);

  // ─── Load employee data ────────────────────────────────────────────────────
  const loadEmployee = async () => {
    try {
      setLoadingEmployee(true);
      const emp = await getEmployeeById(employeeId);
      setEmployee(emp);
    } catch (error) {
      console.error("Failed to load employee:", error);
    } finally {
      setLoadingEmployee(false);
    }
  };

  // ─── Location fetch ────────────────────────────────────────────────────────
  const fetchLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationName("Permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCoords({
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy:  loc.coords.accuracy ?? 15,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (place) {
        const name =
          place.name     ||
          place.street   ||
          place.district ||
          place.city     ||
          "Unknown Location";
        setLocationName(name);
      }
    } catch {
      setLocationName("Error getting location");
    } finally {
      setLocLoading(false);
    }
  };

  // ─── Handle Check In ───────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!coords) {
      Alert.alert("No Location", "Please wait for your location to load.");
      return;
    }
    if (!employee) {
      Alert.alert("Error", "Employee data not loaded.");
      return;
    }

    // Pre-flight geo-fence check (UI-level guard before hitting service)
    if (withinRadius === false) {
      Alert.alert(
        "Outside Work Zone",
        `You are ${distanceMeters} m away from ${employee.assignedLocation.name}.\n\nYou must be within ${employee.assignedLocation.radiusMeters} m to check in.\n\nPlease move to your assigned location.`
      );
      return;
    }

    setCheckingIn(true);
    try {
      const result = await recordCheckIn({
        employeeId,
        latitude:     coords.latitude,
        longitude:    coords.longitude,
        accuracy:     coords.accuracy,
        locationName,
      });

      // if (!result.success) {
      //   Alert.alert("Check-in Failed", result.error ?? "Please try again.");
      //   return;
      // }

      Alert.alert(
        "Checked In",
        `Welcome, ${employee.firstName}! You are checked in at ${employee.assignedLocation.name}.`,
        [
          {
            text: "Go to Dashboard",
            onPress: () => navigation.replace("EmployeeDashboard", { employeeId }),
             
          },
        ]
      );
    } catch {
      Alert.alert("Error", "Check-in failed. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  // ─── Map region ────────────────────────────────────────────────────────────
  // Centre the map on the assigned location so the circle is always visible
  const mapRegion = employee
    ? {
        latitude:       employee.assignedLocation.latitude,
        longitude:      employee.assignedLocation.longitude,
        latitudeDelta:  0.003,
        longitudeDelta: 0.003,
      }
    : coords
    ? {
        latitude:       coords.latitude,
        longitude:      coords.longitude,
        latitudeDelta:  0.004,
        longitudeDelta: 0.004,
      }
    : undefined;

  // ─── Distance badge ────────────────────────────────────────────────────────
  const distanceBadgeColor =
    withinRadius === true
      ? SUCCESS
      : withinRadius === false
      ? BRAND
      : "#999";

  const distanceBadgeText =
    withinRadius === null || distanceMeters === null
      ? "Calculating…"
      : withinRadius
      ? `${distanceMeters} m — Within zone`
      : `${distanceMeters} m — Outside zone`;

  const btnDisabled = checkingIn || locLoading || withinRadius === false || withinRadius === null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_DARK} />
      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* ── Navbar ── */}
        <View style={s.navbar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.replace("Login")}
            activeOpacity={0.7}
          >
            <LogOut size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={s.navCenter}>
            {loadingEmployee ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={s.navTitle}>Check In</Text>
                <Text style={s.navSubtitle}>{employee?.fullName || "Employee"}</Text>
              </>
            )}
          </View>

          <View style={s.navSpacer} />
        </View>
      </SafeAreaView>

      {/* ── Scrollable content ── */}
      <ScrollView 
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            s.content,
            { opacity: cardOpacity, transform: [{ translateY: cardAnim }] },
          ]}
        >
          {/* Welcome card */}
          {employee && !loadingEmployee && (
            <View style={s.welcomeCard}>
              <View style={s.welcomeIcon}>
                <User size={24} color={BRAND} />
              </View>
              <View style={s.welcomeTextContainer}>
                <Text style={s.welcomeGreeting}>
                  Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"},
                </Text>
                <Text style={s.welcomeName}>{employee.firstName}!</Text>
                <Text style={s.welcomeLocation}>
                  {employee.assignedLocation.name}
                </Text>
              </View>
            </View>
          )}

          {/* Distance badge */}
          {!locLoading && (
            <View style={[s.distanceBadge, { backgroundColor: distanceBadgeColor + "18", borderColor: distanceBadgeColor }]}>
              {withinRadius === false
                ? <AlertTriangle size={14} color={distanceBadgeColor} />
                : <MapPin size={14} color={distanceBadgeColor} />
              }
              <Text style={[s.distanceBadgeText, { color: distanceBadgeColor }]}>
                {distanceBadgeText}
              </Text>
            </View>
          )}

          {/* Location card + map */}
          <View style={s.card}>
            <View style={s.locationRow}>
              <MapPin size={16} color={BRAND} strokeWidth={2.2} />
              <Text style={s.locationText} numberOfLines={1}>
                {locLoading ? "Detecting location…" : locationName}
              </Text>
              {locLoading && (
                <ActivityIndicator size="small" color={BRAND} style={{ marginLeft: 6 }} />
              )}
            </View>

            {/* Map with geo-fence circle */}
            <View style={s.mapWrap}>
              {mapRegion ? (
                <MapView
                  style={s.map}
                  provider={PROVIDER_GOOGLE}
                  region={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  showsUserLocation
                  showsMyLocationButton={false}
                >
                  {/* Assigned location marker */}
                  {employee && (
                    <>
                      <Marker
                        coordinate={{
                          latitude:  employee.assignedLocation.latitude,
                          longitude: employee.assignedLocation.longitude,
                        }}
                        title={employee.assignedLocation.name}
                        pinColor={BRAND}
                      />
                      {/* 500 m geo-fence circle */}
                      <Circle
                        center={{
                          latitude:  employee.assignedLocation.latitude,
                          longitude: employee.assignedLocation.longitude,
                        }}
                        radius={employee.assignedLocation.radiusMeters}
                        strokeColor={withinRadius ? SUCCESS : BRAND}
                        fillColor={withinRadius ? SUCCESS + "30" : BRAND + "20"}
                        strokeWidth={2}
                      />
                    </>
                  )}

                  {/* Employee's current location marker */}
                  {coords && (
                    <Marker
                      coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
                      title="Your Location"
                      pinColor="#1565C0"
                    />
                  )}
                </MapView>
              ) : (
                <View style={s.mapFallback}>
                  {locLoading
                    ? <ActivityIndicator size="large" color={BRAND} />
                    : <Text style={s.mapFallbackText}>Map unavailable</Text>
                  }
                </View>
              )}
            </View>
          </View>

          {/* Out-of-zone warning */}
          {withinRadius === false && (
            <View style={s.warningBox}>
              <AlertTriangle size={16} color={BRAND} />
              <Text style={s.warningText}>
                Move to {employee?.assignedLocation.name} to check in. You must be within {employee?.assignedLocation.radiusMeters} m.
              </Text>
            </View>
          )}

          {/* Check In Button */}
          <TouchableOpacity
            style={[s.checkInBtn, btnDisabled && s.checkInBtnDisabled]}
            onPress={handleCheckIn}
            activeOpacity={0.82}
            disabled={btnDisabled}
          >
            {checkingIn ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <CheckCircle2 size={18} color="#fff" strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={s.checkInBtnText}>
                  {withinRadius === false ? "NOT IN WORK ZONE" : "CHECK IN NOW"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={s.infoText}>
            Your check-in location is verified against your assigned work zone. You must be within {employee?.assignedLocation.radiusMeters ?? 500} m of {employee?.assignedLocation.name ?? "your assigned location"}.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default CheckInScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { 
    backgroundColor: BRAND,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  navbar: {
    backgroundColor: BRAND,
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    paddingHorizontal: 12,
    paddingVertical:   12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  navCenter:   { flex: 1, alignItems: "center" },
  navTitle:    { color: "#fff", fontSize: 16, fontWeight: "600", letterSpacing: 0.3 },
  navSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "500", marginTop: 2 },
  navSpacer:   { width: 40 },

  content: {
    paddingHorizontal: 16,
    paddingTop:        16,
  },

  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius:    16,
    padding:         10,
    flexDirection:   "row",
    alignItems:      "center",
    marginBottom:    12,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.05,
    shadowRadius:    8,
    elevation:       2,
  },
  welcomeIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor:  `${BRAND}15`,
    alignItems:       "center",
    justifyContent:   "center",
    marginRight:      12,
  },
  welcomeTextContainer: { flex: 1 },
  welcomeGreeting:      { fontSize: 13, color: "#666", fontWeight: "500" },
  welcomeName:          { fontSize: 20, fontWeight: "800", color: BRAND, marginTop: 2 },
  welcomeLocation:      { fontSize: 11, color: "#888", marginTop: 3, fontWeight: "500" },

  distanceBadge: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            6,
    borderRadius:   10,
    borderWidth:    1.5,
    paddingVertical:   8,
    paddingHorizontal: 12,
    marginBottom:      10,
  },
  distanceBadgeText: { fontSize: 13, fontWeight: "700", flex: 1 },

  card: {
    backgroundColor: "#fff",
    borderRadius:    16,
    padding:         6,
    marginBottom:    12,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.05,
    shadowRadius:    8,
    elevation:       2,
  },
  locationRow: {
    flexDirection:  "row",
    alignItems:     "center",
    marginBottom:   12,
    paddingHorizontal: 4,
  },
  locationText: {
    flex: 1, fontSize: 14, fontWeight: "600",
    color: "#1a1a2e", marginLeft: 8, letterSpacing: 0.1,
  },
  mapWrap: {
    height:           height * 0.38,
    borderRadius:     12,
    overflow:         "hidden",
    backgroundColor:  "#e5e7eb",
  },
  map:            { flex: 1 },
  mapFallback:    { flex: 1, alignItems: "center", justifyContent: "center" },
  mapFallbackText: { color: "#999", fontSize: 14 },

  warningBox: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               8,
    backgroundColor:   "#FFF3E0",
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       BRAND + "50",
    paddingVertical:   10,
    paddingHorizontal: 14,
    marginBottom:      10,
  },
  warningText: { flex: 1, fontSize: 12, color: BRAND, fontWeight: "600" },

  checkInBtn: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    backgroundColor: BRAND,
    borderRadius:    14,
    paddingVertical: 16,
    marginBottom:    12,
    elevation:       3,
    shadowColor:     BRAND_DARK,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.35,
    shadowRadius:    6,
  },
  checkInBtnDisabled: { backgroundColor: "#ccc", shadowOpacity: 0, elevation: 0 },
  checkInBtnText:     { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 1.2 },

  infoText: {
    textAlign: "center", fontSize: 11, color: "#999", marginTop: 4, lineHeight: 16,
  },
});