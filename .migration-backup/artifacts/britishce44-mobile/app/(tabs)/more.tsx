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
  StyleSheet,
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

type Section = { title: string; items: Item[] };
type Item = {
  id: string; icon: string; label: string; sublabel: string; color: string;
  badge?: string; route?: string; action?: () => void; danger?: boolean;
};

export default function MoreScreen() {
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
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const SECTIONS: Section[] = [
    {
      title: "Learning & Assessment",
      items: [
        { id: "homework", icon: "book-outline", label: "Homework Dropbox", sublabel: "Submit & track assignments", color: "#6366f1", badge: "3 Due", route: "/(tabs)/homework" },
        { id: "placements", icon: "clipboard-outline", label: "Placement Tests", sublabel: "Level assessment & entry tests", color: "#7c3aed", route: "/(tabs)/placements" },
        { id: "academic-room", icon: "school-outline", label: "Academic Room", sublabel: "Tutoring, study groups & office hours", color: "#0891b2", route: "/(tabs)/academic-room" },
        { id: "anticheat", icon: "eye-outline", label: "Exam Monitor", sublabel: "Anti-cheat & proctoring status", color: "#e11d48", route: "/(tabs)/anticheat" },
      ],
    },
    {
      title: "Analytics & Reports",
      items: [
        { id: "analytics", icon: "stats-chart-outline", label: "Live Analytics", sublabel: "Real-time platform metrics", color: "#059669", route: "/(tabs)/analytics" },
        { id: "daily-perf", icon: "bar-chart-outline", label: "Daily Performance", sublabel: "Student & teacher progress", color: "#0891b2", route: "/(tabs)/daily-perf" },
        { id: "reports", icon: "document-text-outline", label: "Reports", sublabel: "Triple reports & summaries", color: "#d97706", route: "/(tabs)/reports" },
        { id: "teacher-eval", icon: "ribbon-outline", label: "Teacher Evaluation", sublabel: "AI-powered ratings", color: "#f0a500", route: "/(tabs)/teacher-eval" },
      ],
    },
    {
      title: "Management",
      items: [
        { id: "users", icon: "people-outline", label: "Users & Students", sublabel: "Manage accounts & enrollments", color: "#6366f1", route: "/(tabs)/users" },
        { id: "video-archive", icon: "videocam-outline", label: "Video Archive", sublabel: "Recorded class library", color: "#7c3aed", badge: "240+", route: "/(tabs)/video-archive" },
        { id: "auto-messaging", icon: "chatbox-ellipses-outline", label: "Auto Messaging AI", sublabel: "Automated parent notifications", color: "#059669", route: "/(tabs)/auto-messaging" },
        { id: "marketing", icon: "megaphone-outline", label: "Marketing Suite", sublabel: "Campaigns & enrollment tools", color: "#0891b2", route: "/(tabs)/marketing" },
        { id: "video-editor", icon: "film-outline", label: "AI Video Editor", sublabel: "Create & publish course content", color: "#7c3aed", route: "/(tabs)/video-editor" },
        { id: "ai-dev", icon: "sparkles-outline", label: "AI Development", sublabel: "Smart tools for educators", color: "#6366f1", route: "/(tabs)/ai-dev" },
      ],
    },
    {
      title: "Account",
      items: [
        { id: "notifications", icon: "notifications-outline", label: "Notifications", sublabel: "Push alerts for classes & exams", color: "#6366f1" },
        { id: "language", icon: "language-outline", label: "Language / اللغة", sublabel: "English · العربية", color: "#059669" },
        { id: "logout", icon: "log-out-outline", label: "Sign Out", sublabel: "End your session", color: colors.destructive, danger: true, action: handleLogout },
      ],
    },
  ];

  const tap = async (item: Item) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.action) { item.action(); return; }
    if (item.route) { router.push(item.route as any); }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    userRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 2 },
    sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 22, marginLeft: 2 },
    item: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: colors.card, borderRadius: colors.radius, marginBottom: 8, borderWidth: 1, borderColor: colors.border, gap: 14 },
    iconBox: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.userRow}>
          <View style={[s.avatar, { backgroundColor: `${roleColor}22`, borderColor: `${roleColor}44` }]}>
            <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: roleColor }}>
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "G"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground }}>
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1 }}>
              {user?.email ?? ""}
            </Text>
            <View style={{ marginTop: 5, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, backgroundColor: `${roleColor}22` }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: roleColor }}>
                {ROLE_LABEL[user?.role ?? "student"]}
              </Text>
            </View>
          </View>
          <LinearGradient colors={["#c47d00", "#f0a500"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#080f22" }}>B44</Text>
          </LinearGradient>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={{ paddingHorizontal: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}>
          {SECTIONS.map((section) => (
            <View key={section.title}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              {section.items.map((item) => (
                <Pressable key={item.id} style={({ pressed }) => [s.item, { opacity: pressed ? 0.75 : 1 }]} onPress={() => tap(item)}>
                  <View style={[s.iconBox, { backgroundColor: `${item.color}22` }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.danger ? colors.destructive : item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: "Inter_500Medium", color: item.danger ? colors.destructive : colors.foreground }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                      {item.sublabel}
                    </Text>
                  </View>
                  {item.badge ? (
                    <View style={[s.badge, { backgroundColor: `${item.color}22` }]}>
                      <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: item.color }}>{item.badge}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={15} color={colors.mutedForeground} />
                  )}
                </Pressable>
              ))}
            </View>
          ))}
          <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>
            Britishce44 · المركز البريطاني الأول{"\n"}Platform v2.1 · Taiz, Yemen · Est. 2020
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
