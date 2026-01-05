import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { authorizedRequest } from "../services/api";

export default function AddPlantScreen({ navigation, route }) {
  const plantToEdit = route.params?.plantToEdit;

  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [wateringDays, setWateringDays] = useState("");
  const [fertilizingDays, setFertilizingDays] = useState("");
  const [lightLevel, setLightLevel] = useState("");
  const [temperature, setTemperature] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState(null);
  const [identifying, setIdentifying] = useState(false);
  const [useAI, setUseAI] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (plantToEdit) {
        setPhoto(plantToEdit.photoUrl ? { uri: plantToEdit.photoUrl } : null);
        setName(plantToEdit.name || "");
        setType(plantToEdit.type || "");
        setWateringDays(plantToEdit.wateringInterval?.toString() || "");
        setFertilizingDays(plantToEdit.fertilizingInterval?.toString() || "");
        setLightLevel(plantToEdit.lightLevel || "");
        setTemperature(plantToEdit.temperature || "");
        setNotes(plantToEdit.notes || "");
        setLocation(
          plantToEdit.location?.lat && plantToEdit.location?.lng
            ? plantToEdit.location
            : null
        );
        setUseAI(false);
      } else {
        setPhoto(null);
        setName("");
        setType("");
        setWateringDays("");
        setFertilizingDays("");
        setLightLevel("");
        setTemperature("");
        setNotes("");
        setLocation(null);
        setUseAI(true);
      }
    }, [plantToEdit])
  );
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Uwaga",
          "Brak uprawnień do lokalizacji – pogoda nie będzie dostępna."
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
      if (useAI && !plantToEdit) {
        identifyPlant(result.assets[0]);
      }
    }
  };

  const takePhoto = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPerm.status !== "granted") {
      Alert.alert("Błąd", "Brak dostępu do kamery");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
      if (useAI && !plantToEdit) {
        identifyPlant(result.assets[0]);
      }
    }
  };

  const identifyPlant = async (imageAsset) => {
    setIdentifying(true);
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: imageAsset.uri,
        type: "image/jpeg",
        name: "plant.jpg",
      });

      const res = await authorizedRequest({
        url: "/identify-plant",
        method: "POST",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      setName(data.name || "");
      setType(data.commonNames?.[0] || data.name || "");
      setLightLevel(data.sunlight?.join(", ") || "");

      Alert.alert(
        "Rozpoznano roślinę 🌿",
        `${data.name} (${data.probability}% pewności)`
      );
    } catch (error) {
      console.error("AI error:", error);
      Alert.alert(
        "Nie udało się rozpoznać",
        "Spróbuj innego zdjęcia lub wprowadź dane ręcznie."
      );
      setUseAI(false);
    } finally {
      setIdentifying(false);
    }
  };

  const getLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      Alert.alert("Sukces", "Lokalizacja zapisana");
    } catch {
      Alert.alert("Błąd", "Nie udało się pobrać lokalizacji");
    }
  };

  const savePlant = async () => {
    if (!photo || !name.trim()) {
      Alert.alert("Błąd", "Zdjęcie i nazwa rośliny są wymagane");
      return;
    }

    try {
      const formData = new FormData();

      if (
        photo.uri?.startsWith("file://") ||
        photo.uri?.startsWith("content://")
      ) {
        formData.append("photo", {
          uri: photo.uri,
          type: "image/jpeg",
          name: "plant.jpg",
        });
      }

      formData.append("name", name.trim());
      formData.append("type", type.trim() || "Inna");
      formData.append("wateringDays", wateringDays || "7");
      formData.append("fertilizingDays", fertilizingDays || "30");
      formData.append("lightLevel", lightLevel.trim());
      formData.append("temperature", temperature.trim());
      formData.append("notes", notes.trim());
      formData.append(
        "location",
        JSON.stringify(location || { lat: 0, lng: 0 })
      );

      if (plantToEdit) {
        await authorizedRequest({
          url: `/plants/${plantToEdit.id}`,
          method: "PUT",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        Alert.alert("Sukces", "Roślina zaktualizowana");
      } else {
        await authorizedRequest({
          url: "/plants",
          method: "POST",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        Alert.alert("Sukces", "Roślina dodana");
      }

      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Błąd", "Nie udało się zapisać rośliny");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {plantToEdit ? "Edytuj roślinę" : "Dodaj nową roślinę"}
      </Text>

      <View style={styles.photoSection}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photo} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Brak zdjęcia</Text>
          </View>
        )}

        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.btn} onPress={takePhoto}>
            <Text style={styles.btnText}> Zrób zdjęcie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={pickImage}>
            <Text style={styles.btnText}> Z galerii</Text>
          </TouchableOpacity>
        </View>

        {identifying && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={{ marginTop: 16 }}
          />
        )}
      </View>

      {!plantToEdit && (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Użyj AI do rozpoznania rośliny</Text>
          <Switch value={useAI} onValueChange={setUseAI} />
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Nazwa rośliny *"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Typ (np. Sukulent, Fikus)"
        value={type}
        onChangeText={setType}
      />
      <TextInput
        style={styles.input}
        placeholder="Podlewanie co ile dni (np. 7)"
        value={wateringDays}
        onChangeText={setWateringDays}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Nawożenie co ile dni (np. 30)"
        value={fertilizingDays}
        onChangeText={setFertilizingDays}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Poziom światła (np. Dużo słońca)"
        value={lightLevel}
        onChangeText={setLightLevel}
      />
      <TextInput
        style={styles.input}
        placeholder="Preferowana temperatura (np. 18-24°C)"
        value={temperature}
        onChangeText={setTemperature}
      />
      <TextInput
        style={styles.input}
        placeholder="Dodatkowe notatki"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.locationBtn} onPress={getLocation}>
        <Text style={styles.btnText}>
          {location
            ? "Lokalizacja zapisana ✓"
            : "Pobierz lokalizację (dla pogody)"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={savePlant}>
        <Text style={styles.saveText}>
          {plantToEdit ? "Zapisz zmiany" : "Zapisz roślinę"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 20,
    textAlign: "center",
  },
  photoSection: { alignItems: "center", marginBottom: 24 },
  photo: { width: 220, height: 220, borderRadius: 24, marginBottom: 16 },
  placeholder: {
    width: 220,
    height: 220,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    marginBottom: 16,
  },
  placeholderText: { color: "#666", fontSize: 16 },
  photoButtons: { flexDirection: "row", gap: 16 },
  btn: {
    backgroundColor: "#4caf50",
    padding: 14,
    borderRadius: 12,
    minWidth: 120,
  },
  btnText: { color: "white", fontWeight: "bold", textAlign: "center" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  switchLabel: { fontSize: 16, flex: 1 },
  input: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    elevation: 1,
  },
  locationBtn: {
    backgroundColor: "#2196f3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  saveBtn: {
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  saveText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
