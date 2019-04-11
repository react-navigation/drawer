/* eslint-env jest */

import NativeModules from 'NativeModules';

Object.assign(NativeModules, {
  RNGestureHandlerModule: {
    attachGestureHandler: jest.fn(),
    createGestureHandler: jest.fn(),
    dropGestureHandler: jest.fn(),
    updateGestureHandler: jest.fn(),
    State: {},
    Directions: {},
  },
  ReanimatedModule: {
    createNode: jest.fn(),
    configureProps: jest.fn(),
    configureNativeProps: jest.fn(),
    connectNodes: jest.fn(),
    disconnectNodes: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
  PlatformConstants: {
    forceTouchAvailable: false,
  },
});

jest.mock('react-native-reanimated');
