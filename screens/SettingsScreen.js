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
import Toast from "react-native-toast-message";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { authorizedRequest } from "../services/api";
import { useTheme } from "../context/ThemeContext";

const NOTIFICATIONS_KEY = "dailyRemindersEnabled";

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme, colors } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    joinedAt: null,
    plantCount: 0,
  });

  useEffect(() => {
    loadSetting();
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserInfo();
    });
    return unsubscribe;
  }, [navigation]);

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

  const loadUserInfo = async () => {
    try {
      const res = await authorizedRequest({
        url: "/user-info",
        method: "GET",
      });
      setUserInfo(res.data);
    } catch (error) {
      console.error("Blad pobierania danych użytkownika", error);
    }
  };

  const scheduleDailyReminder = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Czas na podlewanie roślin! 🌱",
          body: "Otwórz GrowMate i sprawdź, które rośliny potrzebują wody dzisiaj.",
          sound: "true",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: "daily",
          hour: 18,
          minute: 0,
          repeats: true,
        },
      });
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log("Zaplanowane powiadomienia:", scheduled.length);
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
            ],
          );
          setEnabled(false);
          await AsyncStorage.setItem(NOTIFICATIONS_KEY, "false");
          return;
        }

        await scheduleDailyReminder();
        Toast.show({
          type: "success",
          text1: "Sukces! 🔔",
          text2: "Codzienne przypomnienie o 18:00 zostało włączone.",
          position: "bottom",
        });
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Toast.show({
          type: "info",
          text1: "Wyłączono",
          text2: "Codzienne przypomnienia zostały wyłączone.",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Błąd zmiany ustawień:", error);
      Toast.show({
        type: "error",
        text1: "Błąd",
        text2: "Nie udało się zapisać ustawień.",
        position: "bottom",
      });
      setEnabled(!value);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);

      await AsyncStorage.multiRemove(["token", "user", NOTIFICATIONS_KEY]);
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Błąd wylogowania", error);
      Toast.show({
        type: "error",
        text1: "Błąd",
        text2: "Nie udało się wylogować poprawnie.",
        position: "bottom",
      });
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Nieznana data";
    const date = new Date(isoString);
    const correctDate = date.toLocaleDateString("pl-PL", {
      month: "short",
      year: "numeric",
    });
    return (
      correctDate.replace(".", "").charAt(0).toUpperCase() +
      String(correctDate).slice(1)
    );
  };
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.primary }]}>Ustawienia</Text>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Twój Profil
        </Text>
        <View style={styles.statsContainer}>
          {[
            { label: "Twoje rośliny", value: userInfo.plantCount },
            {
              label: "Z GrowMate od",
              value: userInfo.joinedAt ? formatDate(userInfo.joinedAt) : "...",
            },
          ].map((item, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                { backgroundColor: isDark ? colors.background : "#fff" },
              ]}
            >
              <Text style={[styles.statMainText, { color: colors.primary }]}>
                {item.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Wygląd
        </Text>
        <View style={styles.option}>
          <View style={styles.optionText}>
            <Text style={[styles.label, { color: colors.text }]}>
              Tryb ciemny
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Zmień wygląd aplikacji na ciemny motyw
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: colors.accent }}
            thumbColor={isDark ? colors.primary : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Powiadomienia
        </Text>
        <View style={styles.option}>
          <View style={styles.optionText}>
            <Text style={[styles.label, { color: colors.text }]}>
              Codzienne przypomnienie
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Powiadomienie o 18:00 o podlewaniu
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggleReminders}
            disabled={loading}
            trackColor={{ false: "#767577", true: colors.accent }}
            thumbColor={enabled ? colors.primary : "#f4f3f4"}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Wyloguj się</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textSecondary }]}>
        Wersja 1.0.0
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 50,
  },
  section: {
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
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  logoutBtn: {
    backgroundColor: "#e53935",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 30,
    elevation: 4,
  },
  logoutText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  version: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statCard: {
    flex: 0.48,
    height: 100,
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  statMainText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "bold",
  },
});
