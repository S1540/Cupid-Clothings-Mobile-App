import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";

const WORDS = ["Plus Size...", "Kids Wear...", "Best Sellers..."];

export function useSearchPlaceholder(enabled = true) {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === "active");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [word, setWord] = useState("Styles");

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduceMotion(value);
    });
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    const app = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => {
      mounted = false;
      motion.remove();
      app.remove();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !focused || !active || reduceMotion) return;
    let index = 0;
    let length = WORDS[0].length;
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;
    setWord(WORDS[0]);
    const tick = () => {
      length += deleting ? -1 : 1;
      setWord(WORDS[index].slice(0, length));
      let delay = deleting ? 55 : 110;
      if (length === 0) {
        index = (index + 1) % WORDS.length;
        deleting = false;
        delay = 240;
      } else if (length === WORDS[index].length) {
        deleting = true;
        delay = 1500;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 1500);
    return () => clearTimeout(timer);
  }, [enabled, focused, active, reduceMotion]);

  return `Search Styles ${reduceMotion ? WORDS[0] : word}`;
}
