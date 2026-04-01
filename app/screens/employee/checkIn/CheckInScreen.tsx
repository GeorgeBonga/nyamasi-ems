import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { ChevronLeft, MapPin, CheckCircle2 } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

const BRAND = "#8b0111";
const BRAND_DARK = "#6a000d";
const AMBER = "#e8920a";
const AMBER_DARK = "#c97a06";
const { width, height } = Dimensions.get("window");

interface Coords {
  latitude: number;
  longitude: number;
}

const CheckInScreen: React.FC = () => {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationName, setLocationName] = useState("Getting location…");
  const [locLoading, setLocLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const navigation: any = useNavigation();

  // Entrance animation
  const cardAnim = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        delay: 120,
      }),
      Animated.spring(cardAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 55,
        friction: 11,
        delay: 120,
      }),
    ]).start();
    fetchLocation();
  }, []);

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
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (place) {
        const name =
          place.name ||
          place.street ||
          place.district ||
          place.city ||
          "Unknown Location";
        setLocationName(name);
      }
    } catch {
      setLocationName("Error getting location");
    } finally {
      setLocLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!coords) {
      Alert.alert("No location", "Please wait for your location to load.");
      return;
    }

    try {
      // 👉 simulate success (later replace with API / validation)

      Alert.alert("Success", "Check-in successful!");

      // ✅ Navigate to Dashboard
      navigation.replace("EmployeeDashboard");
    } catch (error) {
      Alert.alert("Error", "Check-in failed. Try again.");
    }
  };

  const mapRegion = coords
    ? {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      }
    : undefined;

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#8b0111" />
      {/* ── TOP NAV BAR ── */}
      <View style={s.navbar}>
        {/* <TouchableOpacity
          style={s.backBtn}
    
            onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity> */}

        <Text style={s.navTitle}>Check In</Text>

        {/* Spacer to balance the back button */}
        <View style={s.navSpacer} />
      </View>

      {/* ── CONTENT ── */}
      <Animated.View
        style={[
          s.content,
          { opacity: cardOpacity, transform: [{ translateY: cardAnim }] },
        ]}
      >
        {/* LOCATION CARD */}
        <View style={s.card}>
          {/* Location pill */}
          <View style={s.locationRow}>
            <MapPin size={16} color={BRAND} strokeWidth={2.2} />
            <Text style={s.locationText} numberOfLines={1}>
              {locLoading ? "Detecting location…" : locationName}
            </Text>
            {locLoading && (
              <ActivityIndicator
                size="small"
                color={BRAND}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>

          {/* MAP */}
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
                <Marker coordinate={coords} />
              </MapView>
            ) : (
              <View style={s.mapFallback}>
                {locLoading ? (
                  <ActivityIndicator size="large" color={BRAND} />
                ) : (
                  <Text style={s.mapFallbackText}>Map unavailable</Text>
                )}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[s.checkInBtn, checkingIn && s.checkInBtnDisabled]}
          onPress={handleCheckIn}
          activeOpacity={0.82}
          disabled={checkingIn}
        >
          {checkingIn ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <CheckCircle2
                size={18}
                color="#fff"
                strokeWidth={2.5}
                style={{ marginRight: 8 }}
              />
              <Text style={s.checkInBtnText}>CHECK IN NOW</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default CheckInScreen;

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },

  // ── Navbar
  navbar: {
    backgroundColor: BRAND,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  navSpacer: {
    width: 36,
  },

  // ── Content
  content: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },

  // ── Card
  card: {
    backgroundColor: "#fff",
    padding: 5,
    marginBottom: 10,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
    marginLeft: 6,
    letterSpacing: 0.1,
  },

  // ── Map
  mapWrap: {
    height: height * 0.5, // ~40% smaller than filling the card flex space
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapFallbackText: {
    color: "#999",
    fontSize: 14,
  },

  // ── Check In button
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 4,
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
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
