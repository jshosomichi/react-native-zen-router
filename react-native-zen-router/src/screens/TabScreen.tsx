import * as React from 'react';
import * as _ from 'lodash';
import {
  Animated,
  Dimensions,
  LayoutRectangle,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  StyleSheet,
  View
} from 'react-native';
import {Content, ScreenBaseProps, Screen, ScreenAttributes} from '../Router';
import {EventEmitter, EventSubscription} from 'fbemitter';
import {animationConfig} from '../commonFunctions/TransitionAnimationConfigCreators';

/** @ignore */
const windowWidth = Dimensions.get('window').width;

export type TabType = 'header' | 'footer';

/** @ignore */
export enum SwipeDirection {
  NONE,
  NEXT,
  PREV
}

/** @ignore */
export interface TabScreenState {
  tabIndex: number;
  tabLayout?: LayoutRectangle;
  swipeDirection: SwipeDirection;
  swipeDistance: Animated.Value;
}

/** @ignore */
export type TabScreenProps = ScreenBaseProps & CreateTabScreenParams & { screenAttributes: ScreenAttributes };

// For performance tuning
function shouldRenderContent({swipeDirection, tabIndex}: TabScreenState, currentIndex: number) {
  const shouldShowPrev = swipeDirection === SwipeDirection.PREV && tabIndex - 1 === currentIndex;
  const isCurrent = tabIndex === currentIndex;
  const shouldShowNext = swipeDirection === SwipeDirection.NEXT && tabIndex + 1 === currentIndex;

  return (shouldShowPrev || isCurrent || shouldShowNext);
}

/** TabComponent#addTabChangingListenerが返すオブジェクト */
export interface TabEventSubscription {
  /** リスニングしているコールバック情報を削除する */
  remove: () => void;
}

/** 複数のコンテンツコンポーネントと、タブコンポーネント、双方を囲むコンポーネントを持つスクリーン。
 * タブスクリーンインスタンスにはscreenProps.screenAttributes.tabScreenでアクセスすることができ、表示タブ変更などの操作メソッドを実行出来ます。
 */
export class TabScreen extends React.Component<TabScreenProps, TabScreenState> {

  /** @ignore */
  public eventEmitter: EventEmitter = new EventEmitter();

  /** @ignore */
  private swipableResponder: PanResponderInstance;

  /** @ignore */
  private container: React.ComponentType<any>;

  /** @ignore */
  constructor(props: TabScreenProps) {
    super(props);

    this.swipableResponder = TabScreenSwipableResponder.create(this);

    this.container = !_.isNil(props.containerComponent)
      ? props.containerComponent
      : (props) => <View style={{flex: 1}}>{props.children}</View>;

    const isChildTabScreen = _.isNil(props.screenHolder);

    // もし、現在のタブが親タブであれば、子タブに渡すためにparamsにchildTabIndexを持たせる
    if (!isChildTabScreen) {
      props.screenHolder!.addParams('childTabIndex', props.screenHolder!.payload.childTabIndex);
    }

    this.state = {
      // もし、現在のタブが親タブであればScreenHolderの値を使い、子タブであればparamsの値を使う
      tabIndex: isChildTabScreen
        ? props.screenAttributes.params.childTabIndex
        : !_.isNil(props.screenHolder!.payload.tabIndex)
          ? props.screenHolder!.payload.tabIndex
          : 0,
      swipeDirection: SwipeDirection.NONE,
      swipeDistance: new Animated.Value(0)
    };
  }

  /** @ignore */
  shouldComponentUpdate() {
    const {router, screenIndex} = this.props;

    return screenIndex === router.screenLength() - 1;
  }

  /** 表示するコンテンツコンポーネントを変更する */
  switchTab(index: number, payload?: any) {
    const prevState = {...this.state};
    this.setState({tabIndex: index}, () => this.eventEmitter.emit('changeTab', prevState.tabIndex, index, payload));
  }

  /** 現在表示しているコンテンツの配列インデックスを返す */
  currentIndex() {
    return this.state.tabIndex;
  }

