import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './mobile.css';

const ACTION_WIDTH_PX = 88;
const ENGAGE_THRESHOLD_PX = 8;
// a click released right after a swipe is the end of the gesture, not a tap
const CLICK_AFTER_SWIPE_MS = 350;

// Only one row is open at a time: opening one closes the previous
let openRow = null;

/**
 * @description A row whose content slides to the left to reveal its actions
 * (docs/specs/scene-editor-mobile.md, D.3 / E.6). The gesture only engages on a clear horizontal
 * move, so vertical scrolling is never captured (touch-action: pan-y); released past half of the
 * actions' width the row stays open, otherwise it snaps back. Every action also exists without
 * the gesture (in the sheet or a menu), so the hidden buttons leave the tab order while closed.
 */
class SwipeRow extends Component {
  state = {
    offset: 0,
    dragging: false
  };

  componentWillUnmount() {
    if (openRow === this) {
      openRow = null;
    }
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
  }

  getMaxOffset = () => this.props.actions.length * ACTION_WIDTH_PX;

  open = () => {
    if (openRow && openRow !== this) {
      openRow.close();
    }
    openRow = this;
    this.setState({ offset: -this.getMaxOffset(), dragging: false });
    document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
  };

  close = () => {
    if (openRow === this) {
      openRow = null;
    }
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    this.setState({ offset: 0, dragging: false });
  };

  // a press anywhere outside an open row closes it
  onDocumentPointerDown = event => {
    if (this.base && !this.base.contains(event.target)) {
      this.close();
    }
  };

  onPointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.gesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseOffset: this.state.offset,
      engaged: false
    };
  };

  onPointerMove = event => {
    const gesture = this.gesture;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (!gesture.engaged) {
      if (Math.abs(deltaX) > ENGAGE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        gesture.engaged = true;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch (e) {
          // the pointer may already be gone: the gesture still works without the capture
        }
      } else {
        if (Math.abs(deltaY) > ENGAGE_THRESHOLD_PX) {
          // a vertical scroll: this gesture is not a swipe
          this.gesture = null;
        }
        return;
      }
    }
    const maxOffset = this.getMaxOffset();
    const offset = Math.max(-maxOffset - 24, Math.min(0, gesture.baseOffset + deltaX));
    this.setState({ offset, dragging: true });
  };

  onPointerUp = event => {
    const gesture = this.gesture;
    this.gesture = null;
    if (!gesture || gesture.pointerId !== event.pointerId || !gesture.engaged) {
      return;
    }
    this.swipedAt = Date.now();
    if (this.state.offset < -this.getMaxOffset() / 2) {
      this.open();
    } else {
      this.close();
    }
  };

  // the end of a swipe, or a tap on an open row, must not reach the row's own button
  onClickCapture = event => {
    const justSwiped = this.swipedAt && Date.now() - this.swipedAt < CLICK_AFTER_SWIPE_MS;
    if (justSwiped || this.state.offset !== 0) {
      event.preventDefault();
      event.stopPropagation();
      if (!justSwiped) {
        this.close();
      }
    }
  };

  runAction = action => () => {
    this.close();
    action.onClick();
  };

  render({ actions, children, class: className, foregroundClass, dataCy }, { offset, dragging }) {
    const revealed = offset < 0;
    return (
      <div class={cx(style.swipeRow, className)} data-cy={dataCy}>
        <div class={style.swipeActions} style={{ visibility: revealed ? 'visible' : 'hidden' }}>
          {actions.map(action => (
            <button
              key={action.key}
              type="button"
              class={cx(style.swipeAction, style[`swipeAction-${action.tone || 'neutral'}`])}
              style={{ width: `${ACTION_WIDTH_PX}px` }}
              onClick={this.runAction(action)}
              tabIndex={revealed ? 0 : -1}
              data-cy={action.dataCy}
            >
              <i class={`fe fe-${action.icon}`} aria-hidden="true" />
              <Text id={action.labelId} />
            </button>
          ))}
        </div>
        <div
          class={cx(style.swipeForeground, foregroundClass)}
          style={{
            transform: offset ? `translateX(${offset}px)` : undefined,
            transition: dragging ? 'none' : undefined
          }}
          onPointerDown={this.onPointerDown}
          onPointerMove={this.onPointerMove}
          onPointerUp={this.onPointerUp}
          onPointerCancel={this.onPointerUp}
          onClickCapture={this.onClickCapture}
        >
          {children}
        </div>
      </div>
    );
  }
}

export default SwipeRow;
