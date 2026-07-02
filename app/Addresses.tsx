// screens/MyAddresses.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
} from "react-native";
import { Ionicons, Feather, EvilIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

// ─── Types
type addressType = "Home" | "Work" | "Other";

interface Address {
  id: string;
  type: addressType;
  isDefault: boolean;
  fullName: string;
  mobile: string;
  altMobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

// Badge Config
const BADGE_CONFIG: Record<
  addressType,
  { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Home: { bg: "#FFF0F4", color: "#E85D75", icon: "home-outline" },
  Work: { bg: "#EEF3FF", color: "#4A6CF7", icon: "briefcase-outline" },
  Other: { bg: "#F0FFF4", color: "#27AE60", icon: "location-outline" },
};

// Address Card
const AddressCard = ({
  address,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) => {
  const badge = BADGE_CONFIG[address.type];
  const isActive = address.isDefault;

  return (
    <Pressable
      onPress={onSelect}
      style={{
        backgroundColor: isActive ? "#FFF7F8" : "#fff",
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: isActive ? "#F87387" : "#EBEBEB",
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Pressable
          onPress={onSetDefault}
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          {/* Radio */}
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: isActive ? "#E85D75" : "#ddd",
              backgroundColor: isActive ? "#E85D75" : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isActive && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#fff",
                }}
              />
            )}
          </View>

          {/* Type badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: badge.bg,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 99,
            }}
          >
            <Ionicons name={badge.icon} size={11} color={badge.color} />
            <Text
              style={{ fontSize: 11, fontWeight: "700", color: badge.color }}
            >
              {address.type}
            </Text>
          </View>

          {/* Default tag */}
          {address.isDefault && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                backgroundColor: "#FFF0F4",
                borderWidth: 1,
                borderColor: "#FFD6DE",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 99,
              }}
            >
              <Ionicons name="checkmark" size={10} color="#E85D75" />
              <Text
                style={{ fontSize: 10, fontWeight: "700", color: "#E85D75" }}
              >
                Default
              </Text>
            </View>
          )}
        </Pressable>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity
            onPress={onEdit}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              //   backgroundColor: "#FFF0F4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="edit-2" size={18} color="#E85D75" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              //   backgroundColor: "#FFF2F2",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="trash-2" size={18} color="#E24B4A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Name */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: "#1C1C1C",
          marginBottom: 2,
        }}
      >
        {address.fullName}
      </Text>

      {/* Phone */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginBottom: 8,
        }}
      >
        <Ionicons name="call-outline" size={12} color="#999" />
        <Text style={{ fontSize: 12, color: "#777" }}>{address.mobile}</Text>
        <Text style={{ fontSize: 12, color: "#777" }}> | </Text>
        <Text style={{ fontSize: 12, color: "#777" }}>{address.altMobile}</Text>
      </View>

      {/* Address */}
      <Text style={{ fontSize: 12, color: "#555", lineHeight: 18 }}>
        {address.addressLine},{"\n"}
        {address.city}, {address.state} — {address.pincode}
      </Text>

      {/* Bottom row */}
      <View
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "#F5F5F5",
        }}
      >
        {address.isDefault ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="checkmark-circle" size={13} color="#aaa" />
            <Text style={{ fontSize: 12, color: "#aaa" }}>
              Default delivery address
            </Text>
          </View>
        ) : (
          <TouchableOpacity onPress={onSetDefault}>
            <Text style={{ fontSize: 12, color: "#E85D75", fontWeight: "700" }}>
              Set as default
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
};

