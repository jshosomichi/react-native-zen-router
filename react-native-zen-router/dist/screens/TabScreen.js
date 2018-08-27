import * as React from 'react';
import * as _ from 'lodash';
import { Animated, Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { TabScreenSwipableResponder } from '../responders/SwipebaleResponder';
import { EventEmitter } from 'fbemitter';
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
/** @ignore */
export var SwipeDirection;
(function (SwipeDirection) {
    SwipeDirection[SwipeDirection["NONE"] = 0] = "NONE";
    SwipeDirection[SwipeDirection["NEXT"] = 1] = "NEXT";
    SwipeDirection[SwipeDirection["PREV"] = 2] = "PREV";
})(SwipeDirection || (SwipeDirection = {}));
// For performance tuning
function shouldRenderContent({ swipeDirection, tabIndex }, currentIndex) {
    const shouldShowPrev = swipeDirection === SwipeDirection.PREV && tabIndex - 1 === currentIndex;
    const isCurrent = tabIndex === currentIndex;
    const shouldShowNext = swipeDirection === SwipeDirection.NEXT && tabIndex + 1 === currentIndex;
    return (shouldShowPrev || isCurrent || shouldShowNext);
}
/** 複数のコンテンツコンポーネントと、タブコンポーネント、双方を囲むコンポーネントを持つスクリーン。
 * タブスクリーンインスタンスにはscreenProps.screenAttributes.tabScreenでアクセスすることができ、表示タブ変更などの操作メソッドを実行出来ます。
 */
export class TabScreen extends React.Component {
    /** @ignore */
    constructor(props) {
        super(props);
        /** @ignore */
        this.eventEmitter = new EventEmitter();
        this.swipableResponder = TabScreenSwipableResponder.create(this);
        this.container = !_.isNil(props.containerComponent)
            ? props.containerComponent
            : (props) => <View style={{ flex: 1 }}>{props.children}</View>;
        this.state = {
            tabIndex: !_.isNil(props.screenHolder) ? props.screenHolder.tabIndex : 0,
            swipeDirection: SwipeDirection.NONE,
            swipeDistance: new Animated.Value(0)
        };
    }
    /** @ignore */
    shouldComponentUpdate() {
        const { router, screenIndex } = this.props;
        return screenIndex === router.screenLength() - 1;
    }
    /** 表示するコンテンツコンポーネントを変更する */
    switchTab(index, payload) {
        const prevState = Object.assign({}, this.state);
        this.setState({ tabIndex: index }, () => this.eventEmitter.emit('changeTab', prevState.tabIndex, index, payload));
    }
    /** 現在表示しているコンテンツの配列インデックスを返す */
    currentIndex() {
        return this.state.tabIndex;
    }
    /** 表示するコンテンツコンポーネントが変更された時に、登録したコールバックを実行する */
    addTabChangingListener(callback) {
        const sub = this.eventEmitter.addListener('changeTab', callback);
        return { remove: () => sub.remove() };
    }
    /** @ignore */
    render() {
        const { tabType, tabComponent, contentComponents, router, screenHolder, screenProps, screenAttributes, screenIndex } = this.props;
        const footerTabLayout = tabType === 'footer' ? this.state.tabLayout : screenAttributes.tabLayout;
        const negativeMarginBottomOfContent = !_.isNil(this.props.negativeMarginBottomOfContent) ? this.props.negativeMarginBottomOfContent : 0;
        const styles = createStyles(this.state.swipeDirection !== SwipeDirection.NONE, negativeMarginBottomOfContent, footerTabLayout);
        const swipableResponder = this.props.swipable ? Object.assign({}, this.swipableResponder.panHandlers) : {};
        // Nested tab's children don't have a screenHolder prop.
        const isNestedChildTab = _.isNil(screenHolder);
        const translateX = isNestedChildTab ? new Animated.Value(0) : screenHolder.translateX;
        const translateY = isNestedChildTab ? new Animated.Value(0) : screenHolder.translateY;
        const animationPosition = { transform: [{ translateX }, { translateY }] };
        const Tab = tabComponent;
        const componentProps = {
            router,
            screenProps,
            screenIndex,
            screenAttributes: {
                params: isNestedChildTab ? screenAttributes.params : screenHolder.params,
                tabScreen: this,
                tabLayout: this.state.tabLayout,
                parentTabLayout: screenAttributes.tabLayout,
            }
        };
        const headerTab = tabType === 'header'
            ? <View onLayout={evt => this.setState({ tabLayout: evt.nativeEvent.layout })} style={{ zIndex: 99999, width: windowWidth }}>
          <Tab {...componentProps}/>
        </View>
            : <View />;
        const footerTab = tabType === 'footer'
            ? <View onLayout={evt => this.setState({ tabLayout: evt.nativeEvent.layout })} style={{ position: 'absolute', bottom: 0, width: windowWidth }}>
          <Tab {...componentProps}/>
        </View>
            : <View />;
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
                  {contentComponents.map((Content, i) => {
                    const shouldRender = shouldRenderContent(this.state, i);
                    return (<React.Fragment key={i}>
                          <Animated.View style={[styles.contentContainer, animationPosition, shouldRender ? {} : { width: 0, opacity: 0 }]} {...swipableResponder}>
                            {shouldRender || !this.props.shouldUnmountForNonDisplayedContent
                        ? <Content {...componentProps}/>
                        : null}
                          </Animated.View>
                        </React.Fragment>);
                })}
                </Animated.View>
                : <View />}
            </this.container>
            {footerTab}
          </View>)
            : (
            // Transition normally. (Animate entire components)
            <Animated.View style={[styles.tabScreenContainer, animationPosition]}>
            <this.container {...componentProps}>
              {headerTab}
              {!_.isNil(this.state.tabLayout)
                ? <Animated.View style={[styles.contentsContainer, swipedContentsX(this.state)]}>
                  {contentComponents.map((Content, i) => {
                    const shouldRender = shouldRenderContent(this.state, i);
                    return (<React.Fragment key={i}>
                          <Animated.View style={[styles.contentContainer, shouldRender ? {} : { width: 0, opacity: 0 }]} {...swipableResponder}>
                            {shouldRender || !this.props.shouldUnmountForNonDisplayedContent
                        ? <Content {...componentProps}/>
                        : null}
                          </Animated.View>
                        </React.Fragment>);
                })}
                </Animated.View>
                : <View />}
            </this.container>
            {footerTab}
          </Animated.View>));
    }
}
/** TabScreenを生成する */
export const createTabScreen = (params) => {
    return class extends TabScreen {
        render() {
            const tabProps = Object.assign({}, params, { swipable: typeof params.swipable === 'boolean' ? params.swipable : false, shouldUnmountForNonDisplayedContent: typeof params.shouldUnmountForNonDisplayedContent === 'boolean' ? params.shouldUnmountForNonDisplayedContent : true });
            return (<TabScreen {...tabProps} router={this.props.router} screenHolder={this.props.screenHolder} screenProps={this.props.screenProps} screenAttributes={this.props.screenAttributes} screenIndex={this.props.screenIndex}/>);
        }
    };
};
const swipedContentsX = (state) => ({
    transform: [{
            translateX: state.swipeDirection === SwipeDirection.PREV
                ? Animated.add(state.swipeDistance, new Animated.Value(-windowWidth))
                : state.swipeDistance
        }]
});
const createStyles = (isSwiping, negativeMarginBottomOfContent, footerTabLayout) => StyleSheet.create({
    tabScreenContainer: {
        position: 'absolute',
        height: windowHeight - (!_.isNil(StatusBar.currentHeight) ? StatusBar.currentHeight : 0),
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
