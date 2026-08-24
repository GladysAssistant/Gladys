import { Component } from 'preact';
import { route } from 'preact-router';

// Elements that own their horizontal touch gestures: a swipe starting on
// them must never turn into a dashboard switch (maps drag, sliders slide,
// menus scroll, the bottom dock has its own taps…). Charts are NOT in the
// list: ApexCharts' selection zoom is a mouse gesture and its touch
// pinch-zoom uses two fingers, so a one-finger drag on a chart is free —
// and on a one-widget dashboard the chart may be most of the page.
const OWN_GESTURE_SELECTOR =
  'input, textarea, select, button, a, label, .leaflet-container, .dropdown-menu, [data-dashboard-swipe-ignore]';

// Finger travel before the gesture is committed to one axis
const AXIS_LOCK_PX = 12;
// A horizontal move is only a swipe when clearly flatter than it is tall
const HORIZONTAL_RATIO = 1.3;
// Fraction of the page width that commits the switch on release…
const COMMIT_RATIO = 0.15;
// …or a flick: at least this fast (px/ms) over at least FLICK_MIN_PX
const FLICK_VELOCITY = 0.4;
const FLICK_MIN_PX = 30;
// Follow resistance when there is no dashboard on that side
const RUBBER_BAND = 0.25;
// Where the incoming dashboard slides in from
const ENTER_OFFSET_PX = 40;
// How long the snap-back / enter transitions run — the horizontal clip on
// the outer wrapper is kept slightly longer than the longest of them
const SNAP_MS = 150;
const ENTER_MS = 200;

