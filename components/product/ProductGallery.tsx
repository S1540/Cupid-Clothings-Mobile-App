// components/product/ProductGallery.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Swiper from "react-native-swiper";

type ProductImage = { url: string; alt: string };

type Product = {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: ProductImage[];
  price: string;
  compareAtPrice: string | null;
  discountPercent: number | null;
  currency: string;
};

type ProductGalleryProps = {
  product: Product;
  activeImage: number;
  setActiveImage: (index: number) => void;
  wishlist: boolean;
  toggleWishlist: () => void;
};

const ProductGallery = React.memo(
  ({
    product,
    activeImage,
    setActiveImage,
    wishlist,
    toggleWishlist,
  }: ProductGalleryProps) => {
    const { width: screenWidth } = useWindowDimensions();
    // Gallery height: 4:5 portrait ratio, capped for large screens
    const galleryHeight = Math.min(Math.round(screenWidth * 1.5), 580);

    return (
      <View style={{ backgroundColor: "#fafafa" }}>
        {/* Main swiper */}
        <Swiper
          loop={false}
          height={galleryHeight}
          showsPagination={false}
          index={activeImage}
          onIndexChanged={(i: number) => setActiveImage(i)}
        >
          {product.images.map((img, i) => (
            <Image
              key={i}
              source={{ uri: img.url }}
              style={{ width: screenWidth, height: galleryHeight }}
              resizeMode="cover"
            />
          ))}
        </Swiper>

        {/* Wishlist button */}
        <Pressable
          onPress={toggleWishlist}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            backgroundColor: "rgba(255,255,255,0.92)",
            borderRadius: 99,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Ionicons
            name={wishlist ? "heart" : "heart-outline"}
            size={20}
            color={wishlist ? "#ff5c84" : "#555"}
          />
        </Pressable>

        {/* Discount badge */}
        {!!product.discountPercent && (
          <View
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              backgroundColor: "#F87387",
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
              {product.discountPercent}% OFF
            </Text>
          </View>
        )}

        {/* Dot indicators */}
        {product.images.length > 1 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 5,
              paddingTop: 10,
            }}
          >
            {product.images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === activeImage ? 18 : 6,
                  height: 4,
                  borderRadius: 99,
                  backgroundColor: i === activeImage ? "#759EF0" : "#d8d8d8",
                }}
              />
            ))}
          </View>
        )}

        {/* Thumbnail strip */}
        {product.images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10, paddingBottom: 12 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {product.images.map((img: ProductImage, i: number) => (
              <Pressable key={i} onPress={() => setActiveImage(i)}>
                <Image
                  source={{ uri: img.url }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 6,
                    borderWidth: activeImage === i ? 1.5 : 0.5,
                    borderColor: activeImage === i ? "#759EF0DB" : "#eee",
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  },
);

export default ProductGallery;
