import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { Image } from "expo-image";
import { styles } from "@/styles/profile.styles";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Loader } from "@/components/Loader";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

function NoPostsFound() {
  return (
    <View style={styles.noPostsContainer}>
      <Ionicons name="images-outline" size={48} color={COLORS.primary} />
      <Text style={styles.noPostsText}>No posts yet</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { signOut } = useAuthActions();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Doc<"posts"> | null>(null);

  const currentUser = useQuery(api.users.currentUser);
  const posts = useQuery(api.posts.getPostsByUser, {});
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  const [fullname, setFullname] = useState("");
  const [bio, setBio] = useState("");
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  // Синхронізуємо локальний стейт після завантаження профілю
  useEffect(() => {
    if (currentUser) {
      setFullname(currentUser.fullname ?? currentUser.name ?? "");
      setBio(currentUser.bio ?? "");
    }
  }, [currentUser]);

  // Вибір зображення з бібліотеки
  const pickAvatarFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  // Робимо фото на камеру
  const takeAvatarPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Дозвіл відхилено",
        "Для створення знімку потрібен доступ до камери.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  // Викликає Alert для вибору джерела нового аватара
  const handlePickAvatar = () => {
    Alert.alert("Зміна аватара", "Оберіть джерело зображення для аватара", [
      {
        text: "Зробити фото",
        onPress: takeAvatarPhoto,
      },
      {
        text: "Обрати з галереї",
        onPress: pickAvatarFromLibrary,
      },
      {
        text: "Скасувати",
        style: "cancel",
      },
    ]);
  };

  // Завантаження файлу в Convex Storage
  const uploadAvatar = async (uri: string) => {
    try {
      setIsUpdatingAvatar(true);

      // 1. Отримуємо одноразове посилання для завантаження
      const uploadUrl = await generateUploadUrl();

      // 2. Створюємо інстанс файлу через expo-file-system
      const file = new File(uri);

      // 3. Завантажуємо зображення
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!uploadResult.ok) throw new Error("Upload failed");

      // 4. Отримуємо storageId
      const { storageId } = await uploadResult.json();

      // 5. Оновлюємо аватар у профілі через мутацію
      await updateUserProfile({ imageStorageId: storageId });

      Alert.alert("Успіх", "Аватар успішно оновлено!");
    } catch (error) {
      console.error("Error updating avatar:", error);
      Alert.alert("Помилка", "Не вдалося оновити аватар профілю.");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({ fullname, bio });
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleShareProfile = async () => {
    if (!currentUser) return;
    try {
      await Share.share({
        message: `Check out ${currentUser.username ?? currentUser.name}'s profile on ua-messenger!`,
      });
    } catch (error) {
      console.error("Failed to share profile:", error);
    }
  };

  if (currentUser === undefined || posts === undefined) {
    return <Loader />;
  }

  if (currentUser === null) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: COLORS.white, fontSize: 16 }}>
          Please log in to view your profile
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.username}>
            {currentUser.username ?? currentUser.name ?? "profile"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={async () => {
              await signOut();
            }}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          {/* Аватар та статистика */}
          <View style={styles.avatarAndStats}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickAvatar}
              disabled={isUpdatingAvatar}
            >
              {isUpdatingAvatar ? (
                <View
                  style={[
                    styles.avatar,
                    styles.centered,
                    { backgroundColor: COLORS.surface },
                  ]}
                >
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : (
                <View style={{ position: "relative" }}>
                  <Image
                    source={
                      currentUser.image ??
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
                    }
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                  />
                  {/* Індикатор камери */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      backgroundColor: COLORS.primary,
                      borderRadius: 14,
                      width: 28,
                      height: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: COLORS.background,
                    }}
                  >
                    <Ionicons name="camera" size={14} color={COLORS.white} />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.posts ?? 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentUser.followers ?? 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentUser.following ?? 0}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Ім'я та Bio */}
          <Text style={styles.name}>
            {currentUser.fullname ?? currentUser.name ?? "No Name"}
          </Text>
          {currentUser.bio && <Text style={styles.bio}>{currentUser.bio}</Text>}

          {/* Кнопки дій */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareProfile}
            >
              <Ionicons name="share-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Сітка постів */}
        {posts.length === 0 ? (
          <NoPostsFound />
        ) : (
          <View style={styles.postsGrid}>
            {posts.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.gridItem}
                onPress={() => setSelectedPost(item)}
              >
                <Image
                  source={item.imageUrl}
                  style={styles.gridImage}
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Модалка перегляду фото на весь екран */}
      <Modal
        visible={!!selectedPost}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalBackdrop}>
          {selectedPost && (
            <View style={styles.postDetailContainer}>
              <View style={styles.postDetailHeader}>
                <TouchableOpacity onPress={() => setSelectedPost(null)}>
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <Image
                source={selectedPost.imageUrl}
                cachePolicy="memory-disk"
                style={styles.postDetailImage}
                contentFit="contain"
              />
            </View>
          )}
        </View>
      </Modal>

      {/* Модалка редагування профілю */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullname}
                  onChangeText={setFullname}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.grey}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  placeholder="Bio"
                  placeholderTextColor={COLORS.grey}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}