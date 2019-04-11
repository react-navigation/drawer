import * as React from 'react';
import {
  StyleSheet,
  ViewStyle,
  LayoutChangeEvent,
  I18nManager,
  Platform,
  Keyboard,
  StatusBar,
} from 'react-native';
import {
  PanGestureHandler,
  TapGestureHandler,
  State,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';

const {
  Clock,
  Value,
  onChange,
  abs,
  add,
  sub,
  and,
  block,
  call,
  clockRunning,
  cond,
  divide,
  eq,
  event,
  greaterThan,
  lessThan,
  max,
  min,
  multiply,
  neq,
  or,
  set,
  spring,
  startClock,
  stopClock,
  timing,
} = Animated;

const TRUE = 1;
const FALSE = 0;
const NOOP = 0;
const UNSET = -1;

const DIRECTION_LEFT = 1;
const DIRECTION_RIGHT = -1;

const SWIPE_DISTANCE_THRESHOLD_DEFAULT = 120;

const SWIPE_DISTANCE_MINIMUM = 5;

const SPRING_CONFIG = {
  damping: 30,
  mass: 1,
  stiffness: 250,
  overshootClamping: true,
  restSpeedThreshold: 0.001,
  restDisplacementThreshold: 0.001,
};

const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.out(Easing.cubic),
};

type Renderer = (props: { progress: Animated.Node<number> }) => React.ReactNode;

type Props = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onGestureRef?: (ref: PanGestureHandler | null) => void;
  locked: boolean;
  drawerPosition: 'left' | 'right';
  drawerType: 'front' | 'back' | 'slide';
  keyboardDismissMode: 'none' | 'on-drag';
  swipeEdgeWidth: number;
  swipeDistanceThreshold?: number;
  swipeVelocityThreshold: number;
  hideStatusBar: boolean;
  statusBarAnimation: 'slide' | 'none' | 'fade';
  overlayStyle?: ViewStyle;
  drawerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  renderDrawerContent: Renderer;
  renderMainContent: Renderer;
};

export default class DrawerView extends React.Component<Props> {
  static defaultProps = {
    locked: false,
    drawerPostion: I18nManager.isRTL ? 'right' : 'left',
    drawerType: 'front',
    swipeEdgeWidth: 32,
    swipeVelocityThreshold: 1000,
    keyboardDismissMode: 'on-drag',
    hideStatusBar: false,
    statusBarAnimation: 'slide',
  };

  componentDidUpdate(prevProps: Props) {
    const {
      open,
      drawerPosition,
      drawerType,
      swipeDistanceThreshold,
      swipeVelocityThreshold,
      hideStatusBar,
    } = this.props;

    if (
      // Check for open in state to avoid unintended transition if component updates during swipe
      (open !== prevProps.open && open !== this.currentOpenValue) ||
      // Check if the user updated the open value correctly after an update
      (typeof this.pendingOpenValue === 'boolean' &&
        open !== this.pendingOpenValue)
    ) {
      // Open value in user's state is different from the open being tracked
      this.toggleDrawer(open);
      this.currentOpenValue = open;
    }

    this.pendingOpenValue = undefined;

    if (open !== prevProps.open && hideStatusBar) {
      this.toggleStatusBar(open);
    }

    if (prevProps.drawerPosition !== drawerPosition) {
      this.drawerPosition.setValue(
        drawerPosition === 'right' ? DIRECTION_RIGHT : DIRECTION_LEFT
      );
    }

    if (prevProps.drawerType !== drawerType) {
      this.isDrawerTypeFront.setValue(drawerType === 'front' ? TRUE : FALSE);
    }

    if (prevProps.swipeDistanceThreshold !== swipeDistanceThreshold) {
      this.swipeDistanceThreshold.setValue(
        swipeDistanceThreshold !== undefined
          ? swipeDistanceThreshold
          : SWIPE_DISTANCE_THRESHOLD_DEFAULT
      );
    }

    if (prevProps.swipeVelocityThreshold !== swipeVelocityThreshold) {
      this.swipeVelocityThreshold.setValue(swipeVelocityThreshold);
    }
  }

  componentWillUnmount() {
    this.toggleStatusBar(false);
  }

  private clock = new Clock();

  private isDrawerTypeFront = new Value(
    this.props.drawerType === 'front' ? TRUE : FALSE
  );

  private isOpen = new Value(this.props.open ? TRUE : FALSE);
  private nextIsOpen = new Value(UNSET);
  private isSwiping = new Value(FALSE);
  private isSwipeGesture = new Value(FALSE);
  private gestureState = new Value(State.UNDETERMINED);
  private touchX = new Value(0);
  private velocityX = new Value(0);
  private gestureX = new Value(0);
  private offsetX = new Value(0);
  private position = new Value(0);

