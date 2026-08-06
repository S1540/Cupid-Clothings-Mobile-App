import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const MAINTENANCE_IMAGE_URI =
  "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785931119/maintenance_w1enur.png";

// Custom Three-Dots Loader Component
const AnimatedDots: React.FC = () => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);

  useEffect(() => {
    const createAnimation = (
      opacityVal: SharedValue<number>,
      scaleVal: SharedValue<number>,
      delay: number,
    ) => {
      opacityVal.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.ease }),
            withTiming(0.3, { duration: 400, easing: Easing.ease }),
          ),
          -1,
          false,
        ),
      );

      scaleVal.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.3, { duration: 400, easing: Easing.ease }),
            withTiming(1, { duration: 400, easing: Easing.ease }),
          ),
          -1,
          false,
        ),
      );
    };

    createAnimation(dot1Opacity, dot1Scale, 0);
    createAnimation(dot2Opacity, dot2Scale, 200);
    createAnimation(dot3Opacity, dot3Scale, 400);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
    transform: [{ scale: dot1Scale.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
    transform: [{ scale: dot2Scale.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
    transform: [{ scale: dot3Scale.value }],
  }));

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
};

const MaintenanceScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const router = useRouter();

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSubscribe = () => {
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    // Simulate API request delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail("");
    }, 1000);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a" }}>
              Studio
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <Animated.View style={[styles.contentContainer, animatedStyle]}>
              {/* Brand Tag / Accent Dot */}
              <View style={styles.brandBadgeContainer}>
                <View style={styles.badgeDot} />
                <Text style={styles.brandBadgeText}>Lunching Soon</Text>
              </View>

              {/* Center Hero Illustration */}
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: MAINTENANCE_IMAGE_URI }}
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </View>

              {/* Text Section */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>Under Maintenance</Text>
                <Text style={styles.subtitle}>
                  We're launching something exciting.
                </Text>
                <Text style={styles.description}>
                  Our new experience will be available soon. Thank you for your
                  patience.
                </Text>
              </View>

              {/* Minimalist Premium Email Form */}
              <View style={styles.formContainer}>
                {isSubmitted ? (
                  <View style={styles.successBadge}>
                    <Text style={styles.successText}>
                      ✦ You're on the exclusive VIP list.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email for early access"
                      placeholderTextColor="#A0A0A0"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        isSubmitting && styles.submitButtonDisabled,
                      ]}
                      onPress={handleSubscribe}
                      activeOpacity={0.8}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.submitButtonText}>
                        {isSubmitting ? "..." : "NOTIFY ME"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Custom Animated Three-Dots Loader */}
              <View style={styles.loaderContainer}>
                <AnimatedDots />
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </>
  );
};

export default MaintenanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  brandBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F87387",
    marginRight: 8,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderWidth: 0.1,
    borderColor: "#F0F0F0",
    borderRadius: 60,
    // overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    padding: 10,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    maxWidth: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    width: "100%",
    maxWidth: 340,
    marginTop: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 30,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#000000",
  },
  submitButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  successBadge: {
    backgroundColor: "#FFF0F2",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE0E4",
  },
  successText: {
    color: "#F87387",
    fontSize: 13,
    fontWeight: "600",
  },
  loaderContainer: {
    marginTop: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#F87387",
  },
});
