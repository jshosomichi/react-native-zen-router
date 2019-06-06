import * as React from 'react';
import * as _ from 'lodash';
import { Guid } from 'guid-typescript';
import { StyleSheet, Animated, View, Dimensions } from 'react-native';
import { animationConfig, updateTransitionDuration } from './commonFunctions/TransitionAnimationConfigCreators';
/** @ignore */
const windowWidth = Dimensions.get('window').width;
/** @ignore */
const windowHeight = Dimensions.get('window').height;
/** @ignore */
export class ScreenHolder {
    constructor(id, routeName, screenIndex, screen, translateX, translateY, params, stickTab, payload) {
        this.id = id;
        this.routeName = routeName;
        this.screenIndex = screenIndex;
        this.screen = screen;
        this.translateX = translateX;
        this.translateY = translateY;
        this.params = params;
        this.stickTab = stickTab;
        this.payload = payload;
    }
    addParams(key, value) {
        this.params[key] = value;
    }
}
/** @ignore */
function routeFromName(routes, routeName) {
    if (!routes[routeName]) {
        throw new Error(`routeName "${routeName}" is not found in routes.`);
    }
    else {
        return routes[routeName];
    }
}
/** @ignore */
const Stack = {
    pop(array) {
        return array.slice(0, array.length - 1);
    },
};
/**
 * ルーティング機能を提供するためのReactコンポーネントツリーの最上位に位置するコンポーネント。スクリーンを跨いだ操作のためのインスタンスメソッドも提供する。
 * ルータインスタンスにはscreenProps.routerでアクセスすることができ、Screen表示/非表示などの操作メソッドを呼び出せます。
 */
