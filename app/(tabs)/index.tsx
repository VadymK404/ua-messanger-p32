import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { StoriesSection } from "@/components/StoriesSection"; // Додано імпорт
import { Post } from "@/components/Post";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

export default function FeedScreen() {
  const posts = useQuery(api.posts.getPosts);
  const { signOut } = useAuthActions();

  if (posts === undefined) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ua-messenger</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* FEED (Стрічка постів) */}
      <FlatList
        data={posts}
        renderItem={({ item }) => <Post post={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={<StoriesSection />} // Підключено компонент історій
        ListEmptyComponent={
          <View style={[styles.centered, { marginTop: 40 }]}>
            <Text style={{ color: COLORS.grey, fontSize: 16 }}>Постів ще немає</Text>
          </View>
        }
      />
    </View>
  );
}