import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type AlertLevel = "clean" | "warning" | "violation";

const SESSIONS = [
  { id: "1", student: "Ahmed Hassan Ali", exam: "Cambridge B2 Mock Exam", started: "9:05 AM", elapsed: "42 min", status: "clean" as AlertLevel, flags: 0, tabSwitch: 0, faceDetected: true },
  { id: "2", student: "Mohammed Yahya Saleh", exam: "Foundation Level Test", started: "9:02 AM", elapsed: "45 min", status: "warning" as AlertLevel, flags: 2, tabSwitch: 1, faceDetected: true },
  { id: "3", student: "Nadia Hassan Qasim", exam: "Cambridge B2 Mock Exam", started: "9:00 AM", elapsed: "47 min", status: "clean" as AlertLevel, flags: 0, tabSwitch: 0, faceDetected: true },
  { id: "4", student: "Abdulrahman Muthana", exam: "Business English Cert.", started: "9:10 AM", elapsed: "37 min", status: "violation" as AlertLevel, flags: 5, tabSwitch: 3, faceDetected: false },
  { id: "5", student: "Khadija Al-Shami", exam: "Cambridge B1 Placement", started: "9:08 AM", elapsed: "39 min", status: "warning" as AlertLevel, flags: 1, tabSwitch: 0, faceDetected: true },
  { id: "6", student: "Fatima Omar Nasser", exam: "IELTS Academic Practice", started: "9:01 AM", elapsed: "46 min", status: "clean" as AlertLevel, flags: 0, tabSwitch: 0, faceDetected: true },
];

const ALERT_CFG: Record<AlertLevel, { label: string; color: string; bg: string; icon: string }> = {
  clean: { label: "Clean", color: "#059669", bg: "#05966922", icon: "shield-checkmark-outline" },
  warning: { label: "Warning", color: "#f0a500", bg: "#f0a50022", icon: "warning-outline" },
  violation: { label: "Violation", color: "#e11d48", bg: "#e11d4822", icon: "alert-circle-outline" },
};

function SessionCard({ item }: { item: (typeof SESSIONS)[0] }) {
  const colors = useColors();
  const cfg = ALERT_CFG[item.status];
  return (
    <Pressable
      style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: colors.radius, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: item.status === "violation" ? "#e11d4844" : item.status === "warning" ? "#f0a50044" : colors.border, opacity: pressed ? 0.85 : 1 })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 }}>{item.student}</Text>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.exam}</Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Started {item.started}</Text>
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>· {item.elapsed}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: 8, padding: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: item.flags > 0 ? "#e11d48" : "#059669" }}>{item.flags}</Text>
          <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Flags</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: 8, padding: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: item.tabSwitch > 0 ? "#f0a500" : "#059669" }}>{item.tabSwitch}</Text>
          <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Tab Switches</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: 8, padding: 8, alignItems: "center" }}>
          <Ionicons name={item.faceDetected ? "eye" : "eye-off"} size={18} color={item.faceDetected ? "#059669" : "#e11d48"} />
          <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>Face</Text>
        </View>
        <Pressable style={{ flex: 1, backgroundColor: "#e11d4822", borderRadius: 8, padding: 8, alignItems: "center", justifyContent: "center" }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}>
          <Ionicons name="stop-circle-outline" size={18} color="#e11d48" />
          <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#e11d48", marginTop: 2 }}>Terminate</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function AnticheatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState<"all" | AlertLevel>("all");
  const filtered = filter === "all" ? SESSIONS : SESSIONS.filter(s => s.status === filter);
  const violations = SESSIONS.filter(s => s.status === "violation").length;
  const warnings = SESSIONS.filter(s => s.status === "warning").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Exam Monitor</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {SESSIONS.length} active · {violations} violations · {warnings} warnings
            </Text>
          </View>
          {violations > 0 && (
            <View style={{ backgroundColor: "#e11d4822", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="alert-circle" size={12} color="#e11d48" />
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#e11d48" }}>{violations}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["all", "clean", "warning", "violation"] as const).map(f => (
            <Pressable key={f} onPress={() => setFilter(f)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: filter === f ? colors.primary : colors.surface2, borderWidth: 1, borderColor: filter === f ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: filter === f ? colors.primaryForeground : colors.mutedForeground, textTransform: "capitalize" }}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={({ item }) => <SessionCard item={item} />} contentContainerStyle={{ padding: 14, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }} showsVerticalScrollIndicator={false} />
    </View>
  );
}
