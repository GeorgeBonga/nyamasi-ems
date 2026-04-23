// App.tsx
import { useFonts } from "expo-font";
import AppNavigator from "./app/navigation/AppNavigator";
import DancingScript from "./assets/fonts/DancingScript-Regular.ttf";
import { LoaderProvider } from "./app/context/LoaderContext";
import { NavigationContainer } from "@react-navigation/native";
import GlobalLoader from "./components/GlobalLoader";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
export default function App() {



useEffect(() => {
  const setupNotifications = async () => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Set up Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      // Cancel any existing scheduled notifications (optional - for clean testing)
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Check existing notifications
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      
      if (existing.length > 0) {
        console.log('Notifications already scheduled:', existing.length);
        return;
      }

      // Schedule the daily notification
      await Notifications.scheduleNotificationAsync({
        content: {
        title: "Daily Report Reminder",
        body: "It's 6 PM — remember to submit your daily sales report before 7 PM!",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY, // Critical: prevents immediate firing
          channelId: Platform.OS === 'android' ? 'default' : undefined,
          hour: 18,
          minute: 0,
         
        },
      });

      console.log('✅ Notification scheduled for 6:00 PM daily');

    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  // Set notification handler (runs when notification is received)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  setupNotifications();

  // Optional: Cleanup function
  return () => {
    // Add cleanup logic here if needed (e.g., removing listeners)
  };
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