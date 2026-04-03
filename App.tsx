// App.tsx
import React from "react";
import { useFonts } from "expo-font";
import AppNavigator from "./app/navigation/AppNavigator";
import DancingScript from "./assets/fonts/DancingScript-Regular.ttf";
import { LoaderProvider } from "./app/context/LoaderContext";
import { NavigationContainer } from "@react-navigation/native";
import GlobalLoader from "./components/GlobalLoader";

export default function App() {
  const [fontsLoaded] = useFonts({
    DancingScript: DancingScript,
  });
  
  if (!fontsLoaded) return null;
  
  return (
    <LoaderProvider>
      <NavigationContainer>
        <AppNavigator />
        <GlobalLoader /> 
      </NavigationContainer>
    </LoaderProvider>
  );
}