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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Błąd", "Wprowadź email i hasło");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      navigation.replace("HomeScreen");
    } catch (error) {
      let message = "Nie udało się zalogować";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        message = "Nieprawidłowy email lub hasło";
      } else if (error.code === "auth/invalid-email") {
        message = "Nieprawidłowy format email";
      } else if (error.code === "auth/too-many-requests") {
        message = "Zbyt wiele prób. Spróbuj później.";
      }
      Alert.alert("Błąd logowania", message);
      console.log("FireBase message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Witaj w GrowMate 🌱</Text>
        <Text style={styles.subtitle}>
          Zaloguj się, by zadbać o swoje rośliny
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Hasło"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
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
          <Text style={styles.registerText}>
            Nie masz konta? <Text style={styles.bold}>Zarejestruj się</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "white",
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
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
    elevation: 4,
  },
  loginBtnDisabled: {
    backgroundColor: "#81c784",
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
    color: "#666",
  },
  bold: {
    fontWeight: "bold",
    color: "#2e7d32",
  },
});
