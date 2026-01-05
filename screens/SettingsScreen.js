import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_KEY = "dailyRemindersEnabled";

export default function SettingsScreen({ navigation }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSetting();
  }, []);

  const loadSetting = async () => {
    try {
      const value = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const isEnabled = value === "true";
      setEnabled(isEnabled);

      if (isEnabled) {
        await scheduleDailyReminder();
      }
    } catch (error) {
      console.error("Błąd ładowania ustawień powiadomień:", error);
    }
  };

  const scheduleDailyReminder = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Czas na podlewanie roślin! 🌱",
          body: "Otwórz GrowMate i sprawdź, które rośliny potrzebują wody dzisiaj.",
          sound: "default",
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error("Błąd planowania powiadomienia:", error);
    }
  };

  const toggleReminders = async (value) => {
    setLoading(true);
    setEnabled(value);

    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, value.toString());

      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Brak uprawnień",
            "Aby otrzymywać codzienne przypomnienia, włącz powiadomienia w ustawieniach telefonu.",
            [
              { text: "Anuluj", style: "cancel" },
              {
                text: "Otwórz ustawienia",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          setEnabled(false);
          await AsyncStorage.setItem(NOTIFICATIONS_KEY, "false");
          return;
        }

        await scheduleDailyReminder();
        Alert.alert(
          "Sukces! 🔔",
          "Codzienne przypomnienie o 8:00 zostało włączone."
        );
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert("Wyłączono", "Codzienne przypomnienia zostały wyłączone.");
      }
    } catch (error) {
      console.error("Błąd zmiany ustawień:", error);
      Alert.alert("Błąd", "Nie udało się zapisać ustawień.");
      setEnabled(!value);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ustawienia</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Powiadomienia</Text>

        <View style={styles.option}>
          <View style={styles.optionText}>
            <Text style={styles.label}>
              Codzienne przypomnienie o podlewaniu
            </Text>
            <Text style={styles.description}>
              Każdego dnia o 8:00 otrzymasz powiadomienie zachęcające do
              sprawdzenia roślin
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggleReminders}
            disabled={loading}
            trackColor={{ false: "#767577", true: "#81c784" }}
            thumbColor={enabled ? "#2e7d32" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("Calendar")}
      >
        <Text style={styles.actionButtonText}>
          📅 Otwórz kalendarz podlewania
        </Text>
      </TouchableOpacity>

      {/* jednostki temp */}
      {/* 
      Tryb ciemny
      */}

      <Text style={styles.version}>Wersja aplikacji: 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginVertical: 30,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  optionText: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  version: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 20,
  },
});
