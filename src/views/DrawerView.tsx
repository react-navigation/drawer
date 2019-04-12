import * as React from 'react';
import { Dimensions, StyleSheet, ViewStyle, Animated } from 'react-native';
import { SceneView } from '@react-navigation/core';
import DrawerLayout from 'react-native-gesture-handler/DrawerLayout';
import { ScreenContainer } from 'react-native-screens';

import * as DrawerActions from '../routers/DrawerActions';
import DrawerSidebar, { ContentComponentProps } from './DrawerSidebar';
import DrawerGestureContext from '../utils/DrawerGestureContext';
import ResourceSavingScene from '../views/ResourceSavingScene';
import { Navigation } from '../types';

type DrawerOptions = {
  drawerBackgroundColor?: string;
  overlayColor?: string;
  minSwipeDistance?: number;
  drawerPosition: 'left' | 'right';
  drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open';
  keyboardDismissMode?: 'on-drag' | 'none';
  drawerType: 'front' | 'back' | 'slide';
  drawerWidth: number | (() => number);
  statusBarAnimation: 'slide' | 'none' | 'fade';
  useNativeAnimations?: boolean;
  onDrawerClose?: () => void;
  onDrawerOpen?: () => void;
  onDrawerStateChanged?: () => void;
  drawerContainerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edgeWidth: number;
  hideStatusBar?: boolean;
  style?: ViewStyle;
};

