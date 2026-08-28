import { Component } from 'preact';
import { route } from 'preact-router';
import cx from 'classnames';

import DashboardSkeleton from './DashboardSkeleton';
import style from './style.css';

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
// Gap between two pages of the pager track — must match the ±100% offsets
// of .pagerNeighbor in the stylesheet
const PAGE_GUTTER_PX = 16;
// How long the abandon snap-back and the committed slide-out run — the
// horizontal clip on the outer wrapper is kept slightly longer
const SNAP_MS = 150;
const COMMIT_MS = 220;
// Where the incoming dashboard slides in from on a NON-gesture switch
const ENTER_OFFSET_PX = 40;
const ENTER_MS = 200;
// A committed swipe holds its skeleton until the new dashboard's data
// lands; past this it gives up and springs back (network gone, API error)
const SWAP_GIVE_UP_MS = 8000;
// The dock is a slim capsule, and a thumb aiming at its scrollable pill
// track often lands a few pixels high: without a guard that near-miss
// grabbed the PAGE pager and switched dashboards. A page swipe never
// starts this close above the dock; the track's own invisible touch halo
// (style.css) covers most of the strip and scrolls the bar instead.
const DOCK_GUARD_PX = 32;

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

// The phone pager: swiping left/right anywhere on the dashboard page pulls
// the NEIGHBORING dashboard into view — drawn as a data-less skeleton from
// its cached configuration — and a committed swipe slides it fully in, then
// swaps it for the live dashboard in place. The finger always drags two
// pages at once, like a native pager, instead of dragging the current page
// against empty wallpaper and repainting after the fact (which read as a
// web refresh). The listeners live on the document (bounded to the
// dashboard's own page) so the gesture also works on the empty scene around
// and below the widgets of a short dashboard. Only on the mobile/touch
// PHONE layout: on a desktop mouse there is nothing to swipe with, and in
// tablet mode (docked wall tablets — a portrait iPad sits inside the same
// breakpoint) a brushed sleeve must not change dashboards.
class DashboardSwiper extends Component {
  state = {
    pagerNeighbors: null
  };

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

  // While the content is translated (finger follow, snap back, slide out)
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

  // The neighbor skeletons enter the tree only once a gesture is actually
  // locked horizontal — not on every touch, or plain vertical scrolling
  // would pay for their render. Their top edge is aligned with whatever the
  // viewport currently shows, so a swipe from the middle of a long page
  // still reveals the neighbor from its own top.
  mountNeighbors = () => {
    if (!this.element) {
      return;
    }
    const previousSelector = this.getSiblingSelector(-1);
    const nextSelector = this.getSiblingSelector(1);
    if (!previousSelector && !nextSelector) {
      return;
    }
    const top = Math.max(0, -this.element.getBoundingClientRect().top);
    this.setState({ pagerNeighbors: { previousSelector, nextSelector, top } });
  };

