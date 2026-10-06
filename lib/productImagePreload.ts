import { Image } from "expo-image";

const queued = new Set<string>();
const completed = new Map<string, number>();
const pending: string[] = [];
let running = 0;

function drain() {
  while (running < 3 && pending.length) {
    const url = pending.shift()!;
    running++;
    void Image.prefetch(url, "memory-disk")
      .then((success) => {
        if (!success) return;
        completed.set(url, Date.now());
        if (completed.size > 240)
          completed.delete(completed.keys().next().value!);
      })
      .catch(() => {
        // A later visible-card event may retry a failed download.
      })
      .finally(() => {
        queued.delete(url);
        running--;
        drain();
      });
  }
}

export function preloadProductImages(
  images: readonly { url: string }[],
  priority = false,
) {
  // Promote the next visible products ahead of offscreen/swipe-neighbour work.
  // Reverse before unshift so the first visible image still starts first.
  for (const { url } of priority ? [...images].reverse() : images) {
    if (!url || Date.now() - (completed.get(url) ?? 0) < 60_000) continue;
    if (queued.has(url)) {
      const index = priority ? pending.indexOf(url) : -1;
      if (index >= 0) {
        pending.splice(index, 1);
        pending.unshift(url);
      }
      continue;
    }
    if (pending.length >= 48) {
      // Prefer cards currently entering the viewport over old queued work.
      queued.delete(priority ? pending.pop()! : pending.shift()!);
    }
    queued.add(url);
    if (priority) pending.unshift(url);
    else pending.push(url);
  }
  drain();
}
