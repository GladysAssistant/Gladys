import { Component } from 'preact';
import { route } from 'preact-router';

// Elements that own their horizontal touch gestures: a swipe starting on
// them must never turn into a dashboard switch (charts pan/zoom, maps drag,
// sliders slide, menus scroll…)
const OWN_GESTURE_SELECTOR =
  'input, textarea, select, button, a, label, .apexcharts-canvas, .leaflet-container, .dropdown-menu';

// Widgets also hold horizontally scrollable strips (responsive device
// tables, the weather forecast row): a touch starting inside one belongs to
// that scroller. Detected by geometry, not by class, so new scrollers are
// covered by construction. This is also why the wrapper does NOT declare
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

// Finger travel before the gesture is committed to one axis
const AXIS_LOCK_PX = 12;
// A horizontal move is only a swipe when clearly flatter than it is tall
const HORIZONTAL_RATIO = 1.3;
// Fraction of the page width that commits the switch on release
const COMMIT_RATIO = 0.2;
// Follow resistance when there is no dashboard on that side
const RUBBER_BAND = 0.25;
// Where the incoming dashboard slides in from
const ENTER_OFFSET_PX = 40;

// Swiping left/right on the dashboard body switches to the neighboring
// dashboard, in the order of the switcher pills — the phone pager gesture.
// Only on the mobile/touch layout: on a desktop mouse there is nothing to
// swipe with, and a wall tablet must not change dashboards on a brushed
// sleeve. The content follows the finger (with rubber-band resistance at
// both ends), and the target dashboard slides in from the side it was
// pulled from — also when it was picked from the dock, so the pills and
// the gesture tell one consistent story.
class DashboardSwiper extends Component {
  setRef = element => {
    this.element = element;
  };

  isTouchLayout = () =>
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

  handleTouchStart = event => {
    this.swipe = null;
    if (event.touches.length !== 1 || !this.isTouchLayout()) {
      return;
    }
    if (event.target.closest && event.target.closest(OWN_GESTURE_SELECTOR)) {
      return;
    }
    if (startsInHorizontalScroller(event.target, this.element)) {
      return;
    }
    const touch = event.touches[0];
    this.swipe = {
      startX: touch.clientX,
      startY: touch.clientY,
      axis: null,
      dx: 0
    };
  };

  // Attached by hand with { passive: false }: once the gesture is locked
  // horizontal the vertical page scroll must be suppressed, and JSX-attached
  // touchmove listeners can end up passive (non-cancelable)
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
    }
    if (swipe.axis !== 'horizontal') {
      return;
    }

    event.preventDefault();
    const hasTarget = this.getSiblingSelector(dx < 0 ? 1 : -1) !== null;
    swipe.dx = dx;
    const followed = hasTarget ? dx : dx * RUBBER_BAND;
    this.element.style.transition = 'none';
    this.element.style.transform = `translateX(${followed}px)`;
  };

  handleTouchEnd = () => {
    const swipe = this.swipe;
    this.swipe = null;
    if (!swipe || swipe.axis !== 'horizontal') {
      return;
    }
    const direction = swipe.dx < 0 ? 1 : -1;
    const targetSelector =
      Math.abs(swipe.dx) >= this.element.offsetWidth * COMMIT_RATIO ? this.getSiblingSelector(direction) : null;

    if (targetSelector) {
      route(`/dashboard/${targetSelector}`);
      // the enter animation plays when the new dashboard's data lands
      // (componentDidUpdate); until then the pulled content springs back
    }
    this.element.style.transition = 'transform 0.2s ease-out';
    this.element.style.transform = '';
  };

  playEnterAnimation = side => {
    const element = this.element;
    element.style.transition = 'none';
    element.style.transform = `translateX(${side * ENTER_OFFSET_PX}px)`;
    element.style.opacity = '0';
    // double rAF: the starting offset must be painted before transitioning out of it
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
        element.style.transform = '';
        element.style.opacity = '';
      });
    });
  };

  componentDidUpdate(previousProps) {
    const previousSelector = previousProps.currentDashboard && previousProps.currentDashboard.selector;
    const currentSelector = this.props.currentDashboard && this.props.currentDashboard.selector;
    if (!previousSelector || !currentSelector || previousSelector === currentSelector) {
      return;
    }
    if (!this.element || !this.isTouchLayout()) {
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
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
  }

  componentWillUnmount() {
    this.element.removeEventListener('touchmove', this.handleTouchMove);
  }

  render({ children }) {
    return (
      <div
        ref={this.setRef}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
        onTouchCancel={this.handleTouchEnd}
      >
        {children}
      </div>
    );
  }
}

export default DashboardSwiper;
