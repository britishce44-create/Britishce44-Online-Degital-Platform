import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const PROJECTS = [
  { id: "1", title: "Cambridge B2 Course Intro", duration: "2:34", status: "ready", thumbnail: "#6366f1", size: "45 MB" },
  { id: "2", title: "IELTS Tips — Reading Section", duration: "5:12", status: "rendering", thumbnail: "#f0a500", size: "—" },
  { id: "3", title: "School Welcome Video 2026", duration: "1:45", status: "ready", thumbnail: "#059669", size: "28 MB" },
  { id: "4", title: "Student Success Stories", duration: "8:20", status: "draft", thumbnail: "#7c3aed", size: "—" },
];

const TEMPLATES = [
  { id: "t1", name: "Course Intro", icon: "play-circle", color: "#6366f1" },
  { id: "t2", name: "Lesson Recap", icon: "refresh-circle", color: "#f0a500" },
  { id: "t3", name: "Promo Reel", icon: "star", color: "#059669" },
  { id: "t4", name: "Testimonial", icon: "chatbubble-ellipses", color: "#7c3aed" },
  { id: "t5", name: "Event Recap", icon: "calendar", color: "#0891b2" },
  { id: "t6", name: "Announcement", icon: "megaphone", color: "#d97706" },
];

const AI_FEATURES = [
  { icon: "cut-outline", label: "Auto-Cut Silence", sub: "Remove dead air automatically" },
  { icon: "closed-captioning-outline", label: "Auto Captions", sub: "Arabic + English subtitles" },
  { icon: "color-wand-outline", label: "AI Enhancement", sub: "Color grade & stabilize" },
  { icon: "logo-youtube", label: "Export to Archive", sub: "Publish to video archive" },
];

export default function VideoEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LinearGradient colors={["#7c3aed", "#e11d48"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="videocam" size={18} color="#ffffff" />
          </LinearGradient>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>AI Video Editor</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Create & publish course content</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={{ padding: 16 }}>
          {/* New Project CTA */}
          <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
            <LinearGradient colors={["#4f46e5", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, padding: 20, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="add-circle" size={28} color="#ffffff" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" }}>New Video Project</Text>
                <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 }}>Upload footage or record screen</Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Templates */}
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Templates</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
            {TEMPLATES.map(t => (
              <Pressable key={t.id} style={({ pressed }) => ({ width: "30%", backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1 })} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${t.color}22`, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                  <Ionicons name={t.icon as any} size={18} color={t.color} />
                </View>
                <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.foreground, textAlign: "center" }}>{t.name}</Text>
              </Pressable>
            ))}
          </View>

          {/* Recent Projects */}
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Recent Projects</Text>
          {PROJECTS.map(p => (
            <Pressable key={p.id} style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.85 : 1 })} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <View style={{ width: 56, height: 42, borderRadius: 8, backgroundColor: `${p.thumbnail}22`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${p.thumbnail}33` }}>
                <Ionicons name="play" size={18} color={p.thumbnail} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 3 }}>{p.title}</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{p.duration}</Text>
                  {p.size !== "—" && <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{p.size}</Text>}
                </View>
              </View>
              <View style={{ backgroundColor: p.status === "ready" ? "#05966922" : p.status === "rendering" ? "#6366f122" : colors.muted, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: p.status === "ready" ? "#059669" : p.status === "rendering" ? "#6366f1" : colors.mutedForeground, textTransform: "capitalize" }}>{p.status}</Text>
              </View>
            </Pressable>
          ))}

          {/* AI Features */}
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginTop: 12 }}>AI Features</Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
            {AI_FEATURES.map((f, i) => (
              <Pressable key={f.label} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border, opacity: pressed ? 0.8 : 1 })} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#7c3aed22", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={f.icon as any} size={18} color="#7c3aed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground }}>{f.label}</Text>
                  <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{f.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>

          <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}
