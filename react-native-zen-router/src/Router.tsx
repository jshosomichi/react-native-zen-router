import * as React from 'react';
import * as _ from 'lodash';
import {Guid} from 'guid-typescript';
import {StyleSheet, Animated, View, Dimensions, LayoutRectangle} from 'react-native';
import {TabScreen} from './screens/TabScreen';
import {animationConfig, updateTransitionDuration} from './common/TransitionAnimationConfig';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

/** @ignore */
export interface ContentProps {
  router: Router;
  screenProps: ScreenProps;
  screenAttributes: ScreenAttributes;
  screenIndex: number;
}

/** @ignore */
export type Content = React.ComponentType<ContentProps>;

export interface ScreenProps {
  [key: string]: any;
}

/** @ignore */
export type ScreenBaseProps = ContentProps & { screenHolder?: ScreenHolder };

/** 各スクリーンのthis.propsに提供するデータ群 */
export interface ScreenAttributes {
  /** そのスクリーンに遷移する際のメソッドのparam引数 */
  params: { [param: string]: any };
  /** TabScreenインスタンス。GenericScreenには入ってこない */
  tabScreen?: TabScreen;
  /** tabComponentのレイアウト情報。レイアウト情報が取得できるまでは空になる */
  tabLayout?: LayoutRectangle;
  /** タブの入れ子だった場合の親tabComponentのレイアウト情報。レイアウト情報が取得できるまでは空になる */
  parentTabLayout?: LayoutRectangle;
}

/** @ignore */
export type Screen = new(props: ScreenBaseProps) => React.Component<ScreenBaseProps>;

export interface Route {
  screen: Screen;
}

export interface RouterConfig {
  initialRouteName: string;
  transitionDuration?: number;
}

/** スクリーン構成の設計図。routeNameに対応するスクリーンを紐づけるオブジェクト。 */
export interface Routes {
  [routeName: string]: Route;
}

/** @ignore */
export interface RouterProps {
  routes: Routes;
  config: RouterConfig;
  screenProps: ScreenProps;
}

/** @ignore */
export class ScreenHolder {
  constructor(
    readonly id: string,
    readonly routeName: string,
    readonly screenIndex: number,
    readonly screen: Screen,
    readonly translateX: Animated.Value,
    readonly translateY: Animated.Value,
    readonly params: { [param: string]: any },
    readonly stickTab: boolean,
    readonly tabIndex: number
  ) {
  }
}

type TransitionState = 'pushing' | 'popping' | 'noop';

/** @ignore */
export interface RouterState {
  transitionState: TransitionState;
  screenHolders: ScreenHolder[];
  routes: Routes;
  config: RouterConfig;
}

function routeFromName(routes: Routes, routeName: string): Route {
  if (!routes[routeName]) {
    throw new Error(`routeName "${routeName}" is not found in routes.`);
  } else {
    return routes[routeName];
  }
}

const Stack = {
  pop<T>(array: T[]) {
    return array.slice(0, array.length - 1);
  },
};

/** 遷移メソッド群の引数となるオブジェクト。routeName必須。 */
export interface NamedTransitionScreenParams {
  /** 遷移先スクリーンのルート名 */
  routeName: string;
  /** 遷移先のスクリーンに渡すオブジェクト */
  params?: { [param: string]: any };
  /** 真であれば、高速で連続タップされた時に複数操作として受け付ける。省略時にはfalseとして扱う。 */
  tabIndex?: number;
  /** 真であれば、高速で連続タップされた時に複数操作として受け付ける。省略時にはfalse扱いとなる。 */
  allowMultipleTransition?: boolean;
}

/** 遷移メソッド群の引数となるオブジェクト。routeNameは必須ではない。 */
export interface FlexibleTransitionScreenParams {
  /** 遷移先スクリーンのルート名。空の場合はメソッドが判断を行う。 */
  routeName?: string;
  /** 遷移先のスクリーンに渡すオブジェクト */
  params?: { [param: string]: any };
  /** 遷移先がタブスクリーンの場合、最初に表示するコンテンツのインデックスを設定する。省略時には0として扱う。 */
  tabIndex?: number;
  /** 真であれば、高速で連続タップされた時に複数操作として受け付ける。省略時にはfalseとして扱う。 */
  allowMultipleTransition?: boolean;
}

