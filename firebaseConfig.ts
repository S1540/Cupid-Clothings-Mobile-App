import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";

// Auth and Firestore share the native default Firebase app and its session.
export const auth = getAuth();
export const db = getFirestore();