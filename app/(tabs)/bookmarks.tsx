import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { Loader } from "@/components/Loader";
import { Link } from "expo-router";

function NoBookmarksFound() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No bookmarked posts yet</Text>
    </View>
  );
}

export default function BookmarksScreen() {
  const bookmarkedPosts = useQuery(api.bookmarks.getBookmarkedPosts);

  if (bookmarkedPosts === undefined) {
    return <Loader />;
  }

  if (bookmarkedPosts.length === 0) {
    return <NoBookmarksFound />;
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
      </View>

      {/* POSTS GRID */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {bookmarkedPosts.map((post) => {
          if (!post) return null;
          return (
            <View key={post._id} style={styles.gridItem}>
              <Link href={`/post/${post._id}` as any} asChild>
                <TouchableOpacity activeOpacity={0.8} style={{ flex: 1 }}>
                  <Image
                    source={post.imageUrl}
                    style={styles.gridImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              </Link>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  gridContainer: {
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 60,
  },
  gridItem: {
    width: "33.33%",
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  emptyText: {
    color: COLORS.grey,
    fontSize: 18,
  },
});