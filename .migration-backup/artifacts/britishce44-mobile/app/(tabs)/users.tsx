import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type UserRole = "admin" | "supervisor" | "teacher" | "student" | "parent";

const USERS: Array<{ id: string; name: string; email: string; role: UserRole; grade?: string; status: "active" | "inactive"; joined: string }> = [
  { id: "1", name: "Sultan Mohammed Ahmed", email: "sultan.ahmed@britishce44.com", role: "admin", status: "active", joined: "Est. 2020" },
  { id: "2", name: "Suhair Almojahid", email: "suhair.almojahid@britishce44.com", role: "teacher", status: "active", joined: "Jan 2021" },
  { id: "3", name: "Ahmed Hassan Ali", email: "ahmed.ali@student.b44.com", role: "student", grade: "Cambridge B2", status: "active", joined: "Sep 2024" },
  { id: "4", name: "Fatima Omar Nasser", email: "fatima.nasser@student.b44.com", role: "student", grade: "IELTS Prep", status: "active", joined: "Oct 2024" },
  { id: "5", name: "Dr. Omar Nasser", email: "omar.nasser@britishce44.com", role: "teacher", status: "active", joined: "Mar 2022" },
  { id: "6", name: "Khadeejah Al-Ghaily", email: "khadeejah@britishce44.com", role: "supervisor", status: "active", joined: "Jun 2023" },
  { id: "7", name: "Mohammed Yahya", email: "m.yahya@student.b44.com", role: "student", grade: "Foundation A1", status: "active", joined: "Nov 2024" },
  { id: "8", name: "Sara Khalid", email: "sara.k@parent.b44.com", role: "parent", status: "active", joined: "Sep 2024" },
  { id: "9", name: "Amani Alsharabi", email: "amani@britishce44.com", role: "teacher", status: "inactive", joined: "Jan 2022" },
  { id: "10", name: "Nadia Hassan", email: "nadia.h@student.b44.com", role: "student", grade: "Teen English", status: "active", joined: "Aug 2024" },
];

const ROLE_COLOR: Record<UserRole, string> = {
  admin: "#f0a500", supervisor: "#6366f1", teacher: "#059669", student: "#0891b2", parent: "#7c3aed",
};

const ROLE_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "teacher", label: "Teachers" },
  { key: "student", label: "Students" },
  { key: "parent", label: "Parents" },
];

function UserRow({ item }: { item: (typeof USERS)[0] }) {
  const colors = useColors();
  const rc = ROLE_COLOR[item.role];
  return (
    <Pressable
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: colors.card, borderRadius: colors.radius, marginBottom: 8, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1, gap: 12 })}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${rc}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: `${rc}44` }}>
        <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: rc }}>
          {item.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 }} numberOfLines={1}>{item.name}</Text>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.status === "active" ? "#059669" : "#6b7fa3", marginLeft: 8 }} />
        </View>
        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1 }} numberOfLines={1}>{item.email}</Text>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
          <View style={{ backgroundColor: `${rc}22`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: rc, textTransform: "capitalize" }}>{item.role}</Text>
          </View>
          {item.grade && (
            <View style={{ backgroundColor: colors.muted, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{item.grade}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function UsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = USERS.filter(u => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>Users</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>{USERS.length} accounts · {USERS.filter(u => u.status === "active").length} active</Text>
          </View>
          <Pressable style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="person-add" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface2, borderRadius: colors.radius, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={{ flex: 1, height: 40, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, marginLeft: 8 }}
            placeholder="Search users..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {ROLE_FILTERS.map(f => (
            <Pressable key={f.key} onPress={() => setRoleFilter(f.key)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: roleFilter === f.key ? colors.primary : colors.surface2, borderWidth: 1, borderColor: roleFilter === f.key ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: roleFilter === f.key ? colors.primaryForeground : colors.mutedForeground }}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <UserRow item={item} />}
        contentContainerStyle={{ padding: 14, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="people-outline" size={48} color={useColors().mutedForeground} />
            <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: useColors().mutedForeground, marginTop: 12 }}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}
