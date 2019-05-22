import * as React from 'react';
import {createGenericScreen, createTabScreen, Router, Routes} from 'react-native-zen-router';
import {SafeAreaView} from 'react-native';
import {HeaderTab, FooterTab, ContentForTab} from './contents/Tab';
import {TopScreen} from './contents/Top';
import {Modal} from './contents/Modal';


const routes: Routes = {
  Top: {
    screen: createGenericScreen({content: TopScreen})
  },
  Modal: {
    screen: createGenericScreen({content: Modal})
  },
  HeaderTab: {
    screen:
      createTabScreen({
        tabType: 'header',
        tabComponent: HeaderTab,
        contentComponents: [
          ContentForTab('Foo'),
          ContentForTab('Bar'),
          ContentForTab('Baz'),
        ],
        swipable: true
      })
  },
  NestedTab: {
    screen: createTabScreen({
      tabType: 'footer',
      tabComponent: FooterTab,
      contentComponents: [
        createTabScreen({
          tabType: 'header',
          tabComponent: HeaderTab,
          contentComponents: [
            ContentForTab('One'),
            ContentForTab('Two'),
            ContentForTab('Three'),
          ],
          swipable: true
        }),
        ContentForTab('X')
      ]
    })
  },
};


const config = {
  initialRouteName: 'Top'
};

export default class App extends React.Component {
  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <Router
          routes={routes}
          config={config}
          screenProps={{globalValue: 100}}/>
      </SafeAreaView>
    );
  }
}
