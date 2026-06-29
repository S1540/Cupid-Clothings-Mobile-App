import React, { useRef, useState, useCallback, memo, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  StatusBar,
  Text,
  View,
  Pressable,
  Animated,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Platform,
  ViewToken,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

const { width, height } = Dimensions.get("window");

// ─── TYPES ────────────────────────────────────────────────────
type Reel = {
  id: string;
  video: string;
  user: string;
  avatar: string;
  caption: string;
  likes: number;
  comments: number;
  product: string;
  price: string;
  handle: string;
};

type Comment = {
  id: number;
  user: string;
  text: string;
  time: string;
};

// ─── DATA ─────────────────────────────────────────────────────
const REELS: Reel[] = [
  {
    id: "1",
    video:
      "https://res.cloudinary.com/drsoj4c5q/video/upload/v1779431589/WhatsApp_Video_2026-05-22_at_12.01.00_PM_v8wrdp.mp4",
    user: "cupid_clothing",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=60",
    caption:
      "Oversized fit 😄 New drop just landed! #fashion #ootd #cupidclothing",
    likes: 2341,
    comments: 142,
    product: "Oversized Cotton Tee",
    price: "₹449",
    handle: "oversized-cotton-tee",
  },
  {
    id: "2",
    video:
      "https://res.cloudinary.com/drsoj4c5q/video/upload/v1779431602/WhatsApp_Video_2026-05-22_at_12.01.04_PM_hfblfv.mp4",
    user: "cupid_fashion",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&q=60",
    caption: "Summer drop 🔥 New collection just landed! #summer #trending",
    likes: 5820,
    comments: 310,
    product: "Summer Track Pant",
    price: "₹599",
    handle: "summer-track-pant",
  },
  {
    id: "3",
    video:
      "https://res.cloudinary.com/drsoj4c5q/video/upload/q_auto/f_auto/v1780998991/cupidclothings-20260609-0005_ecpvtp.mp4",
    user: "cupid_fashion",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&q=60",
    caption:
      "New drop just landed! Check out our latest collection. #fashion #cupidclothing",
    likes: 5820,
    comments: 220,
    product: "Cotton Track Pant",
    price: "₹449",
    handle: "summer-track-pant",
  },
  {
    id: "4",
    video:
      "https://res.cloudinary.com/drsoj4c5q/video/upload/q_auto/f_auto/v1780998943/fashionwithchitwan-20260609-0001_cfwugm.mp4",
    user: "cupid_fashion",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&q=60",
    caption: "Summer drop 🔥 New collection just landed! #summer #trending",
    likes: 820,
    comments: 80,
    product: "Summer Track Pant",
    price: "₹699",
    handle: "summer-track-pant",
  },
  {
    id: "5",
    video:
      "https://res.cloudinary.com/drsoj4c5q/video/upload/q_auto/f_auto/v1780998943/cupidclothings-20260609-0006_heaxfg.mp4",
    user: "cupid_fashion",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&q=60",
    caption: "Summer drop 🔥 New collection just landed! #summer #trending",
    likes: 820,
    comments: 80,
    product: "Summer Track Pant",
    price: "₹699",
    handle: "summer-track-pant",
  },
  {
    id: "6",
    video:
      "https://res.cloudinary.com/drsoj4c5q/video/upload/q_auto/f_auto/v1780998943/cupidclothings-20260609-0006_heaxfg.mp4",
    user: "cupid_fashion",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&q=60",
    caption: "Summer drop 🔥 New collection just landed! #summer #trending",
    likes: 560,
    comments: 0,
    product: "Summer Track Pant",
    price: "₹699",
    handle: "summer-track-pant",
  },
];

const MOCK_COMMENTS: Comment[] = [
  { id: 1, user: "priya_s", text: "Love this outfit! 😍", time: "2h" },
  { id: 2, user: "anjali.m", text: "Where can I buy this?", time: "1h" },
  { id: 3, user: "ritu_k", text: "Ordering right now 🛒", time: "45m" },
  { id: 4, user: "sneha_t", text: "The color is gorgeous! ✨", time: "30m" },
  { id: 5, user: "kavita_r", text: "Size guide please?", time: "10m" },
];

// ─── HEART BURST ──────────────────────────────────────────────
const HeartBurst = memo(
  ({ x, y, visible }: { x: number; y: number; visible: boolean }) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (visible) {
        scale.setValue(0);
        opacity.setValue(1);
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1.4,
            tension: 80,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(350),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }
    }, [visible]);

    if (!visible) return null;
    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: x - 50,
          top: y - 50,
          transform: [{ scale }],
          opacity,
          zIndex: 99,
        }}
      >
        <Ionicons name="heart" size={100} color="#ff5c84" />
      </Animated.View>
    );
  },
);

