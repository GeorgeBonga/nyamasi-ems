// App.tsx
import { useFonts } from "expo-font";
import AppNavigator from "./app/navigation/AppNavigator";
import DancingScript from "./assets/fonts/DancingScript-Regular.ttf";
import { LoaderProvider } from "./app/context/LoaderContext";
import { NavigationContainer } from "@react-navigation/native";
import GlobalLoader from "./components/GlobalLoader";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
export default function App() {

  useEffect(() => {
  const setupNotifications = async () => {
    // Check if already scheduled
    const scheduled = await AsyncStorage.getItem("@notifications_scheduled");
    if (scheduled === "true") {
      console.log("Notifications already scheduled");
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    // Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("daily-reminder", {
        name: "Daily Report Reminder",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule for 6 PM Kenya time (UTC+3)
    // 6 PM EAT = 3 PM UTC
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Report Reminder",
        body: "It's 6 PM — remember to submit your daily sales report before 7 PM!",
        sound: "default",
        badge: 1,
      },
      trigger: {
       channelId: "daily-reminder",
        hour: 15, // 3 PM UTC = 6 PM EAT
        minute: 0,
        repeats: true,
      },
    });

    // Mark as scheduled
    await AsyncStorage.setItem("@notifications_scheduled", "true");
    console.log("Daily notification scheduled for 6 PM EAT");
  };

  setupNotifications();
}, []);
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