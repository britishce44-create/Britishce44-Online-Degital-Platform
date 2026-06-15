import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useNotifications } from "@/hooks/useNotifications";

const REPL_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";

const CLASSROOM_DATA: Record<string, { name: string; teacher: string; subject: string; level: string; students: number }> = {
  "1": { name: "English Foundation", teacher: "Mr. Ahmed Al-Shami", subject: "Foundation A1", level: "A1", students: 18 },
  "2": { name: "Intermediate English", teacher: "Ms. Fatima Hassan", subject: "Intermediate B1", level: "B1", students: 22 },
  "3": { name: "Advanced Conversation", teacher: "Dr. Omar Nasser", subject: "Advanced C1", level: "C1", students: 12 },
  "4": { name: "Business English", teacher: "Mrs. Sara Al-Yemeni", subject: "Business B2", level: "B2", students: 15 },
};

const CHAT_MSGS = [
  { id: "1", author: "Ms. Fatima Hassan", role: "teacher", text: "Good morning everyone! Let's begin with today's warm-up exercise.", time: "9:01 AM" },
  { id: "2", author: "Ahmed Hassan Ali", role: "student", text: "Good morning teacher! Ready 🙋", time: "9:02 AM" },
  { id: "3", author: "Nadia Hassan Qasim", role: "student", text: "Good morning!", time: "9:02 AM" },
  { id: "4", author: "Ms. Fatima Hassan", role: "teacher", text: "Today we're covering Type 2 conditionals. Can anyone give me an example?", time: "9:03 AM" },
  { id: "5", author: "Mohammed Yahya", role: "student", text: "If I studied harder, I would pass the exam.", time: "9:04 AM" },
  { id: "6", author: "Ms. Fatima Hassan", role: "teacher", text: "Excellent example, Mohammed! That's exactly right. ✅", time: "9:04 AM" },
];

const PARTICIPANTS = [
  { id: "1", name: "Ms. Fatima Hassan", role: "teacher", audio: true, video: true },
  { id: "2", name: "Ahmed Hassan Ali", role: "student", audio: false, video: true },
  { id: "3", name: "Nadia Hassan", role: "student", audio: true, video: false },
  { id: "4", name: "Mohammed Yahya", role: "student", audio: false, video: false },
  { id: "5", name: "Khadija Al-Shami", role: "student", audio: true, video: true },
];

type Tab = "video" | "chat" | "participants" | "whiteboard";

