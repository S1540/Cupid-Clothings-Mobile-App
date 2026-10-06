export function swipeTarget(index: number, count: number, width: number, distance: number, velocity: number) {
  "worklet";
  if (count < 2 || width <= 0) return 0;
  const threshold = Math.min(width * 0.22, 48);
  const direction = Math.abs(velocity) > 450 ? Math.sign(velocity)
    : Math.abs(distance) > threshold ? Math.sign(distance) : 0;
  return Math.max(0, Math.min(count - 1, index - direction));
}
