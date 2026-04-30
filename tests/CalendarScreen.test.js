import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import CalendarScreen from "../screens/CalendarScreen";

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
  TouchableOpacity: "TouchableOpacity",
  ScrollView: ({ children }) => children,
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock("react-native-calendars", () => ({
  Calendar: () => "Calendar",
}));

let focusCallback = null;
const mockNavigation = {
  addListener: jest.fn((event, callback) => {
    if (event === "focus") {
      focusCallback = callback;
    }
    return jest.fn();
  }),
};

const mockPlants = [
  {
    id: "1",
    name: "Monstera",
    wateringInterval: 7,
    fertilizingInterval: 30,
    lastWatered: { seconds: Math.floor(Date.now() / 1000) - 86400 * 10 },
    lastFertilized: { seconds: Math.floor(Date.now() / 1000) - 86400 * 35 },
  },
  {
    id: "2",
    name: "Fikus",
    wateringInterval: 10,
    fertilizingInterval: 30,
    lastWatered: { seconds: Math.floor(Date.now() / 1000) - 86400 * 1 },
    lastFertilized: { seconds: Math.floor(Date.now() / 1000) - 86400 * 15 },
  },
];

describe("CalendarScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    focusCallback = null;
    mockAuthorizedRequest.mockResolvedValue({ data: mockPlants });
  });

  it("renderuje tytuł ekranu", async () => {
    const { getByText } = render(
      <CalendarScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText("Kalendarz pielęgnacji")).toBeTruthy();
    });
  });

  it("renderuje statystyki", async () => {
    const { getByText } = render(
      <CalendarScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText(/Do podlania dzisiaj:/)).toBeTruthy();
      expect(getByText(/Do nawożenia dzisiaj:/)).toBeTruthy();
      expect(getByText(/Podlane w tym miesiącu:/)).toBeTruthy();
      expect(getByText(/Nawożone w tym miesiącu:/)).toBeTruthy();
    });
  });

  it("pobiera rośliny przy starcie", async () => {
    render(<CalendarScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(mockAuthorizedRequest).toHaveBeenCalledWith({
        url: "/plants",
        method: "GET",
      });
    });
  });

  it("renderuje legendę", async () => {
    const { getByText } = render(
      <CalendarScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText("Podlane")).toBeTruthy();
      expect(getByText("Do podlania")).toBeTruthy();
      expect(getByText("Pominięte podlewanie")).toBeTruthy();
      expect(getByText("Nawożone")).toBeTruthy();
      expect(getByText("Do nawożenia")).toBeTruthy();
      expect(getByText("Pominięte nawożenie")).toBeTruthy();
    });
  });

  it("wyświetla przycisk 'Podlej wszystkie' gdy są rośliny do podlania", async () => {
    const { getByText } = render(
      <CalendarScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      const button = getByText(/Podlej wszystkie/);
      expect(button).toBeTruthy();
    });
  });

  it("wyświetla przycisk 'Nawóź wszystkie' gdy są rośliny do nawożenia", async () => {
    const { getByText } = render(
      <CalendarScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      const button = getByText(/Nawóź wszystkie/);
      expect(button).toBeTruthy();
    });
  });

  it("nie wyświetla przycisku 'Podlej wszystkie' gdy nie ma roślin do podlania", async () => {
    const plantsNoWater = [
      {
        id: "1",
        name: "Monstera",
        wateringInterval: 7,
        lastWatered: { seconds: Math.floor(Date.now() / 1000) - 86400 * 1 },
        lastFertilized: { seconds: Math.floor(Date.now() / 1000) - 86400 * 35 },
      },
    ];
    mockAuthorizedRequest.mockResolvedValue({ data: plantsNoWater });

    const { queryByText } = render(
      <CalendarScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(queryByText(/Podlej wszystkie/)).toBeNull();
    });
  });

  it("obsługuje błąd pobierania roślin", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockAuthorizedRequest.mockRejectedValue(new Error("API Error"));

    render(<CalendarScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "info",
          text2: "Nie udało się załadować kalendarza",
        }),
      );
    });

    consoleSpy.mockRestore();
  });

  it("odświeża dane po focuście", async () => {
    render(<CalendarScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(mockAuthorizedRequest).toHaveBeenCalledTimes(1);
    });

    mockAuthorizedRequest.mockClear();

    await act(async () => {
      if (focusCallback) {
        focusCallback();
      }
    });

    await waitFor(() => {
      expect(mockAuthorizedRequest).toHaveBeenCalledTimes(1);
    });
  });

  it("obsługuje rośliny bez daty podlania", async () => {
    const plantsWithoutDates = [
      {
        id: "1",
        name: "Nowa roślina",
        wateringInterval: 7,
        fertilizingInterval: 30,
        lastWatered: null,
        lastFertilized: null,
      },
    ];
    mockAuthorizedRequest.mockResolvedValue({ data: plantsWithoutDates });

    const { getByText } = render(
      <CalendarScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText("Kalendarz pielęgnacji")).toBeTruthy();
    });

    expect(mockToastShow).not.toHaveBeenCalled();
  });

  it("nie wyświetla przycisku 'Podlej wszystkie' gdy wszystkie rośliny są podlane", async () => {
    const wateredPlants = [
      {
        id: "1",
        name: "Monstera",
        wateringInterval: 7,
        lastWatered: { seconds: Math.floor(Date.now() / 1000) },
        lastFertilized: { seconds: Math.floor(Date.now() / 1000) - 86400 * 35 },
      },
    ];
    mockAuthorizedRequest.mockResolvedValue({ data: wateredPlants });

    const { queryByText } = render(
      <CalendarScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(queryByText(/Podlej wszystkie/)).toBeNull();
    });
  });
});
