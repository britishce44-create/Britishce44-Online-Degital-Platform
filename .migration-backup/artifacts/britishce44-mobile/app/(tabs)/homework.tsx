import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type HWStatus = "pending" | "submitted" | "graded" | "late";

const HW_DATA: Array<{
  id: string; title: string; subject: string; teacher: string;
  due: string; status: HWStatus; grade?: number; points: number;
}> = [
  { id: "1", title: "Essay: The Industrial Revolution", subject: "History", teacher: "Mr. Ahmed Al-Shami", due: "Today 11:59 PM", status: "pending", points: 20 },
  { id: "2", title: "Grammar Exercise Set B", subject: "English Foundation", teacher: "Ms. Fatima Hassan", due: "Tomorrow 3:00 PM", status: "pending", points: 15 },
  { id: "3", title: "Reading Comprehension Ch. 7", subject: "Advanced English", teacher: "Dr. Omar Nasser", due: "Jan 22", status: "submitted", points: 10 },
  { id: "4", title: "Vocabulary Worksheet Unit 5", subject: "Vocabulary Builder", teacher: "Ms. Nour Mahmoud", due: "Jan 20", status: "graded", grade: 92, points: 10 },
  { id: "5", title: "Cambridge B2 Past Paper", subject: "Cambridge B2", teacher: "Mr. Khalid Ibrahim", due: "Jan 18", status: "graded", grade: 85, points: 30 },
  { id: "6", title: "Speaking Practice — Self Recording", subject: "Conversation", teacher: "Mrs. Sara Al-Yemeni", due: "Jan 15", status: "late", points: 15 },
];

const STATUS_CONFIG: Record<HWStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: "Pending", color: "#d97706", bg: "#d9770622", icon: "time-outline" },
  submitted: { label: "Submitted", color: "#6366f1", bg: "#6366f122", icon: "checkmark-circle-outline" },
  graded: { label: "Graded", color: "#059669", bg: "#05966922", icon: "ribbon-outline" },
  late: { label: "Late", color: "#e11d48", bg: "#e11d4822", icon: "alert-circle-outline" },
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Due" },
  { key: "submitted", label: "Submitted" },
  { key: "graded", label: "Graded" },
];

function HWCard({ item }: { item: (typeof HW_DATA)[0] }) {
  const colors = useColors();
  const cfg = STATUS_CONFIG[item.status];
  return (
    <Pressable
      style={({ pressed }) => ({
        backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: item.status === "pending" ? "#d9770640" : colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
            <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: cfg.color }}>{cfg.label}</Text>
            </View>
            <View style={{ backgroundColor: `${colors.primary}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.primary }}>{item.points} pts</Text>
            </View>
          </View>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 3 }}>{item.title}</Text>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.subject} · {item.teacher}</Text>
        </View>
        {item.status === "graded" && item.grade !== undefined && (
          <View style={{ alignItems: "center", backgroundColor: item.grade >= 80 ? "#05966922" : "#f0a50022", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: item.grade >= 80 ? "#059669" : "#f0a500" }}>{item.grade}</Text>
            <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>SCORE</Text>
          </View>
        )}
        {item.status === "pending" && (
          <Pressable
            style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: colors.primaryForeground }}>Submit</Text>
          </Pressable>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "center" }}>
        <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: item.status === "pending" ? "#d97706" : colors.mutedForeground }}>
          Due: {item.due}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeworkScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const filtered = filter === "all" ? HW_DATA : HW_DATA.filter(h => h.status === filter);
  const pendingCount = HW_DATA.filter(h => h.status === "pending").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Homework</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {pendingCount} assignments due
            </Text>
          </View>
          {pendingCount > 0 && (
            <View style={{ backgroundColor: "#d9770622", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="time-outline" size={12} color="#d97706" />
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#d97706" }}>{pendingCount} Due</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTERS.map(f => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: filter === f.key ? colors.primary : colors.surface2, borderWidth: 1, borderColor: filter === f.key ? colors.primary : colors.border }}
            >
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: filter === f.key ? colors.primaryForeground : colors.mutedForeground }}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <HWCard item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="book-outline" size={48} color={colors.mutedForeground} />
            <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginTop: 12 }}>No homework found</Text>
          </View>
        }
      />
    </View>
  );
}