  private drawerOpacity = new Value(0);
  private drawerWidth = new Value(0);
  private drawerPosition = new Value(
    this.props.drawerPosition === 'right' ? DIRECTION_RIGHT : DIRECTION_LEFT
  );

  // Comment stolen from react-native-gesture-handler/DrawerLayout
  //
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
  private touchDistanceFromDrawer = cond(
    this.isDrawerTypeFront,
    max(sub(sub(this.touchX, this.gestureX), this.drawerWidth), 0),
    0
  );

  private swipeDistanceThreshold = new Value(
    this.props.swipeDistanceThreshold !== undefined
      ? this.props.swipeDistanceThreshold
      : SWIPE_DISTANCE_THRESHOLD_DEFAULT
  );
  private swipeVelocityThreshold = new Value(this.props.swipeVelocityThreshold);

  private currentOpenValue: boolean = this.props.open;
  private pendingOpenValue: boolean | undefined;

  private isStatusBarHidden: boolean = false;

  private transitionTo = (isOpen: any) => {
    const toValue = new Value(0);
    const frameTime = new Value(0);

    const state = {
      position: this.position,
      time: new Value(0),
      finished: new Value(FALSE),
    };

    return block([
      cond(clockRunning(this.clock), NOOP, [
        // Animation wasn't running before
        // Set the initial values and start the clock
        set(toValue, multiply(isOpen, this.drawerWidth, this.drawerPosition)),
        set(frameTime, 0),
        set(state.time, 0),
        set(state.finished, FALSE),
        set(this.isOpen, isOpen),
        startClock(this.clock),
      ]),
      cond(
        this.isSwipeGesture,
        // Animate the values with a spring for swipe
        spring(
          this.clock,
          { ...state, velocity: this.velocityX },
          { ...SPRING_CONFIG, toValue }
        ),
        // Otherwise use a timing animation for faster switching
        timing(
          this.clock,
          { ...state, frameTime },
          { ...TIMING_CONFIG, toValue }
        )
      ),
      cond(state.finished, [
        // Reset gesture and velocity from previous gesture
        set(this.touchX, 0),
        set(this.gestureX, 0),
        set(this.velocityX, 0),
        set(this.isSwipeGesture, FALSE),
        // When the animation finishes, stop the clock
        stopClock(this.clock),
      ]),
    ]);
  };

  private dragX = block([
    onChange(
      this.isOpen,
      call([this.isOpen], ([value]: ReadonlyArray<0 | 1>) => {
        const open = Boolean(value);

        this.currentOpenValue = open;

        // Without this check, the drawer can go to an infinite update <-> animate loop for sync updates
        if (open !== this.props.open) {
          this.pendingOpenValue = open;

          // If the mode changed, update state
          if (open) {
            this.props.onOpen();
          } else {
            this.props.onClose();
          }

          // Force componentDidUpdate to fire, whether user does a setState or not
          // This allows us to detect when the user drops the update and revert back
          // It's necessary to make sure that the state stays in sync
          this.forceUpdate();
        }
      })
    ),
    onChange(
      this.nextIsOpen,
      cond(neq(this.nextIsOpen, UNSET), [
        // Stop any running animations
        cond(clockRunning(this.clock), stopClock(this.clock)),
        // Update the open value to trigger the transition
        set(this.isOpen, this.nextIsOpen),
        set(this.nextIsOpen, UNSET),
      ])
    ),
    // This block must be after the this.isOpen listener since we check for current value
    onChange(
      this.isSwiping,
      // Listen to updates for this value only when it changes
      // Without `onChange`, this will fire even if the value didn't change
      // We don't want to call the listeners if the value didn't change
      call([this.isSwiping], ([value]: ReadonlyArray<0 | 1>) => {
        const { keyboardDismissMode, onSwipeStart, onSwipeEnd } = this.props;

        if (value === TRUE) {
          onSwipeStart && onSwipeStart();

          if (keyboardDismissMode === 'on-drag') {
            Keyboard.dismiss();
          }

          this.toggleStatusBar(true);
        } else {
          onSwipeEnd && onSwipeEnd();
          this.toggleStatusBar(this.currentOpenValue);
        }
      })
    ),
    cond(
      eq(this.gestureState, State.ACTIVE),
      [
        cond(this.isSwiping, NOOP, [
          // We weren't dragging before, set it to true
          set(this.isSwiping, TRUE),
          set(this.isSwipeGesture, TRUE),
          // Also update the drag offset to the last position
          set(this.offsetX, this.position),
        ]),
        // Update position with previous offset + gesture distance
        set(
          this.position,
          add(this.offsetX, this.gestureX, this.touchDistanceFromDrawer)
        ),
        // Stop animations while we're dragging
        stopClock(this.clock),
      ],
      [
        set(this.isSwiping, FALSE),
        set(this.touchX, 0),
        this.transitionTo(
          cond(
            and(
              greaterThan(abs(this.gestureX), SWIPE_DISTANCE_MINIMUM),
              or(
                greaterThan(abs(this.gestureX), this.swipeDistanceThreshold),
                greaterThan(abs(this.velocityX), this.swipeVelocityThreshold)
              )
            ),
            cond(
              cond(
                eq(this.drawerPosition, DIRECTION_LEFT),
                // If swiped to right, open the drawer, otherwise close it
                greaterThan(this.velocityX, 0),
                // If swiped to left, open the drawer, otherwise close it
                lessThan(this.velocityX, 0)
              ),
              TRUE,
              FALSE
            ),
            this.isOpen
          )
        ),
      ]
    ),
    this.position,
  ]);

