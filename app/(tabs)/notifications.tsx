import { View, Text, FlatList } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { COLORS } from "@/constants/theme";
import { Loader } from "@/components/Loader";
import { SwipeableNotificationItem } from "@/components/SwipeableNotificationItem";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/styles/notifications.styles";

function NoNotificationsFound() {
  return (
    <View style={[styles.container, styles.centered]}>
      <Ionicons name="notifications-outline" size={48} color={COLORS.primary} />
      <Text style={{ fontSize: 18, color: COLORS.white, marginTop: 12 }}>
        No notifications yet
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const notifications = useQuery(api.notifications.getNotifications);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleDeleteNotification = async (notificationId: Id<"notifications">) => {
    try {
      await deleteNotification({ notificationId });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  if (notifications === undefined) {
    return <Loader />;
  }

  if (notifications.length === 0) {
    return <NoNotificationsFound />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {/* NOTIFICATIONS LIST */}
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <SwipeableNotificationItem
              notification={item}
              onDelete={handleDeleteNotification}
            />
          )}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </GestureHandlerRootView>
  );
}
