module.exports = {
  preset: "react-native",
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-navigation|react-native-toast-message|@react-navigation/native)/)",
  ],
  setupFilesAfterEnv: ["@testing-library/react-native/jest-preset"],
  testEnvironment: "node",
};
