declare module 'react-native-zen-router' {
  import * as React from 'react';
  import {Animated, LayoutRectangle} from 'react-native';
  import {EventEmitter} from 'fbemitter';

  /* Common */

  // 各コンポーネントが受け取るプロパティ群
  export interface ContentProps {
    router: Router;                      // Routerインスタンス
    screenProps: ScreenProps;            // Routerにわたしたprops.screenPropos
    screenAttributes: ScreenAttributes;  // pushXXメソッドの引数paramsを受け取る口,
    screenIndex: number;
  }

  export type Content = React.ComponentType<ContentProps>;

  export interface ScreenProps {
    [key: string]: any;
  }

  export type ScreenBaseProps = ContentProps & { screenHolder?: ScreenHolder };

  export interface ScreenAttributes {
    params: { [param: string]: any };
    tabScreen?: TabScreen;
    tabLayout?: LayoutRectangle;
    parentTabLayout?: LayoutRectangle;
  }

  export type Screen = new(props: ScreenBaseProps) => React.Component<ScreenBaseProps>;

  // 内部的に使うクラスなので気にしなくて良い
  export class ScreenHolder {
    readonly routeName: string;
    readonly screen: Screen;
    readonly translateX: Animated.Value;
    readonly translateY: Animated.Value;
    readonly stickTab?: boolean | undefined;
    readonly payload: {
      tabIndex?: number;
      childTabIndex?: number;
    };
  }


  /* Router */

  export interface Route {
    screen: Screen;
  }

  export interface RouterConfig {
    initialRouteName: string;
    transitionDuration?: number;
  }

  export interface Routes {
    [routeName: string]: Route;
  }

  export interface RouterProps {
    routes: Routes;   // 遷移するrouteNameとscreenの組み合わせオブジェクト
    config: RouterConfig;
    screenProps: ScreenProps;
  }

  export interface NamedTransitionScreenParams {
    routeName: string;
    params?: { [param: string]: any };
    tabIndex?: number;
    childTabIndex?: number;
    allowMultipleTransition?: boolean;
  }

  export interface FlexibleTransitionScreenParams {
    routeName?: string;
    params?: { [param: string]: any };
    tabIndex?: number;
    childTabIndex?: number;
    allowMultipleTransition?: boolean;
  }

  export interface PopScreenParams {
    popCount?: number;
    onEndPop?: () => any;
  }

  type TransitionState = 'pushing' | 'popping' | 'noop';

  // 一番外側のコンポーネントであり、インスタンスは遷移や状態確認のためのメソッドを保持する
  export class Router extends React.Component<RouterProps> {

    // 現在のスクリーン数
    screenLength(): number;

    // 最前面スクリーンのルート名
    topRouteName(): string;

    // 現在、積まれているルート名の配列
    routeNameStack(): string[];

    // 現在の遷移状態
    transitionState(): TransitionState;

    // 横移動での画面遷移
    pushHorizontal(params: NamedTransitionScreenParams): void;

    // フッタータブを固定したまま横移動で画面遷移
    pushHorizontalWithStickTab(params: NamedTransitionScreenParams): void;

    // 縦移動での画面遷移
    pushVertical(params: NamedTransitionScreenParams): void;

    // 戻る(横移動)
    popHorizontal(params?: PopScreenParams): void;

    // 戻る(縦移動)
    popVertical(params?: PopScreenParams): void;

    // 現在の最前面スクリーンに新たなスクリーンを表示させ、そのスクリーンのみを持つ新たなスクリーンスタックに差し替える。
    resetWithPushHorizontal(params: NamedTransitionScreenParams): void;

    resetWithPushVertical(params: NamedTransitionScreenParams): void;

    // 現在の最前面スクリーンを閉じ、その背後に初期状態のスクリーンを再描画する。
    // ボトムスクリーンにはrouteNameの指定がなければ、その時点でのボトムスクリーンが設定され、リマウントされる。
    resetWithPopHorizontal(params?: FlexibleTransitionScreenParams): void;

    resetWithPopVertical(params?: FlexibleTransitionScreenParams): void;

    resetWithoutEffect(params: NamedTransitionScreenParams): void;
  }


  /* Generic Screen */

  // ノーマルなスクリーン、スクリーン固有の機能は持っていない
  export class GenericScreen extends React.Component<GenericScreenProps> {
  }

  export type GenericScreenProps = ScreenBaseProps & CreateGenericScreenParams & { screenAttributes: ScreenAttributes };

  export interface CreateGenericScreenParams {
    content: Content;
  }

  // GenericScreenの生成メソッド
  export const createGenericScreen: (params: CreateGenericScreenParams) => Screen;


  /* Tab Screen */

  export type TabType = 'header' | 'footer';


  export type TabScreenProps = ScreenBaseProps & CreateTabScreenParams & { screenAttributes: ScreenAttributes };

  export enum SwipeDirection {
    NONE = 0,
    NEXT = 1,
    PREV = 2
  }

  // addTabChangingListenerの戻り値型、後で購読を解除するために使う
  export interface TabEventSubscription {
    remove: () => void;
  }

  export class TabScreen extends React.Component<TabScreenProps> {
    public eventEmitter: EventEmitter;

    // タブの変更、payloadはaddTabChangingListenerに送られる
    switchTab(index: number, payload?: any): void;

    // 現在タブのインデックス
    currentIndex(): number;

    // タブ切り替え時イベントに実行するコールバックを受け付ける
    addTabChangingListener(callback: (prevIndex: number, nextIndex: number, payload: any) => void): TabEventSubscription;
  }

  export interface CreateTabScreenParams {
    tabType: TabType;
    tabComponent: Content;
    contentComponents: Content[];
    swipable?: boolean;
    shouldUnmountForNonDisplayedContent?: boolean;
    containerComponent?: Content;
    negativeMarginBottomOfContent?: number;
  }

  // GenericScreenの生成メソッド
  export const createTabScreen: (params: CreateTabScreenParams) => Screen;
}