  /** 表示するコンテンツコンポーネントが変更された時に、登録したコールバックを実行する */
  addTabChangingListener(callback: (prevIndex: number, nextIndex: number, payload?: any) => void): TabEventSubscription {
    const sub: EventSubscription = this.eventEmitter.addListener('changeTab', callback);
    return {remove: () => sub.remove()};
  }

  /** @ignore */
  render() {
    const {tabType, tabComponent, contentComponents, router, screenHolder, screenProps, screenAttributes, screenIndex} = this.props;

    if (this.state.tabIndex > contentComponents.length - 1 || this.state.tabIndex < 0) {
      throw new Error(`tabIndex "${this.state.tabIndex}" is out-of-range in TabScreen.`);
    }

    const footerTabLayout = tabType === 'footer' ? this.state.tabLayout : screenAttributes.tabLayout;

    const negativeMarginBottomOfContent = !_.isNil(this.props.negativeMarginBottomOfContent) ? this.props.negativeMarginBottomOfContent! : 0;

    const styles = createStyles(this.state.swipeDirection !== SwipeDirection.NONE, negativeMarginBottomOfContent, footerTabLayout);

    const swipableResponder = this.props.swipable ? {...this.swipableResponder.panHandlers} : {};

    // Nested tab's children don't have a screenHolder prop.
    const isNestedChildTab = _.isNil(screenHolder);
    const translateX = isNestedChildTab ? new Animated.Value(0) : screenHolder!.translateX;
    const translateY = isNestedChildTab ? new Animated.Value(0) : screenHolder!.translateY;
    const animationPosition = {transform: [{translateX}, {translateY}]};

    const Tab = tabComponent;

    const componentProps = {
      router,
      screenProps,
      screenIndex,
      screenAttributes: {
        params: isNestedChildTab ? screenAttributes.params : screenHolder!.params,
        tabScreen: this,
        tabLayout: this.state.tabLayout,
        parentTabLayout: screenAttributes.tabLayout,
      }
    };

    const headerTab =
      tabType === 'header'
        ? <View onLayout={evt => this.setState({tabLayout: evt.nativeEvent.layout})} style={{zIndex: 99999, width: windowWidth}}>
          <Tab {...componentProps}/>
        </View>
        : <View/>;

    const footerTab =
      tabType === 'footer'
        ? <View onLayout={evt => this.setState({tabLayout: evt.nativeEvent.layout})} style={{position: 'absolute', bottom: 0, width: windowWidth}}>
          <Tab {...componentProps}/>
        </View>
        : <View/>;

    return (
      // If `stickTab=true` , a tab component is presented sticky first, and content transitions animation.
      !_.isNil(screenHolder) && screenHolder.stickTab
        ? (
          // Transition with tab sticking. (Animate only contents)
          <View style={styles.tabScreenContainer}>
            <this.container {...componentProps}>
              {headerTab}
              {!_.isNil(this.state.tabLayout)
                ? <Animated.View style={[styles.contentsContainer, swipedContentsX(this.state)]}>
                  {
                    contentComponents.map((Content: Content, i: number) => {
                      const shouldRender = shouldRenderContent(this.state, i);
                      return (
                        <React.Fragment key={i}>
                          <Animated.View
                            style={[styles.contentContainer, animationPosition, shouldRender ? {} : {width: 0, opacity: 0}]} {...swipableResponder}>
                            {shouldRender || !this.props.shouldUnmountForNonDisplayedContent
                              ? <Content {...componentProps}/>
                              : null
                            }
                          </Animated.View>
                        </React.Fragment>
                      );
                    })
                  }
                </Animated.View>
                : <View/>}
            </this.container>
            {footerTab}
          </View>
        )
        : (
          // Transition normally. (Animate entire components)
          <Animated.View style={[styles.tabScreenContainer, animationPosition]}>
            <this.container {...componentProps}>
              {headerTab}
              {!_.isNil(this.state.tabLayout)
                ? <Animated.View style={[styles.contentsContainer, swipedContentsX(this.state)]}>
                  {
                    contentComponents.map((Content: Content, i: number) => {
                      const shouldRender = shouldRenderContent(this.state, i);
                      return (
                        <React.Fragment key={i}>
                          <Animated.View style={[styles.contentContainer, shouldRender ? {} : {width: 0, opacity: 0}]} {...swipableResponder}>
                            {shouldRender || !this.props.shouldUnmountForNonDisplayedContent
                              ? <Content {...componentProps}/>
                              : null
                            }
                          </Animated.View>
                        </React.Fragment>
                      );
                    })
                  }
                </Animated.View>
                : <View/>
              }
            </this.container>
            {footerTab}
          </Animated.View>
        )
    );
  }
}

