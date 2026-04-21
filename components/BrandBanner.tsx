import React from "react";
import { View,Text, StyleSheet } from "react-native";
import Svg, { Polygon } from "react-native-svg";
const BrandBanner: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.blackBg} />

      {/* SVG Shapes */}
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        {/* Red Section */}
        <Polygon points="70,0 1000,0 1000,100 50,100" fill="#8b0111" />

        {/* White Slanted Line */}
        <Polygon points="60,0 70,0 50,100 40,100" fill="#ffffff" />
      </Svg>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.text, { fontFamily: "DancingScript" }]}>
          Eat.... Drink.... Be Healthy
        </Text>
      </View>
    </View>
  );
};

export default BrandBanner;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 60,
    overflow: "hidden",
  },

  blackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#222222",
  },

  textContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 40, // push text away from slant
  },

  text: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "500",
  },
});
