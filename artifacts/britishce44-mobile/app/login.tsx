import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("britishce44@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Login failed");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    inner: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: insets.top + 48,
      paddingBottom: insets.bottom + 24,
    },
    logoWrap: { alignItems: "center", marginBottom: 40 },
    logoBox: {
      width: 80,
      height: 80,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
    },
    logoText: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: colors.primaryForeground,
      letterSpacing: 1,
    },
    title: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 4,
    },
    arabicTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
      textAlign: "center",
      marginTop: 6,
    },
    form: { gap: 14, marginTop: 8 },
    label: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface2,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
    },
    input: {
      flex: 1,
      height: 48,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    eyeBtn: { padding: 4 },
    errorBox: {
      backgroundColor: `${colors.destructive}22`,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: `${colors.destructive}44`,
    },
    errorText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.destructive,
      textAlign: "center",
    },
    loginBtn: {
      height: 52,
      borderRadius: colors.radius,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    loginBtnText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.primaryForeground,
      letterSpacing: 0.5,
    },
    hint: {
      marginTop: 24,
      backgroundColor: colors.surface2,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hintTitle: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      textAlign: "center",
    },
    hintText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
    divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
    divLine: { flex: 1, height: 1, backgroundColor: colors.border },
    divText: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
  });

  return (
    <View style={s.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.inner}>
          <View style={s.logoWrap}>
            <LinearGradient
              colors={["#c47d00", "#f0a500", "#ffd166"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logoBox}
            >
              <Text style={s.logoText}>B44</Text>
            </LinearGradient>
            <Text style={s.title}>Britishce44</Text>
            <Text style={s.arabicTitle}>المركز البريطاني الأول</Text>
            <Text style={s.subtitle}>Online Digital School · Taiz, Yemen</Text>
          </View>

          <View style={s.form}>
            <View>
              <Text style={s.label}>Email Address</Text>
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View>
              <Text style={s.label}>Password</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Pressable style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {!!error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [s.loginBtn, { opacity: pressed || loading ? 0.8 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#c47d00", "#f0a500", "#ffd166"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: colors.radius }]}
              />
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={s.loginBtnText}>Sign In · تسجيل الدخول</Text>
              )}
            </Pressable>
          </View>

          <View style={s.hint}>
            <Text style={s.hintTitle}>Demo Credentials</Text>
            <Text style={s.hintText}>Admin: britishce44@gmail.com / admin123</Text>
            <View style={{ height: 4 }} />
            <Text style={s.hintText}>Teacher: suhair.almojahid / teacher123</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