// ─── COMMENTS SHEET ───────────────────────────────────────────
const CommentsSheet = memo(
  ({
    visible,
    onClose,
    count,
  }: {
    visible: boolean;
    onClose: () => void;
    count: number;
  }) => {
    const insets = useSafeAreaInsets();
    const [comment, setComment] = useState("");

    const fmt = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        />
        <View
          style={{
            backgroundColor: "#111",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: height * 0.65,
            paddingBottom: insets.bottom + 10,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: "#444",
              borderRadius: 99,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 4,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
              Comments · {fmt(count)}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#aaa" />
            </Pressable>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {MOCK_COMMENTS.map((c) => (
              <View
                key={c.id}
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginBottom: 18,
                  alignItems: "flex-start",
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 99,
                    backgroundColor: "#333",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#ff5c84",
                      fontWeight: "800",
                      fontSize: 13,
                    }}
                  >
                    {c.user[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}
                    >
                      {c.user}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 11 }}>
                      {c.time}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "#ddd",
                      fontSize: 13,
                      lineHeight: 18,
                      marginTop: 2,
                    }}
                  >
                    {c.text}
                  </Text>
                </View>
                <Pressable style={{ paddingTop: 4 }}>
                  <Ionicons name="heart-outline" size={15} color="#666" />
                </Pressable>
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 16,
              paddingTop: 10,
              borderTopWidth: 0.5,
              borderTopColor: "#333",
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 99,
                backgroundColor: "#ff5c84",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
                Y
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#222",
                borderRadius: 20,
                paddingHorizontal: 14,
                height: 40,
              }}
            >
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment..."
                placeholderTextColor="#555"
                style={{ flex: 1, color: "#fff", fontSize: 13 }}
              />
            </View>
            {comment.length > 0 && (
              <Pressable onPress={() => setComment("")}>
                <Text
                  style={{ color: "#ff5c84", fontWeight: "800", fontSize: 13 }}
                >
                  Post
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    );
  },
);

