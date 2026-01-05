import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import * as Notifications from "expo-notifications";

import AppNavigator from "./navigation/AppNavigator";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import { createStackNavigator } from "@react-navigation/stack";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import PlantDetailsScreen from "./screens/PlantDetailsScreen";

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      await Notifications.requestPermissionsAsync();
    };
    requestPermissions();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Ładowanie Twoich roślin...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={AppNavigator} />
            <Stack.Screen name="PlantDetails" component={PlantDetailsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
