import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemeContext } from 'react-navigation';
import TouchableItem from './TouchableItem';
import { ThemedColor } from '../types';

type Props = {
  /**
   * The label text of the item.
   */
  label:
    | React.ReactNode
    | ((props: { focused: boolean; tintColor: string }) => React.ReactNode);
  /**
   * Icon to display for the `DrawerItem`.
   */
  icon?:
    | React.ReactNode
    | ((props: {
        focused: boolean;
        size: number;
        tintColor: string;
      }) => React.ReactNode);
  /**
   * Whether to highlight the drawer item as active.
   */
  focused?: boolean;
  /**
   * Function to execute on press.
   */
  onPress: () => void;
  /**
   * Color for the icon and label when the item is active.
   */
  activeTintColor?: ThemedColor;
  /**
   * Color for the icon and label when the item is inactive.
   */
  inactiveTintColor?: ThemedColor;
  /**
   * Background color for item when its active.
   */
  activeBackgroundColor?: ThemedColor;
  /**
   * Background color for item when its inactive.
   */
  inactiveBackgroundColor?: ThemedColor;
  /**
   * Style object for the label element.
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Style object for the wrapper element.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * A component used to show an action item with an icon and a label in a navigation drawer.
 */
export default function DrawerItem({
  icon,
  label,
  focused = false,
  activeTintColor = {
    light: '#2196f3',
    dark: '#fff',
  },
  inactiveTintColor = {
    light: 'rgba(0, 0, 0, .87)',
    dark: 'rgba(255, 255, 255, .87)',
  },
  activeBackgroundColor = {
    light: 'rgba(0, 0, 0, .04)',
    dark: 'rgba(255, 255, 255, .04)',
  },
  inactiveBackgroundColor = {
    light: 'transparent',
    dark: 'transparent',
  },
  style,
  onPress,
  ...rest
}: Props) {
  return (
    <ThemeContext.Consumer>
      {theme => {
        const { borderRadius = 4 } = StyleSheet.flatten(style || {});
        const themeColor = focused ? activeTintColor : inactiveTintColor;
        const themeBackgroundColor = focused
          ? activeBackgroundColor
          : inactiveBackgroundColor;

        const color =
          typeof themeColor === 'string' ? themeColor : themeColor[theme];

        const backgroundColor =
          typeof themeBackgroundColor === 'string'
            ? themeBackgroundColor
            : themeBackgroundColor[theme];

        const iconNode =
          typeof icon === 'function'
            ? icon({ size: 24, focused, tintColor: color })
            : icon;

        return (
          <View
            collapsable={false}
            {...rest}
            style={[styles.container, { borderRadius, backgroundColor }, style]}
          >
            <TouchableItem
              borderless
              delayPressIn={0}
              onPress={onPress}
              style={[styles.wrapper, { borderRadius }]}
              accessibilityTraits={focused ? ['button', 'selected'] : 'button'}
              accessibilityComponentType="button"
              accessibilityRole="button"
              accessibilityStates={focused ? ['selected'] : []}
            >
              <React.Fragment>
                {iconNode}
                {typeof label === 'function' ? (
                  label({ tintColor: color, focused })
                ) : (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      {
                        color,
                        fontWeight: '500',
                        marginLeft: iconNode ? 32 : 0,
                        marginVertical: 5,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                )}
              </React.Fragment>
            </TouchableItem>
          </View>
        );
      }}
    </ThemeContext.Consumer>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginVertical: 4,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  label: {
    marginRight: 32,
  },
});
