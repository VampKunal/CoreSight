import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppShell from "../components/AppShell";
import MetricPill from "../components/MetricPill";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { openAppDrawer } from "../navigation/drawer";
import { apiFetch } from "../services/apiClient";
import { COLORS, TYPOGRAPHY } from "../theme";

const MealCard = memo(({ meal }) => (
  <View style={styles.mealCard}>
    <View style={styles.mealHeader}>
      <View style={styles.mealIcon}>
        <Ionicons name="nutrition-outline" size={20} color={COLORS.white} />
      </View>
      <View style={styles.mealTitleBlock}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealTime}>{meal.time || "Flexible timing"}</Text>
      </View>
    </View>
    <View style={styles.macrosGrid}>
      <MetricPill label="calories" value={`${meal.calories ?? 0} kcal`} />
      <MetricPill label="protein" value={`${meal.protein ?? 0}g`} />
      <MetricPill label="carbs" value={`${meal.carbs ?? 0}g`} />
      <MetricPill label="fat" value={`${meal.fat ?? 0}g`} />
    </View>
    {meal.notes ? <Text style={styles.mealNotes}>{meal.notes}</Text> : null}
  </View>
));

const PlanCard = memo(({ plan }) => {
  const createdAt = plan.createdAt
    ? new Date(plan.createdAt).toLocaleDateString()
    : "today";
  const meals = plan.meals ?? [];

  return (
    <View style={styles.planContainer}>
      <View style={styles.planHeader}>
        <View>
          <Text style={styles.kicker}>Plan created {createdAt}</Text>
          <Text style={styles.planTitle}>
            {plan.targetCalories ?? "Custom"} kcal/day
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{meals.length}</Text>
          <Text style={styles.countLabel}>meals</Text>
        </View>
      </View>
      {meals.map((meal, index) => (
        <MealCard key={`${meal.name}-${index}`} meal={meal} />
      ))}
    </View>
  );
});

const DietScreen = ({ navigation }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const fetchDietPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/api/diet/");
      setPlans(data.data || []);
    } catch (fetchError) {
      setError(fetchError.message || "Could not load diet plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDietPlans();
  }, [fetchDietPlans]);

  const generateNewPlan = useCallback(async () => {
    try {
      setGenerating(true);
      setError("");
      await apiFetch("/api/diet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await fetchDietPlans();
    } catch (generateError) {
      const isProfileIssue =
        generateError.message?.toLowerCase().includes("profile") ||
        generateError.message?.toLowerCase().includes("onboarding");
      setError(
        isProfileIssue
          ? "Complete your profile before generating a plan."
          : generateError.message,
      );
    } finally {
      setGenerating(false);
    }
  }, [fetchDietPlans]);

  const listHeader = useMemo(
    () => (
      <>
        <ScreenHeader
          kicker="AI nutrition"
          title="Diet plans"
          subtitle="Generate meals from your profile, goals, and health constraints."
          onMenu={() => openAppDrawer(navigation)}
          right={
            <PrimaryButton
              label="Generate"
              icon="auto-fix"
              onPress={generateNewPlan}
              loading={generating}
              style={styles.generateButton}
              textStyle={styles.generateText}
            />
          }
        />
        {error ? (
          <View style={styles.notice}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color={COLORS.warning}
            />
            <Text style={styles.noticeText}>{error}</Text>
            {error.includes("profile") ? (
              <PrimaryButton
                label="Profile"
                onPress={() => navigation.navigate("Profile")}
                style={styles.noticeButton}
                textStyle={styles.noticeButtonText}
              />
            ) : null}
          </View>
        ) : null}
      </>
    ),
    [error, generateNewPlan, generating, navigation],
  );

  if (loading) {
    return (
      <AppShell>
        {listHeader}
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your meal history</Text>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FlatList
        data={plans}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PlanCard plan={item} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="restaurant-outline"
              size={58}
              color={COLORS.secondary}
            />
            <Text style={styles.emptyTitle}>No diet plans yet</Text>
            <Text style={styles.emptyText}>
              Complete your profile, then generate a plan tailored to your body
              data and goals.
            </Text>
            <PrimaryButton
              label="Generate first plan"
              icon="auto-fix"
              onPress={generateNewPlan}
              loading={generating}
              style={styles.emptyButton}
            />
          </View>
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
        showsVerticalScrollIndicator={false}
      />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 26,
  },
  generateButton: {
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 12,
  },
  generateText: {
    fontSize: 13,
  },
  notice: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },
  noticeText: {
    flex: 1,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: 10,
    fontWeight: "700",
  },
  noticeButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  noticeButtonText: {
    fontSize: 13,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontWeight: "800",
  },
  emptyState: {
    margin: 18,
    padding: 24,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 14,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: "center",
    marginTop: 8,
  },
  emptyButton: {
    alignSelf: "stretch",
    marginTop: 18,
  },
  planContainer: {
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  kicker: TYPOGRAPHY.kicker,
  planTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  countBadge: {
    minWidth: 62,
    borderRadius: 16,
    padding: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  countText: {
    color: COLORS.secondary,
    fontSize: 20,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  countLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  mealCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mealIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  mealTitleBlock: {
    flex: 1,
  },
  mealName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  mealTime: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealNotes: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});

export default DietScreen;
