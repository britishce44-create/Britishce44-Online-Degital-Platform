import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type TestStatus = "available" | "in-progress" | "completed";

const PLACEMENT_TESTS = [
  { id: "1", title: "General English Placement", description: "Assess overall English proficiency from A1 to C2", level: "A1–C2", duration: "45 min", questions: 60, status: "completed" as TestStatus, result: "B2 — Upper Intermediate", score: 78 },
  { id: "2", title: "IELTS Band Predictor", description: "Estimate your IELTS Academic band score", level: "B1–C2", duration: "30 min", questions: 40, status: "available" as TestStatus },
  { id: "3", title: "Cambridge Level Check", description: "Identify your Cambridge exam readiness", level: "A2–C1", duration: "25 min", questions: 35, status: "available" as TestStatus },
  { id: "4", title: "Business English Screener", description: "Professional English for workplace contexts", level: "B1–C1", duration: "20 min", questions: 25, status: "in-progress" as TestStatus },
  { id: "5", title: "Academic Writing Diagnostic", description: "Evaluate academic writing skills", level: "B2–C2", duration: "35 min", questions: 20, status: "available" as TestStatus },
  { id: "6", title: "Speaking Confidence Assessment", description: "Self-assessment for spoken English fluency", level: "A2–C1", duration: "15 min", questions: 18, status: "available" as TestStatus },
];

const LEVEL_COLORS: Record<string, string> = {
  "A1–C2": "#6366f1", "B1–C2": "#f0a500", "A2–C1": "#059669", "B1–C1": "#0891b2", "B2–C2": "#7c3aed", "A2–C1 ": "#d97706",
};

function TestCard({ item }: { item: (typeof PLACEMENT_TESTS)[0] }) {
  const colors = useColors();
  const levelColor = LEVEL_COLORS[item.level] ?? "#6b7fa3";

  return (
    <Pressable
      style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: item.status === "in-progress" ? "#f0a50044" : colors.border, opacity: pressed ? 0.85 : 1 })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
            <View style={{ backgroundColor: `${levelColor}22`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: levelColor }}>{item.level}</Text>
            </View>
            {item.status === "in-progress" && (
              <View style={{ backgroundColor: "#f0a50022", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="sync-outline" size={9} color="#f0a500" />
                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#f0a500" }}>In Progress</Text>
              </View>
            )}
            {item.status === "completed" && (
              <View style={{ backgroundColor: "#05966922", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="checkmark-circle-outline" size={9} color="#059669" />
                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#059669" }}>Completed</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 }}>{item.title}</Text>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 18 }}>{item.description}</Text>
          {item.result && (
            <View style={{ marginTop: 8, backgroundColor: "#6366f122", borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#6366f1" }}>Result: {item.result}</Text>
            </View>
          )}
        </View>
        {item.status === "available" && (
          <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
            <LinearGradient colors={["#c47d00", "#f0a500"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#080f22" }}>Start</Text>
            </LinearGradient>
          </Pressable>
        )}
        {item.status === "in-progress" && (
          <Pressable style={{ backgroundColor: "#f0a50022", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#f0a500" }}>Continue</Text>
          </Pressable>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.duration}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="help-circle-outline" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.questions} questions</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function PlacementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const completedCount = PLACEMENT_TESTS.filter(t => t.status === "completed").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Placement Tests</Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
          {completedCount} completed · {PLACEMENT_TESTS.length - completedCount} available
        </Text>
      </View>
      <FlatList
        data={PLACEMENT_TESTS}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <TestCard item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
