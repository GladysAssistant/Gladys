import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import cx from 'classnames';

import style from './kit.css';

const DEFAULT_DURATION_MS = 4000;

/**
 * @description A toast (docs/specs/mobile-pages/README.md, C.6): a short confirmation at the
 * bottom of the screen, rendered on <body> above the sheets, gone after `duration` ms (4 s; 5 s
 * is the rule for an Undo). `message` null hides it. A new `toastKey` restarts the delay for a
 * message shown twice in a row.
 *
 * actionLabel / onAction: one action ("Undo"). aboveBar: the page has a bottom bar, the toast
 * sits above it.
 *
 * A toast does not leave under the user's hand: its delay stops while the pointer is over it or
 * the keyboard is on its action, and starts again afterwards (onHold / onRelease tell a caller
 * that runs the delay itself). focusAction: the keyboard is moved to the action when the toast
 * shows — for a page where what had the focus is gone with the deletion the toast is about.
 */
class MobileToast extends Component {
  componentDidMount() {
    this.schedule();
    this.focusActionIfAsked();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.message !== this.props.message || prevProps.toastKey !== this.props.toastKey) {
      this.schedule();
    }
    if (prevProps.toastKey !== this.props.toastKey || Boolean(prevProps.message) !== Boolean(this.props.message)) {
      this.focusActionIfAsked();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  schedule = () => {
    clearTimeout(this.timer);
    if (this.props.message && this.props.onClose) {
      this.timer = setTimeout(this.props.onClose, this.props.duration || DEFAULT_DURATION_MS);
    }
  };

  setActionRef = ref => {
    this.actionRef = ref;
  };

  focusActionIfAsked = () => {
    if (this.props.focusAction && this.props.message && this.actionRef) {
      this.actionRef.focus();
    }
  };

  hold = () => {
    clearTimeout(this.timer);
    if (this.props.onHold) {
      this.props.onHold();
    }
  };

  release = () => {
    this.schedule();
    if (this.props.onRelease) {
      this.props.onRelease();
    }
  };

  // hovering is a mouse thing: a finger that taps the toast is not holding it
  holdOnHover = e => {
    if (e.pointerType === 'mouse') {
      this.hold();
    }
  };

  releaseOnHover = e => {
    if (e.pointerType === 'mouse') {
      this.release();
    }
  };

  // Focus put on the action by the page after a click is not the user reaching for it: only a
  // focus the browser shows (the keyboard) holds the toast
  holdOnKeyboardFocus = e => {
    let visible = true;
    try {
      visible = e.target.matches(':focus-visible');
    } catch (error) {
      // a browser without :focus-visible: any focus holds
    }
    if (visible) {
      this.hold();
    }
  };

  runAction = () => {
    this.props.onAction();
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  render({ message, actionLabel, onAction, aboveBar, dataCy }) {
    if (!message) {
      return null;
    }
    return createPortal(
      <div
        class={cx(style.toast, { [style.toastAboveBar]: aboveBar })}
        role="status"
        data-cy={dataCy || 'mobile-toast'}
        onPointerEnter={this.holdOnHover}
        onPointerLeave={this.releaseOnHover}
      >
        <span class={style.toastText}>{message}</span>
        {actionLabel && onAction && (
          <button
            type="button"
            class={style.toastButton}
            onClick={this.runAction}
            onFocus={this.holdOnKeyboardFocus}
            onBlur={this.release}
            ref={this.setActionRef}
            data-cy="mobile-toast-action"
          >
            {actionLabel}
          </button>
        )}
      </div>,
      document.body
    );
  }
}

export default MobileToast;
