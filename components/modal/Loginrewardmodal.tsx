// components/modal/Loginrewardmodal.tsx
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LoginRewardModalProps {
  visible: boolean;
  onClose: () => void;
  onClaim: () => void;
  offerPercentage?: number;
}

type Stage = "gift" | "opening" | "reward";

const CARD_REVEAL_DELAY = 300;

const LoginRewardModal = React.memo(
  ({
    visible,
    onClose,
    onClaim,
    offerPercentage = 15,
  }: LoginRewardModalProps) => {
    const [stage, setStage] = useState<Stage>("gift");
    const tappedRef = useRef(false);
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();

    // Idle floating gift
    const giftTranslateY = useSharedValue(-8);
    const giftScale = useSharedValue(0.95);

    // Bottom sheet entrance
    const sheetTranslateY = useSharedValue(screenHeight);
    const backdropOpacity = useSharedValue(0);

    const startFloatingLoop = useCallback(() => {
      giftTranslateY.value = -8;
      giftTranslateY.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 1200 }),
          withTiming(-8, { duration: 1200 }),
        ),
        -1,
        true,
      );

      giftScale.value = 0.95;
      giftScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0.95, { duration: 1200 }),
        ),
        -1,
        true,
      );
    }, [giftTranslateY, giftScale]);

    // Reset + start float loop whenever the modal opens
    useEffect(() => {
      if (visible) {
        tappedRef.current = false;
        setStage("gift");

        sheetTranslateY.value = screenHeight;
        backdropOpacity.value = withTiming(1, { duration: 250 });

        startFloatingLoop();
      } else {
        cancelAnimation(giftTranslateY);
        cancelAnimation(giftScale);
        backdropOpacity.value = 0;
      }
    }, [
      visible,
      screenHeight,
      startFloatingLoop,
      giftTranslateY,
      giftScale,
      sheetTranslateY,
      backdropOpacity,
    ]);

    // Move from "opening" (confetti) to "reward" (sheet) after the delay
    useEffect(() => {
      if (stage !== "opening") return;

      const timer = setTimeout(() => {
        setStage("reward");
      }, CARD_REVEAL_DELAY);

      return () => clearTimeout(timer);
    }, [stage]);

    // Slide the bottom sheet up once we reach the "reward" stage
    useEffect(() => {
      if (stage !== "reward") return;

      sheetTranslateY.value = withTiming(0, { duration: 380 });
    }, [stage, sheetTranslateY]);

    const handleGiftGone = useCallback(() => {
      setStage("opening");
    }, []);

    const handleGiftPress = useCallback(() => {
      if (tappedRef.current) return;
      tappedRef.current = true;

      cancelAnimation(giftTranslateY);

      giftScale.value = withSequence(
        withTiming(0.9, { duration: 120 }),
        withTiming(1.05, { duration: 140 }),
        withTiming(0, { duration: 180 }, (finished) => {
          if (finished) {
            runOnJS(handleGiftGone)();
          }
        }),
      );
    }, [giftTranslateY, giftScale, handleGiftGone]);

    const giftAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: giftTranslateY.value },
        { scale: giftScale.value },
      ],
    }));

    const sheetAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: sheetTranslateY.value }],
    }));

    const backdropAnimatedStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          {stage === "gift" && (
            <Pressable
              onPress={handleGiftPress}
              hitSlop={24}
              style={styles.giftTapArea}
            >
              <Animated.View style={giftAnimatedStyle}>
                <LottieView
                  source={require("../../assets/lottie/offer-box.json")}
                  autoPlay
                  loop
                  style={styles.giftLottie}
                />
              </Animated.View>
              <View style={styles.giftTextWrap}>
                <Text style={styles.giftEmoji}>🎁 Surprise Reward</Text>
                <Text style={styles.giftSubtitle}>
                  Unlock your exclusive welcome offer
                </Text>
              </View>
            </Pressable>
          )}

          {(stage === "opening" || stage === "reward") && (
            <LottieView
              source={require("../../assets/lottie/confetti.json")}
              autoPlay
              loop={false}
              style={styles.confetti}
              //   pointerEvents="none"
            />
          )}
        </Animated.View>

        {/* Bottom sheet — separate layer so it slides independently of the backdrop fade */}
        {stage === "reward" && (
          <Animated.View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
              sheetAnimatedStyle,
            ]}
          >
            <View style={styles.sheetHandle} />

            <Text style={styles.cardEyebrow}>🎉 Congratulations!</Text>
            <Text style={styles.cardOffer}>{offerPercentage}% OFF</Text>
            <Text style={styles.cardBody}>
              Your welcome reward has been unlocked.
            </Text>
            <Text style={styles.cardSubBody}>
              Login now to claim your exclusive offer.
            </Text>

            <Pressable style={styles.primaryButton} onPress={onClaim}>
              <Text style={styles.primaryButtonText}>Login & Claim Offer</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </Pressable>
          </Animated.View>
        )}
      </Modal>
    );
  },
);

LoginRewardModal.displayName = "LoginRewardModal";

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 8, 14, 0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftTapArea: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  giftLottie: {
    width: 220,
    height: 220,
  },
  giftTextWrap: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 32,
  },
  giftEmoji: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  giftSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  confetti: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 99,
    marginBottom: 18,
  },
  cardEyebrow: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F87387",
    marginBottom: 4,
  },
  cardOffer: {
    fontSize: 44,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
  cardSubBody: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 22,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#F87387",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
});

export default LoginRewardModal;
