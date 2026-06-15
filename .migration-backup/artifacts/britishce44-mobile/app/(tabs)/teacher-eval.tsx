import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const TEACHERS = [
  { id: "1", name: "Suhair Almojahid", subject: "Cambridge B2 · Advanced", score: 96, punctuality: 98, engagement: 95, completion: 97, classes: 48, students: 312, trend: "+2" },
  { id: "2", name: "Dr. Omar Nasser", subject: "IELTS Prep · Reading", score: 92, punctuality: 94, engagement: 91, completion: 93, classes: 36, students: 189, trend: "+1" },
  { id: "3", name: "Ms. Fatima Hassan", subject: "English Foundation", score: 89, punctuality: 92, engagement: 88, completion: 88, classes: 52, students: 267, trend: "0" },
  { id: "4", name: "Mr. Ahmed Al-Shami", subject: "Business English · B2", score: 94, punctuality: 96, engagement: 93, completion: 95, classes: 31, students: 134, trend: "+3" },
  { id: "5", name: "Mrs. Sara Al-Yemeni", subject: "Teen English · Speaking", score: 87, punctuality: 90, engagement: 86, completion: 85, classes: 44, students: 247, trend: "-1" },
  { id: "6", name: "Ms. Nour Mahmoud", subject: "Vocabulary · Grammar", score: 91, punctuality: 93, engagement: 90, completion: 91, classes: 29, students: 98, trend: "+2" },
];

function ScoreBadge({ value }: { value: number }) {
  const color = value >= 95 ? "#059669" : value >= 88 ? "#f0a500" : "#e11d48";
  return (
    <View style={{ alignItems: "center", backgroundColor: `${color}22`, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color }}>{value}</Text>
      <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color, marginTop: 1 }}>SCORE</Text>
    </View>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 4 }}>{label}</Text>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border }}>
        <View style={{ height: "100%", width: `${value}%`, backgroundColor: color, borderRadius: 2 }} />
      </View>
      <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color, marginTop: 3 }}>{value}%</Text>
    </View>
  );
}

function TeacherCard({ item, rank }: { item: (typeof TEACHERS)[0]; rank: number }) {
  const colors = useColors();
  const rankColor = rank === 1 ? "#f0a500" : rank === 2 ? "#6b7fa3" : rank === 3 ? "#d97706" : colors.mutedForeground;

  return (
    <Pressable
      style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: rank <= 3 ? `${rankColor}44` : colors.border, opacity: pressed ? 0.85 : 1 })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${rankColor}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: `${rankColor}44` }}>
            <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: rankColor }}>#{rank}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 }} numberOfLines={1}>{item.name}</Text>
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: Number(item.trend) > 0 ? "#059669" : Number(item.trend) < 0 ? "#e11d48" : colors.mutedForeground }}>
                {Number(item.trend) > 0 ? "↑" : Number(item.trend) < 0 ? "↓" : "—"}{item.trend !== "0" ? item.trend.replace("-", "") : ""}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.subject}</Text>
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {item.classes} classes · {item.students} students
            </Text>
          </View>
        </View>
        <ScoreBadge value={item.score} />
      </View>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <MiniBar label="Punctuality" value={item.punctuality} color="#6366f1" />
        <MiniBar label="Engagement" value={item.engagement} color="#f0a500" />
        <MiniBar label="Completion" value={item.completion} color="#059669" />
      </View>
    </Pressable>
  );
}

export default function TeacherEvalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const sorted = [...TEACHERS].sort((a, b) => b.score - a.score);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Teacher Evaluation</Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
          AI-powered ratings · {TEACHERS.length} teachers ranked
        </Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={i => i.id}
        renderItem={({ item, index }) => <TeacherCard item={item} rank={index + 1} />}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