// ─── Delete Modal -----------------------------------------
const DeleteModal = ({
  visible,
  address,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  address: Address | null;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onCancel}
  >
    <Pressable
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
      }}
      onPress={onCancel}
    >
      <Pressable
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          paddingBottom: 40,
        }}
        onPress={() => {}}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#FFF2F2",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginBottom: 14,
          }}
        >
          <Feather name="trash-2" size={24} color="#F87387" />
        </View>

        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: "#1C1C1C",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Delete this address?
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#777",
            textAlign: "center",
            lineHeight: 19,
            marginBottom: 16,
          }}
        >
          This address will be permanently removed from your saved addresses.
        </Text>

        {address && (
          <View
            style={{
              backgroundColor: "#FFF7F8",
              borderRadius: 6,
              padding: 12,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 12, color: "#555", lineHeight: 18 }}>
              {address.type} · {address.addressLine}, {address.city} —{" "}
              {address.pincode}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 6,
              backgroundColor: "#F5F5F5",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#555" }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 6,
              backgroundColor: "#F87387",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
              Yes, Delete
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Empty State ──────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      backgroundColor: "#fff",
    }}
  >
    <View
      style={{
        width: 140,
        height: 140,
        borderRadius: 44,
        // backgroundColor: "#FFF0F4",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
      }}
    >
      <Text style={{ fontSize: 100, fontWeight: "700", color: "#F87387" }}>
        🏠
      </Text>
      {/* <Ionicons name="location-outline" size={42} color="#F87387" /> */}
    </View>
    <Text
      style={{
        fontSize: 17,
        fontWeight: "700",
        color: "#1C1C1C",
        textAlign: "center",
        marginBottom: 8,
      }}
    >
      No saved addresses
    </Text>
    <Text
      style={{
        fontSize: 13,
        color: "#777",
        textAlign: "center",
        lineHeight: 19,
        marginBottom: 24,
      }}
    >
      Add your first delivery address{"\n"}to continue shopping
    </Text>
    <TouchableOpacity
      onPress={onAdd}
      style={{
        paddingHorizontal: 24,
        paddingVertical: 13,
        borderRadius: 6,
        backgroundColor: "#F87387",
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
        Add Address
      </Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────
export default function MyAddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const isMaxReached = addresses.length >= 6;

  // Address fetch to firebase
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const addressRef = collection(db, "users", user.uid, "address");
        const snapshot = await getDocs(addressRef);
        const fetchedAddresses = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.addressType,
            isDefault: data.isDefault,
            fullName: data.fullName,
            mobile: data.mobile,
            altMobile: data.altMobile,
            addressLine: `${data.flat}, ${data.area}`,
            city: data.city,
            state: data.stateName,
            pincode: data.pincode,
          };
        });

        setAddresses(fetchedAddresses as Address[]);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    };

    fetchAddresses();
  }, []);

  // ── Handlers (wire to Firebase later) ──
  const handleSelect = (id: string) => {
    setSelectedId(id);
    // TODO: save selected address to order context / local state
  };

  const handleSetDefault = async (id: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const batch = writeBatch(db);
      addresses.forEach((address) => {
        const ref = doc(db, "users", user.uid, "address", address.id);

        batch.update(ref, {
          isDefault: address.id === id,
        });
      });
      await batch.commit();
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        })),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = (address: Address) => {
    router.push({
      pathname: "/Delivery-Address",
      params: {
        addressId: address.id,
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) {
      const remaining = addresses.filter((a) => a.id !== deleteTarget.id);
      setSelectedId(remaining[0]?.id ?? "");
    }
    setDeleteTarget(null);
    // TODO: Firebase delete — remove doc by deleteTarget.id
  };

  const handleAddNew = () => {
    if (isMaxReached) return;
    router.push("/Delivery-Address");
    // console.log("Add new address");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingBottom: insets.bottom,
      }}
    >
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#1a1a1a",
                paddingLeft: 8,
              }}
            >
              Saved Addresses
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#111111" />
            </Pressable>
          ),
        }}
      />
      {/* List / Empty */}
      {addresses.length === 0 ? (
        <EmptyState onAdd={handleAddNew} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
        >
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={selectedId === address.id}
              onSelect={() => handleSelect(address.id)}
              onEdit={() => handleEdit(address)}
              onDelete={() => setDeleteTarget(address)}
              onSetDefault={() => handleSetDefault(address.id)}
            />
          ))}

          {isMaxReached && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#FFF0F4",
                borderRadius: 12,
                padding: 12,
                marginTop: 4,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#E85D75"
              />
              <Text
                style={{ fontSize: 12, color: "#E85D75", fontWeight: "600" }}
              >
                Maximum 5 addresses reached
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Button */}
      {addresses.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 30,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#EBEBEB",
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: insets.bottom + 14,
          }}
        >
          <TouchableOpacity
            onPress={handleAddNew}
            disabled={isMaxReached}
            style={{
              backgroundColor: isMaxReached ? "#f5c0c8" : "#E85D75",
              borderRadius: 8,
              paddingVertical: 15,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
              Add New Address
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Modal */}
      <DeleteModal
        visible={!!deleteTarget}
        address={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </View>
  );
}
