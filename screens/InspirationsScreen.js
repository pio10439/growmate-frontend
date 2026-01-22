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
import { useTheme } from "../context/ThemeContext";

const capitalize = (text) => {
  if (!text) return "";
  let cleaned = String(text).replace(/_/g, " ").toLowerCase();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export default function InspirationsScreen() {
  const { isDark, colors } = useTheme();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomPlant = async () => {
    setLoading(true);
    try {
      const res = await authorizedRequest({
        url: "/funfact?force=true",
        method: "GET",
      });
      setPlant(res.data);
      console.log(res.data);
    } catch (error) {
      console.error("Błąd pobierania rośliny:", error);
      setPlant({
        commonName: "Monstera deliciosa",
        scientificName: "Monstera deliciosa",
        description:
          "Ikona roślin domowych. Jej ogromne liście nadają wnętrzom charakteru.",
        watering: "UMIARKOWANE",
        sunlight: "PÓŁCIEŃ",
        origin: "Ameryka Środkowa",
        indoor: "TAK",
        careLevel: "ŁATWY",
        specialFeature: "oczyszczająca",
        why: "idealna na start",
        imageUrl:
          "https://perenual.com/storage/species_image/1_monstera_deliciosa/large.jpg",
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Szukam rośliny...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.primary }]}>
        Roślina dnia
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Image source={{ uri: plant.imageUrl }} style={styles.image} />

        <View style={styles.content}>
          <Text style={[styles.commonName, { color: colors.primary }]}>
            {capitalize(plant.commonName)}
          </Text>
          <Text
            style={[styles.scientificName, { color: colors.textSecondary }]}
          >
            {capitalize(plant.scientificName)}
          </Text>

          <Text style={[styles.description, { color: colors.text }]}>
            {plant.description}
          </Text>
          <Text style={[styles.why, { color: colors.primary }]}>
            Dlaczego warto? {capitalize(plant.why)}
          </Text>

          <View style={styles.factsGrid}>
            {[
              { emoji: "💧", label: "Podlewanie", value: plant.watering },
              { emoji: "☀️", label: "Światło", value: plant.sunlight },
              { emoji: "🌍", label: "Pochodzenie", value: plant.origin },
              { emoji: "🏠", label: "Do wnętrz", value: plant.indoor },
              { emoji: "⭐", label: "Poziom", value: plant.careLevel },
              { emoji: "✨", label: "Cecha", value: plant.specialFeature },
            ].map((fact, index) => (
              <View
                key={index}
                style={[
                  styles.factItem,
                  { backgroundColor: isDark ? colors.background : "#f0f7f0" },
                ]}
              >
                <Text style={styles.factEmoji}>{fact.emoji}</Text>
                <Text
                  style={[styles.factLabel, { color: colors.textSecondary }]}
                >
                  {fact.label}
                </Text>
                <Text style={[styles.factValue, { color: colors.primary }]}>
                  {capitalize(fact.value)}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.primary }]}
            onPress={fetchRandomPlant}
          >
            <Text style={styles.newBtnText}>Pokaż inną roślinę</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 400,
  },
  content: {
    padding: 24,
  },
  commonName: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 16,
  },
  why: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 24,
  },
  factsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  factItem: {
    width: "48%",
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  factEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  factLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  factValue: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  newBtn: {
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  newBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
