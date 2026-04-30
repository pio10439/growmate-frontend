jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("firebase/auth", () => ({
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
}));

jest.mock("expo", () => ({
  registerRootComponent: jest.fn(),
  Constants: {
    expoConfig: { extra: {} },
  },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: {} },
  },
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn(),
}));
