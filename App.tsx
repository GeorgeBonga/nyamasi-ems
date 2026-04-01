import React from "react";
import { useFonts } from "expo-font";
import AppNavigator from "./app/navigation/AppNavigator";
import DancingScript from "./assets/fonts/DancingScript-Regular.ttf";
export default function App() {
    const [fontsLoaded] = useFonts({
    DancingScript: DancingScript,
  });

   if (!fontsLoaded) return null;
  return <AppNavigator />;
}