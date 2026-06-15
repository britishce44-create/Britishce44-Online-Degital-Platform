import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const KPIs = [
  { label: "Active Students", value: "847", change: "+12%", up: true, icon: "people", color: "#6366f1" },
  { label: "Live Classrooms", value: "14", change: "+3", up: true, icon: "radio-button-on", color: "#059669" },
  { label: "Exams Running", value: "2", change: "0", up: true, icon: "clipboard", color: "#f0a500" },
  { label: "Avg Session", value: "48m", change: "+5m", up: true, icon: "time", color: "#0891b2" },
  { label: "Dropout Rate", value: "2.3%", change: "-0.4%", up: false, icon: "trending-down", color: "#e11d48" },
  { label: "Satisfaction", value: "94%", change: "+2%", up: true, icon: "star", color: "#d97706" },
];

const SUBJECT_STATS = [
  { subject: "Cambridge B2", students: 312, score: 88, color: "#6366f1" },
  { subject: "IELTS Prep", students: 189, score: 82, color: "#f0a500" },
  { subject: "English Foundation", students: 267, score: 79, color: "#059669" },
  { subject: "Business English", students: 134, score: 91, color: "#0891b2" },
  { subject: "TOEFL Prep", students: 98, score: 85, color: "#7c3aed" },
  { subject: "Teen English", students: 247, score: 76, color: "#d97706" },
];

function Bar({ value, color, max }: { value: number; color: string; max: number }) {
  const colors = useColors();
  const pct = value / max;
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden", flex: 1 }}>
      <View style={{ height: "100%", width: `${pct * 100}%`, backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Live Analytics</Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>Real-time platform metrics · Updated now</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Platform KPIs
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {KPIs.map(kpi => (
              <View key={kpi.label} style={{ width: "47%", backgroundColor: colors.card, borderRadius: colors.radius, padding: 14, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${kpi.color}22`, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={kpi.icon as any} size={17} color={kpi.color} />
                  </View>
                  <View style={{ backgroundColor: kpi.up ? "#05966922" : "#e11d4822", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: kpi.up ? "#059669" : "#e11d48" }}>{kpi.change}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: colors.foreground, marginTop: 8 }}>{kpi.value}</Text>
                <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, marginTop: 26 }}>
            Top Subjects by Score
          </Text>
          <View style={{ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
            {SUBJECT_STATS.map(s => (
              <View key={s.subject}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                    <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground }}>{s.subject}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{s.students} students</Text>
                    <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: s.color }}>{s.score}%</Text>
                  </View>
                </View>
                <Bar value={s.score} color={s.color} max={100} />
              </View>
            ))}
          </View>
          <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}
