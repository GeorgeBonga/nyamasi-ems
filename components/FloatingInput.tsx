import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  useColorScheme,
} from "react-native";

const BRAND = "#8b0111";
const LIGHT_BG = "#fff";
const DARK_BG = "#17212B";
const LIGHT_BORDER = "#ccc";
const DARK_BORDER = "#2E3B47";
const LIGHT_TEXT = "#1a1a2e";
const DARK_TEXT = "#E9EDF0";
const MUTED = "#aaa";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  rightElement?: React.ReactNode;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

const FloatingInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  rightElement,
  autoCapitalize = "none",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const bgColor = dark ? DARK_BG : LIGHT_BG;
  const borderColor = isFocused ? BRAND : dark ? DARK_BORDER : LIGHT_BORDER;
  const textColor = dark ? DARK_TEXT : LIGHT_TEXT;

  const labelAnimStyle = {
    position: "absolute" as const,
    left: 14,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -9],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 11],
    }),
    color: isFocused ? BRAND : MUTED,
    backgroundColor: bgColor,
    paddingHorizontal: 4,
    zIndex: 10,
    fontWeight: isFocused ? ("600" as const) : ("400" as const),
  };

  return (
    <View style={[styles.container, { borderColor, backgroundColor: bgColor }]}>
      <Animated.Text style={labelAnimStyle}>{label}</Animated.Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { color: textColor }]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {rightElement && <View style={styles.rightSlot}>{rightElement}</View>}
    </View>
  );
};

export default FloatingInput;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    paddingTop: 6,
  },
  rightSlot: {
    paddingLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});