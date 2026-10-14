import type { PanGesture } from "react-native-gesture-handler";

/** Let the enclosing page scroll unless the user clearly drags sideways. */
export function configureHorizontalCarouselPan(gesture: PanGesture) {
  gesture.activeOffsetX([-16, 16]).failOffsetY([-10, 10]);
}
