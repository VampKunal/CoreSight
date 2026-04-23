import React, { memo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import { COLORS } from "../theme";

const PrimaryButton = ({
  label,
  icon,
  loading,
  variant = "primary",
  style,
  textStyle,
  ...props
}) => (
  <TouchableOpacity
    {...props}
    activeOpacity={0.86}
    disabled={props.disabled || loading}
    style={[
      styles.button,
      variant === "secondary" ? styles.secondary : styles.primary,
      props.disabled ? styles.disabled : null,
      style,
    ]}
  >
    {loading ? (
      <ActivityIndicator color={COLORS.white} />
    ) : (
      <>
        {icon ? (
          <Icon
            name={icon}
            size={20}
            color={COLORS.white}
            style={styles.icon}
          />
        ) : null}
        <Text style={[styles.text, textStyle]}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabled: {
    opacity: 0.58,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
});

export default memo(PrimaryButton);
