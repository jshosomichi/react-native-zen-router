import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as React from 'react';
import {ContentProps} from 'react-native-zen-router';

interface Item {
  description: string;
  callback: () => void;
}

export class TopScreen extends React.Component<ContentProps> {
  LinkItem = ({item}: { item: Item }) => (
    <TouchableOpacity style={styles.linkItemContainer} onPress={item.callback}>
      <View style={styles.linkDescription}><Text>{item.description}</Text></View>
      <View style={styles.linkArrow}><Text style={{fontSize: 20}}>{'→'}</Text></View>
    </TouchableOpacity>
  )

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
        callback: () => this.props.router.pushHorizontal({routeName: 'NestedTab', tabIndex: 0, childTabIndex: 2})
      },
    ];

    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {'React Native Zen Router Example'}
        </Text>
        <FlatList
          keyExtractor={(item, index) => String(index)}
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
    fontSize: 22
  },
  linkListContainer: {
    marginTop: 20
  },
  linkItemContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: 0.5,
    borderBottomColor: '#808080',
    paddingBottom: 4
  },
  linkDescription: {
    flex: 4,
    justifyContent: 'flex-end'
  },
  linkArrow: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  }
});