/** popメソッド群の引数となるオブジェクト */
export interface PopScreenParams {
  /** 破棄するScreen数の指定 */
  popCount?: number;
  /** 遷移完了後に実行するコールバック */
  onEndPop?: () => any;
}

/**
 * ルーティング機能を提供するためのReactコンポーネントツリーの最上位に位置するコンポーネント。スクリーンを跨いだ操作のためのインスタンスメソッドも提供する。
 * ルータインスタンスにはscreenProps.routerでアクセスすることができ、Screen表示/非表示などの操作メソッドを呼び出せます。
 */
export class Router extends React.Component<RouterProps, RouterState> {

  /** @ignore */
  private initialScreenHolder: ScreenHolder;

  /** @ignore */
  constructor(props: RouterProps) {
    super(props);

    if (!_.isNil(props.config.transitionDuration)) {
      updateTransitionDuration(props.config.transitionDuration);
    }

    this.initialScreenHolder =
      new ScreenHolder(
        Guid.create().toString(),
        props.config.initialRouteName,
        0,
        routeFromName(props.routes, props.config.initialRouteName).screen,
        new Animated.Value(0),
        new Animated.Value(0),
        {},
        false,
        0
      );

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
  pushHorizontal({routeName, params, tabIndex = 0, allowMultipleTransition = false}: NamedTransitionScreenParams) {

    if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
      return;
    }

    const translateX = new Animated.Value(windowWidth);
    const translateY = new Animated.Value(0);

    const newScreenHolder =
      new ScreenHolder(
        Guid.create().toString(),
        routeName,
        this.state.screenHolders.length,
        routeFromName(this.state.routes, routeName).screen,
        translateX,
        translateY,
        !_.isNil(params) ? params : {},
        false,
        tabIndex,
      );

    this.setState({
      screenHolders: this.state.screenHolders.concat([newScreenHolder]),
      transitionState: 'pushing',
    });

    Animated.timing(
      translateX,
      animationConfig(0)
    ).start(() =>
      this.setState({transitionState: 'noop'})
    );
  }

  /** 横移動アニメーションと共にスクリーンを追加表示する。 タブはアニメーションせずに先行表示するので、遷移前スクリーンと遷移後スクリーンが同じタブを使っていると、遷移中にタブをスティッキーに見せることができる。 */
  pushHorizontalWithStickTab({routeName, params, tabIndex = 0, allowMultipleTransition = false}: NamedTransitionScreenParams) {

    if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
      return;
    }

    const translateX = new Animated.Value(windowWidth);
    const translateY = new Animated.Value(0);

    const newScreenHolder =
      new ScreenHolder(
        Guid.create().toString(),
        routeName,
        this.state.screenHolders.length,
        routeFromName(this.state.routes, routeName).screen,
        translateX,
        translateY,
        !_.isNil(params) ? params : {},
        true,
        tabIndex
      );

    this.setState({
      screenHolders: this.state.screenHolders.concat([newScreenHolder]),
      transitionState: 'pushing'
    });

