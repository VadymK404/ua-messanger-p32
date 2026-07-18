import {
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { Comment } from "./Comment";

type Props = {
  postId: Id<"posts">;
  visible: boolean;
  onClose: () => void;
  onCommentsCountChange: (newCount: number) => void;
};

export function CommentsModal({ postId, visible, onClose, onCommentsCountChange }: Props) {
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Отримуємо коментарі в реальному часі
  const comments = useQuery(api.comments.getComments, { postId });
  const addComment = useMutation(api.comments.addComment);

  const handleSend = async () => {
    if (!newComment.trim() || isSending) return;

    try {
      setIsSending(true);
      await addComment({
        postId,
        content: newComment.trim(),
      });
      setNewComment("");
      
      // Оновлюємо локальний лічильник коментарів у батьківському компоненті
      if (comments) {
        onCommentsCountChange(comments.length + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        {/* Хедер модала */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Comments</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Список коментарів */}
        {comments === undefined ? (
          <View style={[styles.centered, { flex: 1 }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <Comment comment={item} />}
            style={styles.commentsList}
            ListEmptyComponent={
              <View style={[styles.centered, { marginTop: 40 }]}>
                <Text style={{ color: COLORS.grey, fontSize: 16 }}>
                  No comments yet. Be the first!
                </Text>
              </View>
            }
          />
        )}

        {/* Поле введення нового коментаря */}
        <View style={styles.commentInput}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.grey}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            editable={!isSending}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!newComment.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text
                style={[
                  styles.postButton,
                  !newComment.trim() && styles.postButtonDisabled,
                ]}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}