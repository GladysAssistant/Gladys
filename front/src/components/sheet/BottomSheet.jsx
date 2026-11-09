import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import createBackdropDismiss from '../../utils/backdropDismiss';
import style from './BottomSheet.css';

// The open sheets, bottom to top: only the topmost one answers Escape and keeps the focus, and the
// page scroll stays locked until the last one closes
const openSheets = [];
let previousBodyOverflow = null;

const lockPageScroll = () => {
  if (openSheets.length === 1) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
};

const unlockPageScroll = () => {
  if (openSheets.length === 0) {
    document.body.style.overflow = previousBodyOverflow || '';
    previousBodyOverflow = null;
  }
};

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * @description A bottom sheet on a phone, a centered dialog from 576px (same shell as the music
 * and light panels), rendered on <body> so no backdrop filter of the page can clip it. Closes on
 * Escape, on the backdrop and on its header button; stacks above an already open sheet.
 *
 * depth: the position of the sheet in a stack of sheets (0 at the bottom), so a sheet opened from
 * another one covers it.
 *
 * keepMounted: the content stays mounted (hidden) while the sheet is closed. The scene editor
 * needs it: a step form registers its variables when it mounts (docs/specs/scene-editor-mobile.md,
 * E.4).
 */
class BottomSheet extends Component {
  componentDidMount() {
    if (this.props.open) {
      this.onOpen();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.onOpen();
    } else if (!this.props.open && prevProps.open) {
      this.onClose();
    }
  }

  componentWillUnmount() {
    if (this.props.open) {
      this.onClose();
    }
  }

  onOpen = () => {
    this.previousFocus = document.activeElement;
    openSheets.push(this);
    lockPageScroll();
    document.addEventListener('keydown', this.handleKeyDown);
    // the sheet takes the focus, unless its content already took it (an autofocused search)
    setTimeout(() => {
      if (this.sheet && !this.sheet.contains(document.activeElement)) {
        this.sheet.focus({ preventScroll: true });
      }
    }, 0);
    this.animateIn();
  };

  onClose = () => {
    const index = openSheets.indexOf(this);
    if (index >= 0) {
      openSheets.splice(index, 1);
    }
    unlockPageScroll();
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.previousFocus && this.previousFocus.focus && document.body.contains(this.previousFocus)) {
      this.previousFocus.focus({ preventScroll: true });
    }
  };

  isTopmost = () => openSheets[openSheets.length - 1] === this;

  animateIn = () => {
    const reduceMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !this.sheet || typeof this.sheet.animate !== 'function') {
      return;
    }
    this.sheet.animate(
      [
        { transform: 'translateY(48px)', opacity: 0.4 },
        { transform: 'none', opacity: 1 }
      ],
      {
        duration: 240,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
      }
    );
  };

  handleKeyDown = event => {
    if (!this.isTopmost()) {
      return;
    }
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.props.onClose();
    } else if (event.key === 'Tab') {
      this.keepFocusInside(event);
    }
  };

  keepFocusInside = event => {
    if (!this.sheet) {
      return;
    }
    const focusables = Array.from(this.sheet.querySelectorAll(FOCUSABLE)).filter(
      element => element.offsetParent !== null
    );
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === this.sheet || !this.sheet.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !this.sheet.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  setSheetRef = element => {
    this.sheet = element;
  };

  backdropDismiss = createBackdropDismiss(() => this.props.onClose());

  render({ open, keepMounted, title, onClose, onBack, onOk, okLabelId, size, footer, children, dataCy, depth }) {
    if (!open && !keepMounted) {
      return null;
    }
    return createPortal(
      <div
        class={cx('glass-theme', style.overlay, { [style.overlayHidden]: !open })}
        aria-hidden={open ? undefined : 'true'}
        style={depth ? { zIndex: 1060 + depth * 2 } : undefined}
        {...this.backdropDismiss}
      >
        <div
          class={cx(style.sheet, { [style.sheetFull]: size === 'full' })}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex="-1"
          data-cy={dataCy}
          ref={this.setSheetRef}
        >
          <div class={style.handle} />
          <div class={style.header}>
            <div class={style.headerSide}>
              {onBack && (
                <button type="button" class={style.headerLink} onClick={onBack}>
                  <i class="fe fe-chevron-left" aria-hidden="true" />
                  <Text id="global.back" />
                </button>
              )}
            </div>
            <h2 class={style.title}>{title}</h2>
            <div class={cx(style.headerSide, style.headerSideEnd)}>
              {onOk ? (
                <button type="button" class={cx(style.headerLink, style.headerLinkStrong)} onClick={onOk}>
                  <Text id={okLabelId || 'editScene.mobile.ok'} />
                </button>
              ) : (
                <Localizer>
                  <button
                    type="button"
                    class={style.close}
                    onClick={onClose}
                    aria-label={<Text id="editScene.mobile.close" />}
                  >
                    <i class="fe fe-x" />
                  </button>
                </Localizer>
              )}
            </div>
          </div>
          <div class={style.body}>{children}</div>
          {footer && <div class={style.footer}>{footer}</div>}
        </div>
      </div>,
      document.body
    );
  }
}

export default BottomSheet;
