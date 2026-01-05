import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Calendar, CalendarUtils } from "react-native-calendars";
import { authorizedRequest } from "../services/api";

export default function CalendarScreen({ navigation }) {
  const [plants, setPlants] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [stats, setStats] = useState({ wateredThisMonth: 0, dueToday: 0 });

  const fetchPlantsAndCalculateCalendar = useCallback(async () => {
    try {
      const res = await authorizedRequest({
        url: "/plants",
        method: "GET",
      });

      const fetchedPlants = res.data;
      setPlants(fetchedPlants);

      const marked = {};
      let wateredThisMonth = 0;
      let dueToday = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = CalendarUtils.getCalendarDateString(today);

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      fetchedPlants.forEach((plant) => {
        const interval = plant.wateringInterval || 7;
        let lastWateredDate = null;

        if (plant.lastWatered) {
          if (plant.lastWatered.toDate) {
            lastWateredDate = plant.lastWatered.toDate();
          } else if (plant.lastWatered.seconds) {
            lastWateredDate = new Date(plant.lastWatered.seconds * 1000);
          }

          if (lastWateredDate) {
            lastWateredDate.setHours(0, 0, 0, 0);

            const wateredKey =
              CalendarUtils.getCalendarDateString(lastWateredDate);
            marked[wateredKey] = marked[wateredKey] || { dots: [] };
            marked[wateredKey].dots.push({ key: "watered", color: "#4caf50" });

            if (
              lastWateredDate.getMonth() === currentMonth &&
              lastWateredDate.getFullYear() === currentYear
            ) {
              wateredThisMonth++;
            }

            const nextDue = new Date(lastWateredDate);
            nextDue.setDate(nextDue.getDate() + interval);
            const nextDueString = CalendarUtils.getCalendarDateString(nextDue);

            marked[nextDueString] = marked[nextDueString] || { dots: [] };
            marked[nextDueString].dots.push({ key: "due", color: "#ff9800" });

            if (nextDue <= today) {
              dueToday++;
            }
          }
        } else {
          dueToday++;
          marked[todayString] = marked[todayString] || { dots: [] };
          marked[todayString].dots.push({ key: "due", color: "#ff9800" });
        }
      });

      if (dueToday > 0) {
        marked[todayString] = {
          ...marked[todayString],
          marked: true,
          dotColor: "#ff5722",
          selected: true,
          selectedColor: "#e8f5e8",
        };
      }

      setMarkedDates(marked);
      setStats({ wateredThisMonth, dueToday });
    } catch (error) {
      console.error("Błąd pobierania roślin:", error);
      Alert.alert(
        "Błąd",
        "Nie udało się załadować kalendarza. Sprawdź połączenie."
      );
    }
  }, []);

  useEffect(() => {
    fetchPlantsAndCalculateCalendar();
  }, [fetchPlantsAndCalculateCalendar]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPlantsAndCalculateCalendar();
    });

    return unsubscribe;
  }, [navigation, fetchPlantsAndCalculateCalendar]);

  const markAllAsWateredToday = async () => {
    if (stats.dueToday === 0) {
      Alert.alert("Brawo!", "Wszystkie rośliny są na bieżąco podlane 🌱");
      return;
    }

    Alert.alert(
      "Podlej wszystkie?",
      `Oznaczysz ${stats.dueToday} roślin(y) jako podlane dzisiaj`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Tak, podlałem!",
          onPress: async () => {
            try {
              const promises = plants
                .filter((plant) => {
                  if (!plant.lastWatered) return true;
                  const interval = plant.wateringInterval || 7;
                  let last;
                  if (plant.lastWatered.toDate) {
                    last = plant.lastWatered.toDate();
                  } else if (plant.lastWatered.seconds) {
                    last = new Date(plant.lastWatered.seconds * 1000);
                  } else {
                    return false;
                  }
                  last.setHours(0, 0, 0, 0);
                  const next = new Date(last);
                  next.setDate(next.getDate() + interval);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return next <= today;
                })
                .map((plant) =>
                  authorizedRequest({
                    url: `/plants/${plant.id}/water`,
                    method: "POST",
                  })
                );

              await Promise.all(promises);
              Alert.alert(
                "Sukces!",
                "Wszystkie rośliny oznaczone jako podlane 🌧️"
              );
              fetchPlantsAndCalculateCalendar();
            } catch (error) {
              console.error("Błąd masowego podlania:", error);
              Alert.alert("Błąd", "Nie udało się oznaczyć podlania");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kalendarz podlewania</Text>

      <View style={styles.stats}>
        <Text style={styles.statText}>
          Do podlania dzisiaj: {""}
          <Text style={styles.highlight}>{stats.dueToday}</Text>
        </Text>

        <Text style={styles.statText}>
          Podlań w tym miesiącu:{" "}
          <Text style={styles.highlight}>{stats.wateredThisMonth}</Text>
        </Text>
      </View>

      <Calendar
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          todayTextColor: "#2e7d32",
          todayBackgroundColor: "#e8f5e8",
          selectedDayBackgroundColor: "#2e7d32",
          dotColor: "#4caf50",
        }}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#4caf50" }]} />
          <Text>Dzień podlania</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#ff9800" }]} />
          <Text>Planowane podlanie</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#ff5722" }]} />
          <Text>Dzisiaj do podlania!</Text>
        </View>
      </View>

      {stats.dueToday > 0 && (
        <TouchableOpacity
          style={styles.waterAllBtn}
          onPress={markAllAsWateredToday}
        >
          <Text style={styles.waterAllText}>
            Podlej wszystkie dzisiaj ({stats.dueToday} roślin)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginVertical: 20,
  },
  stats: {
    flexDirection: "column",
    justifyContent: "center",
    marginBottom: 15,
    padding: 14,
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 3,
  },
  statText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  highlight: { fontWeight: "bold", color: "#2e7d32", fontSize: 20 },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 24,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 6,
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  waterAllBtn: {
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
  },
  waterAllText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
