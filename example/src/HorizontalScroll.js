import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { createDrawerNavigator } from 'react-navigation-drawer';

class ScrollingScreen extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <ScrollView pagingEnabled horizontal>
          {Array.from({ length: 60 }).map((_, i) => (
            <Text key={i} style={styles.rowText}>
              {i}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowText: {
    padding: 20,
    backgroundColor: 'steelblue',
    color: 'white',
    margin: 20,
  },
});

export default createDrawerNavigator(
  {
    Home: ScrollingScreen,
  },
  {
    drawerPosition: 'right',
  }
);
