import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";

import * as Location from "expo-location";
import Mapbox from "@rnmapbox/maps";
import { useLocationStore } from "@/store/useLocationStore";
import { EvilIcons, Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

export default function SelectLocation() {
  const [showSheet, setShowSheet] = useState(true);
  const [showAddress, setShowAddress] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const router = useRouter();

  // Saved DAta in Zustand Store
  const setLocation = useLocationStore((state) => state.setLocation);
  // Search Apis
  const searchPlaces = async (text: string) => {
    try {
      setSearch(text);
      if (text.length < 2) {
        setSuggestions([]);
        return;
      }
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${text}.json?access_token=${process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN}&autocomplete=true&limit=8&country=IN`,
      );
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.log(error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setShowSheet(false);
      setShowAddress(true);
      setLocationName("");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setShowAddress(false);
        setShowSheet(true);

        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lng = location.coords.longitude;
      const lat = location.coords.latitude;
      setCoords([lng, lat]);

      // REVERSE GEOCODING
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN}`,
      );
      const data = await response.json();
      const place = data.features?.[0]?.place_name;
      await new Promise((r) => setTimeout(r, 700));

      setLocationName(place);
      setLocation(place, [lat, lng]);
    } catch (error) {
      console.log(error);
      setShowAddress(false);
      setShowSheet(true);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "#fff7f8",
          },

          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
            </Pressable>
          ),
        }}
      />

      <View
        style={{
          flex: 1,
          backgroundColor: "#fff7f8",
        }}
      >
        {/* MAP */}
        {coords ? (
          <Mapbox.MapView
            style={{ flex: 1 }}
            logoEnabled={false}
            scaleBarEnabled={false}
            compassEnabled={false}
          >
            <Mapbox.Camera zoomLevel={15} centerCoordinate={coords} />
            <Mapbox.PointAnnotation id="current-location" coordinate={coords} />
          </Mapbox.MapView>
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: "#fff7f8",
            }}
          />
        )}

        {/* SEARCH BAR */}
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            right: 10,
          }}
        >
          <View
            style={{
              height: 56,
              borderRadius: 6,
              backgroundColor: "#fff",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Feather name="search" size={20} color="#666" />

            <TextInput
              value={search}
              onChangeText={searchPlaces}
              placeholder="Search city, area, street..."
              placeholderTextColor="#777"
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 15,
                color: "#111",
              }}
            />
          </View>
          {suggestions.length > 0 && (
            <View
              style={{
                marginTop: 10,
                backgroundColor: "#fff",
                borderRadius: 18,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              {suggestions.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    const lng = item.center[0];
                    const lat = item.center[1];
                    setCoords([lng, lat]);
                    setLocationName(item.place_name);
                    setSuggestions([]);
                    setSearch(item.place_name);
                    setLocation(item.place_name, [lat, lng]);
                    router.push("./Cart");
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth:
                        index !== suggestions.length - 1 ? 1 : 0,

                      borderBottomColor: "#f2f2f2",
                    }}
                  >
                    <Feather name="map-pin" size={18} color="#F87387" />

                    <Text
                      style={{
                        flex: 1,

                        marginLeft: 12,

                        fontSize: 14,

                        color: "#111",

                        lineHeight: 20,
                      }}
                    >
                      {item.place_name}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* FIRST SHEET */}
        {showSheet && (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "flex-end",
              flex: 1,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                paddingHorizontal: 20,
                paddingTop: 14,
                paddingBottom: 26,
              }}
            >
              {/* HANDLE */}
              <View
                style={{
                  width: 56,
                  height: 5,
                  borderRadius: 99,
                  backgroundColor: "#ddd",
                  alignSelf: "center",
                  marginBottom: 24,
                }}
              />

              {/* TITLE */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: "#111",
                  letterSpacing: -0.6,
                }}
              >
                Select Delivery Location
              </Text>

              {/* SUB */}
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: "#666",
                  marginTop: 8,
                  marginBottom: 28,
                }}
              >
                Choose your preferred delivery location for faster and smoother
                shopping experience.
              </Text>

              {/* BTN 1 */}
              <Pressable onPress={getCurrentLocation}>
                <View
                  style={{
                    height: 58,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: "#F87387",
                    backgroundColor: "#F87387",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 99,
                      backgroundColor: "#F87387",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Feather name="navigation" size={18} color="#fff" />
                  </View>

                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: "800",
                    }}
                  >
                    Use Your Current Location
                  </Text>
                </View>
              </Pressable>

              {/* BTN 2 */}
              <Pressable>
                <View
                  style={{
                    height: 58,
                    borderRadius: 4,
                    borderColor: "#F87387",
                    borderWidth: 1,
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#ff4f81",
                    shadowOffset: {
                      width: 0,
                      height: 4,
                    },
                    shadowOpacity: 0.24,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 99,
                      backgroundColor: "#F87387",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Feather name="map-pin" size={18} color="#fff" />
                  </View>

                  <Text
                    style={{
                      color: "#F87387",
                      fontSize: 15,
                      fontWeight: "800",
                    }}
                  >
                    Add Your Address
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* ADDRESS SHEET */}
        {showAddress && (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "flex-end",
              flex: 1,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                paddingHorizontal: 20,
                paddingTop: 14,
                paddingBottom: 26,
              }}
            >
              {/* HANDLE */}
              <View
                style={{
                  width: 56,
                  height: 5,
                  borderRadius: 99,
                  backgroundColor: "#ddd",
                  alignSelf: "center",
                  marginBottom: 24,
                }}
              />

              {/* TITLE */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#111",
                  marginBottom: 18,
                }}
              >
                Delivery Location
              </Text>

              {/* LOADING */}
              {!locationName ? (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 34,
                  }}
                >
                  <View
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 999,
                      backgroundColor: "#fff0f4",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 18,
                    }}
                  >
                    <ActivityIndicator size="large" color="#F87387" />
                  </View>

                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#111",
                      marginBottom: 8,
                    }}
                  >
                    Fetching Your Location
                  </Text>

                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 21,
                      textAlign: "center",
                      color: "#777",
                    }}
                  >
                    Please wait while we detect your realtime delivery address
                  </Text>
                </View>
              ) : (
                <>
                  {/* ADDRESS CARD */}
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#f2d7df",
                      borderRadius: 6,
                      padding: 16,
                      backgroundColor: "#fff7f9",
                      marginBottom: 24,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                      }}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 999,
                          backgroundColor: "#F87387",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Feather name="map-pin" size={20} color="#fff" />
                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "800",
                            color: "#111",
                            marginBottom: 6,
                          }}
                        >
                          Current Location
                        </Text>

                        <Text
                          style={{
                            fontSize: 13,

                            lineHeight: 22,

                            color: "#666",
                          }}
                        >
                          {locationName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* CONFIRM BTN */}
                  <Pressable
                    onPress={() => {
                      setShowAddress(false);
                      router.push("./Cart");
                    }}
                  >
                    <View
                      style={{
                        height: 58,
                        borderRadius: 6,
                        backgroundColor: "#F87387",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#F87387",
                        shadowOffset: {
                          width: 0,
                          height: 10,
                        },
                        shadowOpacity: 0.24,
                        shadowRadius: 10,
                        elevation: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,

                          borderRadius: 999,

                          backgroundColor: "rgba(255,255,255,0.16)",

                          alignItems: "center",

                          justifyContent: "center",

                          marginRight: 10,
                        }}
                      >
                        <Feather name="check" size={18} color="#fff" />
                      </View>

                      <Text
                        style={{
                          color: "#fff",

                          fontSize: 15,

                          fontWeight: "800",
                        }}
                      >
                        Confirm Address
                      </Text>
                    </View>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </>
  );
}
