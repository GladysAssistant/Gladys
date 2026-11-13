import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import createBackdropDismiss from '../../utils/backdropDismiss';
import { sheetsChanged } from './sheetHistory';
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

const getOpenSheets = () => openSheets;

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Dragging a sheet down closes it once released past this share of its height (or 140px), or
// with a downward flick
const DISMISS_RATIO = 0.3;
const DISMISS_MAX_PX = 140;
const FLICK_PX_PER_MS = 0.55;
const FLICK_MIN_PX = 24;
const ENGAGE_PX = 6;
// what a finger drags on its own inside the content: the sheet must not follow
const NO_DRAG_TARGETS =
  'input, textarea, select, canvas, [contenteditable="true"], [role="slider"], [data-no-sheet-drag], .tagify';

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
 *
 * On a phone the sheet follows a finger dragging it down — from its handle and header, or from
 * its content once that content is scrolled back to its top — and closes when released low enough
 * or flicked. It slides out when it closes, and the system "back" closes it (sheetHistory.js).
 */
class BottomSheet extends Component {
  componentDidMount() {
    if (this.props.open) {
      this.onOpen();
    }
  }

  // the element that opens the sheet is read before the sheet's content renders: a field of the
  // content may take the focus as it updates (an autofocused search)
  componentWillUpdate(nextProps) {
    if (nextProps.open && !this.props.open) {
      this.openerElement = document.activeElement;
      this.cancelLeaving();
    } else if (!nextProps.open && this.props.open && this.canAnimate()) {
      // the sheet stays rendered while it slides out
      this.leaving = true;
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.onOpen();
    } else if (!this.props.open && prevProps.open) {
      this.onClose();
      this.animateOut();
    }
  }

  componentWillUnmount() {
    this.cancelLeaving();
    this.setSheetRef(null);
    if (this.props.open) {
      this.onClose();
    }
  }

