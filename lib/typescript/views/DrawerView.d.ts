import * as React from 'react';
import { ViewStyle } from 'react-native';
import { ContentComponentProps } from './DrawerSidebar';
import { Navigation } from '../types';
declare type DrawerOptions = {
    drawerBackgroundColor?: string;
    overlayColor?: string;
    minSwipeDistance?: number;
    drawerPosition: 'left' | 'right';
    drawerType: 'front' | 'back' | 'slide';
    drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open';
    keyboardDismissMode?: 'on-drag' | 'none';
    drawerWidth: number | (() => number);
    statusBarAnimation: 'slide' | 'none' | 'fade';
    onDrawerClose?: () => void;
    onDrawerOpen?: () => void;
    contentContainerStyle?: ViewStyle;
    edgeWidth: number;
    hideStatusBar?: boolean;
    style?: ViewStyle;
};
declare type Props = {
    lazy: boolean;
    navigation: Navigation;
    descriptors: {
        [key: string]: {
            navigation: {};
            getComponent: () => React.ComponentType<{}>;
            options: DrawerOptions;
        };
    };
    navigationConfig: DrawerOptions & {
        contentComponent?: React.ComponentType<ContentComponentProps>;
        unmountInactiveRoutes?: boolean;
        contentOptions?: object;
    };
    screenProps: unknown;
};
declare type State = {
    loaded: number[];
    drawerWidth: number;
};
/**
 * Component that renders the drawer.
 */
export default class DrawerView extends React.PureComponent<Props, State> {
    static defaultProps: {
        lazy: boolean;
    };
    static getDerivedStateFromProps(nextProps: Props, prevState: State): {
        loaded: number[];
    };
    state: State;
    componentDidMount(): void;
    componentWillUnmount(): void;
    private drawerGestureRef;
    private handleDrawerOpen;
    private handleDrawerClose;
    private updateWidth;
    private renderNavigationView;
    private renderContent;
    private setDrawerGestureRef;
    render(): JSX.Element;
}
export {};
