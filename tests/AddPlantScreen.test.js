import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AddPlantScreen from "../screens/AddPlantScreen";

const mockAuthorizedRequest = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetParams = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setParams: mockSetParams,
  addListener: jest.fn(),
};

const mockRoute = {
  params: {},
};

jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn(),
  },
  Text: "Text",
  View: "View",
  TextInput: "TextInput",
  TouchableOpacity: "TouchableOpacity",
  ScrollView: "ScrollView",
  ActivityIndicator: "ActivityIndicator",
  Image: "Image",
  Switch: "Switch",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  TouchableWithoutFeedback: "TouchableWithoutFeedback",
  Keyboard: {
    dismiss: jest.fn(),
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  Platform: {
    OS: "ios",
  },
}));

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" }),
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "file://camera.jpg" }],
    }),
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "file://gallery.jpg" }],
    }),
  ),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 50, longitude: 20 } }),
  ),
}));

jest.mock("../services/api", () => ({
  __esModule: true,
  authorizedRequest: (...args) => mockAuthorizedRequest(...args),
}));

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      background: "#fff",
      primary: "#4CAF50",
      card: "#f8f8f8",
      textSecondary: "#666",
      text: "#000",
      accent: "#FFC107",
    },
    isDark: false,
  }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: jest.fn(),
}));

describe("AddPlantScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.params = {};
  });

  const renderScreen = () => {
    return render(
      <AddPlantScreen navigation={mockNavigation} route={mockRoute} />,
    );
  };

  it("renderuje tytuł 'Dodaj nową roślinę'", () => {
    const { getByText } = renderScreen();
    expect(getByText("Dodaj nową roślinę")).toBeTruthy();
  });

  it("renderuje pola formularza", () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText("Nazwa rośliny *")).toBeTruthy();
    expect(getByPlaceholderText("Typ (np. Sukulent, Fikus)")).toBeTruthy();
  });

  it("wyświetla przełącznik AI", () => {
    const { getByText } = renderScreen();
    expect(getByText("Użyj AI do rozpoznania")).toBeTruthy();
  });

  it("renderuje przycisk pobierania lokalizacji", () => {
    const { getByText } = renderScreen();
    expect(getByText("Pobierz lokalizację")).toBeTruthy();
  });

  it("renderuje przyciski zdjęć", () => {
    const { getByText } = renderScreen();
    expect(getByText("Zrób zdjęcie")).toBeTruthy();
    expect(getByText("Z galerii")).toBeTruthy();
  });

  it("renderuje przycisk zapisu", () => {
    const { getByText } = renderScreen();
    expect(getByText("Zapisz roślinę")).toBeTruthy();
  });

  it("renderuje pole na notatki", () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText("Dodatkowe notatki")).toBeTruthy();
  });

  it("renderuje pole na światło", () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText("Światło (np. Dużo słońca)")).toBeTruthy();
  });

  it("renderuje pole na temperaturę", () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText("Temperatura (np. 18-24°C)")).toBeTruthy();
  });
});
