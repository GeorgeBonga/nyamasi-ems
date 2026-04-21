// LocationPickerModal.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  Keyboard,
  Animated,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Search, X, MapPin, Check, Navigation, Clock } from "lucide-react-native";

const GOOGLE_API_KEY = "AIzaSyDXt21WgF8JjTYCg33rTXQVUDC_CHdJv3w"; 

const COLORS = {
  primary: "#8B0111",
  primaryMuted: "rgba(139,1,17,0.08)",
  white: "#FFFFFF",
  background: "#F0F5FB",
  cardBg: "#FFFFFF",
  textPrimary: "#0D2137",
  textSecondary: "#4A6580",
  textMuted: "#8FA3B8",
  border: "#D6E4F0",
  success: "#00897B",
  danger: "#C62828",
  overlayBg: "rgba(13,33,55,0.6)",
  suggestionHover: "#F7FAFD",
};

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
}

// Reads the key from Expo Constants if available, falls back to the hardcoded one above
function getApiKey(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default;
    return (
      Constants?.expoConfig?.extra?.googleMapsApiKey ||
      Constants?.manifest?.extra?.googleMapsApiKey ||
      GOOGLE_API_KEY
    );
  } catch {
    return GOOGLE_API_KEY;
  }
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  initialLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [region, setRegion] = useState<Region>({
    latitude: -1.286389,
    longitude: 36.817223,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [recentSearches] = useState<string[]>(["Nairobi CBD", "Westlands", "Karen"]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const suggestionsAnim = useRef(new Animated.Value(0)).current;

  const apiKey = getApiKey();

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [initialLocation]);

  // Animate suggestions dropdown
  useEffect(() => {
    Animated.spring(suggestionsAnim, {
      toValue: showSuggestions && (suggestions.length > 0 || searchQuery.length === 0) ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  }, [showSuggestions, suggestions.length, searchQuery.length]);

  // ── Autocomplete via Places API ──────────────────────────────────────────────
  const fetchSuggestions = useCallback(
    async (text: string) => {
      if (!text.trim() || text.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${apiKey}&language=en&components=country:ke`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK" || data.status === "ZERO_RESULTS") {
          setSuggestions(data.predictions || []);
        }
      } catch {
        // Silently fail autocomplete; user can still press search
      }
    },
    [apiKey]
  );

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300); // 300 ms debounce — feels instant
  };

  // ── Resolve a place_id to coordinates ───────────────────────────────────────
  const resolvePlace = async (placeId: string, description: string) => {
    setSearching(true);
    setShowSuggestions(false);
    Keyboard.dismiss();

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        const { lat, lng } = data.result.geometry.location;
        const newLocation: LocationData = {
          name: data.result.name || description.split(",")[0],
          latitude: lat,
          longitude: lng,
          address: data.result.formatted_address || description,
        };
        setSelectedLocation(newLocation);
        setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        setSearchQuery(newLocation.name);
      } else {
        Alert.alert("Error", "Could not retrieve location details.");
      }
    } catch {
      Alert.alert("Error", "Failed to fetch location. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // ── Geocode free-text when user presses Search ───────────────────────────────
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setShowSuggestions(false);
    Keyboard.dismiss();

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchQuery
      )}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;
        const name =
          data.results[0].address_components?.[0]?.long_name || formattedAddress.split(",")[0];

        const newLocation: LocationData = { name, latitude: lat, longitude: lng, address: formattedAddress };
        setSelectedLocation(newLocation);
        setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      } else {
        Alert.alert("Not Found", "No location found for this search. Try a different term.");
      }
    } catch {
      Alert.alert("Error", "Failed to search location. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // ── Tap on map ────────────────────────────────────────────────────────────────
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setShowSuggestions(false);

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        const name =
          data.results[0].address_components?.[0]?.long_name || address.split(",")[0];
        setSelectedLocation({ name, latitude, longitude, address });
        setSearchQuery(name);
      } else {
        const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setSelectedLocation({ name: `Location at ${fallback}`, latitude, longitude, address: fallback });
      }
    } catch {
      const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setSelectedLocation({ name: `Location at ${fallback}`, latitude, longitude, address: fallback });
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation);
      onClose();
    } else {
      Alert.alert("No Location", "Please select a location on the map or via search.");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // ── Highlight matching text in suggestion ─────────────────────────────────────
  const renderHighlighted = (text: string, query: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1 || !query)
      return <Text style={styles.suggestionMain}>{text}</Text>;

    return (
      <Text style={styles.suggestionMain}>
        {text.slice(0, idx)}
        <Text style={styles.suggestionHighlight}>{text.slice(idx, idx + query.length)}</Text>
        {text.slice(idx + query.length)}
      </Text>
    );
  };

  const showDropdown = showSuggestions && (suggestions.length > 0 || (searchQuery.length === 0 && recentSearches.length > 0));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Assigned Area</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Advanced Search Bar ── */}
          <View style={styles.searchWrapper}>
            <View style={[styles.searchBar, showDropdown && styles.searchBarOpen]}>
              {/* Left icon */}
              <View style={styles.searchIconLeft}>
                {searching ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Search size={16} color={COLORS.primary} />
                )}
              </View>

              {/* Input */}
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleTextChange}
                placeholder="Search area, city or address…"
                placeholderTextColor={COLORS.textMuted}
                onSubmitEditing={searchLocation}
                onFocus={() => setShowSuggestions(true)}
                returnKeyType="search"
                autoCorrect={false}
              />

              {/* Clear */}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
                  <X size={14} color={COLORS.white} />
                </TouchableOpacity>
              )}

              {/* Divider + Search button */}
              <View style={styles.dividerVertical} />
              <TouchableOpacity
                style={styles.searchPill}
                onPress={searchLocation}
                disabled={searching}
              >
                <Text style={styles.searchPillText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* ── Dropdown suggestions ── */}
            {showDropdown && (
              <Animated.View
                style={[
                  styles.dropdown,
                  { opacity: suggestionsAnim, transform: [{ scaleY: suggestionsAnim }] },
                ]}
              >
                {/* Recent searches (shown when input empty) */}
                {searchQuery.length === 0 && recentSearches.length > 0 && (
                  <>
                    <Text style={styles.dropdownLabel}>Recent</Text>
                    {recentSearches.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={styles.suggestionRow}
                        onPress={() => {
                          setSearchQuery(r);
                          fetchSuggestions(r);
                        }}
                      >
                        <Clock size={14} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                        <Text style={styles.suggestionMain}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                    <View style={styles.dropdownDivider} />
                  </>
                )}

                {/* Autocomplete results */}
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={[
                      styles.suggestionRow,
                      index === suggestions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => resolvePlace(item.place_id, item.description)}
                  >
                    <Navigation size={14} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      {renderHighlighted(
                        item.structured_formatting?.main_text || item.description,
                        searchQuery
                      )}
                      {item.structured_formatting?.secondary_text ? (
                        <Text style={styles.suggestionSub} numberOfLines={1}>
                          {item.structured_formatting.secondary_text}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </View>

          {/* Map */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowSuggestions(false)}
            style={styles.mapContainer}
          >
            <MapView
              style={styles.map}
              region={region}
              onPress={handleMapPress}
              onRegionChangeComplete={setRegion}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title={selectedLocation.name}
                  description={selectedLocation.address}
                >
                  <View style={styles.markerContainer}>
                    <MapPin size={28} color={COLORS.primary} />
                  </View>
                </Marker>
              )}
            </MapView>
          </TouchableOpacity>

          {/* Selected Location Info */}
          {selectedLocation && (
            <View style={styles.locationInfo}>
              <View style={styles.locationHeader}>
                <MapPin size={16} color={COLORS.primary} />
                <Text style={styles.locationName}>{selectedLocation.name}</Text>
              </View>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {selectedLocation.address}
              </Text>
              <View style={styles.coordinates}>
                <Text style={styles.coordText}>
                  Lat: {selectedLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordText}>
                  Lng: {selectedLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Check size={20} color={COLORS.white} />
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayBg,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    height: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Search ──────────────────────────────────────────────────────────────────
  searchWrapper: {
    zIndex: 999,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBarOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: "transparent",
  },
  searchIconLeft: {
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
    height: 44,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  dividerVertical: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
  },
  searchPill: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 4,
  },
  searchPillText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },

  // ── Dropdown ────────────────────────────────────────────────────────────────
  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    transformOrigin: "top",
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.textMuted,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    textTransform: "uppercase",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  suggestionMain: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  suggestionHighlight: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  suggestionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // ── Map ─────────────────────────────────────────────────────────────────────
  mapContainer: {
    height: 340,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Location info ────────────────────────────────────────────────────────────
  locationInfo: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  locationName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  locationAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  coordinates: {
    flexDirection: "row",
    gap: 12,
  },
  coordText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // ── Confirm ──────────────────────────────────────────────────────────────────
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 15,
  },
});

export default LocationPickerModal;