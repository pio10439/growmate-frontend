import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { authorizedRequest } from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("latest");

  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authorizedRequest({
        url: "/plants",
        method: "GET",
      });
      setPlants(res.data);
    } catch (error) {
      console.error("Błąd pobierania roślin:", error);
      Alert.alert(
        "Błąd",
        "Nie udało się załadować roślin. Sprawdź połączenie internetowe.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPlants();
    });
    return unsubscribe;
  }, [navigation, fetchPlants]);

  const markAsWatered = async (plantId) => {
    try {
      await authorizedRequest({
        url: `/plants/${plantId}/water`,
        method: "POST",
      });
      const now = new Date();

      setPlants((prevPlants) =>
        prevPlants.map((plant) =>
          plant.id === plantId
            ? {
                ...plant,
                lastWatered: {
                  seconds: Math.floor(now.getTime() / 1000),
                },
              }
            : plant,
        ),
      );
      Alert.alert("Gotowe!", "Roślina została podlana");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się oznaczyć podlania");
    }
  };
  const getWateringStatus = (plant) => {
    const interval = plant.wateringInterval || 7;

    if (!plant.lastWatered) {
      return { due: true, daysLeft: 0, overdue: false };
    }

    let last;
    if (plant.lastWatered.toDate) {
      last = plant.lastWatered.toDate();
    } else if (plant.lastWatered._seconds) {
      last = new Date(plant.lastWatered._seconds * 1000);
    } else if (plant.lastWatered.seconds) {
      last = new Date(plant.lastWatered.seconds * 1000);
    }

    last.setHours(0, 0, 0, 0);

    const next = new Date(last);
    next.setDate(next.getDate() + interval);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = next - today;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      due: daysLeft <= 0,
      daysLeft: daysLeft,
      overdue: daysLeft < 0,
    };
  };

  const sortedPlants = useMemo(() => {
    let result = [...plants];

    if (sortBy === "alpha") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "watering") {
      result.sort((a, b) => {
        const statusA = getWateringStatus(a);
        const statusB = getWateringStatus(b);
        return statusA.daysLeft - statusB.daysLeft;
      });
    }
    return result;
  }, [plants, sortBy]);

  const renderItem = ({ item }) => {
    const { due, daysLeft, overdue } = getWateringStatus(item);

    const getButtonText = () => {
      if (overdue) return `Spóźnione o ${Math.abs(daysLeft)} dni!`;
      if (due) return "Podlej dziś";
      return `Do podlania za ${daysLeft} dni`;
    };
    return (
      <TouchableOpacity
        style={[styles.plantCard, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate("PlantDetails", { plant: item })}
      >
        <Image
          source={{
            uri: item.photoUrl || "https://via.placeholder.com/150?text=🌿",
          }}
          style={styles.plantImage}
        />
        <View style={styles.info}>
          <View>
            <Text style={[styles.name, { color: colors.primary }]}>
              {item.name || "Bez nazwy"}
            </Text>
            <Text style={[styles.type, { color: colors.textSecondary }]}>
              {item.type || "Typ rośliny"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.waterBtn,
              !due && { backgroundColor: isDark ? "#333" : "#e0e0e0" },
              due && !overdue && { backgroundColor: "#4caf50" },
              overdue && { backgroundColor: "#d32f2f" },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (due) markAsWatered(item.id);
            }}
            activeOpacity={due ? 0.7 : 1}
          >
            <Text
              style={[
                styles.waterText,
                !due && { color: colors.textSecondary },
                (due || overdue) && { color: "#fff" },
              ]}
            >
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Ładowanie Twoich roślin...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>
        Moje rośliny
      </Text>

      <View
        style={[
          styles.filterBar,
          { backgroundColor: isDark ? colors.card : "#eee" },
        ]}
      >
        {["latest", "alpha", "watering"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterBtn,
              sortBy === type && [
                styles.filterBtnActive,
                { backgroundColor: isDark ? colors.background : "white" },
              ],
            ]}
            onPress={() => setSortBy(type)}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.textSecondary },
                sortBy === type && { color: colors.primary },
              ]}
            >
              {type === "latest"
                ? "Najnowsze"
                : type === "alpha"
                  ? "A-Z"
                  : "Podlewanie"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {plants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nie masz jeszcze roślin 🌱
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedPlants}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
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
  plantCard: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plantImage: { width: 110, height: 110, borderRadius: 16, margin: 8 },
  info: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    justifyContent: "space-between",
  },
  name: { fontSize: 20, fontWeight: "bold" },
  type: { fontSize: 16, marginTop: 2 },
  waterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  waterText: { color: "white", fontWeight: "bold", fontSize: 15 },
  waterBtnOverdue: { backgroundColor: "#d32f2f" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  filterBar: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  filterBtnActive: {
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, textAlign: "center" },
});
