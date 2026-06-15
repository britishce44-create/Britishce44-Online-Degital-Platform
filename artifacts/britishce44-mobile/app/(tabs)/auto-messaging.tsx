import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Trigger = "absence" | "grade" | "payment" | "exam" | "welcome";

const AUTO_RULES: Array<{
  id: string; title: string; trigger: Trigger; channel: string; enabled: boolean;
  sent: number; lastTriggered: string; audience: string;
}> = [
  { id: "1", title: "Absence Alert to Parent", trigger: "absence", channel: "WhatsApp", enabled: true, sent: 847, lastTriggered: "2 hours ago", audience: "Parents" },
  { id: "2", title: "Low Grade Warning", trigger: "grade", channel: "SMS + WhatsApp", enabled: true, sent: 312, lastTriggered: "Yesterday", audience: "Parents + Student" },
  { id: "3", title: "Upcoming Exam Reminder", trigger: "exam", channel: "SMS", enabled: true, sent: 1240, lastTriggered: "3 days ago", audience: "Students" },
  { id: "4", title: "Payment Due Reminder", trigger: "payment", channel: "WhatsApp + Email", enabled: false, sent: 423, lastTriggered: "1 week ago", audience: "Parents" },
  { id: "5", title: "New Student Welcome Series", trigger: "welcome", channel: "Email", enabled: true, sent: 189, lastTriggered: "Today", audience: "New Students" },
  { id: "6", title: "Weekly Progress Report", trigger: "grade", channel: "Email", enabled: true, sent: 2100, lastTriggered: "Sunday", audience: "Parents" },
];

const TRIGGER_CFG: Record<Trigger, { icon: string; color: string }> = {
  absence: { icon: "person-remove-outline", color: "#e11d48" },
  grade: { icon: "ribbon-outline", color: "#f0a500" },
  payment: { icon: "cash-outline", color: "#059669" },
  exam: { icon: "document-text-outline", color: "#6366f1" },
  welcome: { icon: "hand-left-outline", color: "#7c3aed" },
};

function RuleCard({ item, onToggle }: { item: (typeof AUTO_RULES)[0]; onToggle: (id: string) => void }) {
  const colors = useColors();
  const tc = TRIGGER_CFG[item.trigger];
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: colors.radius, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: item.enabled ? `${tc.color}33` : colors.border }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: `${tc.color}22`, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={tc.icon as any} size={20} color={tc.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1, marginRight: 8 }}>{item.title}</Text>
            <Switch
              value={item.enabled}
              onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(item.id); }}
              trackColor={{ false: colors.border, true: `${tc.color}88` }}
              thumbColor={item.enabled ? tc.color : colors.mutedForeground}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 5 }}>
            <View style={{ backgroundColor: colors.muted, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="chatbubble-outline" size={9} color={colors.mutedForeground} />
              <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.channel}</Text>
            </View>
            <View style={{ backgroundColor: colors.muted, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.audience}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="send-outline" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.sent.toLocaleString()} sent</Text>
        </View>
        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Last: {item.lastTriggered}</Text>
      </View>
    </View>
  );
}

export default function AutoMessagingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [rules, setRules] = useState(AUTO_RULES);
  const toggle = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Auto Messaging</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {activeCount} active rules · AI-powered notifications
            </Text>
          </View>
          <Pressable style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
            <Ionicons name="add" size={16} color={colors.primaryForeground} />
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: colors.primaryForeground }}>Rule</Text>
          </Pressable>
        </View>
        <View style={{ backgroundColor: "#05966918", borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="information-circle-outline" size={18} color="#059669" />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#059669", flex: 1, lineHeight: 18 }}>
            {rules.reduce((s, r) => s + r.sent, 0).toLocaleString()} messages sent this month via WhatsApp, SMS & Email
          </Text>
        </View>
      </View>
      <FlatList data={rules} keyExtractor={i => i.id} renderItem={({ item }) => <RuleCard item={item} onToggle={toggle} />} contentContainerStyle={{ padding: 14, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }} showsVerticalScrollIndicator={false} />
    </View>
  );
}
