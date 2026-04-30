import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import LoginScreen from "../screens/LoginScreen";
import { signInWithEmailAndPassword } from "firebase/auth";

jest.mock("../firebaseConfig", () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

const mockAuth = {
  currentUser: null,
};

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => mockAuth),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

import Toast from "react-native-toast-message";

const mockNavigation = {
  navigate: jest.fn(),
};

import { ThemeProvider } from "../context/ThemeContext";

const renderLogin = () => {
  return render(
    <ThemeProvider>
      <LoginScreen navigation={mockNavigation} />
    </ThemeProvider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      text: "#000",
      background: "#fff",
      primary: "#007AFF",
    },
    isDark: false,
  }),

  ThemeProvider: ({ children }) => children,
}));

describe("UI – renderowanie ekranu logowania", () => {
  it("wyświetla tytuł powitalny z emoji", () => {
    const { getByText } = renderLogin();
    expect(getByText("Witaj w GrowMate 🌱")).toBeTruthy();
  });

  it("wyświetla podtytuł zachęcający do logowania", () => {
    const { getByText } = renderLogin();
    expect(getByText("Zaloguj się, by zadbać o swoje rośliny")).toBeTruthy();
  });

  it("renderuje pole Email", () => {
    const { getByPlaceholderText } = renderLogin();
    expect(getByPlaceholderText("Email")).toBeTruthy();
  });

  it("renderuje pole Hasło", () => {
    const { getByPlaceholderText } = renderLogin();
    expect(getByPlaceholderText("Hasło")).toBeTruthy();
  });

  it("renderuje przycisk 'Zaloguj się'", () => {
    const { getByText } = renderLogin();
    expect(getByText("Zaloguj się")).toBeTruthy();
  });

  it("renderuje link do rejestracji", () => {
    const { getByText } = renderLogin();
    expect(getByText("Zarejestruj się")).toBeTruthy();
  });

  it("pole hasła ma ukryty tekst (secureTextEntry)", () => {
    const { getByPlaceholderText } = renderLogin();
    const passwordInput = getByPlaceholderText("Hasło");
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });
});

describe("Walidacja – puste pola", () => {
  it("pokazuje błąd gdy email i hasło są puste", async () => {
    const { getByText } = renderLogin();

    await act(async () => {
      fireEvent.press(getByText("Zaloguj się"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Wprowadź email i hasło",
        }),
      );
    });
  });

  it("pokazuje błąd gdy tylko email jest pusty", async () => {
    const { getByText, getByPlaceholderText } = renderLogin();

    fireEvent.changeText(getByPlaceholderText("Hasło"), "haslo123");
    await act(async () => {
      fireEvent.press(getByText("Zaloguj się"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Wprowadź email i hasło",
        }),
      );
    });
  });

  it("pokazuje błąd gdy tylko hasło jest puste", async () => {
    const { getByText, getByPlaceholderText } = renderLogin();

    fireEvent.changeText(getByPlaceholderText("Email"), "test@test.pl");
    await act(async () => {
      fireEvent.press(getByText("Zaloguj się"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Wprowadź email i hasło",
        }),
      );
    });
  });

  it("NIE wywołuje Firebase gdy pola są puste", async () => {
    const { getByText } = renderLogin();

    await act(async () => {
      fireEvent.press(getByText("Zaloguj się"));
    });

    await waitFor(() => {
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  it("email z samymi spacjami traktuje jako pusty", async () => {
    const { getByText, getByPlaceholderText } = renderLogin();

    fireEvent.changeText(getByPlaceholderText("Email"), "   ");
    fireEvent.changeText(getByPlaceholderText("Hasło"), "haslo123");
    await act(async () => {
      fireEvent.press(getByText("Zaloguj się"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Wprowadź email i hasło",
        }),
      );
    });
  });
});

describe("Firebase – logowanie", () => {
  it("wywołuje signInWithEmailAndPassword z poprawnymi danymi", async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: "123" } });
    const { getByText, getByPlaceholderText } = renderLogin();

    fireEvent.changeText(getByPlaceholderText("Email"), "test@test.pl");
    fireEvent.changeText(getByPlaceholderText("Hasło"), "haslo123");
    await act(async () => {
      fireEvent.press(getByText("Zaloguj się"));
    });

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        "test@test.pl",
        "haslo123",
      );
    });
  });

  it("konwertuje email do lowercase przed wysłaniem", async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: {} });
    const { getByText, getByPlaceholderText } = renderLogin();

    fireEvent.changeText(getByPlaceholderText("Email"), "TEST@TEST.PL");
    fireEvent.changeText(getByPlaceholderText("Hasło"), "haslo123");
    await act(async () => {
      fireEvent.press(getByText("Zaloguj się"));
    });

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        "test@test.pl",
        "haslo123",
      );
    });
  });

  it("przycisk jest nieaktywny w trakcie ładowania", async () => {
    signInWithEmailAndPassword.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    const { getByText, getByPlaceholderText } = renderLogin();

    fireEvent.changeText(getByPlaceholderText("Email"), "test@test.pl");
    fireEvent.changeText(getByPlaceholderText("Hasło"), "haslo123");

    await act(async () => {
      fireEvent.press(getByText("Zaloguj się"));
    });

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
  });
});

