import React from "react";
import { TextInput, StyleSheet } from "react-native";

export default function Inpunt({ placeholder, ...rest }) {
  return (
    <TextInput
      style={styles.inpunt}
      placeholder={placeholder}
      placeholderTextColor="#000000"
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  inpunt: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    fontSize: 24,
    width: "100%",
  },
});
