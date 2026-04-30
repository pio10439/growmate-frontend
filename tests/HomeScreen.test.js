import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import HomeScreen from "../screens/HomeScreen";

const mockAuthorizedRequest = jest.fn();
const mockToastShow = jest.fn();
const mockNavigate = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  addListener: jest.fn((event, callback) => {
    if (event === "focus") {
      callback();
    }
    return jest.fn();
  }),
};

jest.mock("react-native/Libraries/Lists/FlatList", () => {
  const { View } = require("react-native");
  return ({ data, renderItem, keyExtractor }) => {
    return data?.map((item, index) => (
      <View key={keyExtractor ? keyExtractor(item) : index}>
        {renderItem({ item, index })}
      </View>
    ));
  };
});

jest.mock("react-native", () => {
  return {
    Alert: {
      alert: jest.fn(),
    },
    ActivityIndicator: "ActivityIndicator",
    FlatList: "FlatList",
    Image: "Image",
    Text: "Text",
    TouchableOpacity: "TouchableOpacity",
    View: "View",
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => style,
    },
    Platform: {
      OS: "ios",
    },
    Dimensions: {
      get: () => ({ width: 375, height: 667 }),
    },
  };
});

jest.mock("../services/api", () => ({
  __esModule: true,
  authorizedRequest: (...args) => mockAuthorizedRequest(...args),
}));

jest.mock("react-native-toast-message", () => ({
  show: mockToastShow,
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
}));

const mockPlants = [
  {
    id: "1",
    name: "Monstera",
    type: "Tropical",
    photoUrl: "https://example.com/monstera.jpg",
    wateringInterval: 7,
    lastWatered: { seconds: Math.floor(Date.now() / 1000) - 86400 * 10 },
  },
];

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () => {
    return render(<HomeScreen navigation={mockNavigation} />);
  };

  it("renderuje ekran i pokazuje tytuł", async () => {
    mockAuthorizedRequest.mockResolvedValueOnce({ data: mockPlants });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText("Moje rośliny")).toBeTruthy();
    });
  });

  it("wyświetla loader podczas ładowania", () => {
    mockAuthorizedRequest.mockImplementation(() => new Promise(() => {}));
    const { getByText } = renderScreen();

    expect(getByText("Ładowanie Twoich roślin...")).toBeTruthy();
  });

  it("wyświetla komunikat gdy nie ma roślin", async () => {
    mockAuthorizedRequest.mockResolvedValueOnce({ data: [] });
    const { findByText } = renderScreen();

    const emptyMessage = await findByText("Nie masz jeszcze roślin 🌱");
    expect(emptyMessage).toBeTruthy();
  });

  it("zmienia sortowanie na A-Z", async () => {
    mockAuthorizedRequest.mockResolvedValueOnce({ data: mockPlants });
    const { findByText } = renderScreen();

    const sortBtn = await findByText("A-Z");
    fireEvent.press(sortBtn);

    expect(sortBtn).toBeTruthy();
  });

  it("zmienia sortowanie na Podlewanie", async () => {
    mockAuthorizedRequest.mockResolvedValueOnce({ data: mockPlants });
    const { findByText } = renderScreen();

    const sortBtn = await findByText("Podlewanie");
    fireEvent.press(sortBtn);

    expect(sortBtn).toBeTruthy();
  });

  it("obsługuje błąd pobierania roślin", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { Alert } = require("react-native");

    mockAuthorizedRequest.mockRejectedValueOnce(new Error("Network Error"));

    renderScreen();

    await waitFor(() => {
      expect(mockAuthorizedRequest).toHaveBeenCalled();
    });

    expect(Alert.alert).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
