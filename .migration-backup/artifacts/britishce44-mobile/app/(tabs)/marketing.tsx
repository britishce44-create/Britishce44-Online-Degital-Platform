import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type CampaignStatus = "active" | "scheduled" | "draft" | "completed";

const CAMPAIGNS = [
  { id: "1", title: "Summer Enrollment Drive 2026", channel: "WhatsApp + SMS", status: "active" as CampaignStatus, sent: 2340, opened: 1876, leads: 143, budget: "$450" },
  { id: "2", title: "Cambridge B2 Weekend Classes", channel: "Facebook + Instagram", status: "active" as CampaignStatus, sent: 5200, opened: 3100, leads: 87, budget: "$800" },
  { id: "3", title: "Eid Special — 30% Off All Courses", channel: "WhatsApp Broadcast", status: "scheduled" as CampaignStatus, sent: 0, opened: 0, leads: 0, budget: "$200" },
  { id: "4", title: "IELTS Prep Course — March Intake", channel: "Email + SMS", status: "completed" as CampaignStatus, sent: 3100, opened: 1980, leads: 210, budget: "$350" },
  { id: "5", title: "New Student Welcome Series", channel: "Email Sequence", status: "active" as CampaignStatus, sent: 890, opened: 710, leads: 0, budget: "$0" },
  { id: "6", title: "Parent Referral Program", channel: "WhatsApp + Email", status: "draft" as CampaignStatus, sent: 0, opened: 0, leads: 0, budget: "$150" },
];

const STATUS_CFG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "#05966922" },
  scheduled: { label: "Scheduled", color: "#6366f1", bg: "#6366f122" },
  draft: { label: "Draft", color: "#6b7fa3", bg: "#6b7fa322" },
  completed: { label: "Completed", color: "#f0a500", bg: "#f0a50022" },
};

function CampaignCard({ item }: { item: (typeof CAMPAIGNS)[0] }) {
  const colors = useColors();
  const cfg = STATUS_CFG[item.status];
  const openRate = item.sent > 0 ? Math.round((item.opened / item.sent) * 100) : 0;

  return (
    <Pressable style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 })} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 }} numberOfLines={2}>{item.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="megaphone-outline" size={11} color={colors.mutedForeground} />
            <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.channel}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>

      {item.sent > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          {[
            { label: "Sent", value: item.sent.toLocaleString(), color: "#6366f1" },
            { label: "Opened", value: `${openRate}%`, color: "#059669" },
            { label: "Leads", value: String(item.leads), color: "#f0a500" },
          ].map(stat => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: `${stat.color}18`, borderRadius: 8, padding: 8, alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: stat.color }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="cash-outline" size={13} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Budget: {item.budget}</Text>
        </View>
        <Pressable style={{ backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>View Details</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function MarketingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const activeCount = CAMPAIGNS.filter(c => c.status === "active").length;
  const totalLeads = CAMPAIGNS.reduce((sum, c) => sum + c.leads, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Marketing Suite</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {activeCount} active campaigns · {totalLeads} total leads
            </Text>
          </View>
          <Pressable style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
            <Ionicons name="add" size={16} color={colors.primaryForeground} />
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: colors.primaryForeground }}>New</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[{ label: "Total Leads", value: totalLeads, color: "#f0a500" }, { label: "Active", value: activeCount, color: "#059669" }, { label: "Campaigns", value: CAMPAIGNS.length, color: "#6366f1" }].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: `${s.color}18`, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <FlatList data={CAMPAIGNS} keyExtractor={i => i.id} renderItem={({ item }) => <CampaignCard item={item} />} contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }} showsVerticalScrollIndicator={false} />
    </View>
  );
}
