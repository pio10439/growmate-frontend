import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

jest.mock("../firebaseConfig", () => ({
  auth: { currentUser: { uid: "test-uid" } },
  db: {},
}));

jest.mock("react-native", () => {
  const React = require("react");
  return {
    View: ({ children, ...props }) =>
      React.createElement("View", props, children),
    Text: ({ children, ...props }) =>
      React.createElement("Text", props, children),
    ScrollView: ({ children, ...props }) =>
      React.createElement("ScrollView", props, children),
    TouchableOpacity: ({ children, ...props }) =>
      React.createElement("TouchableOpacity", { ...props }, children),
    Switch: ({ onValueChange, value, testID, ...props }) =>
      React.createElement("Switch", {
        ...props,
        testID,
        value,
        onValueChange: () => onValueChange(!value),
      }),
    StyleSheet: {
      create: (obj) => obj,
      flatten: (obj) => obj,
    },
    Alert: { alert: jest.fn() },
    Linking: { openSettings: jest.fn() },
    Platform: { OS: "ios", select: (obj) => obj.ios },
    Dimensions: { get: () => ({ width: 375, height: 812 }) },
  };
});

import SettingsScreen from "../screens/SettingsScreen";

const mockToggleTheme = jest.fn();

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
    toggleTheme: mockToggleTheme,
    colors: {
      background: "#fff",
      text: "#000",
      primary: "#4CAF50",
      card: "#eee",
    },
  }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    addListener: jest.fn((event, callback) => {
      if (event === "focus") callback();
      return jest.fn();
    }),
  }),
}));

jest.mock("../services/api", () => ({
  authorizedRequest: jest.fn().mockResolvedValue({
    data: { plantCount: 7, joinedAt: "2025-01-10T00:00:00Z" },
  }),
}));

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  AndroidNotificationPriority: { HIGH: 5 },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue("false"),
  setItem: jest.fn().mockResolvedValue(null),
  multiRemove: jest.fn().mockResolvedValue(null),
}));

jest.mock("react-native-toast-message", () => ({ show: jest.fn() }));
jest.mock("firebase/auth", () => ({
  signOut: jest.fn().mockResolvedValue(null),
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderuje ekran ustawień i dane z API", async () => {
    const { getByText, queryByText } = render(
      <SettingsScreen
        navigation={{
          addListener: jest.fn((e, cb) => {
            cb();
            return () => {};
          }),
        }}
      />,
    );
    await waitFor(
      () => {
        const plantCount = getByText("7");
        expect(plantCount).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it("wywołuje funkcję zmiany motywu przy przełączniku", async () => {
    const { UNSAFE_getAllByType } = render(
      <SettingsScreen navigation={{ addListener: jest.fn() }} />,
    );

    const switches = UNSAFE_getAllByType("Switch");

    await act(async () => {
      fireEvent(switches[0], "onValueChange", true);
    });

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it("wylogowuje użytkownika", async () => {
    const { getByText } = render(
      <SettingsScreen navigation={{ addListener: jest.fn() }} />,
    );

    const logoutBtn = getByText("Wyloguj się");
    fireEvent.press(logoutBtn);

    await waitFor(() => {
      const { signOut } = require("firebase/auth");
      expect(signOut).toHaveBeenCalled();
    });
  });
});
it("wyświetla Alert i wyłącza switch, gdy użytkownik odrzuci uprawnienia do powiadomień", async () => {
  const { UNSAFE_getAllByType } = render(
    <SettingsScreen navigation={{ addListener: jest.fn() }} />,
  );
  const { requestPermissionsAsync } = require("expo-notifications");
  const { Alert } = require("react-native");

  requestPermissionsAsync.mockResolvedValueOnce({ status: "denied" });

  const notificationSwitch = UNSAFE_getAllByType("Switch")[1];

  await act(async () => {
    fireEvent(notificationSwitch, "onValueChange", true);
  });

  expect(Alert.alert).toHaveBeenCalledWith(
    "Brak uprawnień",
    expect.any(String),
    expect.any(Array),
  );

  expect(notificationSwitch.props.value).toBe(false);
});

it("poprawnie formatuje i wyświetla datę dołączenia", async () => {
  const { getByText } = render(
    <SettingsScreen navigation={{ addListener: jest.fn((e, cb) => cb()) }} />,
  );

  await waitFor(() => {
    expect(getByText(/Sty 2025/)).toBeTruthy();
  });
});

it("czyści AsyncStorage i powiadomienia przy wylogowaniu", async () => {
  const { getByText } = render(
    <SettingsScreen navigation={{ addListener: jest.fn() }} />,
  );
  const AsyncStorage = require("@react-native-async-storage/async-storage");
  const Notifications = require("expo-notifications");

  const logoutBtn = getByText("Wyloguj się");

  await act(async () => {
    fireEvent.press(logoutBtn);
  });

  expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
    "token",
    "user",
    "dailyRemindersEnabled",
  ]);

  expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
});
