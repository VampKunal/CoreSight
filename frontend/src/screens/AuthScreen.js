import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import AppShell from "../components/AppShell";
import FormField from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";
import { getApiBaseUrl } from "../services/apiConfig";
import { isFirebaseConfigured } from "../services/firebase";
import { saveTokens } from "../services/authService";
import { COLORS, SHADOWS, TYPOGRAPHY } from "../theme";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80";

const validateEmail = (value) => /\S+@\S+\.\S+/.test(value.trim());

const AuthScreen = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState("");

  const modeCopy = useMemo(
    () => ({
      title: isLogin ? "Welcome back" : "Build your FitTrack profile",
      subtitle: isLogin
        ? "Sign in to continue posture checks, diet plans, and saved profile data."
        : "Create an account and start with your camera analysis and nutrition setup.",
      action: isLogin ? "Login" : "Sign up",
    }),
    [isLogin],
  );

  const validateForm = useCallback(() => {
    const nextErrors = {};

    if (!isLogin && !name.trim()) {
      nextErrors.name = "Enter your full name.";
    }

    if (!validateEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (password.length < 6) {
      nextErrors.password = "Use at least 6 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [email, isLogin, name, password]);

  const handleSubmit = useCallback(async () => {
    setFormMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin
      ? { email: email.trim(), password }
      : { name: name.trim(), email: email.trim(), password };

    try {
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.details?.[0]?.msg ||
            "Could not complete this request.",
        );
      }

      if (isLogin) {
        await saveTokens(data);
        onLoginSuccess();
      } else {
        setFormMessage(
          "Account created. Log in with the same email and password.",
        );
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      setFormMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [email, isLogin, name, onLoginSuccess, password, validateForm]);

  return (
    <AppShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={{ uri: HERO_IMAGE }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroCopy}>
              <View style={styles.logoRow}>
                <View style={styles.logoMark}>
                  <Icon name="heart-pulse" size={25} color={COLORS.white} />
                </View>
                <Text style={styles.brand}>FitTrack AI</Text>
              </View>
              <Text style={styles.heroTitle}>
                Train with cleaner form and smarter meals.
              </Text>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.kicker}>Secure access</Text>
            <Text style={styles.title}>{modeCopy.title}</Text>
            <Text style={styles.subtitle}>{modeCopy.subtitle}</Text>

            <View style={styles.segment}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  isLogin ? styles.segmentActive : null,
                ]}
                onPress={() => setIsLogin(true)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isLogin ? styles.segmentTextActive : null,
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  !isLogin ? styles.segmentActive : null,
                ]}
                onPress={() => setIsLogin(false)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    !isLogin ? styles.segmentTextActive : null,
                  ]}
                >
                  Signup
                </Text>
              </TouchableOpacity>
            </View>

            {!isLogin ? (
              <FormField
                label="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                error={errors.name}
                style={styles.field}
              />
            ) : null}

            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              style={styles.field}
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isLogin ? "current-password" : "new-password"}
              error={errors.password}
              style={styles.field}
            />

            {formMessage ? (
              <Text style={styles.formMessage}>{formMessage}</Text>
            ) : null}

            <PrimaryButton
              label={modeCopy.action}
              icon={isLogin ? "login" : "account-plus-outline"}
              onPress={handleSubmit}
              loading={loading}
            />

            <View style={styles.integrationNote}>
              <Icon
                name={
                  isFirebaseConfigured
                    ? "database-check-outline"
                    : "database-cog-outline"
                }
                size={20}
                color={COLORS.secondary}
              />
              <Text style={styles.integrationText}>
                {isFirebaseConfigured
                  ? "Firebase Auth and Firestore are configured for this build."
                  : "Firebase service is ready. Add keys in app.json extra.firebase to connect Auth and Firestore."}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingTop: 58,
    paddingBottom: 30,
  },
  hero: {
    minHeight: 250,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,11,15,0.48)",
  },
  heroCopy: {
    flex: 1,
    justifyContent: "space-between",
    padding: 18,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brand: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 33,
    lineHeight: 37,
    fontWeight: "900",
    maxWidth: 330,
  },
  panel: {
    marginTop: -26,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kicker: TYPOGRAPHY.kicker,
  title: {
    ...TYPOGRAPHY.title,
    marginTop: 5,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginTop: 8,
    marginBottom: 18,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  segmentActive: {
    backgroundColor: COLORS.surfaceHigh,
  },
  segmentText: {
    color: COLORS.textSecondary,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: COLORS.text,
  },
  field: {
    marginBottom: 14,
  },
  formMessage: {
    color: COLORS.warning,
    lineHeight: 20,
    marginBottom: 14,
    fontWeight: "700",
  },
  integrationNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
  },
  integrationText: {
    flex: 1,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: "700",
  },
});

export default AuthScreen;
