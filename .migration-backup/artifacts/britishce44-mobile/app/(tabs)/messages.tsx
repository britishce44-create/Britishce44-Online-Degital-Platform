import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const CONTACTS = [
  { id: "1", name: "Sultan Mohammed Ahmed", role: "Director", initials: "SM", color: "#f0a500", lastMsg: "The new academic schedule is ready for review.", time: "2m", unread: 3, online: true, channel: "CE4" },
  { id: "2", name: "Dr. Omar Nasser", role: "Teacher", initials: "ON", color: "#6366f1", lastMsg: "Please submit your homework by Thursday.", time: "15m", unread: 0, online: true, channel: "CE4" },
  { id: "3", name: "Ms. Fatima Hassan", role: "Teacher", initials: "FH", color: "#059669", lastMsg: "Class tomorrow is moved to Room 12.", time: "1h", unread: 1, online: false, channel: "WhatsApp" },
  { id: "4", name: "Academic Admin", role: "Admin", initials: "AA", color: "#7c3aed", lastMsg: "Your registration has been confirmed.", time: "2h", unread: 0, online: true, channel: "CE4" },
  { id: "5", name: "Mr. Ahmed Al-Shami", role: "Teacher", initials: "AA", color: "#0891b2", lastMsg: "Excellent work on the last exam!", time: "3h", unread: 0, online: false, channel: "CE4" },
  { id: "6", name: "IT Support", role: "Support", initials: "IT", color: "#d97706", lastMsg: "Your account issue has been resolved.", time: "1d", unread: 0, online: true, channel: "CE4" },
  { id: "7", name: "Mrs. Sara Al-Yemeni", role: "Teacher", initials: "SA", color: "#e11d48", lastMsg: "See you in class on Monday!", time: "1d", unread: 0, online: false, channel: "Gmail" },
  { id: "8", name: "Ms. Nour Mahmoud", role: "Teacher", initials: "NM", color: "#059669", lastMsg: "The reading materials are uploaded.", time: "2d", unread: 0, online: true, channel: "CE4" },
];

const CHANNEL_ICON: Record<string, { icon: string; color: string }> = {
  CE4: { icon: "chatbubble", color: "#6366f1" },
  WhatsApp: { icon: "logo-whatsapp", color: "#25d366" },
  Gmail: { icon: "mail", color: "#ea4335" },
  SMS: { icon: "phone-portrait", color: "#0891b2" },
};

function ContactRow({ item }: { item: (typeof CONTACTS)[0] }) {
  const colors = useColors();
  const ch = CHANNEL_ICON[item.channel] ?? CHANNEL_ICON["CE4"];

  return (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        backgroundColor: colors.card,
        borderRadius: colors.radius,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.8 : 1,
        gap: 12,
      })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{ position: "relative" }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: `${item.color}44` }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: item.color }}>{item.initials}</Text>
        </View>
        {item.online && (
          <View style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: "#059669", borderWidth: 2, borderColor: colors.card }} />
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginLeft: 8 }}>
            {item.time}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
            <Ionicons name={ch.icon as any} size={11} color={ch.color} />
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, flex: 1 }} numberOfLines={1}>
              {item.lastMsg}
            </Text>
          </View>
          {item.unread > 0 && (
            <View style={{ backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, marginLeft: 8 }}>
              <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: colors.primaryForeground }}>{item.unread}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
          {item.role}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = CONTACTS.reduce((sum, c) => sum + c.unread, 0);
  const onlineCount = CONTACTS.filter(c => c.online).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>
              CE4 Messenger
            </Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              {onlineCount} online · {totalUnread > 0 ? `${totalUnread} unread` : "all read"}
            </Text>
          </View>
          <Pressable
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="create-outline" size={19} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface2, borderRadius: colors.radius, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="search-outline" size={17} color={colors.mutedForeground} />
          <TextInput
            style={{ flex: 1, height: 40, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, marginLeft: 8 }}
            placeholder="Search messages..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={17} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Channel pills */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {Object.entries(CHANNEL_ICON).map(([channel, cfg]) => (
            <View key={channel} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${cfg.color}18`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 }}>
              <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: cfg.color }}>{channel}</Text>
            </View>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ContactRow item={item} />}
        contentContainerStyle={{ padding: 14, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedForeground} />
            <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginTop: 12 }}>No messages found</Text>
          </View>
        }
      />
    </View>
  );
}
