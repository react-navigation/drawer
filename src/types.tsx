import {
  NavigationScreenProp,
  NavigationState,
  NavigationRoute,
  NavigationParams,
  NavigationProp,
  NavigationDescriptor,
  SupportedThemes,
  NavigationScreenConfig,
} from 'react-navigation';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';

export type Scene = {
  route: NavigationRoute;
  index: number;
  focused: boolean;
  tintColor: string;
};

export type NavigationDrawerState = NavigationState & {
  isDrawerOpen: boolean;
};

export type NavigationDrawerProp<
  State = NavigationRoute,
  Params = NavigationParams
> = NavigationScreenProp<State, Params> & {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  jumpTo: (routeName: string, key?: string) => void;
};

export type NavigationDrawerOptions = {
  title?: string;
  drawerLabel?:
    | React.ReactNode
    | ((props: { tintColor: string; focused: boolean }) => React.ReactNode);
  drawerIcon?:
    | React.ReactNode
    | ((props: { tintColor: string; focused: boolean }) => React.ReactNode);
  drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open';
};

export type NavigationDrawerConfig = {
  contentComponent?: React.ComponentType<DrawerContentComponentProps>;
  edgeWidth?: number;
  minSwipeDistance?: number;
  drawerWidth?: number | (() => number);
  drawerPosition?: 'left' | 'right';
  drawerType?: 'front' | 'back' | 'slide';
  drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open';
  keyboardDismissMode?: 'none' | 'on-drag';
  swipeEdgeWidth?: number;
  swipeDistanceThreshold?: number;
  swipeVelocityThreshold?: number;
  hideStatusBar?: boolean;
  statusBarAnimation?: 'slide' | 'none' | 'fade';
  drawerBackgroundColor?: ThemedColor;
  overlayColor?: ThemedColor;
  screenContainerStyle?: StyleProp<ViewStyle>;
};

export type NavigationDrawerRouterConfig = {
  unmountInactiveRoutes?: boolean;
  resetOnBlur?: boolean;
  initialRouteName?: string;
  contentComponent?: React.ComponentType<DrawerContentComponentProps>;
  contentOptions?: object;
  backBehavior?: 'none' | 'initialRoute' | 'history';
};

export type ThemedColor =
  | string
  | {
      light: string;
      dark: string;
    };

export type DrawerNavigatorItemsProps = DrawerContentOptions & {
  navigation: NavigationDrawerProp<NavigationRoute>;
  screenProps: unknown;
  descriptors: SceneDescriptorMap;
  drawerPosition: 'left' | 'right';
};

export type DrawerContentOptions = {
  activeTintColor?: ThemedColor;
  activeBackgroundColor?: ThemedColor;
  inactiveTintColor?: ThemedColor;
  inactiveBackgroundColor?: ThemedColor;
  itemsContainerStyle?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  activeLabelStyle?: StyleProp<TextStyle>;
  inactiveLabelStyle?: StyleProp<TextStyle>;
  iconContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export type DrawerContentComponentProps = DrawerNavigatorItemsProps & {
  navigation: NavigationProp<NavigationDrawerState>;
  descriptors: SceneDescriptorMap;
  screenProps: unknown;
  progress: Animated.Node<number>;
};

export type NavigationDrawerScreenProps<
  Params = NavigationParams,
  ScreenProps = unknown
> = {
  theme: SupportedThemes;
  navigation: NavigationDrawerProp<NavigationRoute, Params>;
  screenProps: ScreenProps;
};

export type NavigationDrawerScreenComponent<
  Params = NavigationParams,
  ScreenProps = unknown
> = React.ComponentType<NavigationDrawerScreenProps<Params, ScreenProps>> & {
  navigationOptions?: NavigationScreenConfig<
    NavigationDrawerOptions,
    NavigationDrawerProp<NavigationRoute, Params>,
    ScreenProps
  >;
};

export type SceneDescriptorMap = {
  [key: string]: NavigationDescriptor<
    NavigationParams,
    NavigationDrawerOptions,
    NavigationDrawerProp<NavigationRoute, any>
  >;
};
