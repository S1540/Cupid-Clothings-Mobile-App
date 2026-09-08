import { useEffect } from "react";
import { collection, onSnapshot } from "@react-native-firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { useOrderStore, type Order } from "@/store/orderStore";

// Mounted once at the session boundary, including on direct Order Details entry.
export function useOrderSubscription(uid: string | null) {
  const retryVersion = useOrderStore(state => state.retryVersion);
  useEffect(() => {
    const store = useOrderStore.getState();
    store.startSession(uid);
    if (!uid) return;
    let active = true;
    const unsubscribe = onSnapshot(collection(db, "users", uid, "orders"), snapshot => {
      if (!active || auth.currentUser?.uid !== uid) return;
      useOrderStore.getState().setOrders(snapshot.docs.map(item => ({ ...item.data(), orderId: item.id }) as Order));
    }, () => {
      if (active && auth.currentUser?.uid === uid) useOrderStore.getState().setError("We couldn't load your orders. Check your connection and try again.");
    });
    return () => { active = false; unsubscribe(); };
  }, [uid, retryVersion]);
}
