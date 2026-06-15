import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useNotifications } from "@/hooks/useNotifications";

const REPL_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";

const CLASSROOMS = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  number: i + 1,
  name: [
    "English Foundation", "Intermediate English", "Advanced Conversation",
    "Business English", "IELTS Preparation", "Cambridge B1",
    "Cambridge B2", "Grammar & Writing", "Listening Skills",
    "Pronunciation Lab", "English for Kids", "Teen English",
    "Academic Writing", "Speaking Club", "TOEFL Prep",
    "English Literature", "Vocabulary Builder", "Reading Comprehension",
    "Debate & Discussion", "Phonics for Beginners", "English Drama",
    "Digital English", "English for Travel", "Corporate English",
  ][i],
  teacher: [
    "Mr. Ahmed Al-Shami", "Ms. Fatima Hassan", "Dr. Omar Nasser",
    "Mrs. Sara Al-Yemeni", "Mr. Khalid Ibrahim", "Ms. Nour Mahmoud",
  ][i % 6],
  level: ["A1", "A2", "B1", "B2", "C1", "C2"][i % 6],
  status: (["live", "scheduled", "offline", "live", "scheduled", "offline"][i % 6]) as "live" | "scheduled" | "offline",
  students: Math.floor(Math.random() * 25 + 5),
  startTime: ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"][i % 6],
}));

const STATUS_CONFIG = {
  live: { label: "Live", color: "#059669", bg: "#05966922", icon: "radio-button-on" as const },
  scheduled: { label: "Scheduled", color: "#6366f1", bg: "#6366f122", icon: "time" as const },
  offline: { label: "Offline", color: "#6b7fa3", bg: "#6b7fa322", icon: "ellipse-outline" as const },
};

const FILTERS = ["All", "Live", "Scheduled", "Offline"];

function ClassroomCard({
  item,
  onJoin,
  onRemind,
  onViewCompanion,
}: {
  item: (typeof CLASSROOMS)[0];
  onJoin: (item: (typeof CLASSROOMS)[0]) => void;
  onRemind: (item: (typeof CLASSROOMS)[0]) => void;
  onViewCompanion: (item: (typeof CLASSROOMS)[0]) => void;
}) {
  const colors = useColors();
  const status = STATUS_CONFIG[item.status];

  return (
    <Pressable
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderRadius: colors.radius,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: item.status === "live" ? "#05966944" : colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <View style={{ backgroundColor: `${colors.primary}22`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.primary }}>
                Room {item.number}
              </Text>
            </View>
            <View style={{ backgroundColor: "#6366f122", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#6366f1" }}>{item.level}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
            {item.teacher}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: status.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Ionicons name={status.icon} size={10} color={status.color} />
            <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: status.color }}>{status.label}</Text>
          </View>
          {item.status === "live" && (
            <View style={{ gap: 6, alignItems: "flex-end" }}>
              <Pressable
                style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}
                onPress={() => onJoin(item)}
              >
                <Ionicons name="videocam" size={13} color={colors.primaryForeground} />
                <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: colors.primaryForeground }}>Join</Text>
              </Pressable>
              <Pressable
                style={{ backgroundColor: "transparent", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.border }}
                onPress={() => onViewCompanion(item)}
              >
                <Ionicons name="chatbubbles-outline" size={12} color={colors.mutedForeground} />
                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>Chat</Text>
              </Pressable>
            </View>
          )}
          {item.status === "scheduled" && (
            <Pressable
              style={{ backgroundColor: "transparent", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.border }}
              onPress={() => onRemind(item)}
            >
              <Ionicons name="notifications-outline" size={13} color={colors.mutedForeground} />
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>Remind</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.students} students</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.startTime}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ClassroomsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("All");
  const { scheduleClassReminder, sendImmediateNotification, permissionStatus, requestPermissions } = useNotifications();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = activeFilter === "All"
    ? CLASSROOMS
    : CLASSROOMS.filter(c => c.status === activeFilter.toLowerCase());

  const liveCount = CLASSROOMS.filter(c => c.status === "live").length;

  async function handleJoin(item: (typeof CLASSROOMS)[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const webUrl = REPL_DOMAIN
      ? `https://${REPL_DOMAIN}/`
      : "https://britishce44.replit.app/";
    await WebBrowser.openBrowserAsync(webUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
    if (permissionStatus === "granted") {
      await sendImmediateNotification(
        "You joined a classroom 🎓",
        `${item.name} session with ${item.teacher}. Tap to return.`,
        { type: "classroom", id: item.id, name: item.name }
      );
    }
  }

  function handleViewCompanion(item: (typeof CLASSROOMS)[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/(tabs)/classroom-room", params: { id: item.id, name: item.name } });
  }

  async function handleRemind(item: (typeof CLASSROOMS)[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (permissionStatus !== "granted") {
      const ok = await requestPermissions();
      if (!ok) return;
    }
    await scheduleClassReminder(item.id, item.name, 5);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Classrooms</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {liveCount} live now · 240 total
            </Text>
          </View>
          <View style={{ backgroundColor: "#05966922", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="radio-button-on" size={10} color="#059669" />
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#059669" }}>{liveCount} Live</Text>
          </View>
        </View>

        {/* Notification permission prompt */}
        {permissionStatus === "undetermined" && (
          <Pressable
            onPress={requestPermissions}
            style={{ marginBottom: 12, backgroundColor: colors.primary + "15", borderRadius: 10, padding: 10, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.primary + "33" }}
          >
            <Ionicons name="notifications-outline" size={16} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
              Enable notifications for class reminders
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primary }}>Enable</Text>
          </Pressable>
        )}

        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTERS.map(f => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: activeFilter === f ? colors.primary : colors.surface2,
                borderWidth: 1,
                borderColor: activeFilter === f ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: activeFilter === f ? colors.primaryForeground : colors.mutedForeground }}>
                {f}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ClassroomCard item={item} onJoin={handleJoin} onRemind={handleRemind} onViewCompanion={handleViewCompanion} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="school-outline" size={48} color={colors.mutedForeground} />
            <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginTop: 12 }}>No classrooms found</Text>
          </View>
        }
      />
    </View>
  );
}
