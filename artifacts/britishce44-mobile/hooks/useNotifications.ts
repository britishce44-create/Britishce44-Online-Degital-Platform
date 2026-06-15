import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

export type NotificationPermissionStatus = "undetermined" | "granted" | "denied";

export function useNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>("undetermined");
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    checkPermissions();
    setupResponseListener();
    return () => {
      responseListener.current?.remove();
    };
  }, []);

  type PermResult = { granted: boolean; canAskAgain: boolean };

  async function checkPermissions() {
    const result = (await Notifications.getPermissionsAsync()) as unknown as PermResult;
    if (result.granted) {
      setPermissionStatus("granted");
    } else if (result.canAskAgain) {
      setPermissionStatus("undetermined");
    } else {
      setPermissionStatus("denied");
    }
  }

  async function requestPermissions(): Promise<boolean> {
    if (Platform.OS === "web") {
      setPermissionStatus("granted");
      return true;
    }
    const result = (await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    })) as unknown as PermResult;
    if (result.granted) {
      setPermissionStatus("granted");
    } else if (result.canAskAgain) {
      setPermissionStatus("undetermined");
    } else {
      setPermissionStatus("denied");
    }
    if (result.granted) {
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        setExpoPushToken(token.data);
      } catch {
        // Push token unavailable in Expo Go without a project ID — local notifications still work
      }
    }
    return result.granted;
  }

  function setupResponseListener() {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string> | undefined;
        if (!data) return;
        if (data.type === "classroom" && data.id) {
          router.push({
            pathname: "/(tabs)/classroom-room",
            params: { id: data.id, name: data.name ?? "" },
          });
        } else if (data.type === "exam") {
          router.push("/(tabs)/exams");
        } else if (data.deepLink) {
          Linking.openURL(data.deepLink);
        }
      }
    );
  }

  async function scheduleClassReminder(
    classroomId: string,
    name: string,
    minutesBefore: number = 5
  ): Promise<string | null> {
    const granted = permissionStatus === "granted" || (await requestPermissions());
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Class Starting Soon 🎓",
        body: `${name} starts in ${minutesBefore} minute${minutesBefore !== 1 ? "s" : ""}. Tap to join.`,
        sound: true,
        data: { type: "classroom", id: classroomId, name },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutesBefore * 60 },
    });
    return id;
  }

  async function scheduleExamReminder(
    examId: string,
    title: string,
    minutesBefore: number = 15
  ): Promise<string | null> {
    const granted = permissionStatus === "granted" || (await requestPermissions());
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Exam Reminder 📝",
        body: `${title} starts in ${minutesBefore} minutes. Make sure you're ready!`,
        sound: true,
        data: { type: "exam", id: examId, title },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutesBefore * 60 },
    });
    return id;
  }

  async function sendImmediateNotification(title: string, body: string, data?: Record<string, string>): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data },
      trigger: null,
    });
    return id;
  }

  async function cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  return {
    permissionStatus,
    expoPushToken,
    requestPermissions,
    scheduleClassReminder,
    scheduleExamReminder,
    sendImmediateNotification,
    cancelNotification,
    cancelAllNotifications,
  };
}