  scheduleNeighborTeardown = delay => {
    clearTimeout(this.neighborTeardownTimeout);
    this.neighborTeardownTimeout = setTimeout(() => {
      this.setState({ pagerNeighbors: null });
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
    this.scheduleNeighborTeardown(SNAP_MS + 50);
  };

  handleTouchStart = event => {
    if (event.touches.length !== 1) {
      // a second finger (pinch…) aborts the gesture — without snapping back
      // here the content would stay stuck mid-translation
      this.cancelActiveSwipe();
      return;
    }
    this.swipe = null;
    // a committed switch is in flight: the track is translated onto the
    // skeleton and the swap is imminent — a new gesture would fight it
    if (this.pendingSwap) {
      return;
    }
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
    // the guard strip above the dock (see DOCK_GUARD_PX) — the dock itself
    // is already excluded through OWN_GESTURE_SELECTOR
    const dock = page.querySelector('[data-dashboard-swipe-ignore]');
    if (dock && touch.clientY >= dock.getBoundingClientRect().top - DOCK_GUARD_PX) {
      return;
    }
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
        this.mountNeighbors();
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
      this.commitSwipe(direction, targetSelector);
      return;
    }
    this.element.style.transition = `transform ${SNAP_MS}ms ease-out`;
    this.element.style.transform = '';
    this.scheduleUnclip(SNAP_MS + 50);
    this.scheduleNeighborTeardown(SNAP_MS + 50);
  };

  // touchcancel never navigates: the browser or OS abandoned the gesture,
  // it did not complete it
  handleTouchCancel = () => {
    this.cancelActiveSwipe();
  };

  // A committed swipe finishes the slide (the skeleton takes the viewport),
  // navigates, and holds that pose until BOTH the slide has ended and the
  // new dashboard's data has landed — then the live page replaces the
  // skeleton in place. With the configuration cache the data usually
  // arrives first, so the hold is invisible; on a cold cache the skeleton
  // simply stays up, which is exactly what a native skeleton screen does.
  commitSwipe = (direction, targetSelector) => {
    const rect = this.element.getBoundingClientRect();
    this.pendingSwap = {
      // where to route back to if the swap gives up — the URL was already
      // switched to the target at commit time
      source: this.props.currentDashboard.selector,
      target: targetSelector,
      animationDone: false,
      dataReady: false,
      // scroll so the new page's top sits where the skeleton's top was —
      // never further down than the user already was
      scrollTo: Math.max(0, window.scrollY + Math.min(0, rect.top))
    };
    // freeze the page height: the old content re-rendering (or shrinking)
    // under the translated track must not let the document height collapse
    // and yank the scroll position while the skeleton is on stage
    if (this.clipElement) {
      this.clipElement.style.minHeight = `${this.clipElement.offsetHeight}px`;
    }
    this.beginClip();
    this.element.style.transition = `transform ${COMMIT_MS}ms ease-out`;
    this.element.style.transform = `translateX(${direction * -(rect.width + PAGE_GUTTER_PX)}px)`;
    this.swapAnimationTimeout = setTimeout(() => {
      if (this.pendingSwap) {
        this.pendingSwap.animationDone = true;
        this.maybeCompleteSwap();
      }
    }, COMMIT_MS + 20);
    // the give-up path restores the source ROUTE too: the URL switched at
    // commit, so springing back visually without it would leave the source
    // dashboard displayed at the target's URL (and a late target response
    // would then flip the page long after the gesture)
    this.swapGiveUpTimeout = setTimeout(() => this.abortPendingSwap(true), SWAP_GIVE_UP_MS);
    route(`/dashboard/${targetSelector}`);
  };

  maybeCompleteSwap = () => {
    const swap = this.pendingSwap;
    if (!swap || !swap.animationDone || !swap.dataReady) {
      return;
    }
    this.pendingSwap = null;
    clearTimeout(this.swapAnimationTimeout);
    clearTimeout(this.swapGiveUpTimeout);
    // the new dashboard is already rendered in the (translated, clipped)
    // current slot: resetting the transform puts it exactly where the
    // skeleton was, before the next paint — the swap itself is invisible
    this.element.style.transition = 'none';
    this.element.style.transform = '';
    if (this.clipElement) {
      this.clipElement.style.minHeight = '';
    }
    window.scrollTo(0, swap.scrollTo);
    this.setState({ pagerNeighbors: null });
    this.scheduleUnclip(50);
  };

  // The swap fell through. Two flavors: the give-up timeout (fetch never
  // landed — restoreSource re-routes to the source so the URL matches the
  // page that springs back, and the stale-response guard then ignores a
  // late target payload), or the user routed somewhere else mid-hold (the
  // new route must be left alone: no re-route, just the visual snap back).
  abortPendingSwap = restoreSource => {
    if (!this.pendingSwap) {
      return;
    }
    const { source, target } = this.pendingSwap;
    this.pendingSwap = null;
    clearTimeout(this.swapAnimationTimeout);
    clearTimeout(this.swapGiveUpTimeout);
    if (this.clipElement) {
      this.clipElement.style.minHeight = '';
    }
    if (this.element) {
      this.element.style.transition = `transform ${SNAP_MS}ms ease-out`;
      this.element.style.transform = '';
    }
    this.scheduleUnclip(SNAP_MS + 50);
    this.scheduleNeighborTeardown(SNAP_MS + 50);
    // only reclaim the URL while it is still the abandoned target's — if
    // the user navigated elsewhere in the meantime, their route wins
    if (restoreSource && source && this.props.currentDashboardSelector === target) {
      route(`/dashboard/${source}`);
    }
  };

  componentDidUpdate(previousProps) {
    // The HOLD is driven by the ROUTE, not by the rendered dashboard: the
    // URL flips at commit, long before the target's data can land on a cold
    // cache. A navigation elsewhere mid-hold (dock tap…) changes only the
    // selector until ITS data arrives — waiting for currentDashboard would
    // leave the hold blind to it, and the give-up could then re-route back
    // to the swipe source, clobbering the user's navigation. Only a CHANGE
    // of selector counts: right after commit the parent re-renders (URL
    // store update) before its own selector state catches up, and that
    // stale pre-navigation value must not read as "routed elsewhere".
    if (
      this.pendingSwap &&
      previousProps.currentDashboardSelector !== this.props.currentDashboardSelector &&
      this.props.currentDashboardSelector !== this.pendingSwap.target
    ) {
      this.abortPendingSwap();
    }
    const previousSelector = previousProps.currentDashboard && previousProps.currentDashboard.selector;
    const currentSelector = this.props.currentDashboard && this.props.currentDashboard.selector;
    if (!previousSelector || !currentSelector || previousSelector === currentSelector) {
      return;
    }
    if (this.pendingSwap) {
      if (currentSelector === this.pendingSwap.target) {
        this.pendingSwap.dataReady = true;
        this.maybeCompleteSwap();
      }
      return;
    }
    if (!this.element || !this.isPagerEnabled()) {
      return;
    }
    // A NON-gesture switch (dock tap): the new dashboard slides in from the
    // side its pill sits on, so the dock and the gesture tell one story
    const { dashboards } = this.props;
    const previousIndex = dashboards.findIndex(dashboard => dashboard.selector === previousSelector);
    const currentIndex = dashboards.findIndex(dashboard => dashboard.selector === currentSelector);
    if (previousIndex === -1 || currentIndex === -1) {
      return;
    }
    this.playEnterAnimation(currentIndex > previousIndex ? 1 : -1);
  }

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
    clearTimeout(this.neighborTeardownTimeout);
    clearTimeout(this.swapAnimationTimeout);
    clearTimeout(this.swapGiveUpTimeout);
    this.pendingSwap = null;
    this.swipe = null;
  }

  render({ children, dashboardConfigsBySelector }, { pagerNeighbors }) {
    const configs = dashboardConfigsBySelector || {};
    // outer div: transient horizontal clip while the track translates;
    // inner div: the track — current dashboard in flow, neighbor skeletons
    // absolutely posed one page (plus gutter) to each side
    return (
      <div ref={this.setClipRef}>
        <div ref={this.setRef} class={style.pagerTrack}>
          {pagerNeighbors && pagerNeighbors.previousSelector && (
            <div
              class={cx(style.pagerNeighbor, style.pagerNeighborPrevious)}
              style={{ top: `${pagerNeighbors.top}px` }}
              aria-hidden="true"
            >
              <DashboardSkeleton dashboard={configs[pagerNeighbors.previousSelector]} />
            </div>
          )}
          {children}
          {pagerNeighbors && pagerNeighbors.nextSelector && (
            <div
              class={cx(style.pagerNeighbor, style.pagerNeighborNext)}
              style={{ top: `${pagerNeighbors.top}px` }}
              aria-hidden="true"
            >
              <DashboardSkeleton dashboard={configs[pagerNeighbors.nextSelector]} />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default DashboardSwiper;
