import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type SessionType = "tutoring" | "study-group" | "office-hours" | "review";

const ACADEMIC_SESSIONS = [
  { id: "1", title: "1:1 Tutoring — Conditional Sentences", type: "tutoring" as SessionType, tutor: "Suhair Almojahid", subject: "Cambridge B2", time: "Today 3:00 PM", duration: "60 min", slots: 1, booked: true },
  { id: "2", title: "IELTS Writing Study Group", type: "study-group" as SessionType, tutor: "Dr. Omar Nasser", subject: "IELTS Prep", time: "Today 5:00 PM", duration: "90 min", slots: 6, booked: false },
  { id: "3", title: "Grammar Office Hours", type: "office-hours" as SessionType, tutor: "Ms. Fatima Hassan", subject: "Foundation", time: "Tomorrow 10:00 AM", duration: "30 min", slots: 3, booked: false },
  { id: "4", title: "Exam Review — Past Papers", type: "review" as SessionType, tutor: "Mr. Khalid Ibrahim", subject: "TOEFL Prep", time: "Tomorrow 2:00 PM", duration: "120 min", slots: 12, booked: false },
  { id: "5", title: "Pronunciation Clinic", type: "tutoring" as SessionType, tutor: "Mrs. Sara Al-Yemeni", subject: "Speaking", time: "Jan 22 11:00 AM", duration: "45 min", slots: 1, booked: false },
  { id: "6", title: "Cambridge B1 Study Group", type: "study-group" as SessionType, tutor: "Ms. Nour Mahmoud", subject: "Cambridge B1", time: "Jan 23 4:00 PM", duration: "60 min", slots: 8, booked: false },
];

const TYPE_CFG: Record<SessionType, { label: string; color: string; icon: string }> = {
  tutoring: { label: "1:1 Tutoring", color: "#6366f1", icon: "person" },
  "study-group": { label: "Study Group", color: "#059669", icon: "people" },
  "office-hours": { label: "Office Hours", color: "#f0a500", icon: "time" },
  review: { label: "Exam Review", color: "#e11d48", icon: "document-text" },
};

const TYPE_FILTERS = [{ key: "all", label: "All" }, { key: "tutoring", label: "1:1" }, { key: "study-group", label: "Groups" }, { key: "office-hours", label: "Office" }, { key: "review", label: "Review" }];

function SessionCard({ item }: { item: (typeof ACADEMIC_SESSIONS)[0] }) {
  const colors = useColors();
  const cfg = TYPE_CFG[item.type];
  return (
    <Pressable style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: item.booked ? `${cfg.color}44` : colors.border, opacity: pressed ? 0.85 : 1 })} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
            <View style={{ backgroundColor: `${cfg.color}22`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: cfg.color }}>{cfg.label}</Text>
            </View>
            {item.booked && (
              <View style={{ backgroundColor: "#05966922", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#059669" }}>Booked</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 3 }}>{item.title}</Text>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.tutor} · {item.subject}</Text>
        </View>
        {!item.booked ? (
          <Pressable style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: colors.primaryForeground }}>Book</Text>
          </Pressable>
        ) : (
          <Pressable style={{ backgroundColor: "#6366f122", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#6366f1" }}>Join</Text>
          </Pressable>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.time}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.duration}</Text>
        </View>
        {item.slots > 1 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="people-outline" size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.slots} seats</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function AcademicRoomScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const filtered = filter === "all" ? ACADEMIC_SESSIONS : ACADEMIC_SESSIONS.filter(s => s.type === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Academic Room</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>Tutoring, study groups & office hours</Text>
          </View>
          <View style={{ backgroundColor: "#6366f122", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="school-outline" size={12} color="#6366f1" />
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#6366f1" }}>{ACADEMIC_SESSIONS.filter(s => s.booked).length} booked</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TYPE_FILTERS.map(f => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: filter === f.key ? colors.primary : colors.surface2, borderWidth: 1, borderColor: filter === f.key ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: filter === f.key ? colors.primaryForeground : colors.mutedForeground }}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={({ item }) => <SessionCard item={item} />} contentContainerStyle={{ padding: 14, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }} showsVerticalScrollIndicator={false} />
    </View>
  );
}
