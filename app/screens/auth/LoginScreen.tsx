import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  View as RNView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "../../../components/Themed";
import { Eye, EyeOff } from "lucide-react-native";
import Icon from "../../../assets/images/icon.png";
import BrandBanner from "../../../components/BrandBanner";
import FloatingInput from "../../../components/FloatingInput";
import Button from "../../../components/Button";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useLoader } from "../../context/LoaderContext";
import { login } from "../../data/dbService";

const { width } = Dimensions.get("window");
const WHITE = "#ffffff";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

// ── LoginScreen ───────────────────────────────────────────
const LoginScreen: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const scheme = useColorScheme();
  const { withLoader, loading: globalLoading } = useLoader();

  const navigation = useNavigation<NavigationProp>();
  const dark = scheme === "dark";

  const handleLogin = async () => {
    // Validate inputs
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setLocalLoading(true);
    
    try {
      const result = await login(phone, password);

      if (!result.success || !result.user) {
        Alert.alert("Login Failed", result.error || "Invalid credentials. Please try again.");
        return;
      }

      const { role, employeeId } = result.user;
      const employee = result.employee;

      console.log("Login successful:", { role, employeeId, employeeName: employee?.fullName });

      // Navigate based on user role
      switch (role) {
        case "admin":
          navigation.replace("Admin");
          break;
          
        case "employee":
          // Pass employeeId to CheckIn screen
          if (!employeeId) {
            Alert.alert("Error", "Employee profile not found. Please contact administrator.");
            return;
          }
          navigation.replace("CheckIn", { employeeId });
          break;
          
        case "rider":
          navigation.replace("RiderDeliveryScreen");
          break;
          
        default:
          Alert.alert("Error", "Unknown user role. Please contact administrator.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  };

  // Use either local loading or global loading for the button
  const isLoading = localLoading || globalLoading;
  const eyeColor = dark ? "#6C7883" : "#aaa";
  const bg = dark ? "#17212B" : WHITE;

  return (
    <RNView style={[s.outer, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor={bg}
      />

      <SafeAreaView style={s.safeContent} edges={["top"]}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <RNView style={s.root}>
            {/* ── LOGO ── */}
            <View style={s.logoWrap}>
              <Image source={Icon} style={s.logo} resizeMode="contain" />
            </View>

            {/* ── TITLE ── */}
            <Text style={s.title}>NYAMASI</Text>
            <Text style={s.subtitle}>Management System</Text>

            {/* ── FORM ── */}
            <View style={[s.form, { backgroundColor: "transparent" }]}>
              {/* Phone */}
              <FloatingInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />

              {/* Password */}
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPass ? (
                      <Eye size={20} color={eyeColor} />
                    ) : (
                      <EyeOff size={20} color={eyeColor} />
                    )}
                  </TouchableOpacity>
                }
              />

              {/* Login Button */}
              <Button
                label="Log In"
                onPress={handleLogin}
                loading={isLoading}
                style={{ marginTop: 4 }}
              />

         

              {/* Location note */}
              <Text style={s.locationNote}>Location Login Required</Text>
            </View>
          </RNView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── WAVE / BRAND BANNER ── */}
      <SafeAreaView edges={["bottom"]} style={s.bannerSafe}>
        <BrandBanner />
      </SafeAreaView>
    </RNView>
  );
};

// ── StyleSheet ────────────────────────────────────────────
const s = StyleSheet.create({
  outer: {
    flex: 1,
  },

  safeContent: {
    flex: 1,
  },

  flex: { 
    flex: 1 
  },

  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingBottom: 24,
  },

  logoWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  
  logo: { 
    width: 90, 
    height: 90 
  },

  title: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 3,
    marginBottom: 36,
    opacity: 0.75,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  form: {
    width: width * 0.84,
    alignItems: "center",
    zIndex: 1,
  },

  locationNote: {
    marginTop: 18,
    fontSize: 12.5,
    color: "#9aa5b4",
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  bannerSafe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
});

export default LoginScreen;