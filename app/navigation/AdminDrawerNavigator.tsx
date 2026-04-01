// AdminDrawerNavigator.js
import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Users, FileText, DollarSign, Bike, ShoppingCart, LogOut } from 'lucide-react-native';

// Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import EmployeesScreen from '../screens/admin/EmployeesScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import PayrollScreen from '../screens/admin/PayrollScreen';
import RidersManagementScreen from '../screens/admin/riders/RidersManagementScreen';
import OrdersManagementScreen from '../screens/admin/deliveries/OrdersManagementScreen';

const Drawer = createDrawerNavigator();

const COLORS = {
  primary: "#8B0111",
  white: "#FFFFFF",
  textPrimary: "#0D2137",
  textSecondary: "#4A6580",
  textMuted: "#8FA3B8",
  background: "#F0F5FB",
  drawerBg: "#0D2137",
  drawerText: "rgba(255,255,255,0.7)",
  drawerActive: "rgba(139,1,17,0.18)",
  overlayBg: "rgba(13,33,55,0.55)",
};

// Custom Drawer Content
function CustomDrawerContent(props: any) {
  const { state, navigation } = props;
  const activeRouteName = state.routes[state.index].name;

  const handleLogout = () => {
    navigation.replace('Login');
  };

  const handleNavigate = (screenName: string) => {
    navigation.navigate(screenName);
  };

  const mainMenuItems = [
    { key: "Dashboard", label: "Dashboard", icon: Home, screen: "Dashboard" },
    { key: "Employees", label: "Employees", icon: Users, screen: "Employees" },
    { key: "Reports", label: "Reports", icon: FileText, screen: "Reports" },
    { key: "Payroll", label: "Payroll", icon: DollarSign, screen: "Payroll" },
  ];

  const dispatchItems = [
    { key: "RidersManagement", label: "Riders", icon: Bike, screen: "RidersManagement" },
    { key: "OrdersManagement", label: "Orders", icon: ShoppingCart, screen: "OrdersManagement" },
  ];

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerAvatar}>
          <Text style={styles.drawerAvatarText}>AD</Text>
        </View>
        <View style={styles.drawerUserInfo}>
          <Text style={styles.drawerUserName}>Admin</Text>
          <Text style={styles.drawerUserRole}>System Administrator</Text>
        </View>
      </View>

      <View style={styles.drawerDivider} />

      <DrawerContentScrollView 
        {...props} 
        style={styles.drawerNav}
        contentContainerStyle={styles.drawerNavContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.drawerSection}>MAIN MENU</Text>
        {mainMenuItems.map((item) => {
          const isActive = activeRouteName === item.key;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.drawerItem,
                isActive && styles.drawerItemActive,
              ]}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.75}
            >
              <View style={styles.drawerItemIcon}>
                <IconComponent 
                  size={20} 
                  color={isActive ? COLORS.white : COLORS.drawerText} 
                />
              </View>
              <Text
                style={[
                  styles.drawerItemText,
                  isActive && styles.drawerItemTextActive,
                ]}
              >
                {item.label}
              </Text>
              {isActive && <View style={styles.drawerActiveDot} />}
            </TouchableOpacity>
          );
        })}

        <View style={styles.drawerDivider} />
        
        <Text style={styles.drawerSection}>DISPATCH</Text>
        {dispatchItems.map((item) => {
          const isActive = activeRouteName === item.key;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.drawerItem,
                isActive && styles.drawerItemActive,
              ]}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.75}
            >
              <View style={styles.drawerItemIcon}>
                <IconComponent 
                  size={20} 
                  color={isActive ? COLORS.white : COLORS.drawerText} 
                />
              </View>
              <Text
                style={[
                  styles.drawerItemText,
                  isActive && styles.drawerItemTextActive,
                ]}
              >
                {item.label}
              </Text>
              {isActive && <View style={styles.drawerActiveDot} />}
            </TouchableOpacity>
          );
        })}

        <View style={styles.drawerDivider} />
        
        <Text style={styles.drawerSection}>ACCOUNT</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.drawerItem}
          activeOpacity={0.75}
        >
          <View style={styles.drawerItemIcon}>
            <LogOut size={20} color={COLORS.drawerText} />
          </View>
          <Text style={styles.drawerItemText}>Logout</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <Text style={styles.drawerFooterText}>v1.0.0 · Admin Panel</Text>
      </View>
    </SafeAreaView>
  );
}


export default function AdminDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: "72%",
          backgroundColor: COLORS.primary,
          
        }
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
      />
      <Drawer.Screen
        name="Employees"
        component={EmployeesScreen}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
      />
      <Drawer.Screen
        name="Payroll"
        component={PayrollScreen}
      />
      <Drawer.Screen
        name="RidersManagement"
        component={RidersManagementScreen}
      />
      <Drawer.Screen
        name="OrdersManagement"
        component={OrdersManagementScreen}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 16 : 0,
    paddingBottom: 20,
    gap: 12,
  },
  drawerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  drawerAvatarText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 16,
  },
  drawerUserInfo: {
    flex: 1,
  },
  drawerUserName: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 16,
  },
  drawerUserRole: {
    color: COLORS.drawerText,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 20,
    marginVertical: 8,
  },
  drawerNav: {
    flex: 1,
  },
  drawerNavContent: {
    paddingTop: 8,
  },
  drawerSection: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 2,
    marginHorizontal: 12,
  },
  drawerItemActive: {
    backgroundColor: COLORS.drawerActive,
    borderWidth: 1,
    borderColor: "rgba(139,1,17,0.3)",
  },
  drawerItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.drawerText,
  },
  drawerItemTextActive: {
    color: COLORS.white,
    fontWeight: "800",
  },
  drawerActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  drawerFooterText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    fontWeight: "500",
    textAlign: "center",
  },
});