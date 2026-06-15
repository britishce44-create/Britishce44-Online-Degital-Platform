import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const AI_TOOLS = [
  { id: "1", icon: "sparkles", label: "Lesson Plan Generator", sublabel: "Create AI-powered lesson plans", color: "#6366f1" },
  { id: "2", icon: "school", label: "Quiz Builder", sublabel: "Auto-generate quizzes from content", color: "#f0a500" },
  { id: "3", icon: "chatbubbles", label: "Feedback Composer", sublabel: "Personalized student feedback", color: "#059669" },
  { id: "4", icon: "document-text", label: "Content Summarizer", sublabel: "Summarize textbooks & readings", color: "#0891b2" },
  { id: "5", icon: "language", label: "Translation Assistant", sublabel: "Arabic ↔ English learning aids", color: "#7c3aed" },
  { id: "6", icon: "analytics", label: "Performance Predictor", sublabel: "AI-predicted student outcomes", color: "#d97706" },
];

type Msg = { role: "user" | "ai"; text: string };

const DEMO_MSGS: Msg[] = [
  { role: "ai", text: "Hello! I'm your B44 AI assistant. I can help you create lesson plans, generate quizzes, write student feedback, and more. What would you like to do today?" },
  { role: "user", text: "Generate a lesson plan for teaching Cambridge B2 conditionals to intermediate students" },
  { role: "ai", text: "Here's a 60-minute lesson plan for Cambridge B2 Conditionals:\n\n**Objective:** Master mixed conditionals (Types 2 & 3)\n\n**Warm-up (10 min):** Review Type 1 conditionals via quick-fire Q&A\n\n**Presentation (15 min):** Introduce Type 2 & 3 with authentic examples from Cambridge exam materials\n\n**Controlled Practice (15 min):** Gap-fill exercises from past papers\n\n**Free Practice (15 min):** Pair discussion: 'What would you have done if...'\n\n**Wrap-up (5 min):** Exit ticket — 2 sentences using mixed conditionals\n\n**Homework:** Cambridge B2 Practice Test pp. 45–47" },
];

export default function AiDevScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>(DEMO_MSGS);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"tools" | "chat">("tools");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const send = () => {
    if (!input.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => [...prev, { role: "user", text: input.trim() }, { role: "ai", text: "I'm processing your request... (AI response will appear here in the live version)" }]);
    setInput("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <LinearGradient colors={["#4f46e5", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="sparkles" size={18} color="#ffffff" />
          </LinearGradient>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>AI Development</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Smart tools for educators</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["tools", "chat"] as const).map(t => (
            <Pressable key={t} onPress={() => setTab(t)} style={{ paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: tab === t ? colors.primary : colors.surface2, borderWidth: 1, borderColor: tab === t ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: tab === t ? colors.primaryForeground : colors.mutedForeground, textTransform: "capitalize" }}>{t === "chat" ? "AI Chat" : "Tools"}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === "tools" ? (
        <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
          <View style={{ padding: 16, gap: 10, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}>
            {AI_TOOLS.map(tool => (
              <Pressable key={tool.id} style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, opacity: pressed ? 0.8 : 1 })} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: `${tool.color}22`, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={tool.icon as any} size={22} color={tool.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{tool.label}</Text>
                  <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>{tool.sublabel}</Text>
                </View>
                <View style={{ backgroundColor: `${tool.color}22`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: tool.color }}>Launch</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
            {messages.map((msg, i) => (
              <View key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", backgroundColor: msg.role === "user" ? colors.primary : colors.card, borderRadius: 14, padding: 12, borderWidth: msg.role === "ai" ? 1 : 0, borderColor: colors.border }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: msg.role === "user" ? colors.primaryForeground : colors.foreground, lineHeight: 20 }}>{msg.text}</Text>
              </View>
            ))}
            <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 100 }} />
          </ScrollView>
          <View style={{ flexDirection: "row", padding: 12, gap: 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 12 }}>
            <TextInput
              style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, borderWidth: 1, borderColor: colors.border }}
              placeholder="Ask the AI anything..."
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <Pressable style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: input.trim() ? colors.primary : colors.muted, alignItems: "center", justifyContent: "center" }} onPress={send}>
              <Ionicons name="send" size={18} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