// ─── REEL ITEM ────────────────────────────────────────────────
const ReelItem = memo(
  ({
    item,
    isActive,
    screenFocused,
  }: {
    item: Reel;
    isActive: boolean;
    screenFocused: boolean;
  }) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likes, setLikes] = useState(item.likes);
    const [muted, setMuted] = useState(false);
    const [buffering, setBuffering] = useState(true);
    const [paused, setPaused] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [heartVisible, setHeartVisible] = useState(false);
    const [heartPos, setHeartPos] = useState({ x: width / 2, y: height / 2 });
    const lastTap = useRef(0);
    const likeAnim = useRef(new Animated.Value(1)).current;
    const shouldPlay = isActive && screenFocused && !paused;

    const player = useVideoPlayer(isActive ? item.video : null, (p) => {
      p.loop = true;
      p.muted = muted;
    });
    useEffect(() => {
      if (isActive) {
        setBuffering(true);
        const timer = setTimeout(() => setBuffering(false), 2000);
        return () => clearTimeout(timer);
      }
    }, [isActive]);

    useEffect(() => {
      if (!player) return;
      try {
        if (shouldPlay) {
          player.play();
        } else {
          player.pause();
        }
      } catch (_) {}
    }, [shouldPlay, player]);

    useEffect(() => {
      if (!player) return;
      player.muted = muted;
    }, [muted, player]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        try {
          player?.pause();
        } catch (_) {}
      };
    }, []);

    // ── GESTURES ----------------------------
    const handleTap = (e: any) => {
      const now = Date.now();
      if (now - lastTap.current < 280) {
        // Double tap
        const { locationX, locationY } = e.nativeEvent;
        setHeartPos({ x: locationX, y: locationY });
        setHeartVisible(true);
        setTimeout(() => setHeartVisible(false), 800);
        if (!liked) {
          setLiked(true);
          setLikes((l) => l + 1);
          bounceHeart();
        }
      } else {
        setPaused((p) => !p);
      }
      lastTap.current = now;
    };

    const bounceHeart = () => {
      Animated.sequence([
        Animated.spring(likeAnim, {
          toValue: 1.45,
          tension: 100,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(likeAnim, {
          toValue: 1,
          tension: 100,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handleLike = () => {
      setLiked((l) => !l);
      setLikes((l) => (liked ? l - 1 : l + 1));
      bounceHeart();
    };

    const fmt = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

    return (
      <View style={{ width, height, backgroundColor: "#000" }}>
        {/* ------VIDEO ----------------------- */}
        <Pressable
          style={{ position: "absolute", inset: 0 }}
          onPress={handleTap}
        >
          {isActive && player ? (
            <VideoView
              player={player}
              style={{ width, height }}
              contentFit="cover"
              nativeControls={false}
              allowsFullscreen={false}
            />
          ) : (
            <View style={{ width, height, backgroundColor: "#0a0a0a" }} />
          )}
        </Pressable>

        {/* ── BUFFERING --------------------*/}
        {isActive && buffering && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <ActivityIndicator color="#ff5c84" size="large" />
          </View>
        )}

        {/* -- PAUSED ICON -------------------------- */}
        {paused && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="pause" size={32} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        )}

        {/* DOUBLE TAP HEART*/}
        <HeartBurst x={heartPos.x} y={heartPos.y} visible={heartVisible} />
        {/*  BOTTOM LEFT — USER + CAPTION + PRODUCT */}
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 85,
            left: 14,
            right: 72,
            gap: 8,
          }}
        >
          {/* Avatar + name + follow */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={{ uri: item.avatar }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                borderWidth: 1.5,
                borderColor: "#ff5c84",
              }}
            />
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>
              @{item.user}
            </Text>
            <Pressable
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.6)",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                Follow
              </Text>
            </Pressable>
          </View>

          {/* Caption */}
          <Text
            numberOfLines={2}
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {item.caption}
          </Text>

          {/* Product tag */}
          {/* <Pressable
            onPress={() =>
              router.push({
                pathname: "/product/[handle]",
                params: { handle: item.handle },
              })
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 0.5,
              borderColor: "rgba(255,255,255,0.25)",
              alignSelf: "flex-start",
            }}
          >
            <Feather name="shopping-bag" size={13} color="#fff" />
            <View>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {item.product}
              </Text>
              <Text
                style={{ color: "#ffb3c6", fontSize: 11, fontWeight: "600" }}
              >
                {item.price}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={13}
              color="rgba(255,255,255,0.6)"
            />
          </Pressable> */}
        </View>

        {/* ── RIGHT SIDE ACTIONS ------------------------ */}
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 95,
            right: 12,
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Like */}
          <View style={{ alignItems: "center", gap: 3 }}>
            <Pressable onPress={handleLike} hitSlop={8}>
              <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={30}
                  color={liked ? "#ff5c84" : "#fff"}
                />
              </Animated.View>
            </Pressable>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
              {fmt(likes)}
            </Text>
          </View>

          {/* Comment */}
          <View style={{ alignItems: "center", gap: 3 }}>
            <Pressable onPress={() => setShowComments(true)} hitSlop={8}>
              <Ionicons name="chatbubble-outline" size={28} color="#fff" />
            </Pressable>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
              {fmt(item.comments)}
            </Text>
          </View>

          {/* Save */}
          <View style={{ alignItems: "center", gap: 3 }}>
            <Pressable onPress={() => setSaved((s) => !s)} hitSlop={8}>
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={28}
                color={saved ? "#FFB800" : "#fff"}
              />
            </Pressable>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
              Save
            </Text>
          </View>

          {/* Share */}
          <View style={{ alignItems: "center", gap: 3 }}>
            <Pressable hitSlop={8}>
              <Feather name="send" size={26} color="#fff" />
            </Pressable>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
              Share
            </Text>
          </View>

          {/* Mute */}
          <Pressable
            onPress={() => setMuted((m) => !m)}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={muted ? "volume-mute" : "volume-high"}
              size={18}
              color="#fff"
            />
          </Pressable>
        </View>

        {/* --------- COMMENTS MODAL ------------------------- */}
        <CommentsSheet
          visible={showComments}
          onClose={() => setShowComments(false)}
          count={item.comments}
        />
      </View>
    );
  },
  (prev, next) =>
    prev.isActive === next.isActive &&
    prev.screenFocused === next.screenFocused &&
    prev.item.id === next.item.id,
);