  onOpen = () => {
    this.previousFocus = this.openerElement || document.activeElement;
    this.openerElement = null;
    openSheets.push(this);
    sheetsChanged(getOpenSheets);
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
    sheetsChanged(getOpenSheets);
    unlockPageScroll();
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.previousFocus && this.previousFocus.focus && document.body.contains(this.previousFocus)) {
      this.previousFocus.focus({ preventScroll: true });
    }
  };

  isTopmost = () => openSheets[openSheets.length - 1] === this;

  canAnimate = () => Boolean(this.sheet) && typeof this.sheet.animate === 'function' && !prefersReducedMotion();

  animateIn = () => {
    this.resetDrag();
    if (!this.canAnimate()) {
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

  // The sheet slides out from where it is (where a drag released it) while its backdrop fades
  animateOut = () => {
    if (!this.leaving) {
      this.resetDrag();
      return;
    }
    const from = this.dragOffset || 0;
    const options = { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' };
    this.leaveAnimations = [
      this.sheet.animate([{ transform: `translateY(${from}px)` }, { transform: 'translateY(100%)' }], options)
    ];
    if (this.overlay && typeof this.overlay.animate === 'function') {
      this.leaveAnimations.push(this.overlay.animate([{ opacity: 1 }, { opacity: 0 }], options));
    }
    this.leaveAnimations[0].onfinish = () => {
      this.cancelLeaving();
      this.forceUpdate();
    };
  };

  cancelLeaving = () => {
    (this.leaveAnimations || []).forEach(animation => animation.cancel());
    this.leaveAnimations = null;
    this.leaving = false;
    this.resetDrag();
  };

  // ---------- drag to dismiss ----------

  setDragOffset = (offset, animated) => {
    this.dragOffset = offset;
    if (!this.sheet) {
      return;
    }
    this.sheet.style.transition = animated ? 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
    this.sheet.style.transform = offset ? `translateY(${offset}px)` : '';
    if (this.overlay) {
      // the page shows through as the sheet goes down
      const progress = Math.min(1, offset / Math.max(1, this.sheet.offsetHeight));
      this.overlay.style.transition = animated ? 'background-color 220ms ease' : 'none';
      this.overlay.style.backgroundColor = offset ? `rgba(16, 22, 36, ${(0.42 * (1 - progress)).toFixed(3)})` : '';
    }
  };

  resetDrag = () => {
    this.drag = null;
    this.dragOffset = 0;
    if (this.sheet) {
      this.sheet.style.transition = '';
      this.sheet.style.transform = '';
    }
    if (this.overlay) {
      this.overlay.style.transition = '';
      this.overlay.style.backgroundColor = '';
    }
  };

  // A drag may start on the handle and the header, or on the content when nothing in it is
  // scrolled: there, a finger going down has nothing left to scroll and takes the sheet with it
  canDragFrom = target => {
    if (!this.sheet || !this.handle || this.handle.offsetParent === null) {
      // the centered dialog of wider screens has no handle and does not move
      return null;
    }
    if (this.grabZone && this.grabZone.contains(target)) {
      return target.closest('button, a') ? null : 'grab';
    }
    if (target.closest(NO_DRAG_TARGETS)) {
      return null;
    }
    for (let element = target; element && element !== this.sheet; element = element.parentElement) {
      if (element.scrollTop > 0) {
        return null;
      }
    }
    return 'content';
  };

  onTouchStart = event => {
    if (!this.props.open || !this.isTopmost() || event.touches.length !== 1) {
      this.drag = null;
      return;
    }
    const zone = this.canDragFrom(event.target);
    if (!zone) {
      this.drag = null;
      return;
    }
    const touch = event.touches[0];
    this.drag = {
      zone,
      startX: touch.clientX,
      startY: touch.clientY,
      lastY: touch.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      engaged: false
    };
  };

  onTouchMove = event => {
    const drag = this.drag;
    if (!drag) {
      return;
    }
    const touch = event.touches[0];
    const deltaX = touch.clientX - drag.startX;
    const deltaY = touch.clientY - drag.startY;
    if (!drag.engaged) {
      if (Math.abs(deltaY) < ENGAGE_PX && Math.abs(deltaX) < ENGAGE_PX) {
        return;
      }
      // upward, or sideways (a row being swiped): not a drag of the sheet
      if (deltaY <= 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
        this.drag = null;
        return;
      }
      drag.engaged = true;
      // the offset counts from where the drag engaged: the sheet does not jump
      drag.startY = touch.clientY;
    }
    if (event.cancelable) {
      event.preventDefault();
    }
    const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
    drag.velocity = (touch.clientY - drag.lastY) / elapsed;
    drag.lastY = touch.clientY;
    drag.lastTime = event.timeStamp;
    this.setDragOffset(Math.max(0, touch.clientY - drag.startY), false);
  };

  onTouchEnd = () => {
    const drag = this.drag;
    this.drag = null;
    if (!drag || !drag.engaged) {
      return;
    }
    const offset = this.dragOffset || 0;
    const threshold = Math.min(DISMISS_MAX_PX, this.sheet.offsetHeight * DISMISS_RATIO);
    const flicked = drag.velocity > FLICK_PX_PER_MS && offset > FLICK_MIN_PX;
    if (offset > threshold || flicked) {
      this.props.onClose();
      // a sheet that refuses to close goes back up
      setTimeout(() => {
        if (this.props.open && !this.drag) {
          this.setDragOffset(0, true);
        }
      }, 0);
    } else {
      this.setDragOffset(0, true);
    }
  };

  onTouchCancel = () => {
    if (this.drag && this.drag.engaged) {
      this.setDragOffset(0, true);
    }
    this.drag = null;
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

  // the touch listeners are attached by hand: "touchmove" must not be passive, to keep the
  // content from scrolling (and the page from bouncing) while the sheet is dragged
  setSheetRef = element => {
    if (this.sheet === element) {
      return;
    }
    if (this.sheet) {
      this.sheet.removeEventListener('touchstart', this.onTouchStart);
      this.sheet.removeEventListener('touchmove', this.onTouchMove);
      this.sheet.removeEventListener('touchend', this.onTouchEnd);
      this.sheet.removeEventListener('touchcancel', this.onTouchCancel);
    }
    this.sheet = element;
    if (element) {
      element.addEventListener('touchstart', this.onTouchStart, { passive: true });
      element.addEventListener('touchmove', this.onTouchMove, { passive: false });
      element.addEventListener('touchend', this.onTouchEnd);
      element.addEventListener('touchcancel', this.onTouchCancel);
    }
  };

  setOverlayRef = element => {
    this.overlay = element;
  };

  setHandleRef = element => {
    this.handle = element;
  };

  setGrabZoneRef = element => {
    this.grabZone = element;
  };

  backdropDismiss = createBackdropDismiss(() => this.props.onClose());

  render({ open, keepMounted, title, onClose, onBack, onOk, okLabelId, size, footer, children, dataCy, depth }) {
    const leaving = Boolean(this.leaving);
    if (!open && !leaving && !keepMounted) {
      return null;
    }
    return createPortal(
      <div
        class={cx('glass-theme', style.overlay, {
          [style.overlayHidden]: !open && !leaving,
          [style.overlayLeaving]: !open && leaving
        })}
        data-sheet-backdrop
        aria-hidden={open ? undefined : 'true'}
        style={depth ? { zIndex: 1060 + depth * 2 } : undefined}
        ref={this.setOverlayRef}
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
          <div class={style.grabZone} ref={this.setGrabZoneRef} data-not-an-edit>
            <div class={style.handle} ref={this.setHandleRef} />
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
                  <button
                    type="button"
                    class={cx(style.headerLink, style.headerLinkStrong)}
                    onClick={onOk}
                    data-cy="sheet-ok"
                  >
                    <Text id={okLabelId || 'editScene.mobile.ok'} />
                  </button>
                ) : (
                  <Localizer>
                    <button
                      type="button"
                      class={style.close}
                      onClick={onClose}
                      aria-label={<Text id="editScene.mobile.close" />}
                      data-cy="sheet-close"
                    >
                      <i class="fe fe-x" />
                    </button>
                  </Localizer>
                )}
              </div>
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
