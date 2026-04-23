import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import { COLORS, TYPOGRAPHY } from "../theme";

const ScreenHeader = ({ kicker, title, subtitle, onMenu, right }) => (
  <View style={styles.header}>
    <View style={styles.left}>
      {onMenu ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenu}
          activeOpacity={0.84}
          hitSlop={8}
        >
          <Icon name="menu" size={25} color={COLORS.text} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.copy}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    {right}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 14,
  },
  copy: {
    flex: 1,
  },
  kicker: TYPOGRAPHY.kicker,
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 27,
    lineHeight: 32,
    marginTop: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginTop: 4,
  },
});

export default memo(ScreenHeader);
