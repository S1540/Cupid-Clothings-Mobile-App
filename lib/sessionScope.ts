let currentUid: string | null = null;
const owners = new WeakMap<object, string | null>();
export function setSessionScope(uid: string | null) { currentUid = uid; }
export function scopeResult<T extends object>(value: T, uid: string | null): T { owners.set(value, uid); return value; }
export function isCurrentResult(value: object) { return !owners.has(value) || owners.get(value) === currentUid; }
