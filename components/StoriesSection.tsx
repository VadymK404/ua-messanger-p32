import {
  ScrollView,
  ActivityIndicator,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { styles } from "@/styles/feed.styles";
import Story from "./Story";
import { StoryViewerModal } from "./StoryViewerModal";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Id } from "@/convex/_generated/dataModel";
import { COLORS } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { Ionicons } from "@expo/vector-icons";

type StoryUser = {
  id: string;
  username: string;
  avatar: string;
  hasStory: boolean;
};

// Обгортка для користувача історії з відкладеним завантаженням його історій
function StoryWithViewer({ story }: { story: StoryUser }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const userStories = useQuery(
    api.stories.getStoriesByUser,
    story.hasStory ? { userId: story.id as Id<"users"> } : "skip"
  );

  const handlePress = () => {
    if (story.hasStory && userStories && userStories.length > 0) {
      setViewerOpen(true);
    }
  };

  return (
    <>
      <Story story={story} onPress={handlePress} />
      {viewerOpen && userStories && (
        <StoryViewerModal
          visible={viewerOpen}
          user={story}
          stories={userStories}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

export const StoriesSection = () => {
  const stories = useQuery(api.users.getStoriesUsers);
  const generateUploadUrl = useMutation(api.stories.generateUploadUrl);
  const createStory = useMutation(api.stories.createStory);
  const [isUploading, setIsUploading] = useState(false);

  const handleCreateStory = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (result.canceled) return;

      setIsUploading(true);
      const asset = result.assets[0];

      // 1. Отримуємо посилання для завантаження
      const uploadUrl = await generateUploadUrl();

      // 2. Створюємо інстанс файлу через expo-file-system
      const file = new File(asset.uri);

      // 3. Завантажуємо зображення
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      // 4. Отримуємо storageId
      const { storageId } = await uploadResponse.json();

      // 5. Записуємо історію в БД
      await createStory({ storageId });
      Alert.alert("Успіх", "Історію успішно опубліковано!");
    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Не вдалося опублікувати історію");
    } finally {
      setIsUploading(false);
    }
  };

  if (stories === undefined) {
    return (
      <View style={[styles.storiesContainer, styles.centered]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.storiesContainer}
    >
      {/* Кнопка створення історії */}
      <TouchableOpacity
        style={storyStyles.addWrapper}
        onPress={handleCreateStory}
        disabled={isUploading}
      >
        <View style={storyStyles.addRing}>
          {isUploading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="add" size={32} color={COLORS.primary} />
          )}
        </View>
        <Text style={storyStyles.addLabel}>Add Story</Text>
      </TouchableOpacity>

      {stories?.map((story) => (
        <StoryWithViewer key={story.id} story={story} />
      ))}
    </ScrollView>
  );
};

const storyStyles = StyleSheet.create({
  addWrapper: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 72,
  },
  addRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: COLORS.surface,
  },
  addLabel: {
    fontSize: 11,
    color: COLORS.white,
    textAlign: "center",
  },
});