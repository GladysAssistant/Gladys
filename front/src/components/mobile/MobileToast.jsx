import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import { Text, Localizer } from 'preact-i18n';
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
 * For a toast shown from the app shell, which cannot know the page under it: aboveDock keeps it
 * clear, below 992px, of whatever a page pins to the bottom of the screen (the dock of the
 * dashboard, a bottom bar), and dismissable adds a close button (×) to it. role: "alert" for
 * the one error that goes through a toast (C.6), "status" otherwise.
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

  render({ message, actionLabel, onAction, aboveBar, aboveDock, dismissable, onClose, role, dataCy }) {
    if (!message) {
      return null;
    }
    return createPortal(
      <div
        class={cx(style.toast, {
          [style.toastAboveBar]: aboveBar,
          [style.toastAboveDock]: aboveDock
        })}
        role={role || 'status'}
        data-cy={dataCy || 'mobile-toast'}
      >
        <span class={style.toastText}>{message}</span>
        {actionLabel && onAction && (
          <button type="button" class={style.toastButton} onClick={this.runAction} data-cy="mobile-toast-action">
            {actionLabel}
          </button>
        )}
        {dismissable && onClose && (
          <Localizer>
            <button
              type="button"
              class={cx(style.toastButton, style.toastClose)}
              onClick={onClose}
              aria-label={<Text id="mobileKit.close" />}
              data-cy="mobile-toast-close"
            >
              <i class="fe fe-x" aria-hidden="true" />
            </button>
          </Localizer>
        )}
      </div>,
      document.body
    );
  }
}

export default MobileToast;
