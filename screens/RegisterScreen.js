import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useTheme } from "../context/ThemeContext";

export default function RegisterScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert("Błąd", "Wprowadź adres email");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Błąd", "Hasło musi mieć co najmniej 6 znaków");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Błąd", "Hasła nie są identyczne");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      Alert.alert("Sukces!", "Konto zostało utworzone. Witaj w GrowMate!");
    } catch (error) {
      let message = "Nie udało się utworzyć konta";
      if (error.code === "auth/email-already-in-use") {
        message = "Ten adres email jest już zarejestrowany";
      } else if (error.code === "auth/invalid-email") {
        message = "Nieprawidłowy format email";
      } else if (error.code === "auth/weak-password") {
        message = "Hasło jest za słabe";
      }
      Alert.alert("Błąd rejestracji", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.primary }]}>
          Dołącz do GrowMate 🌱
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Załóż konto i zacznij dbać o swoje rośliny
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? "#333" : "transparent",
            },
          ]}
          placeholder="Email"
          placeholderTextColor={isDark ? "#888" : "#999"}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? "#333" : "transparent",
            },
          ]}
          placeholder="Hasło (min. 6 znaków)"
          placeholderTextColor={isDark ? "#888" : "#999"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? "#333" : "transparent",
            },
          ]}
          placeholder="Powtórz hasło"
          placeholderTextColor={isDark ? "#888" : "#999"}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            styles.btn,
            { backgroundColor: colors.primary },
            loading && styles.btnDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>Zarejestruj się</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Masz już konto?{" "}
            <Text style={[styles.bold, { color: colors.primary }]}>
              Zaloguj się
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    fontSize: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  btn: {
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
  },
  bold: {
    fontWeight: "bold",
  },
});
