import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from '@react-navigation/native';
import TouchableItem from './TouchableItem';

/**
 * Component that renders the navigation list in the drawer.
 */
const DrawerNavigatorItems = ({
  items,
  activeItemKey,
  activeTintColor,
  activeBackgroundColor,
  inactiveTintColor,
  inactiveBackgroundColor,
  getLabel,
  getAccessibilityLabel,
  renderIcon,
  onItemPress,
  itemsContainerStyle,
  itemStyle,
  labelStyle,
  activeLabelStyle,
  inactiveLabelStyle,
  iconContainerStyle,
  drawerPosition,
}) => (
  <View style={[styles.container, itemsContainerStyle]}>
    {items.map((route, index) => {
      const focused = activeItemKey === route.key;
      const color = focused ? activeTintColor : inactiveTintColor;
      const backgroundColor = focused
        ? activeBackgroundColor
        : inactiveBackgroundColor;
      const scene = { route, index, focused, tintColor: color };
      const icon = renderIcon(scene);
      const label = getLabel(scene);
      const extraLabelStyle = focused ? activeLabelStyle : inactiveLabelStyle;
      let accessibilityLabel;

      if (typeof label === 'string') {
        accessibilityLabel = label;
      } else if (typeof getAccessibilityLabel === 'function') {
        accessibilityLabel = getAccessibilityLabel(scene);

        if (typeof accessibilityLabel !== 'string') {
          throw new Error(
            'DrawerItems: prop getAccessibilityLabel must return a string'
          );
        }
      } else {
        throw new Error(
          'DrawerItems: prop getLabel must return a string or getAccessibilityLabel must be a function returning a string'
        );
      }

      return (
        <TouchableItem
          key={route.key}
          accessible
          accessibilityLabel={accessibilityLabel}
          onPress={() => {
            onItemPress({ route, focused });
          }}
          delayPressIn={0}
        >
          <SafeAreaView
            style={{ backgroundColor }}
            forceInset={{
              [drawerPosition]: 'always',
              [drawerPosition === 'left' ? 'right' : 'left']: 'never',
              vertical: 'never',
            }}
          >
            <View style={[styles.item, itemStyle]}>
              {icon ? (
                <View
                  style={[
                    styles.icon,
                    focused ? null : styles.inactiveIcon,
                    iconContainerStyle,
                  ]}
                >
                  {icon}
                </View>
              ) : null}
              {typeof label === 'string' ? (
                <Text
                  style={[styles.label, { color }, labelStyle, extraLabelStyle]}
                >
                  {label}
                </Text>
              ) : (
                label
              )}
            </View>
          </SafeAreaView>
        </TouchableItem>
      );
    })}
  </View>
);

/* Material design specs - https://material.io/guidelines/patterns/navigation-drawer.html#navigation-drawer-specs */
DrawerNavigatorItems.defaultProps = {
  activeTintColor: '#2196f3',
  activeBackgroundColor: 'rgba(0, 0, 0, .04)',
  inactiveTintColor: 'rgba(0, 0, 0, .87)',
  inactiveBackgroundColor: 'transparent',
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 16,
    width: 24,
    alignItems: 'center',
  },
  inactiveIcon: {
    /*
     * Icons have 0.54 opacity according to guidelines
     * 100/87 * 54 ~= 62
     */
    opacity: 0.62,
  },
  label: {
    margin: 16,
    fontWeight: 'bold',
  },
});

export default DrawerNavigatorItems;
