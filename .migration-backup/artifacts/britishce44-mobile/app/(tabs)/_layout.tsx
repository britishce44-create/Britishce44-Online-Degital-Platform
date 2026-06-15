import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Redirect, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="classrooms">
        <Icon sf={{ default: "video", selected: "video.fill" }} />
        <Label>Classes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exams">
        <Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} />
        <Label>Exams</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "ellipsis", selected: "ellipsis.circle.fill" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const hiddenTab = { tabBarButton: () => null };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : undefined,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? <Ionicons name="home" size={22} color={color} /> : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="classrooms"
        options={{
          title: "Classes",
          tabBarIcon: ({ color }) =>
            isIOS ? <Ionicons name="videocam" size={22} color={color} /> : <Feather name="video" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: "Exams",
          tabBarIcon: ({ color }) =>
            isIOS ? <Ionicons name="document-text" size={22} color={color} /> : <Feather name="file-text" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) =>
            isIOS ? <Ionicons name="chatbubbles" size={22} color={color} /> : <Feather name="message-circle" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) =>
            isIOS ? <Ionicons name="ellipsis-horizontal-circle" size={22} color={color} /> : <Feather name="menu" size={22} color={color} />,
        }}
      />
      {/* Hidden navigable screens reachable from the More hub */}
      <Tabs.Screen name="homework" options={hiddenTab} />
      <Tabs.Screen name="reports" options={hiddenTab} />
      <Tabs.Screen name="analytics" options={hiddenTab} />
      <Tabs.Screen name="teacher-eval" options={hiddenTab} />
      <Tabs.Screen name="users" options={hiddenTab} />
      <Tabs.Screen name="video-archive" options={hiddenTab} />
      <Tabs.Screen name="placements" options={hiddenTab} />
      <Tabs.Screen name="daily-perf" options={hiddenTab} />
      <Tabs.Screen name="anticheat" options={hiddenTab} />
      <Tabs.Screen name="ai-dev" options={hiddenTab} />
      <Tabs.Screen name="marketing" options={hiddenTab} />
      <Tabs.Screen name="auto-messaging" options={hiddenTab} />
      <Tabs.Screen name="video-editor" options={hiddenTab} />
      <Tabs.Screen name="academic-room" options={hiddenTab} />
      <Tabs.Screen name="classroom-room" options={hiddenTab} />
    </Tabs>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
