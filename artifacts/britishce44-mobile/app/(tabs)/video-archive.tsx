import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const VIDEOS = [
  { id: "1", title: "Cambridge B2 — Conditionals & Modals", teacher: "Suhair Almojahid", subject: "Cambridge B2", duration: "52:14", date: "Jan 15, 2026", views: 234, size: "1.2 GB" },
  { id: "2", title: "IELTS Reading: Paragraph Matching", teacher: "Dr. Omar Nasser", subject: "IELTS Prep", duration: "48:30", date: "Jan 14, 2026", views: 189, size: "980 MB" },
  { id: "3", title: "Business English — Emails & Reports", teacher: "Mr. Ahmed Al-Shami", subject: "Business English", duration: "61:05", date: "Jan 13, 2026", views: 145, size: "1.4 GB" },
  { id: "4", title: "Grammar: Present Perfect vs Past Simple", teacher: "Ms. Fatima Hassan", subject: "Foundation", duration: "44:22", date: "Jan 12, 2026", views: 312, size: "890 MB" },
  { id: "5", title: "TOEFL Integrated Writing Task", teacher: "Mr. Khalid Ibrahim", subject: "TOEFL Prep", duration: "55:41", date: "Jan 11, 2026", views: 98, size: "1.1 GB" },
  { id: "6", title: "Pronunciation: /th/ and /v/ Sounds", teacher: "Mrs. Sara Al-Yemeni", subject: "Pronunciation Lab", duration: "38:17", date: "Jan 10, 2026", views: 267, size: "760 MB" },
  { id: "7", title: "Teen English — Debate Practice", teacher: "Ms. Nour Mahmoud", subject: "Teen English", duration: "42:59", date: "Jan 9, 2026", views: 178, size: "840 MB" },
  { id: "8", title: "Academic Writing: Essay Structure", teacher: "Dr. Omar Nasser", subject: "Academic Writing", duration: "67:13", date: "Jan 8, 2026", views: 201, size: "1.5 GB" },
];

const SUBJECT_COLORS: Record<string, string> = {
  "Cambridge B2": "#6366f1", "IELTS Prep": "#f0a500", "Business English": "#0891b2",
  Foundation: "#059669", "TOEFL Prep": "#7c3aed", "Pronunciation Lab": "#d97706",
  "Teen English": "#e11d48", "Academic Writing": "#6366f1",
};

function VideoCard({ item }: { item: (typeof VIDEOS)[0] }) {
  const colors = useColors();
  const subjectColor = SUBJECT_COLORS[item.subject] ?? "#6b7fa3";

  return (
    <Pressable
      style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      {/* Thumbnail placeholder */}
      <View style={{ height: 120, borderRadius: 10, backgroundColor: `${subjectColor}18`, alignItems: "center", justifyContent: "center", marginBottom: 14, position: "relative", overflow: "hidden", borderWidth: 1, borderColor: `${subjectColor}30` }}>
        <Ionicons name="play-circle" size={52} color={subjectColor} />
        <View style={{ position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ffffff" }}>{item.duration}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
        <View style={{ backgroundColor: `${subjectColor}22`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: subjectColor }}>{item.subject}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 }}>{item.title}</Text>
      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 12 }}>{item.teacher}</Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.date}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="eye-outline" size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.views}</Text>
          </View>
        </View>
        <Pressable
          style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${subjectColor}22`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <Ionicons name="play" size={13} color={subjectColor} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: subjectColor }}>Watch</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function VideoArchiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Video Archive</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {VIDEOS.length} recordings · 240+ sessions total
            </Text>
          </View>
          <View style={{ backgroundColor: "#7c3aed22", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="videocam-outline" size={12} color="#7c3aed" />
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7c3aed" }}>240+</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={VIDEOS}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <VideoCard item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
