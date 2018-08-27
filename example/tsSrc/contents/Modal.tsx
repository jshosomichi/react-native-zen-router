import * as React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {GenericScreenProps} from 'react-native-zen-router';

export const CloseButton = ({onClose}: { onClose: () => void }) =>
  <View style={styles.closeButton}>
    <Text style={{fontSize: 24}} onPress={onClose}>{'×'}</Text>
  </View>;


export const Modal = ({router, screenAttributes}: GenericScreenProps) =>
  <View style={styles.container}>
    <CloseButton onClose={() => router.popVertical()}/>
    <Text style={styles.title}>
      {'Modal Screen'}
    </Text>
    <Text style={styles.paramText}>
      {!!screenAttributes.params ? 'params:' + JSON.stringify(screenAttributes.params) : 'no parameter'}
    </Text>
  </View>;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontFamily: Platform.select({ios: 'BodoniSvtyTwoOSITCTT-Book', android: 'serif'}),
  },
  paramText: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: Platform.select({ios: 'CourierNewPSMT', android: 'sans-serif-smallcaps'}),
  },
});

