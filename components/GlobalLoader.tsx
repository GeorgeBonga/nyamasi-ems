import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, Animated, Dimensions, Image } from "react-native";
import { useLoader } from "../app/context/LoaderContext";
import Spinner from "../assets/images/spinner.gif";

const { width, height } = Dimensions.get("window");

const GlobalLoader = () => {
  const { loading } = useLoader();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true); // Mount first, then animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out, THEN unmount
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 0.95,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false)); // ← unmount only after animation ends
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image source={Spinner} style={styles.spinner} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
};

export default GlobalLoader;

const styles = StyleSheet.create({
  overlay: {
    // ✅ Full-screen white background
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    // ✅ Sit on top of everything
    zIndex: 9999,
    elevation: 9999,
  },
  spinner: {
    width: 120,
    height: 120,
  },
});