  private handleGestureEvent = event([
    {
      nativeEvent: {
        x: this.touchX,
        translationX: this.gestureX,
        velocityX: this.velocityX,
        state: this.gestureState,
      },
    },
  ]);

  private handleTapStateChange = ({
    nativeEvent,
  }: TapGestureHandlerStateChangeEvent) => {
    if (nativeEvent.oldState === State.ACTIVE && !this.props.locked) {
      this.isSwipeGesture.setValue(FALSE);
      this.isSwipeGesture.setValue(FALSE);
      this.nextIsOpen.setValue(FALSE);
    }
  };

  private handleLayout = (e: LayoutChangeEvent) => {
    const drawerWidth = e.nativeEvent.layout.width;

    this.drawerWidth.setValue(drawerWidth);
    this.toggleDrawer(this.props.open);

    // Until layout is available, drawer is hidden with opacity: 0 by default
    // Show it in the next frame when layout is available
    // If we don't delay it until the next frame, there's a visible flicker
    requestAnimationFrame(() => this.drawerOpacity.setValue(1));
  };

  private toggleDrawer = (open: boolean) =>
    this.nextIsOpen.setValue(open ? TRUE : FALSE);

  private toggleStatusBar = (hidden: boolean) => {
    const { hideStatusBar, statusBarAnimation } = this.props;

    if (hideStatusBar && this.isStatusBarHidden !== hidden) {
      this.isStatusBarHidden = hidden;
      StatusBar.setHidden(hidden, statusBarAnimation);
    }
  };

  render() {
    const {
      open,
      locked,
      drawerPosition,
      drawerType,
      swipeEdgeWidth,
      contentContainerStyle,
      drawerStyle,
      overlayStyle,
      onGestureRef,
      renderDrawerContent,
      renderMainContent,
    } = this.props;
    const right = drawerPosition === 'right';

    const translateX = right
      ? min(max(multiply(this.drawerWidth, -1), this.dragX), 0)
      : max(min(this.drawerWidth, this.dragX), 0);

    const progress = cond(
      // Check if the drawer width is available to avoid division by zero
      eq(this.drawerWidth, 0),
      0,
      abs(divide(translateX, this.drawerWidth))
    );

    const contentTranslateX = drawerType === 'front' ? 0 : translateX;
    const drawerTranslateX =
      drawerType === 'back' ? this.drawerWidth : translateX;

    const offset = I18nManager.isRTL ? '100%' : multiply(this.drawerWidth, -1);

    return (
      <PanGestureHandler
        ref={onGestureRef}
        activeOffsetX={[-SWIPE_DISTANCE_MINIMUM, SWIPE_DISTANCE_MINIMUM]}
        failOffsetY={[-SWIPE_DISTANCE_MINIMUM, SWIPE_DISTANCE_MINIMUM]}
        onGestureEvent={this.handleGestureEvent}
        onHandlerStateChange={this.handleGestureEvent}
        hitSlop={
          right
            ? // Extend hitSlop to the side of the screen when drawer is closed
              // This lets the user drag the drawer from the side of the screen
              // @ts-ignore
              { right: 0, width: open ? undefined : swipeEdgeWidth }
            : { left: 0, width: open ? undefined : swipeEdgeWidth }
        }
        enabled={!locked}
      >
        <Animated.View style={styles.main}>
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ translateX: contentTranslateX }],
              },
              contentContainerStyle as any,
            ]}
          >
            {renderMainContent({ progress })}
            <TapGestureHandler onHandlerStateChange={this.handleTapStateChange}>
              <Animated.View
                pointerEvents={open ? 'auto' : 'none'}
                style={[styles.overlay, { opacity: progress }, overlayStyle]}
              />
            </TapGestureHandler>
          </Animated.View>
          <Animated.View
            accessibilityViewIsModal={open}
            removeClippedSubviews={Platform.OS !== 'ios'}
            onLayout={this.handleLayout}
            style={[
              styles.container,
              right ? { right: offset } : { left: offset },
              {
                transform: [{ translateX: drawerTranslateX }],
                opacity: this.drawerOpacity,
                zIndex: drawerType === 'back' ? -1 : 0,
              },
              drawerStyle as any,
            ]}
          >
            {renderDrawerContent({ progress })}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
});
