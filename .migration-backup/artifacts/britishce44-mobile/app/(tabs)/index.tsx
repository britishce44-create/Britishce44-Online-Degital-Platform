import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
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

const KPI_CARDS = [
  { label: "Students", value: "1,247", icon: "people" as const, color: "#6366f1", trend: "+12%" },
  { label: "Classrooms", value: "240", icon: "school" as const, color: "#f0a500", trend: "40 Live" },
  { label: "Exams Today", value: "8", icon: "clipboard" as const, color: "#059669", trend: "3 Active" },
  { label: "Messages", value: "34", icon: "chatbubbles" as const, color: "#e11d48", trend: "Unread" },
];

const QUICK_ACTIONS = [
  { label: "Join Class", icon: "videocam" as const, color: "#6366f1", tab: "classrooms" },
  { label: "Take Exam", icon: "document-text" as const, color: "#f0a500", tab: "exams" },
  { label: "Messages", icon: "chatbubbles" as const, color: "#059669", tab: "messages" },
  { label: "My Profile", icon: "person" as const, color: "#7c3aed", tab: "profile" },
];

const ANNOUNCEMENTS = [
  {
    id: "1",
    title: "New Academic Term Starting",
    body: "Spring 2026 term begins Jan 15. All classes resume as scheduled.",
    time: "2h ago",
    type: "info",
  },
  {
    id: "2",
    title: "Exam Week — Feb 3–7",
    body: "Final exams for all levels. Check your schedule in the Exam tab.",
    time: "1d ago",
    type: "warning",
  },
  {
    id: "3",
    title: "AI Platform Update",
    body: "New AI tutoring features live. Try the AI Teacher Evaluation tool.",
    time: "2d ago",
    type: "success",
  },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Platform Admin",
  supervisor: "Supervisor",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

const ROLE_COLOR: Record<string, string> = {
  admin: "#f0a500",
  supervisor: "#6366f1",
  teacher: "#059669",
  student: "#0891b2",
  parent: "#7c3aed",
};

function KpiCard({ item }: { item: (typeof KPI_CARDS)[0] }) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: colors.radius,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        width: 156,
        marginRight: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={item.icon} size={18} color={item.color} />
        </View>
        <View style={{ backgroundColor: `${item.color}18`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 10, color: item.color, fontFamily: "Inter_600SemiBold" }}>{item.trend}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: colors.foreground, marginTop: 10 }}>
        {item.value}
      </Text>
      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
        {item.label}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = user?.role ?? "student";
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const typeColor: Record<string, string> = { info: colors.indigo, warning: colors.gold, success: colors.emerald };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: topPad + 16,
        paddingHorizontal: 20,
        paddingBottom: 18,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Welcome back</Text>
            <Text style={{ fontSize: 21, fontFamily: "Inter_700Bold", color: colors.foreground, marginTop: 2 }}>
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${ROLE_COLOR[role]}22` }}>
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: ROLE_COLOR[role] }}>
                {ROLE_LABEL[role]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        {/* KPI Cards */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Platform Overview
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
            {KPI_CARDS.map(item => <KpiCard key={item.label} item={item} />)}
            <View style={{ width: 8 }} />
          </ScrollView>
        </View>

        {/* Quick Access */}
        <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Quick Access
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {QUICK_ACTIONS.map(action => (
              <Pressable
                key={action.label}
                style={({ pressed }) => ({
                  width: "47%",
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  padding: 16,
                  flexDirection: "row" as const,
                  alignItems: "center" as const,
                  gap: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                })}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/(tabs)/${action.tab}` as any);
                }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${action.color}22`, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Announcements */}
        <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Announcements
          </Text>
          {ANNOUNCEMENTS.map(a => (
            <View key={a.id} style={{ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 12 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: typeColor[a.type] }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 }}>{a.title}</Text>
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 19 }}>{a.body}</Text>
                <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 6 }}>{a.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
}
