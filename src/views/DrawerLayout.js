// @flow

// This component is based on RN's DrawerLayoutAndroid API
//
// It perhaps deserves to be put in a separate repo, but since it relies
// on react-native-gesture-handler library which isn't very popular at the
// moment I decided to keep it here for the time being. It will allow us
// to move faster and fix issues that may arise in gesture handler library
// that could be found when using the drawer component

import React, { Component } from 'react';
import invariant from '../utils/invariant';
import {
  StyleSheet,
  View,
  Keyboard,
  StatusBar,
  I18nManager,
} from 'react-native';
import { AnimatedEvent } from 'react-native/Libraries/Animated/src/AnimatedEvent';
import Animated from 'react-native-reanimated';

import {
  PanGestureHandler,
  // PanGestureHandler as BasePanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';

const {
  createAnimatedComponent,
  call,
  cond,
  defined,
  eq,
  event,
  greaterThan,
  interpolate,
  multiply,
  add,
  set,
  sub,
  Value,
} = Animated;

// const PanGestureHandler = createAnimatedComponent(BasePanGestureHandler);

const DRAG_TOSS = 0.05;

const IDLE = 'Idle';
const DRAGGING = 'Dragging';
const SETTLING = 'Settling';

export type PropType = {
  children: any,
  drawerBackgroundColor?: string,
  drawerPosition: 'left' | 'right',
  drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open',
  drawerWidth: number,
  keyboardDismissMode?: 'none' | 'on-drag',
  onDrawerClose?: Function,
  onDrawerOpen?: Function,
  onDrawerStateChanged?: Function,
  renderNavigationView: (progressAnimatedValue: any) => any,
  useNativeAnimations: boolean,

  // brand new properties
  drawerType: 'front' | 'back' | 'slide',
  edgeWidth: number,
  minSwipeDistance: number,
  hideStatusBar?: boolean,
  statusBarAnimation?: 'slide' | 'none' | 'fade',
  overlayColor: string,
  drawerContainerStyle?: any,
  contentContainerStyle?: any,
  onGestureRef?: Function,

  // Properties not yet supported
  // onDrawerSlide?: Function
};

export type StateType = {
  // Current gesture translationX, ignored when gesture is inactive in favor of drawerTranslation
  dragX: any,
  // When gesture is inactive this controls the drawer position
  drawerTranslation: any,
  // Current x, this is used for controlling gesture activation
  touchX: any,
  velocityX: any,
  gestureState: any,
  drawerShown: any,
  // For firing state changes - openDrawer / closeDrawer
  requestedState: any,
  containerWidth: number,
};

export type EventType = {
  stopPropagation: Function,
};

export type DrawerMovementOptionType = {
  velocity?: number,
};

export default class DrawerLayout extends Component<PropType, StateType> {
  static defaultProps = {
    drawerWidth: 200,
    drawerPosition: 'left',
    useNativeAnimations: true,
    drawerType: 'front',
    edgeWidth: 20,
    minSwipeDistance: 3,
    overlayColor: 'black',
    drawerLockMode: 'unlocked',
  };

  static positions = {
    Left: 'left',
    Right: 'right',
  };
  _openValue: ?Animated.Interpolation;
  _onGestureEvent: ?AnimatedEvent;
  _accessibilityIsModalView = React.createRef();
  _pointerEventsView = React.createRef();
  _panGestureHandler = React.createRef();

  constructor(props: PropType, context: any) {
    super(props, context);

    const dragX = new Value(0);
    const touchX = new Value(0);
    const velocityX = new Value(0);
    const drawerTranslation = new Value(0);
    const gestureState = new Value();
    const drawerShown = new Value(0);
    const requestedState = new Value(0);

    this.state = {
      dragX,
      touchX,
      drawerTranslation,
      drawerShown,
      gestureState,
      requestedState,
      velocityX,
      containerWidth: 0,
    };

    this._updateAnimatedEvent(props, this.state);
  }

  componentWillUpdate(props: PropType, state: StateType) {
    if (
      this.props.drawerPosition !== props.drawerPosition ||
      this.props.drawerWidth !== props.drawerWidth ||
      this.props.drawerType !== props.drawerType ||
      this.state.containerWidth !== state.containerWidth
    ) {
      this._updateAnimatedEvent(props, state);
    }
  }

  _updateAnimatedEvent = (props: PropType, state: StateType) => {
    const { drawerPosition, drawerWidth, drawerType } = props;
    const {
      dragX: dragXValue,
      touchX: touchXValue,
      gestureState: gestureStateValue,
      velocityX: velocityXValue,
      requestedState,
      drawerShown,
      drawerTranslation,
      containerWidth,
    } = state;

    let dragX = dragXValue;
    let touchX = touchXValue;
    let gestureState = gestureStateValue;
    let velocityX = velocityXValue;

    // TODO: Add this back to support drawer positions other than just left!
    //
    // if (drawerPosition !== 'left') {
    //   // Most of the code is written in a way to handle left-side drawer.
    //   // In order to handle right-side drawer the only thing we need to
    //   // do is to reverse events coming from gesture handler in a way they
    //   // emulate left-side drawer gestures. E.g. dragX is simply -dragX, and
    //   // touchX is calulcated by subtracing real touchX from the width of the
    //   // container (such that when touch happens at the right edge the value
    //   // is simply 0)
    //   dragX = multiply(-1, dragXValue);
    //   touchX = sub(containerWidth, touchXValue);
    //   touchXValue.setValue(containerWidth);
    // } else {
    //   touchXValue.setValue(0);
    // }

    // While closing the drawer when user starts gesture outside of its area (in greyed
    // out part of the window), we want the drawer to follow only once finger reaches the
    // edge of the drawer.
    // E.g. on the diagram below drawer is illustrate by X signs and the greyed out area by
    // dots. The touch gesture starts at '*' and moves left, touch path is indicated by
    // an arrow pointing left
    // 1) +---------------+ 2) +---------------+ 3) +---------------+ 4) +---------------+
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|.<-*..|    |XXXXXXXX|<--*..|    |XXXXX|<-----*..|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    +---------------+    +---------------+    +---------------+    +---------------+
    //
    // For the above to work properly we define animated value that will keep start position
    // of the gesture. Then we use that value to calculate how much we need to subtract from
    // the dragX. If the gesture started on the greyed out area we take the distance from the
    // edge of the drawer to the start position. Otherwise we don't subtract at all and the
    // drawer be pulled back as soon as you start the pan.
    //
    // This is used only when drawerType is "front"
    //
    let translationX = dragX;
    // TODO: Add this back to support fancy touch drag thing!
    // if (drawerType === 'front') {
    //   const startPositionX = add(touchX, multiply(-1, dragX));

    //   const dragOffsetFromOnStartPosition = interpolate(startPositionX, {
    //     inputRange: [drawerWidth - 1, drawerWidth, drawerWidth + 1],
    //     outputRange: [0, 0, 1],
    //   });
    //   translationX = add(dragX, dragOffsetFromOnStartPosition);
    // }

    this._transX = cond(
      defined(requestedState),
      cond(
        eq(requestedState, 1),
        [set(drawerShown, 1), set(requestedState, undefined), drawerWidth],
        [set(drawerShown, 0), set(requestedState, undefined), 0]
      ),
      cond(
        eq(gestureStateValue, State.ACTIVE),
        [
          // block to execute when gesture is active
          translationX,
        ],
        [
          // block to execute when gesture is inactive
          cond(
            this.shouldOpen(),
            [set(drawerShown, 1), drawerWidth],
            [set(drawerShown, 0), call([], () => alert('should close')), 0]
          ),
        ]
      )
    );

    // if (shouldOpen) {
    //   this._animateDrawer(startOffsetX, drawerWidth, velocityX);
    // } else {
    //   this._animateDrawer(startOffsetX, 0, velocityX);
    // }

    this._openValue = interpolate(this._transX, {
      inputRange: [0, drawerWidth],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    this._onGestureEvent = event(
      [
        {
          nativeEvent: {
            translationX: dragXValue,
            x: touchXValue,
            velocityX: velocityXValue,
            state: gestureStateValue,
          },
        },
      ],
      { useNativeDriver: true }
    );
  };

  shouldOpen = () => {
    const { drawerWidth, drawerPosition, drawerType } = this.props;
    let { drawerShown, containerWidth, dragX, touchX, velocityX } = this.state;

    if (drawerPosition !== 'left') {
      // See description in _updateAnimatedEvent about why events are flipped
      // for right-side drawer
      dragX = multiply(-1, dragX);
      touchX = sub(containerWidth, touchX);
      velocityX = multiply(-1, velocityX);
    }

    const gestureStartX = sub(touchX, dragX);
    let dragOffsetBasedOnStart = 0;

    if (drawerType === 'front') {
      dragOffsetBasedOnStart = cond(
        greaterThan(gestureStartX, drawerWidth),
        sub(gestureStartX, drawerWidth),
        0
      );
    }

    const startOffsetX = add(
      add(dragX, dragOffsetBasedOnStart),
      cond(drawerShown, drawerWidth, 0)
    );
    const projOffsetX = add(startOffsetX, multiply(DRAG_TOSS, velocityX));

    return greaterThan(projOffsetX, drawerWidth / 2);
  };

  _handleContainerLayout = ({ nativeEvent }) => {
    this.setState({ containerWidth: nativeEvent.layout.width });
  };

  _emitStateChanged = (newState: string, drawerWillShow: boolean) => {
    this.props.onDrawerStateChanged &&
      this.props.onDrawerStateChanged(newState, drawerWillShow);
  };

  openDrawer = (options: DrawerMovementOptionType = {}) => {
    this.state.requestedState.setValue(1);
    // this._animateDrawer(
    //   undefined,
    //   this.props.drawerWidth,
    //   options.velocity ? options.velocity : 0
    // );
  };

  closeDrawer = (options: DrawerMovementOptionType = {}) => {
    this.state.requestedState.setValue(0);
    // this._animateDrawer(undefined, 0, options.velocity ? options.velocity : 0);
  };

  _renderOverlay = () => {
    /* Overlay styles */
    invariant(this._openValue, 'should be set');

    // we probably want to animate the overlay subtly to the current position rather than
    // tracking it exactly
    const overlayOpacity = interpolate(this._openValue, {
      inputRange: [0, 1],
      outputRange: [0, 0.7],
      extrapolate: 'clamp',
    });
    const dynamicOverlayStyles = {
      opacity: overlayOpacity,
      backgroundColor: this.props.overlayColor,
    };

    const pointerEvents = cond(this.state.drawerShown, 'auto', 'none');

    return (
      <TapGestureHandler onHandlerStateChange={this._onTapHandlerStateChange}>
        <Animated.View
          pointerEvents={pointerEvents}
          ref={this._pointerEventsView}
          style={[styles.overlay, dynamicOverlayStyles]}
        />
      </TapGestureHandler>
    );
  };

  _renderDrawer = () => {
    const {
      drawerBackgroundColor,
      drawerWidth,
      drawerPosition,
      drawerType,
      drawerContainerStyle,
      contentContainerStyle,
    } = this.props;

    const fromLeft = drawerPosition === 'left';
    const drawerSlide = drawerType !== 'back';
    const containerSlide = drawerType !== 'front';

    // we rely on row and row-reverse flex directions to position the drawer
    // properly. Apparently for RTL these are flipped which requires us to use
    // the opposite setting for the drawer to appear from left or right according
    // to the drawerPosition prop
    const reverseContentDirection = I18nManager.isRTL ? fromLeft : !fromLeft;

    const dynamicDrawerStyles = {
      backgroundColor: drawerBackgroundColor,
      width: drawerWidth,
    };
    const openValue = this._openValue;
    invariant(openValue, 'should be set');

    let containerStyles;
    if (containerSlide) {
      const containerTranslateX = interpolate(openValue, {
        inputRange: [0, 1],
        outputRange: fromLeft ? [0, drawerWidth] : [0, -drawerWidth],
        extrapolate: 'clamp',
      });
      containerStyles = {
        transform: [{ translateX: containerTranslateX }],
      };
    }

    let drawerTranslateX = 0;
    if (drawerSlide) {
      const closedDrawerOffset = fromLeft ? -drawerWidth : drawerWidth;
      drawerTranslateX = interpolate(openValue, {
        inputRange: [0, 1],
        outputRange: [closedDrawerOffset, 0],
        extrapolate: 'clamp',
      });
    }
    const drawerStyles = {
      transform: [{ translateX: drawerTranslateX }],
      flexDirection: reverseContentDirection ? 'row-reverse' : 'row',
    };

    const accessibilityViewIsModal = cond(this.state.drawerShown, true, false);

    return (
      <Animated.View style={styles.main} onLayout={this._handleContainerLayout}>
        <Animated.View
          style={[
            drawerType === 'front'
              ? styles.containerOnBack
              : styles.containerInFront,
            containerStyles,
            contentContainerStyle,
          ]}
        >
          {typeof this.props.children === 'function'
            ? this.props.children(this._openValue)
            : this.props.children}
          {this._renderOverlay()}
        </Animated.View>
        <Animated.View
          pointerEvents="box-none"
          accessibilityViewIsModal={accessibilityViewIsModal}
          style={[styles.drawerContainer, drawerStyles, drawerContainerStyle]}
        >
          <View style={[styles.drawer, dynamicDrawerStyles]}>
            {this.props.renderNavigationView(this._openValue)}
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  _setPanGestureRef = ref => {
    this._panGestureHandler.current = ref;
    this.props.onGestureRef && this.props.onGestureRef(ref);
  };

  render() {
    const {
      drawerPosition,
      drawerLockMode,
      edgeWidth,
      minSwipeDistance,
    } = this.props;
    const { drawerShown } = this.state;

    const fromLeft = drawerPosition === 'left';

    // gestureOrientation is 1 if the expected gesture is from left to right and -1 otherwise
    // e.g. when drawer is on the left and is closed we expect left to right gesture, thus
    // orientation will be 1.
    const gestureOrientation = multiply(
      fromLeft ? 1 : -1,
      cond(drawerShown, -1, 1)
    );

    // NOTE: I think that adding support for updating gesture handlers with reanimated,
    // and also for undefined props (width: x ? undefined : y) are the only blockers

    // TODO: RNGH may need to be updated to support this
    const activeOffsetX = multiply(gestureOrientation, minSwipeDistance);

    // When drawer is closed we want the hitSlop to be horizontally shorter
    // than the container size by the value of SLOP. This will make it only
    // activate when gesture happens not further than SLOP away from the edge
    //
    // TODO: this needs to be converted to Reanimated - does it support undefined values?
    const hitSlop = fromLeft
      ? { left: 0, width: this._drawerShown ? undefined : edgeWidth }
      : { right: 0, width: this._drawerShown ? undefined : edgeWidth };

    // TODO: Need to be able to update hitSlop and activeOffsetX using Reanimated!
    return (
      <PanGestureHandler
        ref={this._setPanGestureRef}
        hitSlop={hitSlop}
        activeOffsetX={5 /* activeOffsetX */}
        failOffsetY={[-15, 15]}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._onGestureEvent}
        enabled={
          drawerLockMode !== 'locked-closed' && drawerLockMode !== 'locked-open'
        }
      >
        {this._renderDrawer()}
      </PanGestureHandler>
    );
  }
}

const styles = StyleSheet.create({
  drawer: { flex: 0 },
  drawerContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
    flexDirection: 'row',
  },
  containerInFront: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1002,
  },
  containerOnBack: {
    ...StyleSheet.absoluteFillObject,
  },
  main: {
    flex: 1,
    zIndex: 0,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
});
