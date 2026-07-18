import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { COLORS } from "@/constants/theme";

const { width, height } = Dimensions.get("window");
const STORY_DURATION = 5000; // 5 секунд на одну історію

type StoryItem = {
  _id: Id<"stories">;
  imageUrl: string;
  userId: Id<"users">;
  views: number;
  expiresAt: number;
};

type StoryUser = {
  id: string;
  username: string;
  avatar: string;
};

type Props = {
  visible: boolean;
  user: StoryUser;
  stories: StoryItem[];
  onClose: () => void;
};

export function StoryViewerModal({ visible, user, stories, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const incrementViews = useMutation(api.stories.incrementViews);

  const currentStory = stories[currentIndex];

  const startProgress = () => {
    progress.setValue(0);
    animation.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animation.current.start(({ finished }) => {
      if (finished) goNext();
    });
  };

  const stopProgress = () => {
    animation.current?.stop();
  };

  useEffect(() => {
    if (!visible || stories.length === 0) return;
    startProgress();
    
    if (currentStory) {
      incrementViews({ storyId: currentStory._id }).catch(() => {});
    }
    
    return () => stopProgress();
  }, [visible, currentIndex]);

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleClose();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      stopProgress();
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleClose = () => {
    stopProgress();
    setCurrentIndex(0);
    onClose();
  };

  if (!visible || stories.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={viewerStyles.container}>
        {/* Фонове зображення на весь екран */}
        <Image
          source={{ uri: currentStory?.imageUrl }}
          style={viewerStyles.image}
          resizeMode="cover"
        />

        {/* Прогрес-бари для кожної історії */}
        <View style={viewerStyles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={viewerStyles.progressTrack}>
              <Animated.View
                style={[
                  viewerStyles.progressFill,
                  {
                    width:
                      index < currentIndex
                        ? "100%"
                        : index === currentIndex
                          ? progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            })
                          : "0%",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Хедер модала: інформація про користувача */}
        <View style={viewerStyles.header}>
          <View style={viewerStyles.userInfo}>
            <Image source={{ uri: user.avatar }} style={viewerStyles.avatar} />
            <Text style={viewerStyles.username}>{user.username}</Text>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Сенсорні зони для швидкого перемикання (ліворуч/праворуч) */}
        <View style={viewerStyles.tapZones}>
          <TouchableOpacity
            style={viewerStyles.tapLeft}
            onPress={goPrev}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={viewerStyles.tapRight}
            onPress={goNext}
            activeOpacity={1}
          />
        </View>
      </View>
    </Modal>
  );
}

const viewerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    width,
    height,
    position: "absolute",
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 48,
    gap: 4,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  username: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 14,
  },
  tapZones: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    zIndex: 5,
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
});