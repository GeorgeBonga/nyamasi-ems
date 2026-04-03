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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { MapPin, CheckCircle2, User, ChevronLeft } from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { recordCheckIn, getEmployeeById, Employee } from "../../../data/dbService";

// ─── Navigation types ─────────────────────────────────────────────────────────
type CheckInRouteParams = {
  CheckIn: { employeeId: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────
const BRAND      = "#8b0111";
const BRAND_DARK = "#6a000d";
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

  // employeeId comes from LoginScreen via navigation params.
  const employeeId = route.params?.employeeId ?? "e001";

  const [coords,       setCoords]       = useState<Coords | null>(null);
  const [locationName, setLocationName] = useState("Getting location…");
  const [locLoading,   setLocLoading]   = useState(true);
  const [checkingIn,   setCheckingIn]   = useState(false);
  const [employee,     setEmployee]     = useState<Employee | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

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
        accuracy: Location.Accuracy.Balanced,
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
          place.name    ||
          place.street  ||
          place.district ||
          place.city    ||
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
      Alert.alert("No location", "Please wait for your location to load.");
      return;
    }

    setCheckingIn(true);
    try {
      // Save check-in to the data store; marks employee online automatically
      await recordCheckIn({
        employeeId,
        latitude:     coords.latitude,
        longitude:    coords.longitude,
        accuracy:     coords.accuracy,
        locationName,
      });

      Alert.alert(
        "Success", 
        `Welcome, ${employee?.firstName || "Employee"}! You have successfully checked in.`,
        [
          {
            text: "Go to Dashboard",
            onPress: () =>
              navigation.replace("EmployeeDashboard", { employeeId }),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Check-in failed. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  // ─── Map region ────────────────────────────────────────────────────────────
  const mapRegion = coords
    ? {
        latitude:      coords.latitude,
        longitude:     coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      }
    : undefined;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND} />

      {/* ── Navbar with Employee Name ── */}
      <View style={s.navbar}>
        <TouchableOpacity 
          style={s.backBtn} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
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

      {/* ── Animated content ── */}
      <Animated.View
        style={[
          s.content,
          { opacity: cardOpacity, transform: [{ translateY: cardAnim }] },
        ]}
      >
        {/* Welcome Message */}
        {employee && !loadingEmployee && (
          <View style={s.welcomeCard}>
            <View style={s.welcomeIcon}>
              <User size={24} color={BRAND} />
            </View>
            <View style={s.welcomeTextContainer}>
              <Text style={s.welcomeGreeting}>Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"},</Text>
              <Text style={s.welcomeName}>{employee.firstName}!</Text>
            </View>
          </View>
        )}

        {/* Location Card */}
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

          {/* Map */}
          <View style={s.mapWrap}>
            {coords && mapRegion ? (
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
                <Marker coordinate={{ latitude: coords.latitude, longitude: coords.longitude }} />
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

        {/* Check In Button */}
        <TouchableOpacity
          style={[s.checkInBtn, (checkingIn || locLoading) && s.checkInBtnDisabled]}
          onPress={handleCheckIn}
          activeOpacity={0.82}
          disabled={checkingIn || locLoading}
        >
          {checkingIn ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#fff" strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={s.checkInBtnText}>CHECK IN NOW</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={s.infoText}>
          Your check-in location will be recorded and shared with your manager.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

export default CheckInScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  navbar: {
    backgroundColor: BRAND,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  navCenter: {
    flex: 1,
    alignItems: "center",
  },
  navTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  navSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  navSpacer: { width: 40 },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BRAND}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a2e",
    marginLeft: 8,
    letterSpacing: 0.1,
  },
  mapWrap: {
    height: height * 0.45,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  map: { flex: 1 },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapFallbackText: { color: "#999", fontSize: 14 },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: BRAND_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  checkInBtnDisabled: {
    backgroundColor: BRAND_DARK,
    opacity: 0.7,
  },
  checkInBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  infoText: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
});