import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STUDENTS = [
  { id: "1", name: "Ahmed Hassan Ali", grade: "Cambridge B2", attendance: 96, homework: 88, score: 82, activity: "high" as const },
  { id: "2", name: "Fatima Omar Nasser", grade: "IELTS Prep", attendance: 92, homework: 95, score: 91, activity: "high" as const },
  { id: "3", name: "Mohammed Yahya Saleh", grade: "Foundation A1", attendance: 78, homework: 72, score: 74, activity: "medium" as const },
  { id: "4", name: "Nadia Hassan Qasim", grade: "Teen English", attendance: 100, homework: 100, score: 97, activity: "high" as const },
  { id: "5", name: "Abdulrahman Muthana", grade: "Business English", attendance: 65, homework: 60, score: 68, activity: "low" as const },
  { id: "6", name: "Khadija Al-Shami", grade: "Cambridge B1", attendance: 89, homework: 84, score: 87, activity: "medium" as const },
  { id: "7", name: "Omar Fares Al-Hamdani", grade: "TOEFL Prep", attendance: 94, homework: 91, score: 89, activity: "high" as const },
  { id: "8", name: "Sara Khalid Ibrahim", grade: "Vocab Builder", attendance: 71, homework: 75, score: 72, activity: "low" as const },
];

const ACTIVITY_CFG = {
  high: { label: "High", color: "#059669", bg: "#05966922" },
  medium: { label: "Medium", color: "#f0a500", bg: "#f0a50022" },
  low: { label: "Low", color: "#e11d48", bg: "#e11d4822" },
};

const DAY_FILTERS = ["Today", "This Week", "This Month"];

function MiniBar({ pct, color }: { pct: number; color: string }) {
  const colors = useColors();
  return (
    <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden", flex: 1 }}>
      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

function StudentRow({ item }: { item: (typeof STUDENTS)[0] }) {
  const colors = useColors();
  const act = ACTIVITY_CFG[item.activity];
  const avg = Math.round((item.attendance + item.homework + item.score) / 3);
  const avgColor = avg >= 85 ? "#059669" : avg >= 70 ? "#f0a500" : "#e11d48";

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: colors.radius, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{item.name}</Text>
            <View style={{ backgroundColor: act.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 9, fontFamily: "Inter_600SemiBold", color: act.color }}>{act.label}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.grade}</Text>
        </View>
        <View style={{ alignItems: "center", backgroundColor: `${avgColor}22`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: avgColor }}>{avg}</Text>
          <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: avgColor }}>AVG</Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {[
          { label: "Attendance", value: item.attendance, color: "#6366f1" },
          { label: "Homework", value: item.homework, color: "#f0a500" },
          { label: "Score", value: item.score, color: "#059669" },
        ].map(m => (
          <View key={m.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, width: 72 }}>{m.label}</Text>
            <MiniBar pct={m.value} color={m.color} />
            <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: m.color, width: 32, textAlign: "right" }}>{m.value}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function DailyPerfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState("Today");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const highCount = STUDENTS.filter(s => s.activity === "high").length;
  const lowCount = STUDENTS.filter(s => s.activity === "low").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Daily Performance</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {highCount} high · {lowCount} need attention
            </Text>
          </View>
          {lowCount > 0 && (
            <View style={{ backgroundColor: "#e11d4822", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="alert-circle-outline" size={12} color="#e11d48" />
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#e11d48" }}>{lowCount} Alert</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DAY_FILTERS.map(f => (
            <Pressable key={f} onPress={() => setPeriod(f)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: period === f ? colors.primary : colors.surface2, borderWidth: 1, borderColor: period === f ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: period === f ? colors.primaryForeground : colors.mutedForeground }}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={STUDENTS}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <StudentRow item={item} />}
        contentContainerStyle={{ padding: 14, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
