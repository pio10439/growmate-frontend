import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Platform } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import AddPlantScreen from "../screens/AddPlantScreen";
import InspirationsScreen from "../screens/InspirationsScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          height: 77,
          paddingTop: 1,
          paddingBottom: Platform.OS === "ios" ? 10 : 12,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          marginTop: 1,
        },
        tabBarItemStyle: {
          paddingHorizontal: 5.5,
          paddingVertical: 1,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Rośliny",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sprout" size={28} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarLabel: "Kalendarz",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={28} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="AddPlantTab"
        component={AddPlantScreen}
        options={{
          tabBarLabel: "Dodaj",
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={{
                top: Platform.OS === "ios" ? -20 : -25,
                marginBottom: Platform.OS === "ios" ? 0 : -10,
              }}
            >
              <View style={styles.floatingButton}>
                <Ionicons name="add" size={36} color="white" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name="InspirationsTab"
        component={InspirationsScreen}
        options={{
          tabBarLabel: "Inspiracje",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Ustawienia",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={28} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = {
  floatingButton: {
    width: 64,
    height: 64,
    backgroundColor: "#2e7d32",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 4,
    borderColor: "white",
  },
};
