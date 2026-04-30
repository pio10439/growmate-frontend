export const useTheme = () => ({
  isDark: false,
  toggleTheme: jest.fn(),
  colors: {
    background: "#f8f9fa",
    card: "#ffffff",
    text: "#24292e",
    textSecondary: "#586069",
    border: "#e1e4e8",
    primary: "#2e7d32",
    primaryDark: "#1b5e20",
    accent: "#4caf50",
    danger: "#d32f2f",
  },
});