//----------------------- HEADER --------------------------------------------
const ReelsHeader = memo(
  ({ activeIndex, total }: { activeIndex: number; total: number }) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
      <>
        {/* Back + Studio + Camera */}
        <View
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 0,
            right: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            zIndex: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </Pressable>

            <Pressable
              onPress={() => setDropdownOpen((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                Studio
              </Text>
              <Ionicons
                name={dropdownOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color="#fff"
              />
            </Pressable>
          </View>

          <Pressable hitSlop={8}>
            <Feather name="camera" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Dropdown */}
        {dropdownOpen && (
          <View
            style={{
              position: "absolute",
              top: insets.top + 50,
              alignSelf: "center",
              left: "30%",
              backgroundColor: "rgba(18,18,18,0.96)",
              borderRadius: 12,
              borderWidth: 0.5,
              borderColor: "#333",
              zIndex: 30,
              overflow: "hidden",
              minWidth: 180,
            }}
          >
            {[
              { label: "Customer Reviews", icon: "star-outline" },
              { label: "Cupid Feed", icon: "grid-outline" },
            ].map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => setDropdownOpen(false)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: i === 0 ? 0.5 : 0,
                  borderBottomColor: "#2a2a2a",
                }}
              >
                <Ionicons name={opt.icon as any} size={17} color="#ff5c84" />
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </>
    );
  },
);

// ─── MAIN SCREEN -------------------------------------
export default function Reels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [screenFocused, setScreenFocused] = useState(true);

  // Pause all videos when navigating away
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 75,
    minimumViewTime: 100,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: height,
      offset: height * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelItem
        item={item}
        isActive={index === activeIndex}
        screenFocused={screenFocused}
      />
    ),
    [activeIndex, screenFocused],
  );

  const keyExtractor = useCallback((item: Reel) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar hidden translucent />
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={REELS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // ── PERFORMANCE -----------------------------
        pagingEnabled
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.9}
        snapToInterval={height}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews // unmount off-screen items
        windowSize={3} // render only 3 screens (prev + active + next)
        initialNumToRender={1} // render only first reel initially
        maxToRenderPerBatch={1} // render 1 at a time during scroll
        updateCellsBatchingPeriod={50} // how often to batch updates
        disableIntervalMomentum // snap one item at a time
        bounces={false}
        overScrollMode="never"
        directionalLockEnabled //For IoS Devicess
      />

      {/* Overlay header — outside FlatList to avoid re-renders */}
      <ReelsHeader activeIndex={activeIndex} total={REELS.length} />
    </View>
  );
}
