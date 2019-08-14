import * as React from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Props as DrawerNavigatorItemsProps } from './DrawerNavigatorItems';
import { Navigation } from '../types';
export declare type ContentComponentProps = DrawerNavigatorItemsProps & {
    navigation: Navigation;
    descriptors: {
        [key: string]: any;
    };
    drawerOpenProgress: Animated.AnimatedInterpolation;
    screenProps: unknown;
};
declare type Props = {
    contentComponent?: React.ComponentType<ContentComponentProps>;
    contentOptions?: object;
    screenProps?: unknown;
    navigation: Navigation;
    descriptors: {
        [key: string]: any;
    };
    drawerOpenProgress: Animated.AnimatedInterpolation;
    drawerPosition: 'left' | 'right';
    style?: ViewStyle;
};
/**
 * Component that renders the sidebar screen of the drawer.
 */
declare class DrawerSidebar extends React.PureComponent<Props> {
    private getScreenOptions;
    private getLabel;
    private renderIcon;
    private handleItemPress;
    render(): JSX.Element | null;
}
export default DrawerSidebar;
