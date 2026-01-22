import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import LottieView from "lottie-react-native";
import { authorizedRequest } from "../services/api";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const WEATHER_ANIMATIONS = {
  Clear: require("../assets/lottie/sun.json"),
  Clouds: require("../assets/lottie/cloudy.json"),
  Rain: require("../assets/lottie/rain.json"),
  Drizzle: require("../assets/lottie/drizzle.json"),
  Thunderstorm: require("../assets/lottie/thunder.json"),
  Snow: require("../assets/lottie/snow.json"),
  Mist: require("../assets/lottie/cloudy.json"),
  Fog: require("../assets/lottie/cloudy.json"),
  Default: require("../assets/lottie/partly-cloudy.json"),
};

export default function PlantDetailsScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { plant: initialPlant } = route.params;
  const [plant, setPlant] = useState(initialPlant);
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("Nieznana lokalizacja");
  const [loading, setLoading] = useState(true);

  const fetchPlant = async () => {
    try {
      const res = await authorizedRequest({
        url: `/plants/${initialPlant.id}`,
        method: "GET",
      });
      setPlant(res.data);
    } catch (error) {
      console.error("Błąd pobierania rośliny:", error);
      Alert.alert("Błąd", "Nie udało się załadować aktualnych danych rośliny");
    }
  };

  const fetchWeatherAndLocation = async (lat, lng) => {
    try {
      const weatherRes = await authorizedRequest({
        url: `/weather/${lat}/${lng}`,
        method: "GET",
      });
      setWeather(weatherRes.data);

      const locationRes = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pl`,
      );
      const data = locationRes.data;
      if (data.address) {
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.hamlet ||
          data.address.state ||
          "Nieznana miejscowość";
        const country = data.address.country || "";
        setLocationName(`${city}${country ? `, ${country}` : ""}`);
      }
    } catch (error) {
      console.error("Błąd pogody/lokalizacji:", error);
      setLocationName("Nieznana lokalizacja");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPlant();
      if (plant.location?.lat && plant.location?.lng) {
        await fetchWeatherAndLocation(plant.location.lat, plant.location.lng);
      }
      setLoading(false);
    };
    loadData();
  }, [initialPlant.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchPlant);
    return unsubscribe;
  }, [navigation]);

  const getCurrentWeather = () => {
    if (!weather || !weather.list || weather.list.length === 0) return null;
    return weather.list[0];
  };

  const current = getCurrentWeather();

  const getWeatherAnimation = () => {
    if (!current) return WEATHER_ANIMATIONS.Default;
    const condition = current.weather[0].main;
    return WEATHER_ANIMATIONS[condition] || WEATHER_ANIMATIONS.Default;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Nigdy";
    let date;
    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      return "Nieznana data";
    }

    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const markAsWatered = async () => {
    Alert.alert(
      "Podlej roślinę",
      `Oznaczyć "${plant.name}" jako podlaną teraz?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Tak",
          onPress: async () => {
            try {
              await authorizedRequest({
                url: `/plants/${plant.id}/water`,
                method: "POST",
              });
              await fetchPlant();
              Alert.alert("Gotowe! ", "Data podlania została zaktualizowana");
            } catch (error) {
              Alert.alert("Błąd", "Nie udało się oznaczyć podlania");
            }
          },
        },
      ],
    );
  };

  const markAsFertilized = async () => {
    Alert.alert("Nawożenie", `Oznaczyć "${plant.name}" jako nawożoną teraz?`, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Tak",
        onPress: async () => {
          try {
            await authorizedRequest({
              url: `/plants/${plant.id}/fertilize`,
              method: "POST",
            });
            await fetchPlant();
            Alert.alert("Gotowe!", "Data nawożenia została zaktualizowana");
          } catch (error) {
            Alert.alert("Błąd", "Nie udało się oznaczyć nawożenia");
          }
        },
      },
    ]);
  };

  const deletePlant = async () => {
    Alert.alert(
      "Usuń roślinę",
      `Na pewno chcesz usunąć "${plant.name}"? Tej operacji nie można cofnąć.`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              await authorizedRequest({
                url: `/plants/${plant.id}`,
                method: "DELETE",
              });
              Alert.alert("Usunięto", "Roślina została usunięta", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert("Błąd", "Nie udało się usunąć rośliny");
            }
          },
        },
      ],
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
          Ładowanie szczegółów...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri:
              plant.photoUrl ||
              "https://via.placeholder.com/400x300?text=Brak+zdjęcia",
          }}
          style={styles.photo}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.primary }]}>
          {plant.name || "Bez nazwy"}
        </Text>
        <Text style={[styles.type, { color: colors.textSecondary }]}>
          {plant.type || "Typ niepodany"}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.waterBtn} onPress={markAsWatered}>
            <Text style={styles.btnText}>Podlej teraz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fertilizeBtn}
            onPress={markAsFertilized}
          >
            <Text style={styles.btnText}>Nawożę teraz</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Informacje o pielęgnacji
        </Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Ostatnio podlana:{" "}
            <Text style={[styles.bold, { color: colors.primary }]}>
              {formatDate(plant.lastWatered)}
            </Text>
          </Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Ostatnio nawożona:{" "}
            <Text style={[styles.bold, { color: colors.primary }]}>
              {formatDate(plant.lastFertilized)}
            </Text>
          </Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Światło: {plant.lightLevel || "Nie podano"}
          </Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Temperatura: {plant.temperature || "Nie podano"}°C
          </Text>
          {plant.notes && (
            <Text style={[styles.infoText, { color: colors.text }]}>
              Notatki: {plant.notes}
            </Text>
          )}
        </View>

        <View style={styles.weatherSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Pogoda w lokalizacji
          </Text>
          {current ? (
            <View
              style={[styles.weatherCard, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.locationName, { color: colors.text }]}>
                {locationName}
              </Text>
              <LottieView
                source={getWeatherAnimation()}
                autoPlay
                loop
                style={styles.lottie}
              />
              <Text style={[styles.weatherTemp, { color: colors.text }]}>
                {Math.round(current.main.temp)}°C
              </Text>
              <Text
                style={[styles.weatherDesc, { color: colors.textSecondary }]}
              >
                {current.weather[0].description.charAt(0).toUpperCase() +
                  current.weather[0].description.slice(1)}
              </Text>
              <Text
                style={[styles.weatherDetail, { color: colors.textSecondary }]}
              >
                Wilgotność: {current.main.humidity}%
              </Text>
            </View>
          ) : (
            <Text style={[styles.noData, { color: colors.textSecondary }]}>
              Brak danych pogodowych
            </Text>
          )}
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate("Main", {
                screen: "AddPlantTab",
                params: { plantToEdit: plant },
              })
            }
          >
            <Text style={styles.btnText}>Edytuj</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={deletePlant}>
            <Text style={styles.btnText}>Usuń</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photo: {
    width: "100%",
    height: 340,
    marginTop: 65,
    borderRadius: 12,
    padding: 16,
  },
  content: { padding: 20 },
  name: { fontSize: 32, fontWeight: "bold", marginBottom: 6 },
  type: { fontSize: 20, marginBottom: 24 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  waterBtn: {
    backgroundColor: "#4caf50",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
  },
  fertilizeBtn: {
    backgroundColor: "#ff9800",
    padding: 16,
    borderRadius: 12,
    flex: 1,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  infoCard: { padding: 18, borderRadius: 16, marginBottom: 24, elevation: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  infoText: { fontSize: 18, marginBottom: 8 },
  bold: { fontWeight: "bold" },
  weatherSection: { marginBottom: 30 },
  locationName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  weatherCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 3,
  },
  lottie: { width: 160, height: 160 },
  weatherTemp: { fontSize: 40, fontWeight: "bold", marginVertical: 8 },
  weatherDesc: { fontSize: 18, textAlign: "center", marginBottom: 12 },
  weatherDetail: { fontSize: 16 },
  noData: { fontSize: 16, textAlign: "center", fontStyle: "italic" },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  editBtn: {
    backgroundColor: "#2196f3",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
  },
  deleteBtn: {
    backgroundColor: "#f44336",
    padding: 16,
    borderRadius: 12,
    flex: 1,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 20, fontSize: 18 },
  imageWrapper: { position: "relative" },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
