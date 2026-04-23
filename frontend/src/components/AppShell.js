import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../theme";

const AppShell = ({ children, scroll = false, style }) => {
  const Container = scroll ? View : SafeAreaView;

  return (
    <Container style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  glowTop: {
    position: "absolute",
    top: -150,
    right: -120,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "rgba(105,191,160,0.13)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -180,
    left: -160,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(229,107,63,0.11)",
  },
});

export default AppShell;
