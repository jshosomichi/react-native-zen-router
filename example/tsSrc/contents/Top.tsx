import {FlatList, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as React from 'react';
import {ContentProps} from 'react-native-zen-router';

interface Item {
  description: string;
  callback: () => void;
}

export class TopScreen extends React.Component<ContentProps> {
  LinkItem = ({item}: { item: Item }) => {
    return (
      <TouchableOpacity style={styles.linkItemContainer} onPress={item.callback}>
        <View style={styles.linkDescription}>
          <Text style={styles.linkDescriptionText}>{item.description}</Text>
        </View>
        <View style={styles.linkArrow}>
          <Text style={styles.linkArrowText}>{'→'}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  render() {
    const routes: Item[] = [
      {
        description: 'Open the generic screen vertically.',
        callback: () => this.props.router.pushVertical({routeName: 'Modal', params: {message: 'Hello!'}})
      },
      {
        description: 'Open the tab screen. (header tab)',
        callback: () => this.props.router.pushHorizontal({routeName: 'HeaderTab'})
      },
      {
        description: 'Open the tab screen. (header and footer)',
        callback: () => this.props.router.pushHorizontal({routeName: 'NestedTab'})
      },
    ];

    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {'React Native Zen Router Example'}
        </Text>
        <FlatList
          style={styles.linkListContainer}
          data={routes}
          renderItem={this.LinkItem}
        />
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: '#fff'
  },
  title: {
    color: '#4c4c4c',
    fontSize: Platform.select({ios: 26, android: 21}),
    fontFamily: Platform.select({ios: 'BodoniSvtyTwoOSITCTT-Book', android: 'serif'}),
  },
  linkListContainer: {
    marginTop: 30
  },
  linkItemContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 56,
    borderBottomWidth: 0.5,
    borderBottomColor: '#808080',
  },
  linkDescription: {
    flex: 6,
    justifyContent: 'flex-end',
  },
  linkDescriptionText: {
    height: 16,
    bottom: 4,
    fontSize: Platform.select({ios: 12, android: 14}),
    fontFamily: Platform.select({ios: 'CourierNewPSMT', android: 'sans-serif-smallcaps'}),
  },
  linkArrow: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  },
  linkArrowText: {
    fontSize: Platform.select({ios: 24, android: 26}),
    fontFamily: Platform.select({ios: 'CourierNewPSMT', android: 'sans-serif-smallcaps'}),
    bottom: 2,
  }
});
