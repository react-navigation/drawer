import * as React from 'react';
import DrawerItem from './DrawerItem';
import {
  DrawerContentOptions,
  NavigationDrawerProp,
  SceneDescriptorMap,
} from '../types';

type Props = Omit<DrawerContentOptions, 'style'> & {
  navigation: NavigationDrawerProp;
  descriptors: SceneDescriptorMap;
};

/**
 * Component that renders the navigation list in the drawer.
 */
export default function DrawerItemList({
  navigation,
  descriptors,
  activeTintColor,
  inactiveTintColor,
  activeBackgroundColor,
  inactiveBackgroundColor,
  itemStyle,
  labelStyle,
}: Props) {
  return (navigation.state.routes.map((route, i) => {
    const focused = i === navigation.state.index;
    const { title, drawerLabel, drawerIcon } = descriptors[route.key].options;

    return (
      <DrawerItem
        key={route.key}
        label={
          drawerLabel != null
            ? drawerLabel
            : title != null
            ? title
            : route.routeName
        }
        icon={drawerIcon != null ? drawerIcon : undefined}
        focused={focused}
        activeTintColor={activeTintColor}
        inactiveTintColor={inactiveTintColor}
        activeBackgroundColor={activeBackgroundColor}
        inactiveBackgroundColor={inactiveBackgroundColor}
        labelStyle={labelStyle}
        style={itemStyle}
        onPress={() => {
          if (focused) {
            navigation.closeDrawer();
          } else {
            navigation.navigate({ routeName: route.routeName });
          }
        }}
      />
    );
  }) as React.ReactNode) as React.ReactElement;
}
