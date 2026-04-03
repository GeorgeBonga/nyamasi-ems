// GlobalLoader.tsx
import React, { useRef, useEffect } from "react";
import { StyleSheet, Animated, Dimensions, Image } from "react-native";
import { useLoader } from "../app/context/LoaderContext";
import Spinner from "../assets/images/spinner.gif";

const { width, height } = Dimensions.get("window");

const GlobalLoader = () => {
  const { loading } = useLoader();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (loading) {
      // Show loader with animation
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
      // Hide loader with animation
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
      ]).start();
    }
  }, [loading]);

  if (!loading) return null;

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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    backgroundColor: "#FFFFFF",
  },
  spinner: {
    width: 120,
    height: 120,
  },
});