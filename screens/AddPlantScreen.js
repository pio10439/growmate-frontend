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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { authorizedRequest } from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function AddPlantScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
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
            : null,
        );
        setUseAI(false);
      } else {
        resetForm();
      }
      return () => {
        navigation.setParams({ plantToEdit: null });
      };
    }, [plantToEdit]),
  );

  const resetForm = () => {
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
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Uwaga", "Brak uprawnień do lokalizacji.");
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
      if (useAI && !plantToEdit) identifyPlant(result.assets[0]);
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
      if (useAI && !plantToEdit) identifyPlant(result.assets[0]);
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
      });
      const data = res.data;
      setName(data.name || "");
      setType(data.commonNames?.[0] || data.name || "");
      setWateringDays(data.wateringDays?.toString() || "");
      setFertilizingDays(data.fertilizingDays?.toString() || "");
      setLightLevel(data.lightLevel || "");
      setTemperature(data.temperature || "");
      setNotes(data.notes || "");
      Alert.alert(
        "Rozpoznano roślinę! 🌿",
        `${data.name || "Roślina"} (${data.probability || "?"}% pewności)\n`,
      );
    } catch (error) {
      console.error("Błąd AI:", error);
      Alert.alert("Nie udało się rozpoznać", "Wypełnij dane ręcznie.");
      setUseAI(false);
    } finally {
      setIdentifying(false);
    }
  };

  const getLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Alert.alert("Sukces", "Lokalizacja zapisana");
    } catch {
      Alert.alert("Błąd", "Nie udało się pobrać lokalizacji");
    }
  };

  const savePlant = async () => {
    if (!photo || !name.trim() || !wateringDays || !fertilizingDays) {
      Alert.alert("Błąd", "Wymagane: zdjęcie, nazwa, podlewanie i nawożenie.");
      return;
    }
    try {
      const formData = new FormData();
      if (
        photo.uri &&
        (photo.uri.startsWith("file://") || photo.uri.startsWith("content://"))
      ) {
        formData.append("photo", {
          uri: photo.uri,
          type: "image/jpeg",
          name: "plant.jpg",
        });
      }
      formData.append("name", name.trim());
      formData.append("type", type?.trim() || "Inna");
      formData.append("wateringDays", wateringDays);
      formData.append("fertilizingDays", fertilizingDays);
      formData.append("lightLevel", lightLevel.trim());
      formData.append("temperature", temperature.trim());
      formData.append("notes", notes.trim());
      formData.append(
        "location",
        JSON.stringify(location || { lat: 0, lng: 0 }),
      );

      if (plantToEdit) {
        await authorizedRequest({
          url: `/plants/${plantToEdit.id}`,
          method: "PUT",
          data: formData,
        });
      } else {
        await authorizedRequest({
          url: "/plants",
          method: "POST",
          data: formData,
        });
      }
      navigation.setParams({ plantToEdit: null });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zapisać.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ paddingBottom: 40 }}>
            <Text style={[styles.title, { color: colors.primary }]}>
              {plantToEdit ? "Edytuj roślinę" : "Dodaj nową roślinę"}
            </Text>

            <View style={styles.photoSection}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photo} />
              ) : (
                <View
                  style={[
                    styles.placeholder,
                    {
                      backgroundColor: isDark ? colors.card : "#e8f5e8",
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.placeholderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Brak zdjęcia
                  </Text>
                </View>
              )}

              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.accent }]}
                  onPress={takePhoto}
                >
                  <Text style={styles.btnText}>Zrób zdjęcie</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.accent }]}
                  onPress={pickImage}
                >
                  <Text style={styles.btnText}>Z galerii</Text>
                </TouchableOpacity>
              </View>

              {identifying && (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{ marginTop: 16 }}
                />
              )}
            </View>

            {!plantToEdit && (
              <View
                style={[styles.switchRow, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  Użyj AI do rozpoznania
                </Text>
                <Switch
                  value={useAI}
                  onValueChange={setUseAI}
                  trackColor={{ false: "#767577", true: colors.accent }}
                  thumbColor={useAI ? colors.primary : "#f4f3f4"}
                />
              </View>
            )}

            {[
              { val: name, setter: setName, ph: "Nazwa rośliny *" },
              { val: type, setter: setType, ph: "Typ (np. Sukulent, Fikus)" },
              {
                val: wateringDays,
                setter: setWateringDays,
                ph: "Podlewanie (dni) *",
                kt: "numeric",
              },
              {
                val: fertilizingDays,
                setter: setFertilizingDays,
                ph: "Nawożenie (dni) *",
                kt: "numeric",
              },
              {
                val: lightLevel,
                setter: setLightLevel,
                ph: "Światło (np. Dużo słońca)",
              },
              {
                val: temperature,
                setter: setTemperature,
                ph: "Temperatura (np. 18-24°C)",
              },
            ].map((input, idx) => (
              <TextInput
                key={idx}
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text },
                ]}
                placeholder={input.ph}
                placeholderTextColor={colors.textSecondary}
                value={input.val}
                onChangeText={input.setter}
                keyboardType={input.kt || "default"}
              />
            ))}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  height: 100,
                },
              ]}
              placeholder="Dodatkowe notatki"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[
                styles.locationBtn,
                { backgroundColor: location ? colors.primary : "#2196f3" },
              ]}
              onPress={getLocation}
            >
              <Text style={styles.btnText}>
                {location ? "Lokalizacja zapisana ✓" : "Pobierz lokalizację"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={savePlant}
            >
              <Text style={styles.btnText}>
                {plantToEdit ? "Zapisz zmiany" : "Zapisz roślinę"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 24,
  },
  photoSection: { alignItems: "center", marginBottom: 24 },
  photo: { width: 260, height: 260, borderRadius: 30 },
  placeholder: {
    width: 240,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  placeholderText: { fontSize: 16 },
  photoButtons: { flexDirection: "row", gap: 16, marginTop: 16 },
  btn: { padding: 14, borderRadius: 12, minWidth: 120 },
  btnText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
  },
  switchLabel: { fontSize: 16, flex: 1 },
  input: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    elevation: 1,
  },
  locationBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  saveBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
});
