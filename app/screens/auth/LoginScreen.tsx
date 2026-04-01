import React, { useState, useRef, useEffect } from "react";
import {
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  TouchableOpacity,
  useColorScheme,
  View as RNView,
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


const { width, height } = Dimensions.get("window");
const BRAND = "#8b0111";
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
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();
 

const navigation = useNavigation<NavigationProp>();
  const dark = scheme === "dark";

  // Staggered entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 100,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
        delay: 100,
      }),
    ]).start();
  }, []);

const handleLogin = () => {
  setLoading(true);

  setTimeout(() => {
    setLoading(false);

 
    if (phone === "1" && password === "1") {
      navigation.replace("Admin");
    } 
    else if (phone === "2" && password === "2") {
      navigation.replace("CheckIn"); // Seller (employee)
    } 
    else if (phone === "3" && password === "3") {
      navigation.replace("RiderDeliveryScreen"); // Rider
    } 
    else {
      alert("Invalid credentials");
    }

  }, 800);
};

  const eyeColor = dark ? "#6C7883" : "#aaa";
  const bg = dark ? "#17212B" : WHITE;

  return (
    // Outer container holds everything: keyboard area + banner
    <RNView style={[s.outer, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={dark ? "light-content" : "dark-content"}
        backgroundColor={bg}
      />

      {/* SafeAreaView wraps only the scrollable/keyboard content */}
      <SafeAreaView style={s.safeContent} edges={["top"]}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Animated.View
            style={[
              s.root,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
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
              />

              {/* Password */}
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
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
                loading={loading}
                style={{ marginTop: 4 }}
              />

              {/* Location note */}
              <Text style={s.locationNote}>Location Login Required</Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── WAVE / BRAND BANNER ── lives OUTSIDE KeyboardAvoidingView ── */}
      <SafeAreaView edges={["bottom"]} style={s.bannerSafe}>
        <BrandBanner />
      </SafeAreaView>
    </RNView>
  );
};

// ── StyleSheet ────────────────────────────────────────────
const s = StyleSheet.create({
  // Full-screen shell
  outer: {
    flex: 1,
  },

  // Grows to fill space above the banner
  safeContent: {
    flex: 1,
  },

  flex: { flex: 1 },

  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // vertically centres content in remaining space
    backgroundColor: "transparent",
    paddingBottom: 24,        // small breathing room above the banner
  },

  // ── Logo
  logoWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  logo: { width: 90, height: 90 },

  // ── Title
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

  // ── Form
  form: {
    width: width * 0.84,
    alignItems: "center",
    zIndex: 1,
  },

  // ── Location note
  locationNote: {
    marginTop: 18,
    fontSize: 12.5,
    color: "#9aa5b4",
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  // ── Banner SafeArea (handles home indicator on iOS)
  bannerSafe: {
    backgroundColor: "transparent",
  },
});

export default LoginScreen;