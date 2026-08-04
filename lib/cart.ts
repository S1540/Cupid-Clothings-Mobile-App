import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import {
  CART_STORAGE_KEY,
  createCartKey,
  type CartItem,
} from "@/store/cartStore";

type StoredCartItem = Partial<CartItem> & {
  id?: unknown;
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
  price?: unknown;
  compareAtPrice?: unknown;
  discountPercent?: unknown;
  size?: unknown;
  handle?: unknown;
  title?: unknown;
  image?: unknown;
  cartKey?: unknown;
};

type CartDocument = {
  sourceIds: string[];
  item: CartItem;
  needsMigration: boolean;
};

const asText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const asNumber = (value: unknown): number | undefined => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const asPositiveInteger = (value: unknown): number => {
  const numberValue = Math.floor(Number(value));
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 1;
};

/** Firestore document IDs cannot contain slashes from Shopify GIDs. */
export function getCartDocumentId(cartKey: string): string {
  return encodeURIComponent(cartKey);
}

function legacyVariantId(productId: string, sourceId: string): string {
  return `legacy:${encodeURIComponent(sourceId || productId)}`;
}

function normalizeCartItem(
  raw: StoredCartItem,
  sourceId: string,
): CartDocument | null {
  const productId = asText(raw.productId) || asText(raw.id);
  if (!productId) return null;

  // Older app versions saved some rows without a variant. Keep them visible
  // without allowing them to collide; checkout validation will ask the user to
  // reselect that product because a real Shopify variant cannot be inferred.
  const originalVariantId = asText(raw.variantId);
  const variantId = originalVariantId || legacyVariantId(productId, sourceId);
  const cartKey = createCartKey(productId, variantId);
  const price = asNumber(raw.price) ?? 0;
  const compareAtPrice = asNumber(raw.compareAtPrice);
  const discountPercent = asNumber(raw.discountPercent);

  const item: CartItem = {
    cartKey,
    productId,
    variantId,
    title: asText(raw.title),
    image: asText(raw.image),
    price,
    ...(compareAtPrice === undefined ? {} : { compareAtPrice }),
    ...(discountPercent === undefined ? {} : { discountPercent }),
    handle: asText(raw.handle),
    quantity: asPositiveInteger(raw.quantity),
    size: asText(raw.size),
  };

  return {
    sourceIds: [sourceId],
    item,
    needsMigration:
      raw.cartKey !== cartKey ||
      raw.productId !== productId ||
      raw.id !== undefined ||
      !originalVariantId ||
      raw.quantity !== item.quantity ||
      raw.price !== price,
  };
}

function mergeCartDocuments(documents: CartDocument[]): CartDocument[] {
  const byKey = new Map<string, CartDocument>();

  for (const document of documents) {
    const existing = byKey.get(document.item.cartKey);
    if (!existing) {
      byKey.set(document.item.cartKey, document);
      continue;
    }

    byKey.set(document.item.cartKey, {
      ...existing,
      sourceIds: [...existing.sourceIds, ...document.sourceIds],
      item: {
        ...existing.item,
        quantity: existing.item.quantity + document.item.quantity,
      },
      needsMigration: true,
    });
  }

  return [...byKey.values()];
}

async function readGuestCart(): Promise<CartDocument[]> {
  const rawValue = await AsyncStorage.getItem(CART_STORAGE_KEY);
  if (!rawValue) return [];

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => normalizeCartItem(item as StoredCartItem, String(index)))
      .filter((item): item is CartDocument => item !== null);
  } catch {
    return [];
  }
}

async function readFirebaseCart(user: User): Promise<CartDocument[]> {
  const snapshot = await getDocs(collection(db, "users", user.uid, "cart"));
  return snapshot.docs
    .map((snapshotDocument) =>
      normalizeCartItem(
        snapshotDocument.data() as StoredCartItem,
        snapshotDocument.id,
      ),
    )
    .filter((item): item is CartDocument => item !== null);
}