type Props = {
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

type State = {
  loaded: number[];
  drawerWidth: number;
};

/**
 * Component that renders the drawer.
 */
export default class DrawerView extends React.PureComponent<Props, State> {
  static defaultProps = {
    lazy: true,
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { index } = nextProps.navigation.state;

    return {
      // Set the current tab to be loaded if it was not loaded before
      loaded: prevState.loaded.includes(index)
        ? prevState.loaded
        : [...prevState.loaded, index],
    };
  }

  state: State = {
    loaded: [this.props.navigation.state.index],
    drawerWidth:
      typeof this.props.navigationConfig.drawerWidth === 'function'
        ? this.props.navigationConfig.drawerWidth()
        : this.props.navigationConfig.drawerWidth,
  };

  componentDidMount() {
    Dimensions.addEventListener('change', this._updateWidth);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      openId,
      closeId,
      toggleId,
      isDrawerOpen,
    } = this.props.navigation.state;
    const {
      openId: prevOpenId,
      closeId: prevCloseId,
      toggleId: prevToggleId,
    } = prevProps.navigation.state;

    let prevIds = [prevOpenId, prevCloseId, prevToggleId];
    let changedIds = [openId, closeId, toggleId]
      .filter(id => !prevIds.includes(id))
      // @ts-ignore
      .sort((a, b) => a > b);

    changedIds.forEach(id => {
      if (id === openId) {
        this._drawer.openDrawer();
      } else if (id === closeId) {
        this._drawer.closeDrawer();
      } else if (id === toggleId) {
        if (isDrawerOpen) {
          this._drawer.closeDrawer();
        } else {
          this._drawer.openDrawer();
        }
      }
    });
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this._updateWidth);
  }

  _drawer: typeof DrawerLayout;

  drawerGestureRef = React.createRef();

  _handleDrawerStateChange = (newState: string, willShow: boolean) => {
    if (newState === 'Idle') {
      if (!this.props.navigation.state.isDrawerIdle) {
        this.props.navigation.dispatch({
          type: DrawerActions.MARK_DRAWER_IDLE,
          key: this.props.navigation.state.key,
        });
      }
    } else if (newState === 'Settling') {
      this.props.navigation.dispatch({
        type: DrawerActions.MARK_DRAWER_SETTLING,
        key: this.props.navigation.state.key,
        willShow,
      });
    } else {
      if (this.props.navigation.state.isDrawerIdle) {
        this.props.navigation.dispatch({
          type: DrawerActions.MARK_DRAWER_ACTIVE,
          key: this.props.navigation.state.key,
        });
      }
    }
  };

  _handleDrawerOpen = () => {
    this.props.navigation.dispatch({
      type: DrawerActions.DRAWER_OPENED,
      key: this.props.navigation.state.key,
    });
  };

  _handleDrawerClose = () => {
    this.props.navigation.dispatch({
      type: DrawerActions.DRAWER_CLOSED,
      key: this.props.navigation.state.key,
    });
  };

  _updateWidth = () => {
    const drawerWidth =
      typeof this.props.navigationConfig.drawerWidth === 'function'
        ? this.props.navigationConfig.drawerWidth()
        : this.props.navigationConfig.drawerWidth;

    if (this.state.drawerWidth !== drawerWidth) {
      this.setState({ drawerWidth });
    }
  };

  _renderNavigationView = (
    drawerOpenProgress: Animated.AnimatedInterpolation
  ) => {
    return (
      <DrawerGestureContext.Provider value={this.drawerGestureRef}>
        <DrawerSidebar
          screenProps={this.props.screenProps}
          drawerOpenProgress={drawerOpenProgress}
          navigation={this.props.navigation}
          descriptors={this.props.descriptors}
          contentComponent={this.props.navigationConfig.contentComponent}
          contentOptions={this.props.navigationConfig.contentOptions}
          drawerPosition={this.props.navigationConfig.drawerPosition}
          style={this.props.navigationConfig.style}
          {...this.props.navigationConfig}
        />
      </DrawerGestureContext.Provider>
    );
  };

  _renderContent = () => {
    let { lazy, navigation } = this.props;
    let { loaded } = this.state;
    let { routes } = navigation.state;

    if (this.props.navigationConfig.unmountInactiveRoutes) {
      let activeKey = navigation.state.routes[navigation.state.index].key;
      let descriptor = this.props.descriptors[activeKey];

      return (
        <SceneView
          navigation={descriptor.navigation}
          screenProps={this.props.screenProps}
          component={descriptor.getComponent()}
        />
      );
    } else {
      return (
        <ScreenContainer style={styles.pages}>
          {routes.map((route, index) => {
            if (lazy && !loaded.includes(index)) {
              // Don't render a screen if we've never navigated to it
              return null;
            }

            let isFocused = navigation.state.index === index;
            let descriptor = this.props.descriptors[route.key];

            return (
              <ResourceSavingScene
                key={route.key}
                style={[
                  StyleSheet.absoluteFill,
                  { opacity: isFocused ? 1 : 0 },
                ]}
                isVisible={isFocused}
              >
                <SceneView
                  navigation={descriptor.navigation}
                  screenProps={this.props.screenProps}
                  component={descriptor.getComponent()}
                />
              </ResourceSavingScene>
            );
          })}
        </ScreenContainer>
      );
    }
  };

  _setDrawerGestureRef = (ref: any) => {
    // @ts-ignore
    this.drawerGestureRef.current = ref;
  };

  render() {
    const { navigation, screenProps } = this.props;
    const activeKey = navigation.state.routes[navigation.state.index].key;
    const { drawerLockMode } = this.props.descriptors[activeKey].options;

    return (
      <DrawerLayout
        ref={(c: any) => {
          this._drawer = c;
        }}
        onGestureRef={this._setDrawerGestureRef}
        drawerLockMode={
          drawerLockMode ||
          (typeof screenProps === 'object' &&
            screenProps != null &&
            // @ts-ignore
            screenProps.drawerLockMode) ||
          this.props.navigationConfig.drawerLockMode
        }
        drawerBackgroundColor={
          this.props.navigationConfig.drawerBackgroundColor
        }
        keyboardDismissMode={this.props.navigationConfig.keyboardDismissMode}
        drawerWidth={this.state.drawerWidth}
        onDrawerOpen={this._handleDrawerOpen}
        onDrawerClose={this._handleDrawerClose}
        onDrawerStateChanged={this._handleDrawerStateChange}
        useNativeAnimations={this.props.navigationConfig.useNativeAnimations}
        renderNavigationView={this._renderNavigationView}
        drawerPosition={
          this.props.navigationConfig.drawerPosition === 'right'
            ? DrawerLayout.positions.Right
            : DrawerLayout.positions.Left
        }
        /* props specific to react-native-gesture-handler/DrawerLayout */
        drawerType={this.props.navigationConfig.drawerType}
        edgeWidth={this.props.navigationConfig.edgeWidth}
        hideStatusBar={this.props.navigationConfig.hideStatusBar}
        statusBarAnimation={this.props.navigationConfig.statusBarAnimation}
        minSwipeDistance={this.props.navigationConfig.minSwipeDistance}
        overlayColor={this.props.navigationConfig.overlayColor}
        drawerContainerStyle={this.props.navigationConfig.drawerContainerStyle}
        contentContainerStyle={
          this.props.navigationConfig.contentContainerStyle
        }
      >
        <DrawerGestureContext.Provider value={this.drawerGestureRef}>
          {this._renderContent()}
        </DrawerGestureContext.Provider>
      </DrawerLayout>
    );
  }
}

const styles = StyleSheet.create({
  pages: {
    flex: 1,
  },
});
