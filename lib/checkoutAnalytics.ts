import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/firebaseConfig";
import { apiRequest } from "./api";
import { Analytics } from "./analytics";
const pending = new Set<string>();
export async function recordConfirmedPurchase(cartId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid || !cartId || pending.has(cartId)) return;
  pending.add(cartId);
  try {
    for (let attempt = 0; attempt < 8 && auth.currentUser?.uid === uid; attempt++) {
      const result = await apiRequest<{ confirmed: boolean; orderId: string; total: number; products: { id: string; title: string; quantity: number; price: number }[] }>("/api/checkout/status", { method: "POST", body: JSON.stringify({ cartId }) });
      if (result.confirmed) {
        const key = `purchase:${uid}:${result.orderId}`;
        if (await AsyncStorage.getItem(key)) return;
        if (auth.currentUser?.uid !== uid) return;
        await Analytics.purchase(result.orderId, result.total, result.products);
        await AsyncStorage.setItem(key, "1");
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch { /* Best effort: never affect checkout completion. */ }
  finally { pending.delete(cartId); }
}
