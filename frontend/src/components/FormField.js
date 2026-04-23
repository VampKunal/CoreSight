import React, { memo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { COLORS } from "../theme";

const FormField = ({ label, error, style, ...inputProps }) => (
  <View style={style}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...inputProps}
      style={[styles.input, error ? styles.inputError : null, inputProps.style]}
      placeholderTextColor="rgba(247,243,238,0.38)"
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  label: {
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: "800",
  },
  input: {
    minHeight: 54,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 15,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  error: {
    color: COLORS.error,
    marginTop: 7,
    fontSize: 13,
    fontWeight: "700",
  },
});

export default memo(FormField);
