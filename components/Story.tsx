import { styles } from "@/styles/feed.styles";
import { View, Text, Image, TouchableOpacity } from "react-native";

type StoryUser = {
  id: string;
  username: string;
  avatar: string;
  hasStory: boolean;
};

interface StoryProps {
  story: StoryUser;
  onPress: () => void;
}

export default function Story({ story, onPress }: StoryProps) {
  return (
    <TouchableOpacity style={styles.storyWrapper} onPress={onPress}>
      <View style={[styles.storyRing, !story.hasStory && styles.noStory]}>
        <Image source={{ uri: story.avatar }} style={styles.storyAvatar} />
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {story.username}
      </Text>
    </TouchableOpacity>
  );
}