async function migrateGuestCart(documents: CartDocument[]): Promise<void> {
  await AsyncStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(documents.map((document) => document.item)),
  );
}

async function migrateFirebaseCart(
  user: User,
  documents: CartDocument[],
): Promise<void> {
  const batch = writeBatch(db);
  let changed = false;

  for (const document of documents) {
    const destination = doc(
      db,
      "users",
      user.uid,
      "cart",
      getCartDocumentId(document.item.cartKey),
    );

    const hasSupersededSource = document.sourceIds.some(
      (sourceId) => sourceId !== destination.id,
    );
    if (document.needsMigration || hasSupersededSource) {
      batch.set(destination, document.item);
      changed = true;
      for (const sourceId of document.sourceIds) {
        if (sourceId !== destination.id) {
          batch.delete(doc(db, "users", user.uid, "cart", sourceId));
        }
      }
    }
  }

  if (changed) await batch.commit();
}

export async function loadCart(user: User | null): Promise<CartItem[]> {
  const documents = mergeCartDocuments(
    user ? await readFirebaseCart(user) : await readGuestCart(),
  );
  const requiresMigration = documents.some((document) => document.needsMigration);

  if (user) {
    const hasLegacyDocumentId = documents.some(
      (document) =>
        document.sourceIds.some(
          (sourceId) => sourceId !== getCartDocumentId(document.item.cartKey),
        ),
    );
    if (requiresMigration || hasLegacyDocumentId) {
      await migrateFirebaseCart(user, documents);
    }
  } else if (requiresMigration) {
    await migrateGuestCart(documents);
  }

  return documents.map((document) => document.item);
}

async function saveCartLine(user: User | null, item: CartItem): Promise<void> {
  if (user) {
    await setDoc(
      doc(db, "users", user.uid, "cart", getCartDocumentId(item.cartKey)),
      item,
    );
    return;
  }

  const existing = await loadCart(null);
  const updated = existing.some((current) => current.cartKey === item.cartKey)
    ? existing.map((current) =>
        current.cartKey === item.cartKey ? item : current,
      )
    : [item, ...existing];
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
}

export async function addCartLine(
  user: User | null,
  item: CartItem,
): Promise<CartItem[]> {
  const existing = await loadCart(user);
  const current = existing.find((line) => line.cartKey === item.cartKey);
  const line = current
    ? { ...current, quantity: current.quantity + item.quantity }
    : item;

  await saveCartLine(user, line);
  return current
    ? existing.map((existingLine) =>
        existingLine.cartKey === line.cartKey ? line : existingLine,
      )
    : [line, ...existing];
}

export async function setCartLineQuantity(
  user: User | null,
  cartKey: string,
  quantity: number,
): Promise<CartItem[]> {
  const existing = await loadCart(user);
  const line = existing.find((item) => item.cartKey === cartKey);
  if (!line) return existing;

  if (quantity < 1) return removeCartLine(user, cartKey, existing);

  const updatedLine = { ...line, quantity: asPositiveInteger(quantity) };
  await saveCartLine(user, updatedLine);
  return existing.map((item) =>
    item.cartKey === cartKey ? updatedLine : item,
  );
}

export async function removeCartLine(
  user: User | null,
  cartKey: string,
  knownItems?: CartItem[],
): Promise<CartItem[]> {
  const existing = knownItems ?? (await loadCart(user));
  const updated = existing.filter((item) => item.cartKey !== cartKey);

  if (user) {
    await deleteDoc(
      doc(db, "users", user.uid, "cart", getCartDocumentId(cartKey)),
    );
  } else {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
}

export async function clearCart(user: User | null): Promise<void> {
  if (!user) {
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    return;
  }

  const snapshot = await getDocs(collection(db, "users", user.uid, "cart"));
  const batch = writeBatch(db);
  snapshot.docs.forEach((snapshotDocument) => batch.delete(snapshotDocument.ref));
  await batch.commit();
}
