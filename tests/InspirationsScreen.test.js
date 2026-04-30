import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import InspirationsScreen from "../screens/InspirationsScreen";

const mockAuthorizedRequest = jest.fn();
jest.mock("../services/api", () => ({
  authorizedRequest: (...args) => mockAuthorizedRequest(...args),
}));

const mockToastShow = jest.fn();
jest.mock("react-native-toast-message", () => ({
  show: (...args) => mockToastShow(...args),
}));

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
  ActivityIndicator: "ActivityIndicator",
  ScrollView: ({ children }) => children,
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
}));

const mockPlantData = {
  commonName: "Paproć",
  scientificName: "Nephrolepis exaltata",
  description: "Bardzo zielona roślina doniczkowa.",
  watering: "DUŻE",
  sunlight: "CIEŃ",
  origin: "Tropiki",
  indoor: "TAK",
  careLevel: "ŁATWY",
  specialFeature: "nawilżająca",
  imageUrl: "https://example.com/plant.jpg",
  why: "bo tak",
};

describe("InspirationsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlantData });
  });

  it("wyświetla loader podczas ładowania", () => {
    mockAuthorizedRequest.mockImplementation(() => new Promise(() => {}));
    const { getByText } = render(<InspirationsScreen />);
    expect(getByText("Szukam rośliny...")).toBeTruthy();
  });

  it("wyświetla dane rośliny po załadowaniu", async () => {
    const { getByText, queryByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      expect(getByText("Paproć")).toBeTruthy();
    });

    expect(queryByText("Szukam rośliny...")).toBeNull();
    expect(getByText("Pokaż inną roślinę")).toBeTruthy();
  });

  it("wyświetla wszystkie etykiety faktów", async () => {
    const { getByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      expect(getByText("Paproć")).toBeTruthy();
    });

    expect(getByText("Podlewanie")).toBeTruthy();
    expect(getByText("Światło")).toBeTruthy();
    expect(getByText("Pochodzenie")).toBeTruthy();
    expect(getByText("Do wnętrz")).toBeTruthy();
    expect(getByText("Poziom")).toBeTruthy();
    expect(getByText("Cecha")).toBeTruthy();
  });

  it("wyświetla wartości faktów", async () => {
    const { getByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      expect(getByText("Paproć")).toBeTruthy();
    });

    expect(getByText("Duże")).toBeTruthy();
    expect(getByText("Cień")).toBeTruthy();
    expect(getByText("Tropiki")).toBeTruthy();
    expect(getByText("Tak")).toBeTruthy();
    expect(getByText("Łatwy")).toBeTruthy();
  });

  it("obsługuje błąd API i pokazuje fallbackową roślinę", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockAuthorizedRequest.mockRejectedValue(new Error("API Error"));

    const { getAllByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      const elements = getAllByText("Monstera deliciosa");
      expect(elements.length).toBeGreaterThan(0);
    });

    expect(mockToastShow).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("pobiera nową roślinę po kliknięciu przycisku", async () => {
    const { getByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      expect(getByText("Paproć")).toBeTruthy();
    });

    const button = getByText("Pokaż inną roślinę");
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockAuthorizedRequest).toHaveBeenCalledTimes(2);
    });
  });

  it("aktualizuje dane po kliknięciu przycisku", async () => {
    const secondPlant = {
      ...mockPlantData,
      commonName: "Fikus",
      watering: "MAŁE",
    };
    mockAuthorizedRequest
      .mockResolvedValueOnce({ data: mockPlantData })
      .mockResolvedValueOnce({ data: secondPlant });

    const { getByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      expect(getByText("Paproć")).toBeTruthy();
      expect(getByText("Duże")).toBeTruthy();
    });

    const button = getByText("Pokaż inną roślinę");
    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText("Fikus")).toBeTruthy();
      expect(getByText("Małe")).toBeTruthy();
    });
  });

  it("poprawnie formatuje tekst z podkreślnikami", async () => {
    mockAuthorizedRequest.mockResolvedValue({
      data: {
        ...mockPlantData,
        watering: "BARDZO_DUŻE",
        specialFeature: "oczyszczająca_powietrze",
      },
    });

    const { getByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      expect(getByText("Paproć")).toBeTruthy();
      expect(getByText("Bardzo duże")).toBeTruthy();
      expect(getByText("Oczyszczająca powietrze")).toBeTruthy();
    });
  });

  it("nie wywołuje błędu przy pustych wartościach", async () => {
    mockAuthorizedRequest.mockResolvedValue({
      data: {
        ...mockPlantData,
        watering: null,
        specialFeature: null,
        why: null,
      },
    });

    const { getByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      expect(getByText("Paproć")).toBeTruthy();
    });

    expect(getByText("Podlewanie")).toBeTruthy();
    expect(getByText("Cecha")).toBeTruthy();
  });

  it("pokazuje loader podczas ładowania nowej rośliny", async () => {
    let resolvePromise;
    const slowPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockAuthorizedRequest
      .mockResolvedValueOnce({ data: mockPlantData })
      .mockImplementationOnce(() => slowPromise);

    const { getByText, queryByText } = render(<InspirationsScreen />);

    await waitFor(() => {
      expect(getByText("Paproć")).toBeTruthy();
    });

    const button = getByText("Pokaż inną roślinę");
    fireEvent.press(button);

    expect(getByText("Szukam rośliny...")).toBeTruthy();

    await act(async () => {
      resolvePromise({ data: { ...mockPlantData, commonName: "Nowa" } });
    });

    await waitFor(() => {
      expect(queryByText("Szukam rośliny...")).toBeNull();
      expect(getByText("Nowa")).toBeTruthy();
    });
  });

  it("wywołuje API tylko raz przy starcie", async () => {
    render(<InspirationsScreen />);

    await waitFor(() => {
      expect(mockAuthorizedRequest).toHaveBeenCalledTimes(1);
    });
  });
});
