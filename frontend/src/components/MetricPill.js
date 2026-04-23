import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS } from "../theme";

const MetricPill = ({ label, value }) => (
  <View style={styles.pill}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  value: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
});

export default memo(MetricPill);
