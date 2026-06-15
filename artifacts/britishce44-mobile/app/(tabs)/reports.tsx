import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const REPORTS = [
  { id: "1", title: "Monthly Performance Summary", type: "Performance", period: "January 2026", students: 1247, status: "ready", format: "PDF" },
  { id: "2", title: "Teacher Attendance & Punctuality", type: "Attendance", period: "January 2026", students: 42, status: "ready", format: "Excel" },
  { id: "3", title: "Exam Results Analysis — Q4 2025", type: "Exam", period: "Q4 2025", students: 1247, status: "ready", format: "PDF" },
  { id: "4", title: "Student Progress Tracker", type: "Progress", period: "January 2026", students: 1247, status: "generating", format: "PDF" },
  { id: "5", title: "Financial Revenue Summary", type: "Finance", period: "January 2026", students: 0, status: "ready", format: "Excel" },
  { id: "6", title: "Enrollment & Dropout Report", type: "Enrollment", period: "Q4 2025", students: 1247, status: "ready", format: "PDF" },
  { id: "7", title: "Parent Communication Log", type: "Communication", period: "January 2026", students: 834, status: "ready", format: "PDF" },
  { id: "8", title: "AI Evaluation Summary Report", type: "AI", period: "January 2026", students: 42, status: "generating", format: "PDF" },
];

const TYPE_COLORS: Record<string, string> = {
  Performance: "#6366f1", Attendance: "#059669", Exam: "#f0a500",
  Progress: "#0891b2", Finance: "#d97706", Enrollment: "#7c3aed",
  Communication: "#e11d48", AI: "#059669",
};

function ReportCard({ item }: { item: (typeof REPORTS)[0] }) {
  const colors = useColors();
  const typeColor = TYPE_COLORS[item.type] ?? "#6b7fa3";
  const isReady = item.status === "ready";

  return (
    <Pressable
      style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
            <View style={{ backgroundColor: `${typeColor}22`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: typeColor }}>{item.type}</Text>
            </View>
            <View style={{ backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>{item.format}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 3 }}>{item.title}</Text>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.period}</Text>
        </View>
        {isReady ? (
          <Pressable
            style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 5 }}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <Ionicons name="download-outline" size={14} color={colors.primaryForeground} />
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: colors.primaryForeground }}>Export</Text>
          </Pressable>
        ) : (
          <View style={{ backgroundColor: "#6366f122", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="sync-outline" size={14} color="#6366f1" />
            <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#6366f1" }}>Generating</Text>
          </View>
        )}
      </View>
      {item.students > 0 && (
        <View style={{ flexDirection: "row", gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "center" }}>
          <Ionicons name="people-outline" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.students.toLocaleString()} records</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const readyCount = REPORTS.filter(r => r.status === "ready").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Reports</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {readyCount} reports ready · {REPORTS.length - readyCount} generating
            </Text>
          </View>
          <View style={{ backgroundColor: "#05966922", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="document-text-outline" size={12} color="#059669" />
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#059669" }}>{readyCount} Ready</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={REPORTS}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <ReportCard item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
