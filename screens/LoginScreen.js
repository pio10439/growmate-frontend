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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useTheme } from "../context/ThemeContext";
import Toast from "react-native-toast-message";

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Toast.show({
        type: "error",
        text1: "Błąd",
        text2: "Wprowadź email i hasło",
        visibilityTime: 2500,
        position: "bottom",
      });
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
    } catch (error) {
      let message = "Nie udało się zalogować";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        message = "Nieprawidłowy email lub hasło.";
      } else if (error.code === "auth/invalid-email") {
        message = "Nieprawidłowy format email.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Zbyt wiele prób. Spróbuj później.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Brak połączenia z internetem.";
      }
      Toast.show({
        type: "error",
        text1: "Błąd logowania",
        text2: message,
        visibilityTime: 2500,
        position: "bottom",
      });
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
          Witaj w GrowMate 🌱
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Zaloguj się, by zadbać o swoje rośliny
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
          placeholder="Hasło"
          placeholderTextColor={isDark ? "#888" : "#999"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            styles.loginBtn,
            { backgroundColor: colors.primary },
            loading && styles.loginBtnDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginText}>Zaloguj się</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={[styles.registerText, { color: colors.textSecondary }]}>
            Nie masz konta?{" "}
            <Text style={[styles.bold, { color: colors.primary }]}>
              Zarejestruj się
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
  loginBtn: {
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerLink: {
    marginTop: 32,
    alignItems: "center",
  },
  registerText: {
    fontSize: 16,
  },
  bold: {
    fontWeight: "bold",
  },
});
