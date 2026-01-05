import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { authorizedRequest } from "../services/api";

export default function InspirationsScreen({ navigation }) {
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomPlant = async () => {
    setLoading(true);
    try {
      const res = await authorizedRequest({ url: "/funfact", method: "GET" });
      setPlant(res.data);
    } catch (error) {
      console.error("Błąd pobierania rośliny dnia:", error);
      setPlant({
        commonName: "Sansewieria",
        scientificName: "Sansevieria trifasciata",
        description:
          "Jedna z najodporniejszych roślin! Oczyszcza powietrze nawet w nocy dzięki specjalnemu typowi fotosyntezy.",
        cycle: "Wieloletnia",
        watering: "Rzadkie",
        sunlight: "Cień do półcień",
        origin: "Afryka Zachodnia",
        indoor: "Tak",
        careLevel: "Bardzo łatwy",
        imageUrl:
          "https://perenual.com/storage/species_image/3_sansevieria_trifasciata/large.jpg",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomPlant();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Szukam inspirującej rośliny...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Nie udało się załadować rośliny dnia
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Roślina dnia 🌿</Text>

      <View style={styles.card}>
        <Image source={{ uri: plant.imageUrl }} style={styles.image} />

        <View style={styles.content}>
          <Text style={styles.commonName}>{plant.commonName}</Text>
          <Text style={styles.scientificName}>{plant.scientificName}</Text>

          <Text style={styles.description}>{plant.description}</Text>

          <View style={styles.factsGrid}>
            <View style={styles.factItem}>
              <Text style={styles.factEmoji}>💧</Text>
              <Text style={styles.factLabel}>Podlewanie</Text>
              <Text style={styles.factValue}>{plant.watering}</Text>
            </View>

            <View style={styles.factItem}>
              <Text style={styles.factEmoji}>☀️</Text>
              <Text style={styles.factLabel}>Światło</Text>
              <Text style={styles.factValue}>{plant.sunlight}</Text>
            </View>

            <View style={styles.factItem}>
              <Text style={styles.factEmoji}>🌍</Text>
              <Text style={styles.factLabel}>Pochodzenie</Text>
              <Text style={styles.factValue}>{plant.origin}</Text>
            </View>

            <View style={styles.factItem}>
              <Text style={styles.factEmoji}>🏠</Text>
              <Text style={styles.factLabel}>Do wnętrz</Text>
              <Text style={styles.factValue}>{plant.indoor}</Text>
            </View>

            <View style={styles.factItem}>
              <Text style={styles.factEmoji}>⭐</Text>
              <Text style={styles.factLabel}>Poziom opieki</Text>
              <Text style={styles.factValue}>{plant.careLevel}</Text>
            </View>

            <View style={styles.factItem}>
              <Text style={styles.factEmoji}>🔄</Text>
              <Text style={styles.factLabel}>Cykl</Text>
              <Text style={styles.factValue}>{plant.cycle}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.newBtn} onPress={fetchRandomPlant}>
            <Text style={styles.newBtnText}>🔀 Pokaż inną roślinę</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: "#666",
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 28,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    marginBottom: 40,
  },
  image: {
    width: "100%",
    height: 520,
  },
  content: {
    padding: 28,
  },
  commonName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: 8,
  },
  scientificName: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 28,
  },
  description: {
    fontSize: 17,
    lineHeight: 28,
    color: "#333",
    textAlign: "center",
    marginBottom: 32,
  },
  factsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  factItem: {
    width: "48%",
    backgroundColor: "#f0f7f0",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  factEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  factLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  factValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
  },
  newBtn: {
    backgroundColor: "#2e7d32",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 6,
  },
  newBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#f44336",
  },
});
