import { PanResponder, Dimensions, Animated } from 'react-native';
import { SwipeDirection } from '../screens/TabScreen';
import { animationConfig } from '../common/TransitionAnimationConfig';
const windowWidth = Dimensions.get('window').width;
function isHorizontalGesture(gestureState) {
    return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2) && Math.abs(gestureState.vx) > Math.abs(gestureState.vy * 2);
}
function isMovingPrev(gestureState, tabScreen) {
    return (gestureState.dx > 0 || (gestureState.dx === 0 && gestureState.vx > 0.00000001)) && tabScreen.state.tabIndex > 0;
}
function isMovingNext(gestureState, tabScreen) {
    return (gestureState.dx < 0 || (gestureState.dx === 0 && gestureState.vx < -0.00000001)) && tabScreen.state.tabIndex < tabScreen.props.contentComponents.length - 1;
}
function shouldAcceptSwipeGesture(gestureState) {
    return Math.abs(gestureState.dx) > windowWidth / 4 || Math.abs(gestureState.vx) > 0.4 || Math.abs(gestureState.dx) * Math.abs(gestureState.vx) > 30;
}
function onPanResponderEnd(gestureState, tabScreen) {
    if (isMovingNext(gestureState, tabScreen)) {
        if (shouldAcceptSwipeGesture(gestureState)) {
            Animated.timing(tabScreen.state.swipeDistance, animationConfig(-windowWidth)).start(result => {
                if (result.finished) {
                    tabScreen.setState({
                        tabIndex: tabScreen.state.tabIndex + 1,
                        swipeDirection: SwipeDirection.NONE,
                        swipeDistance: new Animated.Value(0)
                    }, () => tabScreen.eventEmitter.emit('changeTab', tabScreen.state.tabIndex - 1, tabScreen.state.tabIndex));
                }
            });
        }
        else {
            Animated.timing(tabScreen.state.swipeDistance, animationConfig(0)).start(result => {
                if (result.finished) {
                    tabScreen.setState({ swipeDirection: SwipeDirection.NONE });
                }
            });
        }
    }
    else if (isMovingPrev(gestureState, tabScreen)) {
        if (shouldAcceptSwipeGesture(gestureState)) {
            Animated.timing(tabScreen.state.swipeDistance, animationConfig(windowWidth)).start(result => {
                if (result.finished) {
                    tabScreen.setState({
                        tabIndex: tabScreen.state.tabIndex - 1,
                        swipeDirection: SwipeDirection.NONE,
                        swipeDistance: new Animated.Value(0)
                    }, () => tabScreen.eventEmitter.emit('changeTab', tabScreen.state.tabIndex + 1, tabScreen.state.tabIndex));
                }
            });
        }
        else {
            Animated.timing(tabScreen.state.swipeDistance, animationConfig(0)).start(result => {
                if (result.finished) {
                    tabScreen.setState({ swipeDirection: SwipeDirection.NONE });
                }
            });
        }
    }
    else {
        Animated.timing(tabScreen.state.swipeDistance, animationConfig(0)).start(result => {
            if (result.finished) {
                tabScreen.setState({ swipeDirection: SwipeDirection.NONE });
            }
        });
    }
}
/** @ignore */
export class TabScreenSwipableResponder {
}
TabScreenSwipableResponder.create = (tabScreen) => {
    return PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return isMovingPrev(gestureState, tabScreen) || isMovingNext(gestureState, tabScreen);
        },
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
            evt.stopPropagation();
            return isHorizontalGesture(gestureState);
        },
        onPanResponderTerminationRequest: (evt, gestureState) => false,
        onPanResponderMove: (evt, gestureState) => {
            const _isMovingPrev = isMovingPrev(gestureState, tabScreen);
            const _isMovingNext = isMovingNext(gestureState, tabScreen);
            if (_isMovingPrev && tabScreen.state.swipeDirection !== SwipeDirection.PREV) {
                tabScreen.setState({ swipeDirection: SwipeDirection.PREV });
            }
            else if (_isMovingNext && tabScreen.state.swipeDirection !== SwipeDirection.NEXT) {
                tabScreen.setState({ swipeDirection: SwipeDirection.NEXT });
            }
            if (_isMovingPrev || _isMovingNext) {
                tabScreen.state.swipeDistance.setValue(gestureState.dx);
            }
        },
        onPanResponderRelease: (evt, gestureState) => {
            onPanResponderEnd(gestureState, tabScreen);
        },
        onPanResponderTerminate: (evt, gestureState) => {
            // For Android
            onPanResponderEnd(gestureState, tabScreen);
        }
    });
};
