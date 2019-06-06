import * as React from 'react';
import {Dimensions, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ContentProps, TabScreen} from 'react-native-zen-router';

const windowWidth = Dimensions.get('window').width;

export class HeaderTab extends React.Component<ContentProps> {
  render() {
    const tabScreen = this.props.screenAttributes.tabScreen;
    return (
      <View style={styles.headerTabContainer}>
        <View style={styles.goBack}>
          <Text style={styles.goBackText} onPress={() => this.props.router.popHorizontal()}>
            {'< GoBack'}
          </Text>
        </View>
        <View style={styles.headerTabButtons}>
          <TouchableOpacity style={styles.headerTabButton}>
            <Text
              style={{color: tabScreen!.currentIndex() === 0 ? '#55cbe1' : '#4c4c4c'}}
              onPress={() => tabScreen!.switchTab(0)}>
              {'Content1'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerTabButton}>
            <Text
              style={{color: tabScreen!.currentIndex() === 1 ? '#55cbe1' : '#4c4c4c'}}
              onPress={() => tabScreen!.switchTab(1)}>
              {'Content2'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerTabButton}>
            <Text
              style={{color: tabScreen!.currentIndex() === 2 ? '#55cbe1' : '#4c4c4c'}}
              onPress={() => tabScreen!.switchTab(2)}>
              {'Content3'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export const FooterTab = ({router, screenProps, screenAttributes}: ContentProps) => {
  const tabScreen = screenAttributes.tabScreen as TabScreen;
  return (
    <View style={styles.footerTabContainer}>
      <View style={styles.footerTabButton}>
        <Text
          style={{color: tabScreen.currentIndex() === 0 ? '#8ad132' : '#4c4c4c'}}
          onPress={() => tabScreen.switchTab(0)}>
          {'Content A'}
        </Text>
      </View>
      <View style={styles.footerTabButton}>
        <Text
          style={{color: tabScreen.currentIndex() === 1 ? '#8ad132' : '#4c4c4c'}}
          onPress={() => tabScreen.switchTab(1)}>
          {'Content B'}
        </Text>
      </View>
    </View>
  );
};

export const ContentForTab = (kind: string) => {
  return class extends React.Component<ContentProps> {
    render() {
      return <View style={styles.contentContainer}>
        <View>
          <Text style={styles.contentText}>
            {`Screen ${kind}`}
          </Text>
        </View>
      </View>;
    }
  };
};

const styles = StyleSheet.create({
  headerTabContainer: {
    backgroundColor: '#fff'
  },
  goBack: {
    top: 8,
    left: 8,
    height: 20,
  },
  goBackText: {
    fontSize: 14,
    color: '#4c4c4c'
  },
  headerTabButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    top: 12,
    height: 60,
    width: windowWidth,
    borderBottomWidth: 0.5,
    borderColor: '#808080'
  },
  headerTabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 64,
  },
  headerTabButtonCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#808080'
  },
  footerTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    height: 60,
    borderTopWidth: 0.5,
    borderColor: '#808080'
  },
  footerTabButton: {
    flex: 1,
    alignItems: 'center'
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  contentText: {
    textAlign: 'center'
  }
});
