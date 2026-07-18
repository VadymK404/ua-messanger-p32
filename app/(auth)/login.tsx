import { COLORS } from "@/constants/theme";
import { styles } from "@/styles/auth.styles";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const { signIn } = useAuthActions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Помилка", "Будь ласка, заповніть обов'язкові поля.");
      return;
    }

    if (isSignUp && !name.trim()) {
      Alert.alert("Помилка", "Будь ласка, вкажіть ваше ім'я.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("========== AUTH START ==========");
      console.log("Flow:", isSignUp ? "SIGN UP" : "SIGN IN");
      console.log("Email:", email);

      if (isSignUp) {
        const result = await signIn("password", {
          email,
          password,
          name,
          flow: "signUp",
        });

        console.log("SIGN UP RESULT:");
        console.log(result);

        Alert.alert("Успіх", "Акаунт успішно створено!");
      } else {
        const result = await signIn("password", {
          email,
          password,
          flow: "signIn",
        });

        console.log("SIGN IN RESULT:");
        console.log(result);
      }

      console.log("========== AUTH END ==========");
    } catch (err) {
      console.error("AUTH ERROR:");
      console.error(err);

      Alert.alert(
        "Помилка",
        isSignUp
          ? "Не вдалося створити акаунт. Можливо, пошта вже зайнята."
          : "Неправильний email або пароль."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Ionicons
              name="accessibility-outline"
              size={24}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.appName}>UA-Messenger</Text>

          <Text style={styles.tagline}>
            {isSignUp ? "create new account" : "find your next adventure"}
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: 24,
            marginTop: 40,
            gap: 16,
            width: "100%",
            alignItems: "center",
          }}
        >
          {isSignUp && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                width: "100%",
                maxWidth: 320,
              }}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.grey}
                style={{ marginRight: 12 }}
              />

              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: COLORS.white,
                }}
                placeholder="Ваше ім'я"
                placeholderTextColor={COLORS.grey}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              width: "100%",
              maxWidth: 320,
            }}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={COLORS.grey}
              style={{ marginRight: 12 }}
            />

            <TextInput
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 16,
                color: COLORS.white,
              }}
              placeholder="Email"
              placeholderTextColor={COLORS.grey}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              width: "100%",
              maxWidth: 320,
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={COLORS.grey}
              style={{ marginRight: 12 }}
            />

            <TextInput
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 16,
                color: COLORS.white,
              }}
              placeholder="Пароль"
              placeholderTextColor={COLORS.grey}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.googleButton,
              isLoading && { opacity: 0.6 },
              { marginTop: 10 },
            ]}
            activeOpacity={0.9}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <Text style={styles.googleButtonText}>
                {isSignUp ? "Створити акаунт" : "Увійти"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={{ marginTop: 10 }}
          >
            <Text
              style={{
                color: COLORS.primary,
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              {isSignUp
                ? "Вже є акаунт? Увійти"
                : "Немає акаунту? Зареєструватися"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}