/** createTabScreen関数の引数となるオブジェクト */
export interface CreateTabScreenParams {
  /** tabComponentの表示位置。"header" または "footer". */
  tabType: TabType;
  /** タブを表すReactコンポーネント. */
  tabComponent: Content;
  /** コンテンツを表すReactコンポーネント群。スワイプジェスチャーによるコンテンツ変更順序はこの配列順序と一致する。 */
  contentComponents: Content[];
  /** 真の場合、スワイプジェスチャーで表示コンテンツの変更が可能となる。デフォルト値false */
  swipable?: boolean;
  /** 真の場合、非表示となったコンテンツはアンマウントされる。デフォルト値true */
  shouldUnmountForNonDisplayedContent?: boolean;
  /** タブ、コンテンツの外側に位置するReactコンポーネント。タブ、コンテンツを共にスクロール対象とするときには、ここにScrollViewを設定する */
  containerComponent?: Content;
  /** 通常タブの高さ＋コンテンツの高さ=ウィンドウの高さとしているが、コンテンツの高さを下に伸ばしたい時に設定する */
  negativeMarginBottomOfContent?: number;
}

/** TabScreenを生成する */
export const createTabScreen = (params: CreateTabScreenParams): Screen => {
  return class extends TabScreen {
    render() {
      const tabProps = {
        ...params,
        swipable: typeof params.swipable === 'boolean' ? params.swipable : false,
        shouldUnmountForNonDisplayedContent: typeof params.shouldUnmountForNonDisplayedContent === 'boolean' ? params.shouldUnmountForNonDisplayedContent : true
      };

      return (
        <TabScreen
          {...tabProps}
          router={this.props.router}
          screenHolder={this.props.screenHolder}
          screenProps={this.props.screenProps}
          screenAttributes={this.props.screenAttributes}
          screenIndex={this.props.screenIndex}/>
      );
    }
  };
};

const swipedContentsX = (state: TabScreenState) =>
  ({
    transform: [{
      translateX:
        state.swipeDirection === SwipeDirection.PREV
          ? Animated.add(state.swipeDistance, new Animated.Value(-windowWidth))
          : state.swipeDistance
    }]
  });

/* PanResponder for swipe gesture */

/** @ignore */
export function isHorizontalGesture(gestureState: PanResponderGestureState) {
  return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2) && Math.abs(gestureState.vx) > Math.abs(gestureState.vy * 2);
}

/** @ignore */
export function isMovingPrev(gestureState: PanResponderGestureState, tabIndex: number) {
  return (gestureState.dx > 0 || (gestureState.dx === 0 && gestureState.vx > 0.00000001)) && tabIndex > 0;
}

/** @ignore */
export function isMovingNext(gestureState: PanResponderGestureState, tabIndex: number, numberOfTabs: number) {
  return (gestureState.dx < 0 || (gestureState.dx === 0 && gestureState.vx < -0.00000001)) && tabIndex < numberOfTabs;
}

/** @ignore */
export function shouldAcceptSwipeGesture(gestureState: PanResponderGestureState) {
  return Math.abs(gestureState.dx) > windowWidth / 4 || Math.abs(gestureState.vx) > 0.4 || Math.abs(gestureState.dx) * Math.abs(gestureState.vx) > 30;
}