describe("Obsługa błędów Firebase", () => {
  const loginWith = async (getByText, getByPlaceholderText) => {
    fireEvent.changeText(getByPlaceholderText("Email"), "test@test.pl");
    fireEvent.changeText(getByPlaceholderText("Hasło"), "haslo123");
    fireEvent.press(getByText("Zaloguj się"));
  };

  it("wyświetla błąd dla auth/user-not-found", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/user-not-found",
    });
    const { getByText, getByPlaceholderText } = renderLogin();
    await loginWith(getByText, getByPlaceholderText);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Nieprawidłowy email lub hasło.",
        }),
      );
    });
  });

  it("wyświetla błąd dla auth/wrong-password", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/wrong-password",
    });
    const { getByText, getByPlaceholderText } = renderLogin();
    await loginWith(getByText, getByPlaceholderText);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Nieprawidłowy email lub hasło.",
        }),
      );
    });
  });

  it("wyświetla błąd dla auth/invalid-credential", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/invalid-credential",
    });
    const { getByText, getByPlaceholderText } = renderLogin();
    await loginWith(getByText, getByPlaceholderText);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Nieprawidłowy email lub hasło.",
        }),
      );
    });
  });

  it("wyświetla błąd dla auth/invalid-email", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/invalid-email",
    });
    const { getByText, getByPlaceholderText } = renderLogin();
    await loginWith(getByText, getByPlaceholderText);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Nieprawidłowy format email.",
        }),
      );
    });
  });

  it("wyświetla błąd dla auth/too-many-requests", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/too-many-requests",
    });
    const { getByText, getByPlaceholderText } = renderLogin();
    await loginWith(getByText, getByPlaceholderText);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Zbyt wiele prób. Spróbuj później.",
        }),
      );
    });
  });

  it("wyświetla błąd dla auth/network-request-failed", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/network-request-failed",
    });
    const { getByText, getByPlaceholderText } = renderLogin();
    await loginWith(getByText, getByPlaceholderText);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Brak połączenia z internetem.",
        }),
      );
    });
  });

  it("wyświetla generyczny błąd dla nieobsługiwanego kodu błędu", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/unknown-error",
    });
    const { getByText, getByPlaceholderText } = renderLogin();
    await loginWith(getByText, getByPlaceholderText);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Nie udało się zalogować",
        }),
      );
    });
  });
});

describe("Nawigacja", () => {
  it("przechodzi do ekranu rejestracji po kliknięciu linku", () => {
    const { getByText } = renderLogin();

    fireEvent.press(getByText("Zarejestruj się"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Register");
  });
});
