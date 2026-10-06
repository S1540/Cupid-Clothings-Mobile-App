export type PhonePurpose = "login" | "link" | "change" | "reauth";
type Identity = { uid: string };
export async function applyPhoneCredential<T>(options: {
  purpose: PhonePurpose;
  credential: T;
  expectedUid: string | null;
  currentUser: () => Identity | null;
  signIn: (credential: T) => Promise<unknown>;
  link: (credential: T) => Promise<unknown>;
  change: (credential: T) => Promise<unknown>;
  reauthenticate: (credential: T) => Promise<unknown>;
}) {
  const { purpose, credential, expectedUid, currentUser } = options;
  if (purpose === "login") {
    if (currentUser()) throw { code: "auth/user-mismatch" };
    await options.signIn(credential);
    return;
  }
  if (!expectedUid || currentUser()?.uid !== expectedUid)
    throw { code: "auth/user-mismatch" };
  // Credential collisions propagate. There is intentionally no merge/delete or
  // sign-in fallback here: linking must retain the authenticated original UID.
  await (
    purpose === "link"
      ? options.link
      : purpose === "change"
        ? options.change
        : options.reauthenticate
  )(credential);
  if (currentUser()?.uid !== expectedUid) throw { code: "auth/user-mismatch" };
}