    Animated.timing(
      translateX,
      animationConfig(0)
    ).start(() =>
      this.setState({transitionState: 'noop'})
    );
  }

  /** 縦移動アニメーションと共にスクリーンを追加表示する。 */
  pushVertical({routeName, params, tabIndex = 0, allowMultipleTransition = false}: NamedTransitionScreenParams) {

    if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
      return;
    }

    const translateX = new Animated.Value(0);
    const translateY = new Animated.Value(windowHeight);

    const newScreenHolder: ScreenHolder =
      new ScreenHolder(
        Guid.create().toString(),
        routeName,
        this.state.screenHolders.length,
        routeFromName(this.state.routes, routeName).screen,
        translateX,
        translateY,
        !_.isNil(params) ? params : {},
        false,
        tabIndex
      );

    this.setState({
      screenHolders: this.state.screenHolders.concat([newScreenHolder]),
      transitionState: 'pushing'
    });

    Animated.timing(
      translateY,
      animationConfig(0)
    ).start(() => this.setState({transitionState: 'noop'}));
  }

  /** 横移動アニメーションと共にスクリーンを表示し、それまでのスクリーンスタックを破棄し、新しいスクリーンスタックに差し替える */
  resetWithPushHorizontal({routeName, params, tabIndex = 0, allowMultipleTransition = false}: NamedTransitionScreenParams) {

    if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
      return;
    }

    const prevTopScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
    const prevBottomScreenHolder = this.state.screenHolders[0];

    const translateX = new Animated.Value(windowWidth);
    const translateY = new Animated.Value(0);

    const nextTopScreenHolder =
      !_.isNil(routeName) ?
        new ScreenHolder(
          Guid.create().toString(),
          routeName,
          0,
          routeFromName(this.state.routes, routeName).screen,
          translateX,
          translateY,
          !_.isNil(params) ? params : {},
          false,
          tabIndex
        ) :
        prevBottomScreenHolder;

    this.initialScreenHolder = nextTopScreenHolder;

    this.setState(
      {screenHolders: [nextTopScreenHolder, prevTopScreenHolder], transitionState: 'pushing'},
      () =>
        Animated.timing(
          nextTopScreenHolder.translateX,
          animationConfig(0)
        ).start(() =>
          this.setState({screenHolders: [nextTopScreenHolder], transitionState: 'noop'})
        )
    );
  }

  /** 縦移動アニメーションと共にスクリーンを表示し、それまでのスクリーンスタックを破棄し、新しいスクリーンスタックに差し替える */
  resetWithPushVertical({routeName, params, tabIndex = 0, allowMultipleTransition = false}: NamedTransitionScreenParams) {

    if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
      return;
    }

    const prevTopScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
    const prevBottomScreenHolder = this.state.screenHolders[0];

    const translateX = new Animated.Value(0);
    const translateY = new Animated.Value(windowHeight);

    const nextTopScreenHolder =
      !_.isNil(routeName) ?
        new ScreenHolder(
          Guid.create().toString(),
          routeName,
          this.state.screenHolders.length,
          routeFromName(this.state.routes, routeName).screen,
          translateX,
          translateY,
          !_.isNil(params) ? params : {},
          false,
          tabIndex
        ) :
        prevBottomScreenHolder;

    this.initialScreenHolder = nextTopScreenHolder;

    this.setState(
      {screenHolders: [nextTopScreenHolder, prevTopScreenHolder], transitionState: 'pushing'},
      () =>
        Animated.timing(
          nextTopScreenHolder.translateY,
          animationConfig(0)
        ).start(() =>
          this.setState({screenHolders: [nextTopScreenHolder], transitionState: 'noop'})
        )
    );
  }

  /** 横移動アニメーションと共に現在のスクリーンを破棄し、新しいスクリーンスタックに差し替える */
  resetWithPopHorizontal(params?: FlexibleTransitionScreenParams) {
    const allowMultipleTransition = !_.isNil(params) && !_.isNil(params.allowMultipleTransition) ? params.allowMultipleTransition : false;

    if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
      return;
    }

    const tabIndex = !_.isNil(params) && !_.isNil(params.tabIndex) ? params.tabIndex : 0;
    const topScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
    const prevBottomScreenHolder = this.state.screenHolders[0];

    const bottomScreenHolder =
      !_.isNil(params) && !_.isNil(params.routeName) ?
        new ScreenHolder(
          Guid.create().toString(),
          params.routeName,
          0,
          routeFromName(this.state.routes, params.routeName).screen,
          new Animated.Value(0),
          new Animated.Value(0),
          !_.isNil(params) ? params : {},
          false,
          tabIndex
        ) :
        prevBottomScreenHolder;

    this.initialScreenHolder = bottomScreenHolder;

    this.setState(
      {screenHolders: [bottomScreenHolder, topScreenHolder], transitionState: 'popping'},
      () =>
        this.setState(
          {screenHolders: [bottomScreenHolder, topScreenHolder]},
          () =>
            Animated.timing(
              topScreenHolder.translateX,
              animationConfig(windowWidth)
            ).start(() =>
              this.setState({screenHolders: [bottomScreenHolder], transitionState: 'noop'})
            )
        )
    );
  }

  /** 縦移動アニメーションと共に現在のスクリーンを破棄し、新しいスクリーンスタックに差し替える */
  resetWithPopVertical(params?: FlexibleTransitionScreenParams) {
    const allowMultipleTransition = !_.isNil(params) && !_.isNil(params.allowMultipleTransition) ? params.allowMultipleTransition : false;

    if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
      return;
    }

    const tabIndex = !_.isNil(params) && !_.isNil(params.tabIndex) ? params.tabIndex : 0;
    const topScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
    const prevBottomScreenHolder = this.state.screenHolders[0];

    const bottomScreenHolder =
      !_.isNil(params) && !_.isNil(params.routeName) ?
        new ScreenHolder(
          Guid.create().toString(),
          params.routeName,
          0,
          routeFromName(this.state.routes, params.routeName).screen,
          new Animated.Value(0),
          new Animated.Value(0),
          !_.isNil(params) ? params : {},
          false,
          tabIndex
        ) :
        prevBottomScreenHolder;

    this.initialScreenHolder = bottomScreenHolder;

    this.setState(
      {screenHolders: [bottomScreenHolder, topScreenHolder], transitionState: 'popping'},
      () =>
        this.setState(
          {screenHolders: [bottomScreenHolder, topScreenHolder]},
          () =>
            Animated.timing(
              topScreenHolder.translateY,
              animationConfig(windowHeight)
            ).start(() =>
              this.setState({screenHolders: [bottomScreenHolder], transitionState: 'noop'})
            )
        )
    );
  }

  /** 移動アニメーションなしで現在のスクリーンを破棄し、新しいスクリーンスタックに差し替える */
  resetWithoutEffect({routeName, params, tabIndex = 0, allowMultipleTransition = false}: NamedTransitionScreenParams) {

    if (!allowMultipleTransition && this.state.transitionState !== 'noop') {
      return;
    }

    const bottomScreenHolder =
        new ScreenHolder(
          Guid.create().toString(),
          routeName,
          0,
          routeFromName(this.state.routes, routeName).screen,
          new Animated.Value(0),
          new Animated.Value(0),
          !_.isNil(params) ? params : {},
          false,
          tabIndex
        );

    this.initialScreenHolder = bottomScreenHolder;

    this.setState({screenHolders: [bottomScreenHolder], transitionState: 'noop'});
  }

  /** 横移動アニメーションと共に現在のスクリーンをスタックから破棄する */
  popHorizontal(params?: PopScreenParams) {
    if (this.state.transitionState !== 'noop') {
      return;
    }

    const popCount = !_.isNil(params) && !_.isNil(params.popCount) ? params.popCount : 1;
    const onEndPop = !_.isNil(params) && !_.isNil(params.onEndPop) ? params.onEndPop : () => {};

    this.setState({transitionState: 'popping'});

    const topScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
    const remainScreenHolders = this.state.screenHolders.slice(0, this.state.screenHolders.length - popCount);
    this.setState({screenHolders: remainScreenHolders.concat([topScreenHolder])}, () => {
      Animated.timing(
        this.state.screenHolders[this.state.screenHolders.length - 1].translateX,
        animationConfig(windowWidth)
      ).start(() =>
        this.setState({
          screenHolders: Stack.pop(this.state.screenHolders),
          transitionState: 'noop'
        }, () => {
          if (!_.isNil(onEndPop)) {
            onEndPop();
          }
        })
      );
    });
  }

  /** 縦移動アニメーションと共に現在のスクリーンをスタックから破棄する */
  popVertical(params?: PopScreenParams) {
    if (this.state.transitionState !== 'noop') {
      return;
    }

    const popCount = !_.isNil(params) && !_.isNil(params.popCount) ? params.popCount : 1;
    const onEndPop = !_.isNil(params) && !_.isNil(params.onEndPop) ? params.onEndPop : () => {};

    this.setState({transitionState: 'popping'});

    const topScreenHolder = this.state.screenHolders[this.state.screenHolders.length - 1];
    const remainScreenHolders = this.state.screenHolders.slice(0, this.state.screenHolders.length - popCount);
    this.setState({screenHolders: remainScreenHolders.concat([topScreenHolder])}, () => {
      Animated.timing(
        this.state.screenHolders[this.state.screenHolders.length - 1].translateY,
        animationConfig(windowHeight)
      ).start(() =>
        this.setState({
          screenHolders: Stack.pop(this.state.screenHolders),
          transitionState: 'noop'
        }, () => onEndPop())
      );
    });
  }

  /** @ignore */
  render() {
    return (
      <View style={styles.container}>
        {this.state.screenHolders.map((screenHolder, i) => {
          const Screen = screenHolder.screen;

          return (
            <Screen
              key={screenHolder.id}
              router={this}
              screenProps={this.props.screenProps}
              screenHolder={screenHolder}
              screenAttributes={{params: screenHolder.params}}
              screenIndex={i}/>
          );
        })}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
