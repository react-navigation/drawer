import * as React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Scene, Route } from '../types';
export declare type Props = {
    items: Route[];
    activeItemKey?: string | null;
    activeTintColor?: string;
    activeBackgroundColor?: string;
    inactiveTintColor?: string;
    inactiveBackgroundColor?: string;
    getLabel: (scene: Scene) => React.ReactNode;
    renderIcon: (scene: Scene) => React.ReactNode;
    onItemPress: (scene: {
        route: Route;
        focused: boolean;
    }) => void;
    itemsContainerStyle?: ViewStyle;
    itemStyle?: ViewStyle;
    labelStyle?: TextStyle;
    activeLabelStyle?: TextStyle;
    inactiveLabelStyle?: TextStyle;
    iconContainerStyle?: ViewStyle;
    drawerPosition: 'left' | 'right';
};
/**
 * Component that renders the navigation list in the drawer.
 */
declare const DrawerNavigatorItems: {
    ({ items, activeItemKey, activeTintColor, activeBackgroundColor, inactiveTintColor, inactiveBackgroundColor, getLabel, renderIcon, onItemPress, itemsContainerStyle, itemStyle, labelStyle, activeLabelStyle, inactiveLabelStyle, iconContainerStyle, drawerPosition, }: Props): JSX.Element;
    defaultProps: {
        activeTintColor: string;
        activeBackgroundColor: string;
        inactiveTintColor: string;
        inactiveBackgroundColor: string;
    };
};
export default DrawerNavigatorItems;
