let transitionDuration = 300;
/** @ignore */
export function updateTransitionDuration(duration) {
    transitionDuration = duration;
}
/** @ignore */
export function animationConfig(toValue) {
    return {
        toValue,
        duration: transitionDuration,
        useNativeDriver: true
    };
}