export class Router extends React.Component {
    /** @ignore */
    constructor(props) {
        super(props);
        if (!_.isNil(props.config.transitionDuration)) {
            updateTransitionDuration(props.config.transitionDuration);
        }
        this.initialScreenHolder =
            new ScreenHolder(Guid.create().toString(), props.config.initialRouteName, 0, routeFromName(props.routes, props.config.initialRouteName).screen, new Animated.Value(0), new Animated.Value(0), {}, false, {});
        this.state = {
            transitionState: 'noop',
            routes: props.routes,
            config: props.config,
            screenHolders: [this.initialScreenHolder],
        };
    }
    /** スクリーンのスタック数を返す */
    screenLength() {
        return this.state.screenHolders.length;
    }
    /** 現在表示されているスクリーンのルート名を返す */
    topRouteName() {
        return this.state.screenHolders[this.state.screenHolders.length - 1].routeName;
    }
    /** 現在スタックされているスクリーンのルート名一覧を返す */
    routeNameStack() {
        return this.state.screenHolders.map(screenHolder => screenHolder.routeName);
    }
    /** スクリーンのスタック操作状態を返す */
    transitionState() {
        return this.state.transitionState;
    }
    /** 横移動アニメーションと共にスクリーンを追加表示する。 */
    pushHorizontal({ routeName, params, tabIndex = 0, childTabIndex = 0, allowMultipleTransition = false }) {
        if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
            return;
        }
        const translateX = new Animated.Value(windowWidth);
        const translateY = new Animated.Value(0);
        const newScreenHolder = new ScreenHolder(Guid.create().toString(), routeName, this.state.screenHolders.length, routeFromName(this.state.routes, routeName).screen, translateX, translateY, !_.isNil(params) ? params : {}, false, { tabIndex, childTabIndex });
        this.setState({
            screenHolders: this.state.screenHolders.concat([newScreenHolder]),
            transitionState: 'pushing',
        });
        Animated.timing(translateX, animationConfig(0)).start(() => this.setState({ transitionState: 'noop' }));
    }
    /** 横移動アニメーションと共にスクリーンを追加表示する。 タブはアニメーションせずに先行表示するので、遷移前スクリーンと遷移後スクリーンが同じタブを使っていると、遷移中にタブをスティッキーに見せることができる。 */
    pushHorizontalWithStickTab({ routeName, params, tabIndex = 0, childTabIndex = 0, allowMultipleTransition = false }) {
        if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
            return;
        }
        const translateX = new Animated.Value(windowWidth);
        const translateY = new Animated.Value(0);
        const newScreenHolder = new ScreenHolder(Guid.create().toString(), routeName, this.state.screenHolders.length, routeFromName(this.state.routes, routeName).screen, translateX, translateY, !_.isNil(params) ? params : {}, true, { tabIndex, childTabIndex });
        this.setState({
            screenHolders: this.state.screenHolders.concat([newScreenHolder]),
            transitionState: 'pushing'
        });
        Animated.timing(translateX, animationConfig(0)).start(() => this.setState({ transitionState: 'noop' }));
    }
    /** 縦移動アニメーションと共にスクリーンを追加表示する。 */
    pushVertical({ routeName, params, tabIndex = 0, childTabIndex = 0, allowMultipleTransition = false }) {
        if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
            return;
        }
        const translateX = new Animated.Value(0);
        const translateY = new Animated.Value(windowHeight);
        const newScreenHolder = new ScreenHolder(Guid.create().toString(), routeName, this.state.screenHolders.length, routeFromName(this.state.routes, routeName).screen, translateX, translateY, !_.isNil(params) ? params : {}, false, { tabIndex, childTabIndex });
        this.setState({
            screenHolders: this.state.screenHolders.concat([newScreenHolder]),
            transitionState: 'pushing'
        });
        Animated.timing(translateY, animationConfig(0)).start(() => this.setState({ transitionState: 'noop' }));
    }
    /** 横移動アニメーションと共にスクリーンを表示し、それまでのスクリーンスタックを破棄し、新しいスクリーンスタックに差し替える */
    resetWithPushHorizontal({ routeName, params, tabIndex = 0, childTabIndex = 0, allowMultipleTransition = false }) {
        if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
            return;
        }
        const prevTopScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
        const prevBottomScreenHolder = this.state.screenHolders[0];
        const translateX = new Animated.Value(windowWidth);
        const translateY = new Animated.Value(0);
        const nextTopScreenHolder = !_.isNil(routeName) ?
            new ScreenHolder(Guid.create().toString(), routeName, 0, routeFromName(this.state.routes, routeName).screen, translateX, translateY, !_.isNil(params) ? params : {}, false, { tabIndex, childTabIndex }) :
            prevBottomScreenHolder;
        this.initialScreenHolder = nextTopScreenHolder;
        this.setState({ screenHolders: [nextTopScreenHolder, prevTopScreenHolder], transitionState: 'pushing' }, () => Animated.timing(nextTopScreenHolder.translateX, animationConfig(0)).start(() => this.setState({ screenHolders: [nextTopScreenHolder], transitionState: 'noop' })));
    }
    /** 縦移動アニメーションと共にスクリーンを表示し、それまでのスクリーンスタックを破棄し、新しいスクリーンスタックに差し替える */
    resetWithPushVertical({ routeName, params, tabIndex = 0, childTabIndex = 0, allowMultipleTransition = false }) {
        if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
            return;
        }
        const prevTopScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
        const prevBottomScreenHolder = this.state.screenHolders[0];
        const translateX = new Animated.Value(0);
        const translateY = new Animated.Value(windowHeight);
        const nextTopScreenHolder = !_.isNil(routeName) ?
            new ScreenHolder(Guid.create().toString(), routeName, this.state.screenHolders.length, routeFromName(this.state.routes, routeName).screen, translateX, translateY, !_.isNil(params) ? params : {}, false, { tabIndex, childTabIndex }) :
            prevBottomScreenHolder;
        this.initialScreenHolder = nextTopScreenHolder;
        this.setState({ screenHolders: [nextTopScreenHolder, prevTopScreenHolder], transitionState: 'pushing' }, () => Animated.timing(nextTopScreenHolder.translateY, animationConfig(0)).start(() => this.setState({ screenHolders: [nextTopScreenHolder], transitionState: 'noop' })));
    }
    /** 横移動アニメーションと共に現在のスクリーンを破棄し、新しいスクリーンスタックに差し替える */
    resetWithPopHorizontal(params) {
        const allowMultipleTransition = !_.isNil(params) && !_.isNil(params.allowMultipleTransition) ? params.allowMultipleTransition : false;
        if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
            return;
        }
        const tabIndex = !_.isNil(params) && !_.isNil(params.tabIndex) ? params.tabIndex : 0;
        const childTabIndex = !_.isNil(params) && !_.isNil(params.childTabIndex) ? params.childTabIndex : 0;
        const topScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
        const prevBottomScreenHolder = this.state.screenHolders[0];
        const bottomScreenHolder = !_.isNil(params) && !_.isNil(params.routeName) ?
            new ScreenHolder(Guid.create().toString(), params.routeName, 0, routeFromName(this.state.routes, params.routeName).screen, new Animated.Value(0), new Animated.Value(0), !_.isNil(params) ? params : {}, false, { tabIndex, childTabIndex }) :
            prevBottomScreenHolder;
        this.initialScreenHolder = bottomScreenHolder;
        this.setState({ screenHolders: [bottomScreenHolder, topScreenHolder], transitionState: 'popping' }, () => this.setState({ screenHolders: [bottomScreenHolder, topScreenHolder] }, () => Animated.timing(topScreenHolder.translateX, animationConfig(windowWidth)).start(() => this.setState({ screenHolders: [bottomScreenHolder], transitionState: 'noop' }))));
    }
    /** 縦移動アニメーションと共に現在のスクリーンを破棄し、新しいスクリーンスタックに差し替える */
    resetWithPopVertical(params) {
        const allowMultipleTransition = !_.isNil(params) && !_.isNil(params.allowMultipleTransition) ? params.allowMultipleTransition : false;
        if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
            return;
        }
        const tabIndex = !_.isNil(params) && !_.isNil(params.tabIndex) ? params.tabIndex : 0;
        const childTabIndex = !_.isNil(params) && !_.isNil(params.childTabIndex) ? params.childTabIndex : 0;
        const topScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
        const prevBottomScreenHolder = this.state.screenHolders[0];
        const bottomScreenHolder = !_.isNil(params) && !_.isNil(params.routeName) ?
            new ScreenHolder(Guid.create().toString(), params.routeName, 0, routeFromName(this.state.routes, params.routeName).screen, new Animated.Value(0), new Animated.Value(0), !_.isNil(params) ? params : {}, false, { tabIndex, childTabIndex }) :
            prevBottomScreenHolder;
        this.initialScreenHolder = bottomScreenHolder;
        this.setState({ screenHolders: [bottomScreenHolder, topScreenHolder], transitionState: 'popping' }, () => this.setState({ screenHolders: [bottomScreenHolder, topScreenHolder] }, () => Animated.timing(topScreenHolder.translateY, animationConfig(windowHeight)).start(() => this.setState({ screenHolders: [bottomScreenHolder], transitionState: 'noop' }))));
    }
    /** 移動アニメーションなしで現在のスクリーンを破棄し、新しいスクリーンスタックに差し替える */
    resetWithoutEffect({ routeName, params, tabIndex = 0, childTabIndex = 0, allowMultipleTransition = false }) {
        if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
            return;
        }
        const bottomScreenHolder = new ScreenHolder(Guid.create().toString(), routeName, 0, routeFromName(this.state.routes, routeName).screen, new Animated.Value(0), new Animated.Value(0), !_.isNil(params) ? params : {}, false, { tabIndex, childTabIndex });
        this.initialScreenHolder = bottomScreenHolder;
        this.setState({ screenHolders: [bottomScreenHolder], transitionState: 'noop' });
    }
    /** 横移動アニメーションと共に現在のスクリーンをスタックから破棄する */
    popHorizontal(params) {
        if (this.state.transitionState !== 'noop') {
            return;
        }
        const popCount = !_.isNil(params) && !_.isNil(params.popCount) ? params.popCount : 1;
        const onEndPop = !_.isNil(params) && !_.isNil(params.onEndPop) ? params.onEndPop : () => { };
        this.setState({ transitionState: 'popping' });
        const topScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
        const remainScreenHolders = this.state.screenHolders.slice(0, this.state.screenHolders.length - popCount);
        this.setState({ screenHolders: remainScreenHolders.concat([topScreenHolder]) }, () => {
            Animated.timing(this.state.screenHolders[this.state.screenHolders.length - 1].translateX, animationConfig(windowWidth)).start(() => this.setState({
                screenHolders: Stack.pop(this.state.screenHolders),
                transitionState: 'noop'
            }, () => {
                if (!_.isNil(onEndPop)) {
                    onEndPop();
                }
            }));
        });
    }
    /** 縦移動アニメーションと共に現在のスクリーンをスタックから破棄する */
    popVertical(params) {
        if (this.state.transitionState !== 'noop') {
            return;
        }
        const popCount = !_.isNil(params) && !_.isNil(params.popCount) ? params.popCount : 1;
        const onEndPop = !_.isNil(params) && !_.isNil(params.onEndPop) ? params.onEndPop : () => { };
        this.setState({ transitionState: 'popping' });
        const topScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
        const remainScreenHolders = this.state.screenHolders.slice(0, this.state.screenHolders.length - popCount);
        this.setState({ screenHolders: remainScreenHolders.concat([topScreenHolder]) }, () => {
            Animated.timing(this.state.screenHolders[this.state.screenHolders.length - 1].translateY, animationConfig(windowHeight)).start(() => this.setState({
                screenHolders: Stack.pop(this.state.screenHolders),
                transitionState: 'noop'
            }, () => onEndPop()));
        });
    }
    /** @ignore */
    render() {
        return (<View style={styles.container}>
        {this.state.screenHolders.map((screenHolder, i) => {
            const Screen = screenHolder.screen;
            return (<Screen key={screenHolder.id} router={this} screenProps={this.props.screenProps} screenHolder={screenHolder} screenAttributes={{ params: screenHolder.params }} screenIndex={i}/>);
        })}
      </View>);
    }
}
/** @ignore */
const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});
