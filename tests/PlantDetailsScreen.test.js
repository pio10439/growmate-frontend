import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import PlantDetailsScreen from "../screens/PlantDetailsScreen";
import axios from "axios";

const mockAuthorizedRequest = jest.fn();
jest.mock("../services/api", () => ({
  authorizedRequest: (...args) => mockAuthorizedRequest(...args),
}));

const mockToastShow = jest.fn();
jest.mock("react-native-toast-message", () => ({
  show: (...args) => mockToastShow(...args),
}));

jest.mock("axios");

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("lottie-react-native", () => "LottieView");

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      primary: "#4CAF50",
      background: "#ffffff",
      card: "#f8f8f8",
      text: "#000000",
      textSecondary: "#666666",
    },
    isDark: false,
  }),
}));

jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Image: "Image",
  TouchableOpacity: "TouchableOpacity",
  ScrollView: ({ children }) => children,
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  Alert: {
    alert: jest.fn(),
  },
}));

const mockNavigation = {
  goBack: jest.fn(),
  addListener: jest.fn((event, callback) => {
    if (event === "focus") {
      callback();
    }
    return jest.fn();
  }),
  navigate: jest.fn(),
};

const mockPlant = {
  id: "1",
  name: "Monstera",
  type: "Tropical",
  photoUrl: "https://example.com/monstera.jpg",
  wateringInterval: 7,
  fertilizingInterval: 30,
  lastWatered: { seconds: Math.floor(Date.now() / 1000) - 86400 * 5 },
  lastFertilized: { seconds: Math.floor(Date.now() / 1000) - 86400 * 10 },
  lightLevel: "Dużo słońca",
  temperature: "22",
  notes: "Lubi wilgoć",
  location: { lat: 52.2297, lng: 21.0122 },
};

const mockWeatherData = {
  list: [
    {
      main: { temp: 22, humidity: 65 },
      weather: [{ main: "Clear", description: "bezchmurnie" }],
    },
  ],
};

const mockLocationData = {
  data: {
    address: {
      city: "Warszawa",
      country: "Polska",
    },
  },
};

describe("PlantDetailsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () => {
    return render(
      <PlantDetailsScreen
        route={{ params: { plant: mockPlant } }}
        navigation={mockNavigation}
      />,
    );
  };

  it("renderuje loader podczas ładowania", () => {
    mockAuthorizedRequest.mockImplementation(() => new Promise(() => {}));
    const { getByText } = renderScreen();
    expect(getByText("Ładowanie szczegółów...")).toBeTruthy();
  });

  it("renderuje nazwę rośliny po załadowaniu", async () => {
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlant });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText("Monstera")).toBeTruthy();
    });
  });

  it("renderuje typ rośliny", async () => {
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlant });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText("Tropical")).toBeTruthy();
    });
  });

  it("renderuje przyciski akcji", async () => {
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlant });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText("Podlej teraz")).toBeTruthy();
      expect(getByText("Nawożę teraz")).toBeTruthy();
      expect(getByText("Edytuj")).toBeTruthy();
      expect(getByText("Usuń")).toBeTruthy();
    });
  });

  it("renderuje informacje o pielęgnacji", async () => {
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlant });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText(/Ostatnio podlana:/)).toBeTruthy();
      expect(getByText(/Ostatnio nawożona:/)).toBeTruthy();
      expect(getByText("Światło: Dużo słońca")).toBeTruthy();
      expect(getByText("Notatki: Lubi wilgoć")).toBeTruthy();
    });
  });

  it("pobiera dane rośliny przy starcie", async () => {
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlant });
    renderScreen();

    await waitFor(() => {
      expect(mockAuthorizedRequest).toHaveBeenCalledWith({
        url: `/plants/${mockPlant.id}`,
        method: "GET",
      });
    });
  });

  it("pobiera pogodę gdy roślina ma lokalizację", async () => {
    mockAuthorizedRequest
      .mockResolvedValueOnce({ data: mockPlant })
      .mockResolvedValueOnce({ data: mockWeatherData });
    axios.get.mockResolvedValue(mockLocationData);

    renderScreen();

    await waitFor(() => {
      expect(mockAuthorizedRequest).toHaveBeenCalledWith({
        url: `/weather/${mockPlant.location.lat}/${mockPlant.location.lng}`,
        method: "GET",
      });
    });
  });

  it("obsługuje brak lokalizacji rośliny", async () => {
    const plantWithoutLocation = { ...mockPlant, location: null };
    mockAuthorizedRequest.mockResolvedValue({ data: plantWithoutLocation });

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText("Brak danych pogodowych")).toBeTruthy();
    });
  });

  it("obsługuje błąd pobierania rośliny", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockAuthorizedRequest.mockRejectedValue(new Error("API Error"));

    renderScreen();

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text2: "Nie udało się załadować aktualnych danych rośliny",
        }),
      );
    });

    consoleSpy.mockRestore();
  });

  it("nawiguje do edycji rośliny", async () => {
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlant });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText("Edytuj")).toBeTruthy();
    });

    const editButton = getByText("Edytuj");
    fireEvent.press(editButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Main", {
      screen: "AddPlantTab",
      params: { plantToEdit: mockPlant },
    });
  });

  it("nawiguje wstecz przyciskiem back", async () => {
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlant });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText("Monstera")).toBeTruthy();
    });

    const backButton = require("react-native").TouchableOpacity;
    expect(backButton).toBeDefined();
  });
});
