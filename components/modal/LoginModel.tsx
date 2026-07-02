import { auth } from "@/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TextInput,
  KeyboardAvoidingView,
  View,
  Platform,
} from "react-native";
import CircleLoader from "../ui/CircleLoader";
const LoginModel = ({
  openLogin,
  setOpenLogin,
  openSignup,
}: {
  openLogin: boolean;
  setOpenLogin: (value: boolean) => void;
  openSignup: (value: boolean) => void;
}) => {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginUser = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setOpenLogin(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      switch (err.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/user-not-found":
          setError("No account found with this email.");
          break;

        case "auth/wrong-password":
          setError("Incorrect password.");
          break;

        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;

        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later.");
          break;

        default:
          setError("Unable to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (openLogin) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 60,
      }).start();
    }
  }, [openLogin]);

  const closeAuthModal = () => {
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setOpenLogin(false));
  };

  return (
    <Modal visible={openLogin} transparent animationType="none">
      {loading ? (
        <CircleLoader />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={closeAuthModal} />
            <Animated.View
              style={{
                transform: [{ translateY: slideAnim }],
                backgroundColor: "#fff",
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 44,
              }}
            >
              {/* Handle  */}
              <View className="w-14 h-1.5 rounded-full bg-[#ddd] self-center mb-6" />

              <Text className="text-2xl font-black text-[#1c1c1c]">
                Welcome Back
              </Text>
              <Text className="text-[#999] mt-1 mb-6 text-[14px]">
                Login to continue shopping
              </Text>

              {/* Email */}
              <View className="border border-[#eee] rounded-xl px-4 flex-row items-center h-[52px]">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  focusable
                  placeholder="Email or Phone"
                  placeholderTextColor="#bbb"
                  className="flex-1 text-[15px] text-[#1c1c1c]"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View className="border border-[#eee] rounded-xl px-4 flex-row items-center h-[52px] mt-3">
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError("");
                  }}
                  placeholder="Password"
                  placeholderTextColor="#bbb"
                  secureTextEntry
                  className="flex-1 text-[15px] text-[#1c1c1c]"
                />
                <Text className="text-[#F87387] text-[12px] font-semibold">
                  Forget Password?
                </Text>
              </View>
              {error ? (
                <Text className="text-red-500 text-[12px] mt-2 ml-1 font-medium">
                  {error}
                </Text>
              ) : null}

              {/* Continue Button */}
              <Pressable
                onPress={loginUser}
                className="bg-[#F87387] rounded-xl items-center justify-center mt-5 h-[52px]"
              >
                <Text className="text-white font-bold text-[15px]">
                  Continue
                </Text>
              </Pressable>

              {/* Sign Up */}
              <Pressable className="items-center mt-4">
                <Text className="text-[#999] text-[13px]">
                  New here?{" "}
                  <Text
                    onPress={() => {
                      setOpenLogin(false);
                      openSignup(true);
                    }}
                    className="text-[#F87387] font-bold "
                  >
                    Create Account
                  </Text>
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
};

export default LoginModel;
