import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { authorizedRequest } from "../services/api";

export default function HomeScreen({ navigation }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

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
        "Nie udało się załadować roślin. Sprawdź połączenie internetowe."
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
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się oznaczyć podlania");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.plantCard}
      onPress={() => navigation.navigate("PlantDetails", { plant: item })}
    >
      <Image
        source={{
          uri: item.photoUrl || "https://via.placeholder.com/150?text=🌿",
        }}
        style={styles.plantImage}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name || "Bez nazwy"}</Text>
        <Text style={styles.type}>{item.type || "Typ rośliny"}</Text>

        <TouchableOpacity
          style={styles.waterBtn}
          onPress={(e) => {
            e.stopPropagation();
            markAsWatered(item.id);
          }}
        >
          <Text style={styles.waterText}>Podlej dziś</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Ładowanie Twoich roślin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moje rośliny ({plants.length})</Text>

      {plants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nie masz jeszcze żadnych roślin 🌱
          </Text>
          <Text style={styles.emptySubtext}>
            Dotknij przycisku „+” na dole, aby dodać pierwszą!
          </Text>
        </View>
      ) : (
        <FlatList
          data={plants}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: 24,
  },
  plantCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plantImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
    margin: 8,
  },
  info: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  type: {
    fontSize: 16,
    color: "#666",
    marginVertical: 4,
  },
  waterBtn: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  waterText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
  },
  emptySubtext: {
    fontSize: 17,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: "#666",
  },
});
