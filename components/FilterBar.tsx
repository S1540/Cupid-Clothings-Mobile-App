import { Modal, Pressable, ScrollView, TouchableOpacity } from "react-native";
import { memo, useState } from "react";
import { View } from "react-native-reanimated/lib/typescript/Animated";
import { Text } from "@react-navigation/elements";

// ─── FILTER TYPES---------------------------------------------
type FilterState = {
  priceRange: string | null;
  sizes: string[];
  discount: string | null;
  sort: string | null;
};

// ─── FILTER MODAL COMPONENT -------------------------------------
const FilterModal = memo(
  ({
    visible,
    onClose,
    onApply,
  }: {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
  }) => {
    const [selected, setSelected] = useState<FilterState>({
      priceRange: null,
      sizes: [],
      discount: null,
      sort: null,
    });

    const toggle = (key: keyof FilterState, value: string) => {
      if (key === "sizes") {
        setSelected((prev) => ({
          ...prev,
          sizes: prev.sizes.includes(value)
            ? prev.sizes.filter((s) => s !== value)
            : [...prev.sizes, value],
        }));
      } else {
        setSelected((prev) => ({
          ...prev,
          [key]: prev[key] === value ? null : value,
        }));
      }
    };

    const clear = () =>
      setSelected({ priceRange: null, sizes: [], discount: null, sort: null });

    const Chip = ({
      label,
      active,
      onPress,
    }: {
      label: string;
      active: boolean;
      onPress: () => void;
    }) => (
      <Pressable
        onPress={onPress}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: active ? "#F87387" : "#e5e5e5",
          backgroundColor: active ? "#fff0f4" : "#fff",
          marginRight: 8,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: "600",
            color: active ? "#F87387" : "#555",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );

    const Section = ({
      title,
      children,
    }: {
      title: string;
      children: React.ReactNode;
    }) => (
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "800",
            color: "#1a1a1a",
            marginBottom: 12,
            letterSpacing: 0.3,
          }}
        >
          {title}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {children}
        </View>
      </View>
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        {/* Backdrop */}
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
        />

        {/* Sheet */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "80%",
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: "#e0e0e0",
              borderRadius: 99,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 4,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: "#f0f0f0",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#1a1a1a" }}>
              Sort & Filter
            </Text>
            <Pressable onPress={clear}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#F87387" }}
              >
                Clear All
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 20, paddingTop: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* SORT */}
            <Section title="SORT BY">
              {[
                "Recommended",
                "Newest First",
                "Price: Low to High",
                "Price: High to Low",
                "Discount",
              ].map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={selected.sort === s}
                  onPress={() => toggle("sort", s)}
                />
              ))}
            </Section>

            {/* PRICE */}
            <Section title="PRICE RANGE">
              {["Under ₹299", "₹300 – ₹599", "₹600 – ₹999", "Above ₹1000"].map(
                (p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={selected.priceRange === p}
                    onPress={() => toggle("priceRange", p)}
                  />
                ),
              )}
            </Section>

            {/* DISCOUNT */}
            <Section title="DISCOUNT">
              {["10% & above", "20% & above", "30% & above", "50% & above"].map(
                (d) => (
                  <Chip
                    key={d}
                    label={d}
                    active={selected.discount === d}
                    onPress={() => toggle("discount", d)}
                  />
                ),
              )}
            </Section>

            {/* SIZE */}
            <Section title="SIZE">
              {[
                "XS",
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                "3XL",
                "4XL",
                "5XL",
                "6XL",
                "7XL",
              ].map((sz) => (
                <Chip
                  key={sz}
                  label={sz}
                  active={selected.sizes.includes(sz)}
                  onPress={() => toggle("sizes", sz)}
                />
              ))}
            </Section>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Apply Button */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              backgroundColor: "#fff",
              borderTopWidth: 0.5,
              borderTopColor: "#f0f0f0",
            }}
          >
            <Pressable
              onPress={() => {
                onApply(selected);
                onClose();
              }}
              style={{
                backgroundColor: "#F87387",
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  },
);
