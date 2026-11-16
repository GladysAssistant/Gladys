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
 */
class MobileToast extends Component {
  componentDidMount() {
    this.schedule();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.message !== this.props.message || prevProps.toastKey !== this.props.toastKey) {
      this.schedule();
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
      >
        <span class={style.toastText}>{message}</span>
        {actionLabel && onAction && (
          <button type="button" class={style.toastButton} onClick={this.runAction} data-cy="mobile-toast-action">
            {actionLabel}
          </button>
        )}
      </div>,
      document.body
    );
  }
}

export default MobileToast;
