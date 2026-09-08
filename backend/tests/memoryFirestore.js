// A deterministic transaction harness for service tests, never production data.
const clone = value => structuredClone(value);
const FieldValue = { increment: value => ({ __increment: value }), serverTimestamp: () => new Date("2026-09-06T00:00:00Z") };
class MemoryFirestore {
  constructor(seed = {}) { this.documents = new Map(Object.entries(clone(seed))); this.queue = Promise.resolve(); }
  collection(path) { return new Query(this, path); }
  async runTransaction(action) {
    const run = this.queue.then(async () => {
      const writes = [];
      let wrote = false;
      const tx = {
        get: async ref => { if (wrote) throw new Error("Transaction read after write"); return ref.get(); },
        set: (ref, value, options) => { wrote = true; writes.push(() => ref.set(value, options)); },
        update: (ref, value) => { wrote = true; writes.push(() => ref.update(value)); },
        create: (ref, value) => { wrote = true; writes.push(() => ref.create(value)); },
      };
      const result = await action(tx);
      for (const write of writes) await write();
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
  async recursiveDelete(ref) { for (const path of this.documents.keys()) if (path.startsWith(`${ref.path}/`)) this.documents.delete(path); }
}
class Document {
  constructor(db, path) { this.db = db; this.path = path; this.id = path.split("/").pop(); }
  collection(name) { return new Query(this.db, `${this.path}/${name}`); }
  async get() { const value = this.db.documents.get(this.path); return { id: this.id, ref: this, exists: value !== undefined, data: () => value === undefined ? undefined : clone(value) }; }
  async set(value, options) {
    const old = this.db.documents.get(this.path) || {};
    const result = options?.merge ? clone(old) : {};
    for (const [key, data] of Object.entries(value)) result[key] = data && typeof data === "object" && Object.hasOwn(data, "__increment") ? (old[key] || 0) + data.__increment : clone(data);
    this.db.documents.set(this.path, result);
  }
  async update(value) { if (!this.db.documents.has(this.path)) throw new Error("Missing document"); return this.set(value, { merge: true }); }
  async create(value) { if (this.db.documents.has(this.path)) throw new Error("Already exists"); return this.set(value); }
  async delete() { this.db.documents.delete(this.path); }
}
class Query {
  constructor(db, path, filters = [], cap = Infinity) { Object.assign(this, { db, path, filters, cap }); }
  doc(id) { return new Document(this.db, `${this.path}/${id}`); }
  where(field, operation, value) { if (operation !== "==") throw new Error("Unsupported test query"); return new Query(this.db, this.path, [...this.filters, [field, value]], this.cap); }
  limit(cap) { return new Query(this.db, this.path, this.filters, cap); }
  async get() {
    const docs = [];
    for (const [path, value] of this.db.documents) {
      if (path.startsWith(`${this.path}/`) && path.split("/").length === this.path.split("/").length + 1 && this.filters.every(([key, expected]) => value[key] === expected)) docs.push(await new Document(this.db, path).get());
      if (docs.length >= this.cap) break;
    }
    return { docs, size: docs.length, empty: docs.length === 0 };
  }
}
module.exports = { MemoryFirestore, FieldValue };
