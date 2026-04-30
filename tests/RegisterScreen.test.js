import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import RegisterScreen from "../screens/RegisterScreen";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Toast from "react-native-toast-message";
import { ThemeProvider } from "../context/ThemeContext";

jest.mock("../firebaseConfig", () => ({
  auth: {
    currentUser: null,
  },
}));

const mockAuth = {
  currentUser: null,
};

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => mockAuth),
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      text: "#000",
      background: "#fff",
      primary: "#4CAF50",
      card: "#f8f8f8",
      textSecondary: "#666",
    },
    isDark: false,
  }),
  ThemeProvider: ({ children }) => children,
}));

const mockNavigation = {
  navigate: jest.fn(),
};

const renderRegister = () => {
  return render(
    <ThemeProvider>
      <RegisterScreen navigation={mockNavigation} />
    </ThemeProvider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("UI – renderowanie ekranu rejestracji", () => {
  it("wyświetla tytuł z emoji", () => {
    const { getByText } = renderRegister();
    expect(getByText("Dołącz do GrowMate 🌱")).toBeTruthy();
  });

  it("renderuje wszystkie pola tekstowe", () => {
    const { getByPlaceholderText } = renderRegister();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Hasło (min. 6 znaków)")).toBeTruthy();
    expect(getByPlaceholderText("Powtórz hasło")).toBeTruthy();
  });

  it("pola haseł mają włączone secureTextEntry", () => {
    const { getByPlaceholderText } = renderRegister();
    expect(
      getByPlaceholderText("Hasło (min. 6 znaków)").props.secureTextEntry,
    ).toBe(true);
    expect(getByPlaceholderText("Powtórz hasło").props.secureTextEntry).toBe(
      true,
    );
  });
});

describe("Walidacja pól formularza", () => {
  it("pokazuje błąd, gdy email jest pusty", async () => {
    const { getByText } = renderRegister();
    fireEvent.press(getByText("Zarejestruj się"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: "Wprowadź adres email" }),
      );
    });
  });

  it("pokazuje błąd, gdy hasło jest za krótkie (< 6 znaków)", async () => {
    const { getByText, getByPlaceholderText } = renderRegister();

    fireEvent.changeText(getByPlaceholderText("Email"), "test@test.pl");
    fireEvent.changeText(getByPlaceholderText("Hasło (min. 6 znaków)"), "123");
    fireEvent.press(getByText("Zarejestruj się"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: "Hasło musi mieć co najmniej 6 znaków",
        }),
      );
    });
  });

  it("pokazuje błąd, gdy hasła nie są identyczne", async () => {
    const { getByText, getByPlaceholderText } = renderRegister();

    fireEvent.changeText(getByPlaceholderText("Email"), "test@test.pl");
    fireEvent.changeText(
      getByPlaceholderText("Hasło (min. 6 znaków)"),
      "haslo123",
    );
    fireEvent.changeText(getByPlaceholderText("Powtórz hasło"), "innehaslo");
    fireEvent.press(getByText("Zarejestruj się"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: "Hasła nie są identyczne" }),
      );
    });
  });
});

describe("Firebase – Rejestracja", () => {
  it("wywołuje createUserWithEmailAndPassword z poprawnymi i oczyszczonymi danymi", async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: "new-user-123" },
    });
    const { getByText, getByPlaceholderText } = renderRegister();

    fireEvent.changeText(getByPlaceholderText("Email"), " TEST@test.pl ");
    fireEvent.changeText(
      getByPlaceholderText("Hasło (min. 6 znaków)"),
      "password123",
    );
    fireEvent.changeText(getByPlaceholderText("Powtórz hasło"), "password123");

    await act(async () => {
      fireEvent.press(getByText("Zarejestruj się"));
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      "test@test.pl",
      "password123",
    );
  });

  it("pokazuje sukces po pomyślnej rejestracji", async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: {} });
    const { getByText, getByPlaceholderText } = renderRegister();

    fireEvent.changeText(getByPlaceholderText("Email"), "test@test.pl");
    fireEvent.changeText(
      getByPlaceholderText("Hasło (min. 6 znaków)"),
      "password123",
    );
    fireEvent.changeText(getByPlaceholderText("Powtórz hasło"), "password123");

    await act(async () => {
      fireEvent.press(getByText("Zarejestruj się"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", text1: "Sukces!" }),
      );
    });
  });
});

describe("Obsługa błędów Firebase", () => {
  const setupFields = (getByPlaceholderText) => {
    fireEvent.changeText(getByPlaceholderText("Email"), "test@test.pl");
    fireEvent.changeText(
      getByPlaceholderText("Hasło (min. 6 znaków)"),
      "password123",
    );
    fireEvent.changeText(getByPlaceholderText("Powtórz hasło"), "password123");
  };

  it("obsługuje błąd auth/email-already-in-use", async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/email-already-in-use",
    });
    const { getByText, getByPlaceholderText } = renderRegister();

    setupFields(getByPlaceholderText);
    await act(async () => {
      fireEvent.press(getByText("Zarejestruj się"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: "Ten adres email jest już zarejestrowany",
        }),
      );
    });
  });

  it("obsługuje błąd auth/invalid-email", async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/invalid-email",
    });
    const { getByText, getByPlaceholderText } = renderRegister();

    setupFields(getByPlaceholderText);
    await act(async () => {
      fireEvent.press(getByText("Zarejestruj się"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: "Nieprawidłowy format email" }),
      );
    });
  });

  it("obsługuje błąd auth/weak-password", async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/weak-password",
    });
    const { getByText, getByPlaceholderText } = renderRegister();

    setupFields(getByPlaceholderText);
    await act(async () => {
      fireEvent.press(getByText("Zarejestruj się"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: "Hasło jest za słabe" }),
      );
    });
  });
});

describe("Nawigacja", () => {
  it("nawiguje do ekranu logowania po kliknięciu linku", () => {
    const { getByText } = renderRegister();
    fireEvent.press(getByText("Zaloguj się"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Login");
  });
});
