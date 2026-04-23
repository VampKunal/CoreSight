import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppShell from "../components/AppShell";
import FormField from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { openAppDrawer } from "../navigation/drawer";
import { apiFetch } from "../services/apiClient";
import { COLORS, TYPOGRAPHY } from "../theme";

const initialProfile = {
  age: "",
  weight: "",
  height: "",
  goals: "",
  healthConditions: "",
};

const parseList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const ProfileScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const completion = useMemo(() => {
    const values = Object.values(profile);
    const filled = values.filter((value) => value.trim()).length;
    return Math.round((filled / values.length) * 100);
  }, [profile]);

  const updateField = useCallback((field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/profile/me");
      if (data) {
        setProfile({
          age: data.age?.toString() || "",
          weight: data.weight?.toString() || "",
          height: data.height?.toString() || "",
          goals: data.goals?.join(", ") || "",
          healthConditions: data.healthConditions?.join(", ") || "",
        });
      }
    } catch (error) {
      setMessage(
        "Profile data could not be loaded. You can still fill it in and save.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const validateProfile = useCallback(() => {
    const nextErrors = {};
    const age = Number(profile.age);
    const weight = Number(profile.weight);
    const height = Number(profile.height);

    if (!age || age < 12 || age > 100) {
      nextErrors.age = "Enter an age between 12 and 100.";
    }

    if (!weight || weight < 25 || weight > 250) {
      nextErrors.weight = "Enter weight in kg between 25 and 250.";
    }

    if (!height || height < 90 || height > 240) {
      nextErrors.height = "Enter height in cm between 90 and 240.";
    }

    if (!parseList(profile.goals).length) {
      nextErrors.goals = "Add at least one goal.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [profile]);

  const saveProfile = useCallback(async () => {
    setMessage("");

    if (!validateProfile()) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        age: Number(profile.age),
        weight: Number(profile.weight),
        height: Number(profile.height),
        goals: parseList(profile.goals),
        healthConditions: parseList(profile.healthConditions),
        onboardingCompleted: true,
        activityLevel: "moderately-active",
        gender: "prefer-not-to-say",
      };

      await apiFetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMessage("Profile saved. Diet generation can use this data now.");
    } catch (error) {
      setMessage(error.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }, [profile, validateProfile]);

  if (loading) {
    return (
      <AppShell>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile</Text>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          kicker="Profile data"
          title="Your profile"
          subtitle="Keep this current so diet plans and posture sessions match your goals."
          onMenu={() => openAppDrawer(navigation)}
          right={
            <PrimaryButton
              label="Logout"
              icon="logout"
              variant="secondary"
              onPress={signOut}
              style={styles.logoutButton}
              textStyle={styles.logoutText}
            />
          }
        />

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.kicker}>Completion</Text>
            <Text style={styles.summaryTitle}>{completion}% ready</Text>
            <Text style={styles.summaryText}>
              Age, body metrics, goals, and conditions feed your
              recommendations.
            </Text>
          </View>
          <View style={styles.progressRing}>
            <Text style={styles.progressText}>{completion}</Text>
          </View>
        </View>

        {message ? (
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color={COLORS.secondary}
            />
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <View style={styles.row}>
            <FormField
              label="Age"
              placeholder="25"
              keyboardType="numeric"
              value={profile.age}
              onChangeText={(text) => updateField("age", text)}
              error={errors.age}
              style={styles.halfField}
            />
            <FormField
              label="Weight"
              placeholder="70 kg"
              keyboardType="numeric"
              value={profile.weight}
              onChangeText={(text) => updateField("weight", text)}
              error={errors.weight}
              style={styles.halfField}
            />
          </View>

          <FormField
            label="Height (cm)"
            placeholder="175"
            keyboardType="numeric"
            value={profile.height}
            onChangeText={(text) => updateField("height", text)}
            error={errors.height}
            style={styles.field}
          />
          <FormField
            label="Goals"
            placeholder="Muscle gain, fat loss"
            value={profile.goals}
            onChangeText={(text) => updateField("goals", text)}
            error={errors.goals}
            style={styles.field}
          />
          <FormField
            label="Health conditions / allergies"
            placeholder="Peanut allergy, hypertension"
            value={profile.healthConditions}
            onChangeText={(text) => updateField("healthConditions", text)}
            error={errors.healthConditions}
            multiline
            style={styles.field}
          />

          <PrimaryButton
            label="Save profile"
            icon="content-save-outline"
            onPress={saveProfile}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
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
  logoutButton: {
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: COLORS.text,
    fontSize: 13,
  },
  summaryCard: {
    marginHorizontal: 18,
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },
  kicker: TYPOGRAPHY.kicker,
  summaryTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 5,
    fontVariant: ["tabular-nums"],
  },
  summaryText: {
    ...TYPOGRAPHY.body,
    maxWidth: 230,
    marginTop: 6,
  },
  progressRing: {
    width: 74,
    height: 74,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  progressText: {
    color: COLORS.secondary,
    fontSize: 23,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  notice: {
    margin: 18,
    marginBottom: 0,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceHigh,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noticeText: {
    flex: 1,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: 10,
    fontWeight: "700",
  },
  formCard: {
    margin: 18,
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  saveButton: {
    marginTop: 4,
  },
});

export default ProfileScreen;
