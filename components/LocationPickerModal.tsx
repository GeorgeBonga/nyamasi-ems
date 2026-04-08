// LocationPickerModal.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Platform
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import Geocoder from "react-native-geocoding";
import { Search, X, MapPin, Check } from "lucide-react-native";

// Initialize Geocoder (get your API key from Google Cloud Console)
Geocoder.init(""); // Replace with your API key

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
};

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  initialLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [region, setRegion] = useState<Region>({
    latitude: -1.286389, // Default to Nairobi
    longitude: 36.817223,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

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

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await Geocoder.from(searchQuery);
      if (response.results.length > 0) {
        const { lat, lng } = response.results[0].geometry.location;
        const formattedAddress = response.results[0].formatted_address;
        
        const newLocation = {
          name: searchQuery,
          latitude: lat,
          longitude: lng,
          address: formattedAddress,
        };
        
        setSelectedLocation(newLocation);
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        Alert.alert("Not Found", "No location found for this search.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to search location. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      const response = await Geocoder.from({ latitude, longitude });
      if (response.results.length > 0) {
        const address = response.results[0].formatted_address;
        const name = response.results[0].address_components[0]?.long_name || address.split(",")[0];
        
        setSelectedLocation({
          name,
          latitude,
          longitude,
          address,
        });
      } else {
        setSelectedLocation({
          name: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          latitude,
          longitude,
          address: `${latitude}, ${longitude}`,
        });
      }
    } catch (error) {
      setSelectedLocation({
        name: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude,
        address: `${latitude}, ${longitude}`,
      });
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation);
      onClose();
    } else {
      Alert.alert("No Location", "Please select a location first.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Assigned Area</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Search size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for area, city, or address..."
                placeholderTextColor={COLORS.textMuted}
                onSubmitEditing={searchLocation}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchLocation}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
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
          </View>

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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  mapContainer: {
    height: 400,
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
