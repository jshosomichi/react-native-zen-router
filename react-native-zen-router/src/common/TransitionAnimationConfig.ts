let transitionDuration = 300;

/** @ignore */
export function updateTransitionDuration(duration: number) {
  transitionDuration = duration;
}

/** @ignore */
export function animationConfig(toValue: number) {
  return {
    toValue,
    duration: transitionDuration,
    useNativeDriver: true
  };
}
