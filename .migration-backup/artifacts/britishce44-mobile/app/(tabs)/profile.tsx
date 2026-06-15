import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const ROLE_COLOR: Record<string, string> = {
  admin: "#f0a500", supervisor: "#6366f1", teacher: "#059669", student: "#0891b2", parent: "#7c3aed",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Platform Admin", supervisor: "Supervisor", teacher: "Teacher", student: "Student", parent: "Parent",
};

const STATS = [
  { label: "Classes", value: "12" },
  { label: "Exams", value: "7" },
  { label: "Score Avg", value: "87%" },
];

type SettingRow = {
  id: string;
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  action?: () => void;
  danger?: boolean;
};

function SettingItem({ item }: { item: SettingRow }) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: colors.radius,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.75 : 1,
        gap: 14,
      })}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        item.action?.();
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={item.icon as any} size={18} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: "Inter_500Medium", color: item.danger ? colors.destructive : colors.foreground }}>
          {item.label}
        </Text>
        {!!item.sublabel && (
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1 }}>
            {item.sublabel}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const roleColor = ROLE_COLOR[user?.role ?? "student"];

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/login"));
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const SETTINGS: SettingRow[] = [
    { id: "notifications", icon: "notifications-outline", label: "Notifications", sublabel: "Push alerts for classes & exams", color: "#6366f1" },
    { id: "language", icon: "language-outline", label: "Language / اللغة", sublabel: "English · العربية", color: "#059669" },
    { id: "darkmode", icon: "moon-outline", label: "Appearance", sublabel: "Follow system setting", color: "#7c3aed" },
    { id: "privacy", icon: "shield-checkmark-outline", label: "Privacy & Security", color: "#f0a500" },
    { id: "about", icon: "information-circle-outline", label: "About Britishce44", sublabel: "Version 2.1 · Taiz, Yemen", color: "#0891b2" },
    { id: "support", icon: "headset-outline", label: "Help & Support", color: "#d97706" },
    { id: "logout", icon: "log-out-outline", label: "Sign Out", color: colors.destructive, danger: true, action: handleLogout },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        {/* Hero banner */}
        <LinearGradient
          colors={[colors.navy, colors.surface2 ?? "#131f38"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: topPad + 24, paddingBottom: 32, paddingHorizontal: 20 }}
        >
          {/* Avatar */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: `${roleColor}22`, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: roleColor, shadowColor: roleColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 }}>
              <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: roleColor }}>
                {user ? `${user.firstName[0]}${user.lastName[0]}` : "G"}
              </Text>
            </View>
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: "#ffffff" }}>
                {user ? `${user.firstName} ${user.lastName}` : "Guest"}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                {user?.email ?? ""}
              </Text>
              <View style={{ marginTop: 8, backgroundColor: `${roleColor}33`, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: `${roleColor}55` }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: roleColor }}>
                  {ROLE_LABEL[user?.role ?? "student"]}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: colors.radius, padding: 16, gap: 0 }}>
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.15)" }} />}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.primary }}>{stat.value}</Text>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        <View style={{ padding: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>
            Account Settings
          </Text>
          {SETTINGS.map(item => (
            <SettingItem key={item.id} item={item} />
          ))}

          <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginTop: 16 }}>
            Britishce44 · المركز البريطاني الأول{"\n"}Platform v2.1 · Taiz, Yemen · Est. 2020
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
