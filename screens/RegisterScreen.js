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

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert("Błąd", "Wprowadź adres email");
      return;
    }
    if (!password) {
      Alert.alert("Błąd", "Wprowadź hasło");
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
        password
      );
      Alert.alert("Sukces!", "Konto zostało utworzone. Witaj w GrowMate!", [
        { text: "OK", onPress: () => navigation.replace("Home") },
      ]);
    } catch (error) {
      let message = "Nie udało się utworzyć konta";
      if (error.code === "auth/email-already-in-use") {
        message = "Ten adres email jest już zarejestrowany";
      } else if (error.code === "auth/invalid-email") {
        message = "Nieprawidłowy format email";
      } else if (error.code === "auth/weak-password") {
        message = "Hasło jest za słabe (minimum 6 znaków)";
      }
      Alert.alert("Błąd rejestracji", message);
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
        <Text style={styles.title}>Dołącz do GrowMate 🌱</Text>
        <Text style={styles.subtitle}>
          Załóż konto i zacznij dbać o swoje rośliny
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
          placeholder="Hasło (min. 6 znaków)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Powtórz hasło"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.registerText}>Zarejestruj się</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginText}>
            Masz już konto? <Text style={styles.bold}>Zaloguj się</Text>
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
  registerBtn: {
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
    elevation: 4,
  },
  registerBtnDisabled: {
    backgroundColor: "#81c784",
  },
  registerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 32,
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    color: "#666",
  },
  bold: {
    fontWeight: "bold",
    color: "#2e7d32",
  },
});
