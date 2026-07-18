import { Loader } from "@/components/Loader";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Link } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: Id<"users"> }>();
  const router = useRouter();

  // Отримуємо дані профілю
  const profile = useQuery(api.users.getUserProfile, { id });
  // Отримуємо пости користувача
  const posts = useQuery(api.posts.getPostsByUser, { userId: id });
  // Отримуємо статус підписки
  const isFollowingUser = useQuery(api.users.isFollowing, { followingId: id });

  const toggleFollow = useMutation(api.users.toggleFollow);

  if (profile === undefined || posts === undefined || isFollowingUser === undefined) {
    return <Loader />;
  }

  if (profile === null) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: COLORS.white, fontSize: 18 }}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.username ?? profile.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          {/* Avatar and Stats */}
          <View style={styles.avatarAndStats}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  profile.image ??
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
                }
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.posts ?? 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.followers ?? 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.following ?? 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Name and Bio */}
          <Text style={styles.name}>{profile.fullname ?? profile.name}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Кнопка Підписатися / Відписатися */}
          <Pressable
            style={[
              styles.followButton,
              isFollowingUser && styles.followingButton,
            ]}
            onPress={() => toggleFollow({ followingId: id })}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowingUser && styles.followingButtonText,
              ]}
            >
              {isFollowingUser ? "Following" : "Follow"}
            </Text>
          </Pressable>
        </View>

        {/* Сітка постів */}
        <View style={styles.postsGrid}>
          {posts.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <Ionicons name="images-outline" size={48} color={COLORS.grey} />
              <Text style={styles.noPostsText}>No posts yet</Text>
            </View>
          ) : (
            posts.map((item) => (
              <Link key={item._id} href={`/post/${item._id}` as any} asChild>
                <TouchableOpacity style={styles.gridItem}>
                  <Image
                    source={item.imageUrl}
                    style={styles.gridImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              </Link>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}