import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import DrawerItemList from './DrawerItemList';
import { DrawerContentComponentProps } from '../types';

export default function DrawerContent({
  style,
  drawerPosition,
  ...rest
}: DrawerContentComponentProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={[styles.container, style]}
    >
      <SafeAreaView
        forceInset={{
          [drawerPosition]: 'always',
          [drawerPosition === 'left' ? 'right' : 'left']: 'never',
          top: 'always',
          bottom: 'always',
        }}
      >
        <DrawerItemList {...rest} />
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 4,
  },
});
