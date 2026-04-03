// AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LoginScreen from "../screens/auth/LoginScreen";
import CheckInScreen from "../screens/employee/checkIn/CheckInScreen";
import EmployeeDashboardScreen from "../screens/employee/dashboard/EmployeeDashboardScreen";
import ReportHistoryScreen from "../screens/employee/dashboard/ReportHistoryScreen";
import RiderDeliveryScreen from "../screens/employee/rider/RiderDeliveryScreen";

import AdminDrawerNavigator from "./AdminDrawerNavigator";

export type RootStackParamList = {
  Login: undefined;
  CheckIn: undefined;
  EmployeeDashboard: undefined;
  ReportHistoryScreen: undefined;
  Admin: undefined;
  RiderDeliveryScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} />
      <Stack.Screen
        name="EmployeeDashboard"
        component={EmployeeDashboardScreen}
      />
      <Stack.Screen
        name="ReportHistoryScreen"
        component={ReportHistoryScreen}
      />
      <Stack.Screen
        name="RiderDeliveryScreen"
        component={RiderDeliveryScreen}
      />

      <Stack.Screen name="Admin" component={AdminDrawerNavigator} />
    </Stack.Navigator>
  );
}