/** @ignore */
function onPanResponderEnd(gestureState: PanResponderGestureState, tabScreen: TabScreen) {
  if (isMovingNext(gestureState, tabScreen.state.tabIndex, tabScreen.props.contentComponents.length - 1)) {
    if (shouldAcceptSwipeGesture(gestureState)) {

      Animated.timing(
        tabScreen.state.swipeDistance,
        animationConfig(-windowWidth)
      ).start(result => {
        if (result.finished) {
          tabScreen.setState({
              tabIndex: tabScreen.state.tabIndex + 1,
              swipeDirection: SwipeDirection.NONE,
              swipeDistance: new Animated.Value(0)
            }, () =>
              tabScreen.eventEmitter.emit('changeTab', tabScreen.state.tabIndex - 1, tabScreen.state.tabIndex)
          );
        }
      });
    } else {
      Animated.timing(
        tabScreen.state.swipeDistance,
        animationConfig(0)
      ).start(result => {
        if (result.finished) {
          tabScreen.setState({swipeDirection: SwipeDirection.NONE});
        }
      });
    }

  } else if (isMovingPrev(gestureState, tabScreen.state.tabIndex)) {
    if (shouldAcceptSwipeGesture(gestureState)) {
      Animated.timing(
        tabScreen.state.swipeDistance,
        animationConfig(windowWidth)
      ).start(result => {
        if (result.finished) {
          tabScreen.setState({
              tabIndex: tabScreen.state.tabIndex - 1,
              swipeDirection: SwipeDirection.NONE,
              swipeDistance: new Animated.Value(0)
            }, () =>
              tabScreen.eventEmitter.emit('changeTab', tabScreen.state.tabIndex + 1, tabScreen.state.tabIndex)
          );
        }
      });
    } else {
      Animated.timing(
        tabScreen.state.swipeDistance,
        animationConfig(0)
      ).start(result => {
        if (result.finished) {
          tabScreen.setState({swipeDirection: SwipeDirection.NONE});
        }
      });
    }
  } else {
    Animated.timing(
      tabScreen.state.swipeDistance,
      animationConfig(0)
    ).start(result => {
      if (result.finished) {
        tabScreen.setState({swipeDirection: SwipeDirection.NONE});
      }
    });
  }
}

/** @ignore */
export class TabScreenSwipableResponder {
  public static create = (tabScreen: TabScreen) => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return isMovingPrev(gestureState, tabScreen.state.tabIndex)
          || isMovingNext(gestureState, tabScreen.state.tabIndex, tabScreen.props.contentComponents.length - 1);
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        evt.stopPropagation();
        return isHorizontalGesture(gestureState);
      },
      onPanResponderTerminationRequest: (evt, gestureState) => false,

      onPanResponderMove: (evt, gestureState) => {
        const _isMovingPrev = isMovingPrev(gestureState, tabScreen.state.tabIndex);
        const _isMovingNext = isMovingNext(gestureState, tabScreen.state.tabIndex, tabScreen.props.contentComponents.length - 1);
        if (_isMovingPrev && tabScreen.state.swipeDirection !== SwipeDirection.PREV) {
          tabScreen.setState({swipeDirection: SwipeDirection.PREV});
        } else if (_isMovingNext && tabScreen.state.swipeDirection !== SwipeDirection.NEXT) {
          tabScreen.setState({swipeDirection: SwipeDirection.NEXT});
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
  }
}

/** @ignore */
const createStyles = (isSwiping: boolean, negativeMarginBottomOfContent: number, footerTabLayout: LayoutRectangle | undefined) =>
  StyleSheet.create({
    tabScreenContainer: {
      position: 'absolute',
      height: '100%',
    },
    contentsContainer: {
      flexDirection: 'row',
      flex: 1,
      width: isSwiping ? windowWidth * 2 : windowWidth,
    },
    contentContainer: {
      flexDirection: 'column',
      width: windowWidth,
      marginBottom: !_.isNil(footerTabLayout) ? footerTabLayout.height - negativeMarginBottomOfContent : 0 // for avoiding a content hide behind footerTab.
    }
  });
