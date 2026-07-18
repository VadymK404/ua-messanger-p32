import { Dimensions, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "@/constants/theme";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/notifications.styles";
import { NotificationItem, NotificationProps } from "./NotificationItem";

interface SwipeableNotificationItemProps extends NotificationProps {
  onDelete: (id: Id<"notifications">) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export function SwipeableNotificationItem({
  notification,
  onDelete,
}: SwipeableNotificationItemProps) {
  // Shared value для збереження значення зміщення по X в UI-потоці
  const translateX = useSharedValue(0);

  const handleDelete = () => {
    onDelete(notification._id);
  };

  // Обробник жестів Pan (перетягування)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Активація тільки по горизонталі
    .onUpdate((event) => {
      // Рух тільки вліво (від'ємні значення)
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd((event) => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        // Якщо зміщення більше за поріг - анімуємо за межі екрану та видаляємо
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 }, () => {
          runOnJS(handleDelete)();
        });
      } else {
        // Повернення на місце
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  // Анімований стиль для зсуву контенту
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Анімований стиль для появи кнопки видалення
  const deleteButtonStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
    };
  });

  return (
    <View style={styles.swipeContainer}>
      {/* Кнопка видалення під контентом */}
      <Animated.View style={[styles.deleteButton, deleteButtonStyle]}>
        <Ionicons name="trash-outline" size={24} color={COLORS.white} />
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>

      {/* Верхній шар з контентом, що зсувається */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.swipeContent, animatedStyle]}>
          <NotificationItem notification={notification} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}