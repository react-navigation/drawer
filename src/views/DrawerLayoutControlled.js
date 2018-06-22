import React from 'react';
import DrawerLayout from 'react-native-drawer-layout-polyfill';

export default class DrawerLayoutControlled extends React.Component {
  componentDidUpdate(prevProps) {
    const { navWantsDrawerOpen, navChangeRequested } = this.props;
    console.log({
      navWantsDrawerOpen,
      navChangeRequested,
    })

    if (
      navWantsDrawerOpen &&
      !prevProps.navWantsDrawerOpen &&
      this.props.navChangeRequested
    ) {
      console.log('open');
      this._openDrawer();
    } else if (
      !navWantsDrawerOpen &&
      prevProps.navWantsDrawerOpen &&
      this.props.navChangeRequested
    ) {
      console.log('close');
      this._closeDrawer();
    }
  }

  _closeDrawer = () => {
    this._drawer.closeDrawer();
  };

  _openDrawer = () => {
    this._drawer.openDrawer();
  };

  _onDrawerClose = () => {
    console.log('notify');
    if (this.props.navWantsDrawerOpen) {
      this.props.notifyNavIsClosed();
    }
  }

  _onDrawerOpen = () => {
    if (!this.props.navWantsDrawerOpen) {
      this.props.notifyNavIsOpen();
    }
  }

  _viewState = {
    settling: null,
    dragging: null,
    idle: null,
  };

  _setViewState = state => {
    this._viewState = {
      settling: null,
      dragging: null,
      idle: null,
      ...state,
    };
  };

  _onDrawerStateChanged = state => {
    if (state === 'Settling') {
      this._settlingFrames = [];
      this._setViewState({ settling: 'unknown' });
    } else if (state === 'Dragging') {
      this._setViewState({ dragging: true });
    } else if (state === 'Idle') {
      let idleState =
        this._viewState.settling === 'opening' ? 'open' : 'closed';
      this._setViewState({ idle: idleState });
    }

    console.log(this._viewState);
  };

  _onDrawerSlide = ({ nativeEvent: { offset } }) => {
    const { navWantsDrawerOpen } = this.props;

    if (this._viewState.settling === 'unknown') {
      this._settlingFrames.push(offset);
      if (this._settlingFrames.length === 5) {
        let settlingState;
        if (this._settlingFrames[4] > this._settlingFrames[0]) {
          settlingState = 'opening';
        } else {
          settlingState = 'closing';
        }

        this._viewState.settling = settlingState;

        if (!navWantsDrawerOpen && settlingState === 'opening') {
          this.props.notifyNavIsOpen();
        } else if (navWantsDrawerOpen && settlingState === 'closing') {
          this.props.notifyNavIsClosed();
        }
      }

      console.log(this._viewState);
    }

    this._prevSlidePosition = offset;
  };

  render() {
    return (
      <DrawerLayout
        ref={c => {
          this._drawer = c;
        }}
        onDrawerSlide={this._onDrawerSlide}
        onDrawerOpen={this._onDrawerOpen}
        onDrawerClose={this._onDrawerClose}
        onDrawerStateChanged={this._onDrawerStateChanged}
        {...this.props}
      />
    );
  }
}




  // _isViewStateOpen = () => {
  //   return (
  //     this._viewState.settling === 'opening' || this._viewState.idle === 'open'
  //   );
  // };

  // nav state - isDrawerOpen
  // view state - drawer state
  //   - (settling(opening|closing|unknown)
  //   - dragging
  //   - idle(open|closed))
