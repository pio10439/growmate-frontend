import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { authorizedRequest } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import Toast from "react-native-toast-message";

const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function CalendarScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [plants, setPlants] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [stats, setStats] = useState({
    wateredThisMonth: 0,
    fertilizedThisMonth: 0,
    dueWaterToday: 0,
    dueFertilizeToday: 0,
  });

  const addDotOnce = (marked, date, key, color) => {
    marked[date] = marked[date] || { dots: [] };
    if (!marked[date].dots.some((d) => d.key === key)) {
      marked[date].dots.push({ key, color });
    }
  };

  const fetchPlantsAndCalculateCalendar = useCallback(async () => {
    try {
      const res = await authorizedRequest({ url: "/plants", method: "GET" });
      const fetchedPlants = res.data;
      setPlants(fetchedPlants);

      const marked = {};
      let wateredThisMonth = 0;
      let fertilizedThisMonth = 0;
      let dueWaterToday = 0;
      let dueFertilizeToday = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = toDateString(today);
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      fetchedPlants.forEach((plant) => {
        const waterInterval = plant.wateringInterval || 7;
        const fertilizeInterval = plant.fertilizingInterval || 30;

        let plantNeedsWater = false;
        let plantNeedsFertilize = false;

        const parseDate = (value) => {
          if (!value) return null;
          if (value.toDate) return value.toDate();
          if (value.seconds) return new Date(value.seconds * 1000);
          if (value._seconds) return new Date(value._seconds * 1000);
          return null;
        };

        const lastWatered = parseDate(plant.lastWatered);
        if (lastWatered) {
          lastWatered.setHours(0, 0, 0, 0);
          addDotOnce(marked, toDateString(lastWatered), "watered", "#4caf50");
          if (
            lastWatered.getMonth() === currentMonth &&
            lastWatered.getFullYear() === currentYear
          ) {
            wateredThisMonth++;
          }
          for (let d = waterInterval; d <= 60; d += waterInterval) {
            const next = new Date(lastWatered);
            next.setDate(next.getDate() + d);
            const nextStr = toDateString(next);
            if (next < today) {
              addDotOnce(marked, nextStr, "missed-water", "#4584dbff");
              plantNeedsWater = true;
            } else {
              addDotOnce(marked, nextStr, "due-water", "#ff9800");
              if (nextStr === todayString) plantNeedsWater = true;
            }
          }
        } else {
          addDotOnce(marked, todayString, "due-water", "#ff9800");
          plantNeedsWater = true;
        }

        const lastFertilized = parseDate(plant.lastFertilized);
        if (lastFertilized) {
          lastFertilized.setHours(0, 0, 0, 0);
          addDotOnce(
            marked,
            toDateString(lastFertilized),
            "fertilized",
            "#9c27b0",
          );
          if (
            lastFertilized.getMonth() === currentMonth &&
            lastFertilized.getFullYear() === currentYear
          ) {
            fertilizedThisMonth++;
          }

          for (let d = fertilizeInterval; d <= 60; d += fertilizeInterval) {
            const next = new Date(lastFertilized);
            next.setDate(next.getDate() + d);
            const nextStr = toDateString(next);

            if (next < today) {
              addDotOnce(marked, nextStr, "missed-fert", "#880e4f");
              plantNeedsFertilize = true;
            } else {
              addDotOnce(marked, nextStr, "due-fertilize", "#f44336");
              if (nextStr === todayString) plantNeedsFertilize = true;
            }
          }
        } else {
          addDotOnce(marked, todayString, "due-fertilize", "#f44336");
          plantNeedsFertilize = true;
        }

        if (plantNeedsWater) dueWaterToday++;
        if (plantNeedsFertilize) dueFertilizeToday++;
      });

      if (dueWaterToday || dueFertilizeToday) {
        marked[todayString] = {
          ...marked[todayString],
          selected: true,
          selectedColor: isDark ? "#2e7d3233" : "#e8f5e8",
          selectedTextColor: colors.primary,
        };
      }

      setMarkedDates(marked);
      setStats({
        wateredThisMonth,
        fertilizedThisMonth,
        dueWaterToday,
        dueFertilizeToday,
      });
    } catch (e) {
      console.error("Blad kalendarza", e);
      Toast.show({
        type: "info",
        text1: "Błąd!",
        text2: "Nie udało się załadować kalendarza",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  }, [colors.primary, isDark]);

  useEffect(() => {
    fetchPlantsAndCalculateCalendar();
    const unsub = navigation.addListener(
      "focus",
      fetchPlantsAndCalculateCalendar,
    );
    return unsub;
  }, [fetchPlantsAndCalculateCalendar, navigation]);

  const markAllAsWateredToday = async () => {
    if (stats.dueWaterToday === 0) {
      Toast.show({
        type: "success",
        text1: "Brawo!",
        text2: "Wszystkie rośliny są podlane na bieżąco! 🌱",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    Alert.alert(
      "Podlej wszystkie?",
      `Oznaczysz ${stats.dueWaterToday} roślin jako podlane dzisiaj`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Tak!",
          onPress: async () => {
            try {
              const promises = plants
                .filter((plant) => {
                  const interval = plant.wateringInterval || 7;
                  let last = null;
                  if (plant.lastWatered?.toDate)
                    last = plant.lastWatered.toDate();
                  else if (plant.lastWatered?._seconds)
                    last = new Date(plant.lastWatered._seconds * 1000);
                  else if (plant.lastWatered?.seconds)
                    last = new Date(plant.lastWatered.seconds * 1000);

                  if (!last) return true;

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
                  }),
                );

              await Promise.all(promises);
              Toast.show({
                type: "success",
                text1: "Sukces!",
                text2: `Podlałeś ${stats.dueWaterToday} roślin 🌧️`,
                position: "bottom",
                visibilityTime: 3000,
              });
              fetchPlantsAndCalculateCalendar();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Błąd",
                text2: "Nie udało się podlać wszystkich",
                position: "bottom",
                visibilityTime: 3000,
              });
            }
          },
        },
      ],
    );
  };

  const markAllAsFertilizedToday = async () => {
    if (stats.dueFertilizeToday === 0) {
      Toast.show({
        type: "success",
        text1: "Brawo!",
        text2: "Wszystkie rośliny są już nawożone! 🌱",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    Alert.alert(
      "Nawozić wszystkie?",
      `Oznaczysz ${stats.dueFertilizeToday} roślin jako nawożone dzisiaj`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Tak!",
          onPress: async () => {
            try {
              const promises = plants
                .filter((plant) => {
                  const interval = plant.fertilizingInterval || 30;
                  let last = null;

                  if (plant.lastFertilized?.toDate)
                    last = plant.lastFertilized.toDate();
                  else if (plant.lastFertilized?._seconds)
                    last = new Date(plant.lastFertilized._seconds * 1000);
                  else if (plant.lastFertilized?.seconds)
                    last = new Date(plant.lastFertilized.seconds * 1000);

                  if (!last) return true;

                  last.setHours(0, 0, 0, 0);
                  const next = new Date(last);
                  next.setDate(next.getDate() + interval);

                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  return next <= today;
                })
                .map((plant) =>
                  authorizedRequest({
                    url: `/plants/${plant.id}/fertilize`,
                    method: "POST",
                  }),
                );

              await Promise.all(promises);
              Toast.show({
                type: "success",
                text1: "Sukces!",
                text2: `Nawoziłeś ${stats.dueFertilizeToday} roślin 🌱`,
                position: "bottom",
                visibilityTime: 3000,
              });

              fetchPlantsAndCalculateCalendar();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Błąd",
                text2: "Nie udało się nawozić wszystkich",
                position: "bottom",
                visibilityTime: 3000,
              });
            }
          },
        },
      ],
    );
  };
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.primary }]}>
        Kalendarz pielęgnacji
      </Text>

      <View style={[styles.stats, { backgroundColor: colors.card }]}>
        <Text style={[styles.statText, { color: colors.text }]}>
          Do podlania dzisiaj:{" "}
          <Text style={[styles.highlight, { color: colors.primary }]}>
            {stats.dueWaterToday}
          </Text>
        </Text>
        <Text style={[styles.statText, { color: colors.text }]}>
          Do nawożenia dzisiaj:{" "}
          <Text style={[styles.highlight, { color: colors.primary }]}>
            {stats.dueFertilizeToday}
          </Text>
        </Text>
        <Text style={[styles.statText, { color: colors.text }]}>
          Podlane w tym miesiącu:{" "}
          <Text style={[styles.highlight, { color: colors.primary }]}>
            {stats.wateredThisMonth}
          </Text>
        </Text>
        <Text style={[styles.statText, { color: colors.text }]}>
          Nawożone w tym miesiącu:{" "}
          <Text style={[styles.highlight, { color: colors.primary }]}>
            {stats.fertilizedThisMonth}
          </Text>
        </Text>
      </View>

      <Calendar
        key={isDark ? "dark-calendar" : "light-calendar"}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: colors.card,
          calendarBackground: colors.card,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#ffffff",
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: isDark ? "#444" : "#d9e1e8",
          dotColor: colors.primary,
          dotStyle: { width: 7, height: 7, borderRadius: 10 },
          monthTextColor: colors.text,
          indicatorColor: colors.primary,
          arrowColor: colors.primary,
        }}
      />

      <View style={styles.legend}>
        {[
          { color: "#4caf50", label: "Podlane" },
          { color: "#ff9800", label: "Do podlania" },
          { color: "#4584dbff", label: "Pominięte podlewanie" },
          { color: "#9c27b0", label: "Nawożone" },
          { color: "#f44336", label: "Do nawożenia" },
          { color: "#880e4f", label: "Pominięte nawożenie" },
        ].map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {stats.dueWaterToday > 0 && (
        <TouchableOpacity
          style={[styles.waterAllBtn, { backgroundColor: colors.primary }]}
          onPress={markAllAsWateredToday}
        >
          <Text style={styles.waterAllText}>
            Podlej wszystkie ({stats.dueWaterToday})
          </Text>
        </TouchableOpacity>
      )}

      {stats.dueFertilizeToday > 0 && (
        <TouchableOpacity
          style={[styles.waterAllBtn, { backgroundColor: "#9c27b0" }]}
          onPress={markAllAsFertilizedToday}
        >
          <Text style={styles.waterAllText}>
            Nawóź wszystkie ({stats.dueFertilizeToday})
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 24,
  },
  stats: { padding: 16, borderRadius: 16, marginBottom: 20, elevation: 3 },
  statText: { fontSize: 16, textAlign: "center", marginVertical: 4 },
  highlight: { fontSize: 22, fontWeight: "bold" },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 6,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendLabel: { fontSize: 11 },
  waterAllBtn: {
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  waterAllText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