export default function ClassroomRoomScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const { sendImmediateNotification, permissionStatus } = useNotifications();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const roomId = params.id ?? "1";
  const room = CLASSROOM_DATA[roomId] ?? CLASSROOM_DATA["1"];
  const displayName = params.name ?? room.name;

  const [tab, setTab] = useState<Tab>("video");
  const [handRaised, setHandRaised] = useState(false);

  useEffect(() => {
    if (permissionStatus === "granted") {
      sendImmediateNotification(
        "In classroom companion view 🎓",
        `Chat & participants for ${displayName}. Tap Join to open video.`,
        { type: "classroom", id: roomId, name: displayName }
      ).catch(() => {});
    }
  }, []);

  async function openInBrowser() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const webUrl = REPL_DOMAIN
      ? `https://${REPL_DOMAIN}/`
      : "https://britishce44.replit.app/";
    await WebBrowser.openBrowserAsync(webUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  }

  const leave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.back();
  };

  const tabIcons: { key: Tab; icon: string; label: string }[] = [
    { key: "video", icon: "videocam", label: "Video" },
    { key: "chat", icon: "chatbubbles", label: "Chat" },
    { key: "participants", icon: "people", label: "People" },
    { key: "whiteboard", icon: "brush", label: "Board" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#050a15" }}>
      {/* Header */}
      <View style={{ paddingTop: topPad + 10, paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#ffffff" }} numberOfLines={1}>{displayName}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#059669" }} />
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#6b7fa3" }}>
              Live · {room.teacher} · {room.students} students
            </Text>
          </View>
        </View>

        <Pressable
          onPress={leave}
          style={{ backgroundColor: "#e11d48", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="exit-outline" size={15} color="#ffffff" />
          <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#ffffff" }}>Leave</Text>
        </Pressable>
      </View>

      {/* Tab navigation */}
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1a2740", backgroundColor: "#0a1628" }}>
        {tabIcons.map(t => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: tab === t.key ? colors.primary : "transparent" }}>
            <Ionicons name={t.icon as any} size={18} color={tab === t.key ? colors.primary : "#6b7fa3"} />
            <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: tab === t.key ? colors.primary : "#6b7fa3", marginTop: 3 }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tab === "video" && (
          <View style={{ flex: 1, padding: 16, gap: 14 }}>
            {/* Join in browser — primary action */}
            <Pressable
              onPress={openInBrowser}
              style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 20, alignItems: "center", gap: 10 }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="videocam" size={28} color="#ffffff" />
              </View>
              <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: "#ffffff" }}>Join Video Session</Text>
              <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", textAlign: "center" }}>
                Opens the full WebRTC classroom in your browser — video, audio, whiteboard, and all controls.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 }}>
                <Ionicons name="open-outline" size={14} color="#ffffff" />
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ffffff" }}>Open in Browser</Text>
              </View>
            </Pressable>

            {/* Session info */}
            <View style={{ backgroundColor: "#0d1f3c", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1a2740", gap: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#e2e8f0" }}>Session Info</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#6366f122", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: "#6366f1" }}>
                    {room.teacher.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: "#e2e8f0" }}>{room.teacher}</Text>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#6b7fa3" }}>{room.subject} · {room.level}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="people-outline" size={13} color="#6b7fa3" />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#6b7fa3" }}>{room.students} students</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#059669" }} />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#059669" }}>Live now</Text>
                </View>
              </View>
            </View>

            {/* Quick actions */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setTab("chat")}
                style={{ flex: 1, backgroundColor: "#0d1f3c", borderRadius: 12, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#1a2740" }}
              >
                <Ionicons name="chatbubbles-outline" size={22} color="#6366f1" />
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#e2e8f0" }}>Chat</Text>
                <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: "#6b7fa3" }}>{CHAT_MSGS.length} messages</Text>
              </Pressable>
              <Pressable
                onPress={() => setTab("participants")}
                style={{ flex: 1, backgroundColor: "#0d1f3c", borderRadius: 12, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#1a2740" }}
              >
                <Ionicons name="people-outline" size={22} color="#059669" />
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#e2e8f0" }}>Participants</Text>
                <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: "#6b7fa3" }}>{PARTICIPANTS.length} online</Text>
              </Pressable>
              <Pressable
                onPress={() => { setHandRaised(p => !p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                style={{ flex: 1, backgroundColor: handRaised ? "#f0a50022" : "#0d1f3c", borderRadius: 12, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: handRaised ? "#f0a50044" : "#1a2740" }}
              >
                <Ionicons name={handRaised ? "hand-left" : "hand-left-outline"} size={22} color={handRaised ? "#f0a500" : "#6b7fa3"} />
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: handRaised ? "#f0a500" : "#e2e8f0" }}>
                  {handRaised ? "Raised!" : "Raise Hand"}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: "#6b7fa3" }}>Notify teacher</Text>
              </Pressable>
            </View>
          </View>
        )}

        {tab === "chat" && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 12 }}>
            {CHAT_MSGS.map(msg => (
              <View key={msg.id} style={{ maxWidth: "85%", alignSelf: msg.role === "teacher" ? "flex-start" : "flex-end" }}>
                {msg.role === "teacher" && (
                  <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.primary, marginBottom: 3 }}>{msg.author}</Text>
                )}
                <View style={{ backgroundColor: msg.role === "teacher" ? "#0d1f3c" : "#6366f133", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: msg.role === "teacher" ? "#1a2740" : "#6366f144" }}>
                  <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: "#e2e8f0", lineHeight: 19 }}>{msg.text}</Text>
                </View>
                <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: "#6b7fa3", marginTop: 2, alignSelf: "flex-end" }}>{msg.time}</Text>
              </View>
            ))}
            <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 100 }} />
          </ScrollView>
        )}

        {tab === "participants" && (
          <ScrollView contentContainerStyle={{ padding: 14, gap: 8 }}>
            {PARTICIPANTS.map(p => (
              <View key={p.id} style={{ backgroundColor: "#0d1f3c", borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#1a2740" }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366f122", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#6366f1" }}>{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: "#e2e8f0" }}>{p.name}</Text>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#6b7fa3", textTransform: "capitalize" }}>{p.role}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Ionicons name={p.audio ? "mic" : "mic-off"} size={16} color={p.audio ? "#059669" : "#e11d48"} />
                  <Ionicons name={p.video ? "videocam" : "videocam-off"} size={16} color={p.video ? "#059669" : "#e11d48"} />
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {tab === "whiteboard" && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: "#6366f122", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="brush-outline" size={40} color="#6366f1" />
            </View>
            <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: "#e2e8f0", textAlign: "center" }}>Interactive Whiteboard</Text>
            <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#6b7fa3", textAlign: "center", lineHeight: 22 }}>
              The live collaborative whiteboard is available in the full desktop experience via fabric.js. Open the classroom in your browser to access it.
            </Text>
            <Pressable
              style={{ backgroundColor: "#6366f1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              onPress={openInBrowser}
            >
              <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffffff" }}>Open in Browser</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom action bar */}
      <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 12, paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 12, backgroundColor: "#0a1628", borderTopWidth: 1, borderTopColor: "#1a2740" }}>
        <Pressable onPress={openInBrowser} style={{ alignItems: "center", gap: 5 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary + "33", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.primary }}>Join Video</Text>
        </Pressable>

        <Pressable onPress={() => setTab("chat")} style={{ alignItems: "center", gap: 5 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#1a2740", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="chatbubbles-outline" size={20} color="#6b7fa3" />
          </View>
          <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: "#6b7fa3" }}>Chat</Text>
        </Pressable>

        <Pressable onPress={() => setTab("participants")} style={{ alignItems: "center", gap: 5 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#1a2740", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="people-outline" size={20} color="#6b7fa3" />
          </View>
          <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: "#6b7fa3" }}>People</Text>
        </Pressable>

        <Pressable onPress={() => { setHandRaised(p => !p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={{ alignItems: "center", gap: 5 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: handRaised ? "#f0a50022" : "#1a2740", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={handRaised ? "hand-left" : "hand-left-outline"} size={20} color={handRaised ? "#f0a500" : "#6b7fa3"} />
          </View>
          <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: handRaised ? "#f0a500" : "#6b7fa3" }}>Hand</Text>
        </Pressable>
      </View>
    </View>
  );
}