// Widgets also hold horizontally scrollable strips (responsive device
// tables, the weather forecast row): a touch starting inside one belongs to
// that scroller. Detected by geometry, not by class, so new scrollers are
// covered by construction. This is also why no ancestor declares
// touch-action: pan-y — that would disable these inner scrollers natively.
const startsInHorizontalScroller = (target, boundary) => {
  let node = target;
  while (node && node !== boundary) {
    if (node.scrollWidth > node.clientWidth + 1) {
      const { overflowX } = window.getComputedStyle(node);
      if (overflowX === 'auto' || overflowX === 'scroll') {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
};

// Swiping left/right anywhere on the dashboard page switches to the
// neighboring dashboard, in the order of the switcher pills — the phone
// pager gesture. The listeners live on the document (bounded to the
// dashboard's own page) so the gesture also works on the empty scene around
// and below the widgets of a short dashboard, not only on this wrapper's
// content. Only on the mobile/touch PHONE layout: on a desktop mouse there
// is nothing to swipe with, and in tablet mode (docked wall tablets — a
// portrait iPad sits inside the same breakpoint) a brushed sleeve must not
// change dashboards. The content follows the finger (with rubber-band
// resistance at both ends), and the target dashboard slides in from the
// side it was pulled from — also when it was picked from the dock, so the
// pills and the gesture tell one consistent story.
class DashboardSwiper extends Component {
  setClipRef = element => {
    this.clipElement = element;
  };

  setRef = element => {
    this.element = element;
  };

  isPagerEnabled = () =>
    !this.props.tabletMode &&
    window.matchMedia &&
    window.matchMedia('(pointer: coarse)').matches &&
    window.matchMedia('(max-width: 991.98px)').matches;

  getSiblingSelector = direction => {
    const { dashboards, currentDashboard } = this.props;
    if (!dashboards || dashboards.length < 2 || !currentDashboard) {
      return null;
    }
    const index = dashboards.findIndex(dashboard => dashboard.selector === currentDashboard.selector);
    if (index === -1) {
      return null;
    }
    const sibling = dashboards[index + direction];
    return sibling ? sibling.selector : null;
  };

  // While the content is translated (finger follow, snap back, enter slide)
  // the outer wrapper clips horizontally so the page never grows a
  // horizontal scrollbar. The clip is transient on purpose: statically it
  // would turn the wrapper into a scroll container (overflow-x: hidden
  // forces overflow-y out of `visible`) and clip in-card dropdown menus.
  beginClip = () => {
    clearTimeout(this.unclipTimeout);
    if (this.clipElement) {
      this.clipElement.style.overflowX = 'hidden';
    }
  };

  scheduleUnclip = delay => {
    clearTimeout(this.unclipTimeout);
    this.unclipTimeout = setTimeout(() => {
      if (this.clipElement) {
        this.clipElement.style.overflowX = '';
      }
    }, delay);
  };

  // Abandons an in-flight gesture — second finger landing, touchcancel
  // (incoming call, the OS taking over the touch), unmount — snapping the
  // content back WITHOUT navigating, whatever distance was reached
  cancelActiveSwipe = () => {
    const swipe = this.swipe;
    this.swipe = null;
    if (!swipe || swipe.axis !== 'horizontal' || !this.element) {
      return;
    }
    this.element.style.transition = `transform ${SNAP_MS}ms ease-out`;
    this.element.style.transform = '';
    this.scheduleUnclip(SNAP_MS + 50);
  };

  handleTouchStart = event => {
    if (event.touches.length !== 1) {
      // a second finger (pinch…) aborts the gesture — without snapping back
      // here the content would stay stuck mid-translation
      this.cancelActiveSwipe();
      return;
    }
    this.swipe = null;
    if (!this.isPagerEnabled() || !this.element) {
      return;
    }
    // the page bounds the gesture: the wallpaper around the widgets swipes,
    // the app chrome (sidebar, top bar) and the excluded controls do not
    const page = this.element.closest('.page-main');
    if (!page || !page.contains(event.target)) {
      return;
    }
    if (event.target.closest && event.target.closest(OWN_GESTURE_SELECTOR)) {
      return;
    }
    if (startsInHorizontalScroller(event.target, page)) {
      return;
    }
    const touch = event.touches[0];
    this.swipe = {
      startX: touch.clientX,
      startY: touch.clientY,
      axis: null,
      dx: 0,
      // previous sample, for the release velocity of a flick
      lastX: touch.clientX,
      lastTime: event.timeStamp,
      velocity: 0
    };
  };

  // Attached by hand with { passive: false }: once the gesture is locked
  // horizontal the vertical page scroll must be suppressed, and
  // JSX/document-attached touchmove listeners can end up passive
  // (non-cancelable)
  handleTouchMove = event => {
    const swipe = this.swipe;
    if (!swipe || event.touches.length !== 1) {
      return;
    }
    const touch = event.touches[0];
    const dx = touch.clientX - swipe.startX;
    const dy = touch.clientY - swipe.startY;

    if (swipe.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) {
        return;
      }
      swipe.axis = Math.abs(dx) > Math.abs(dy) * HORIZONTAL_RATIO ? 'horizontal' : 'vertical';
      if (swipe.axis === 'horizontal') {
        this.beginClip();
      }
    }
    if (swipe.axis !== 'horizontal') {
      return;
    }

    event.preventDefault();
    const elapsed = event.timeStamp - swipe.lastTime;
    if (elapsed > 0) {
      swipe.velocity = (touch.clientX - swipe.lastX) / elapsed;
      swipe.lastX = touch.clientX;
      swipe.lastTime = event.timeStamp;
    }
    const hasTarget = this.getSiblingSelector(dx < 0 ? 1 : -1) !== null;
    swipe.dx = dx;
    const followed = hasTarget ? dx : dx * RUBBER_BAND;
    this.element.style.transition = 'none';
    this.element.style.transform = `translateX(${followed}px)`;
  };

  handleTouchEnd = () => {
    const swipe = this.swipe;
    this.swipe = null;
    if (!swipe || swipe.axis !== 'horizontal' || !this.element) {
      return;
    }
    const direction = swipe.dx < 0 ? 1 : -1;
    // the documented threshold is a fraction of the PAGE width — the wrapper
    // is a .container child, narrower than the page by its side padding
    const pastDistance = Math.abs(swipe.dx) >= window.innerWidth * COMMIT_RATIO;
    // a flick commits early, but only in the direction the content moved
    const flicked =
      Math.abs(swipe.dx) >= FLICK_MIN_PX &&
      Math.abs(swipe.velocity) >= FLICK_VELOCITY &&
      Math.sign(swipe.velocity) === Math.sign(swipe.dx);
    const targetSelector = pastDistance || flicked ? this.getSiblingSelector(direction) : null;

    if (targetSelector) {
      route(`/dashboard/${targetSelector}`);
      // the enter animation plays when the new dashboard's data lands
      // (componentDidUpdate); until then the pulled content springs back
    }
    this.element.style.transition = `transform ${SNAP_MS}ms ease-out`;
    this.element.style.transform = '';
    this.scheduleUnclip(SNAP_MS + 50);
  };

  // touchcancel never navigates: the browser or OS abandoned the gesture,
  // it did not complete it
  handleTouchCancel = () => {
    this.cancelActiveSwipe();
  };

  playEnterAnimation = side => {
    const element = this.element;
    // a still-pending previous animation must not fire on top of this one
    cancelAnimationFrame(this.enterFrame);
    this.beginClip();
    element.style.transition = 'none';
    element.style.transform = `translateX(${side * ENTER_OFFSET_PX}px)`;
    element.style.opacity = '0';
    // double rAF: the starting offset must be painted before transitioning
    // out of it. The ids are kept so an unmount (or the next animation)
    // cancels the pending frame instead of letting it write on a dead node.
    this.enterFrame = requestAnimationFrame(() => {
      this.enterFrame = requestAnimationFrame(() => {
        if (!this.element) {
          return;
        }
        this.element.style.transition = `transform ${ENTER_MS}ms ease-out, opacity ${ENTER_MS}ms ease-out`;
        this.element.style.transform = '';
        this.element.style.opacity = '';
        this.scheduleUnclip(ENTER_MS + 50);
      });
    });
  };

  componentDidUpdate(previousProps) {
    const previousSelector = previousProps.currentDashboard && previousProps.currentDashboard.selector;
    const currentSelector = this.props.currentDashboard && this.props.currentDashboard.selector;
    if (!previousSelector || !currentSelector || previousSelector === currentSelector) {
      return;
    }
    if (!this.element || !this.isPagerEnabled()) {
      return;
    }
    // The slide-in side comes from the dashboards' order, not from the
    // gesture: a dock tap animates exactly like the equivalent swipe
    const { dashboards } = this.props;
    const previousIndex = dashboards.findIndex(dashboard => dashboard.selector === previousSelector);
    const currentIndex = dashboards.findIndex(dashboard => dashboard.selector === currentSelector);
    if (previousIndex === -1 || currentIndex === -1) {
      return;
    }
    this.playEnterAnimation(currentIndex > previousIndex ? 1 : -1);
  }

  componentDidMount() {
    document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    document.addEventListener('touchcancel', this.handleTouchCancel);
  }

  componentWillUnmount() {
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchCancel);
    cancelAnimationFrame(this.enterFrame);
    clearTimeout(this.unclipTimeout);
    this.swipe = null;
  }

  render({ children }) {
    // outer div: transient horizontal clip while the inner one translates
    return (
      <div ref={this.setClipRef}>
        <div ref={this.setRef}>{children}</div>
      </div>
    );
  }
}

export default DashboardSwiper;
