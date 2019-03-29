import * as React from 'react';
import * as _ from 'lodash';
import { Animated, Dimensions, StyleSheet } from 'react-native';
const windowWidth = Dimensions.get('window').width;
/** 特有の機能を持たないスクリーン。1つのReactコンポーネントで画面全体を構成する。 */
export class GenericScreen extends React.Component {
    /** @ignore */
    shouldComponentUpdate() {
        const { router, screenIndex } = this.props;
        return screenIndex === router.screenLength() - 1;
    }
    /** @ignore */
    render() {
        const { content, router, screenHolder, screenProps } = this.props;
        // Nested tab's children don't have a screenHolder prop.
        const isNestedTabsChild = _.isNil(screenHolder);
        const translateX = isNestedTabsChild ? new Animated.Value(0) : screenHolder.translateX;
        const translateY = isNestedTabsChild ? new Animated.Value(0) : screenHolder.translateY;
        const animationPosition = { transform: [{ translateX }, { translateY }] };
        const params = isNestedTabsChild ? {} : screenHolder.params;
        const Content = content;
        return (<Animated.View style={[styles.screenContainer, animationPosition]}>
        <Content router={router} screenProps={screenProps} screenAttributes={{ params }} screenIndex={this.props.screenIndex}/>
      </Animated.View>);
    }
}
/** GenericScreenを生成する */
export const createGenericScreen = (params) => {
    return class extends GenericScreen {
        render() {
            return (<GenericScreen content={params.content} router={this.props.router} screenHolder={this.props.screenHolder} screenProps={this.props.screenProps} screenAttributes={this.props.screenAttributes} screenIndex={this.props.screenIndex}/>);
        }
    };
};
const styles = StyleSheet.create({
    screenContainer: {
        position: 'absolute',
        width: windowWidth,
        height: '100%',
        backgroundColor: '#fff'
    }
});
