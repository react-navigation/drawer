import React from 'react';
import { Dimensions } from 'react-native';
import { SceneView } from 'react-navigation';
import DrawerLayout from 'react-native-drawer-layout-polyfill';

import DrawerSidebar from './DrawerSidebar';
import DrawerLayoutControlled from './DrawerLayoutControlled';
import DrawerActions from '../routers/DrawerActions';

/**
 * Component that renders the drawer.
 */
export default class DrawerView extends React.PureComponent {
  state = {
    drawerWidth:
      typeof this.props.navigationConfig.drawerWidth === 'function'
        ? this.props.navigationConfig.drawerWidth()
        : this.props.navigationConfig.drawerWidth,
  };

  componentDidMount() {
    Dimensions.addEventListener('change', this._updateWidth);
  }

  _updateWidth = () => {
    const drawerWidth =
      typeof this.props.navigationConfig.drawerWidth === 'function'
        ? this.props.navigationConfig.drawerWidth()
        : this.props.navigationConfig.drawerWidth;

    if (this.state.drawerWidth !== drawerWidth) {
      this.setState({ drawerWidth });
    }
  };

  _renderNavigationView = () => {
    return (
      <DrawerSidebar
        screenProps={this.props.screenProps}
        navigation={this.props.navigation}
        descriptors={this.props.descriptors}
        contentComponent={this.props.navigationConfig.contentComponent}
        contentOptions={this.props.navigationConfig.contentOptions}
        drawerPosition={this.props.navigationConfig.drawerPosition}
        style={this.props.navigationConfig.style}
        {...this.props.navigationConfig}
      />
    );
  };

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this._updateWidth);
  }

  render() {
    const { state } = this.props.navigation;
    const activeKey = state.routes[state.index].key;
    const descriptor = this.props.descriptors[activeKey];

    const { drawerLockMode } = descriptor.options;

    return (
      <DrawerLayoutControlled
        ref={c => {
          this._drawer = c;
        }}
        navWantsDrawerOpen={this.props.navigation.state.isDrawerOpen}
        navChangeRequested={this.props.navigation.state.requested}
        notifyNavIsOpen={() =>
          this.props.navigation.dispatch(DrawerActions.openDrawer({ notify: true }))
        }
        notifyNavIsClosed={() =>
          this.props.navigation.dispatch(DrawerActions.closeDrawer({ notify: true }))
        }
        drawerLockMode={
          drawerLockMode ||
          (this.props.screenProps && this.props.screenProps.drawerLockMode) ||
          this.props.navigationConfig.drawerLockMode
        }
        drawerBackgroundColor={
          this.props.navigationConfig.drawerBackgroundColor
        }
        drawerWidth={this.state.drawerWidth}
        useNativeAnimations={this.props.navigationConfig.useNativeAnimations}
        renderNavigationView={this._renderNavigationView}
        drawerPosition={
          this.props.navigationConfig.drawerPosition === 'right'
            ? DrawerLayout.positions.Right
            : DrawerLayout.positions.Left
        }
      >
        <SceneView
          navigation={descriptor.navigation}
          screenProps={this.props.screenProps}
          component={descriptor.getComponent()}
        />
      </DrawerLayoutControlled>
    );
  }
}
