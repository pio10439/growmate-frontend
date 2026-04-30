module.exports = {
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  TouchableOpacity: "TouchableOpacity",
  ActivityIndicator: "ActivityIndicator",
  KeyboardAvoidingView: "KeyboardAvoidingView",

  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },

  Platform: {
    OS: "ios",
    select: (obj) => obj.ios,
  },

  Alert: {
    alert: jest.fn(),
  },
};
