import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { splitLeadingEmoji, wrapEmojisJSX } from '../../utils/emojiWrapper';
import { iconFromEmoji } from '../../utils/emojiIconMapping';
import style from './style.css';

// The icon is often all that identifies a pill (tablet dock, collapsed
// mobile pills), and dashboards created before icons existed all fall back
// to the same house glyph. Many of them carry the distinguishing mark in
// the name instead — a leading emoji — so translate it to the matching
// icon of the icon set (the emoji itself is never used as the icon: its
// rendering depends on the viewer's platform) and take it out of the pill
// name so the mark doesn't show twice. An emoji with no match keeps the
// generic house and the full name.
const getTabAppearance = dashboard => {
  if (dashboard.icon) {
    return { icon: dashboard.icon, name: dashboard.name };
  }
  const { emoji, rest } = splitLeadingEmoji(dashboard.name);
  const icon = emoji && iconFromEmoji(emoji);
  if (icon) {
    // rest is empty when the emoji IS the whole name: keep it as the label
    // even next to the mapped icon — a nameless entry in the overflow menu
    // would be worse than the doubled mark.
    return { icon, name: rest || dashboard.name };
  }
  return { icon: 'home', name: dashboard.name };
};

// The breakpoint below which the switcher is the bottom dock (style.css):
// there the bar scrolls sideways instead of collapsing behind "…"
const DOCK_BREAKPOINT_QUERY = '(max-width: 991.98px)';
// Hysteresis for the edge fades and the overflow check — sub-pixel layouts
// report scrollWidth one unit over clientWidth on an exactly-fitting track
const EDGE_EPSILON_PX = 2;

// The dashboard switcher, in two layouts:
//
// - Desktop: "priority+" navigation — a single row of one-tap pills in
//   dashboard order (the order the user already controls in the edit view),
//   and everything that doesn't fit collapses behind a trailing "…" button
//   opening the full list. When the current dashboard is one of the
//   collapsed ones, the button shows it.
//
// - Mobile dock (below the breakpoint above): the pill track scrolls
//   sideways with a hidden scrollbar, like the integrations band. With many
//   dashboards the collapsed list cost two taps and a vertical scroll, and
//   the visible/collapsed frontier moved with every rotation; a scrollable
//   track keeps every dashboard one continuous thumb gesture away, at a
//   stable position. Edge fades hint at the hidden pills, and a fixed list
//   button (shown only when the track actually overflows) still opens the
//   full NAMED list — with pills collapsed to icon dots, the list is how a
//   dashboard is identified when the icons look alike.
class DashboardTabs extends Component {
  state = {
    // desktop only — null = render everything (also the measuring state)
    visibleCount: null,
    menuOpen: false,
    scrollable:
      typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(DOCK_BREAKPOINT_QUERY).matches : false,
    // mobile only — the pills exceed the visible track: fade the scrolled
    // edges and show the full-list button
    trackOverflows: false,
    fadeStart: false,
    fadeEnd: false
  };

  setContainerRef = element => {
    this.container = element;
  };

  setTrackRef = element => {
    this.track = element;
  };

  // Desktop: collapse pills one by one until everything visible — the "…"
  // button included — sits on the first row
  ensureRowFits = () => {
    const container = this.container;
    if (!container) {
      return;
    }
    const pills = Array.from(container.querySelectorAll('[data-dashboard-pill]')).filter(
      pill => !pill.classList.contains('d-none')
    );
    if (pills.length === 0) {
      return;
    }
    // Viewport-based tops: offsetTop would be relative to each element's own
    // offsetParent (the "…" button lives in a position:relative dropdown)
    const firstRowTop = pills[0].getBoundingClientRect().top;
    const moreButton = container.querySelector('[data-dashboard-overflow]');
    const lastElement = moreButton || pills[pills.length - 1];
    const wraps =
      lastElement.getBoundingClientRect().top > firstRowTop + 1 ||
      pills[pills.length - 1].getBoundingClientRect().top > firstRowTop + 1;
    if (!wraps) {
      return;
    }
    const currentCount = this.state.visibleCount === null ? pills.length : this.state.visibleCount;
    if (currentCount <= 1) {
      return;
    }
    this.setState({ visibleCount: currentCount - 1 }, this.ensureRowFits);
  };

  // Mobile: refresh the overflow flag and the edge fades from the track's
  // current scroll geometry
  updateTrackState = () => {
    const track = this.track;
    if (!track) {
      return;
    }
    const maxScroll = track.scrollWidth - track.clientWidth;
    const trackOverflows = maxScroll > EDGE_EPSILON_PX;
    const fadeStart = trackOverflows && track.scrollLeft > EDGE_EPSILON_PX;
    const fadeEnd = trackOverflows && track.scrollLeft < maxScroll - EDGE_EPSILON_PX;
    if (
      trackOverflows !== this.state.trackOverflows ||
      fadeStart !== this.state.fadeStart ||
      fadeEnd !== this.state.fadeEnd
    ) {
      this.setState({ trackOverflows, fadeStart, fadeEnd });
    }
  };

  // Mobile: center the active pill in the track — after a dock tap, a page
  // swipe or a rotation, the user must see where they are without hunting
  scrollActiveIntoView = instant => {
    const track = this.track;
    if (!track) {
      return;
    }
    const active = track.querySelector('[data-dashboard-pill][data-active]');
    if (!active) {
      return;
    }
    const maxScroll = track.scrollWidth - track.clientWidth;
    const target = Math.max(0, Math.min(active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2, maxScroll));
    if (instant) {
      // bypass the track's CSS scroll-behavior: smooth — the initial
      // position must not play as an animation on page load
      track.style.scrollBehavior = 'auto';
      track.scrollLeft = target;
      track.style.scrollBehavior = '';
    } else {
      track.scrollLeft = target;
    }
  };

  // One layout pass for both modes. revealActive: also bring the active pill
  // back into view (mount, dashboard list change, mode switch). A resize that
  // CHANGES THE WIDTH (rotation, split-screen) re-lays the track out and can
  // leave the active pill off-screen, so it re-centers too — but not the
  // height-only resizes mobile browsers fire while their toolbars animate,
  // where a re-center would yank a track the user just scrolled.
  measure = revealActive => {
    const scrollable = window.matchMedia ? window.matchMedia(DOCK_BREAKPOINT_QUERY).matches : false;
    const enteredScrollable = scrollable && !this.state.scrollable;
    const widthChanged = window.innerWidth !== this.lastMeasuredWidth;
    this.lastMeasuredWidth = window.innerWidth;
    this.setState({ scrollable, visibleCount: null, menuOpen: false }, () => {
      if (this.state.scrollable) {
        this.updateTrackState();
        if (revealActive || enteredScrollable || widthChanged) {
          this.scrollActiveIntoView(true);
        }
      } else {
        this.ensureRowFits();
      }
    });
  };

  scheduleMeasure = () => {
    // Coalesce resize bursts into one measure per frame
    if (this.measureScheduled) {
      return;
    }
    this.measureScheduled = true;
    requestAnimationFrame(() => {
      this.measureScheduled = false;
      this.measure();
    });
  };

  handleTrackScroll = () => {
    // Coalesce the continuous scroll stream: the state only changes when an
    // edge fade flips, so most frames are a cheap no-op
    if (this.trackScrollScheduled) {
      return;
    }
    this.trackScrollScheduled = true;
    requestAnimationFrame(() => {
      this.trackScrollScheduled = false;
      this.updateTrackState();
    });
  };

  toggleMenu = () => {
    this.setState(prevState => ({ menuOpen: !prevState.menuOpen }));
  };

  // The overflow menu closes like any menu: tap/click anywhere else, or
  // Escape. Without this, a wall tablet keeps the list open until another
  // dashboard is picked.
  handleDocumentPointerDown = event => {
    if (this.state.menuOpen && this.container && !this.container.contains(event.target)) {
      this.setState({ menuOpen: false });
    }
  };

  handleDocumentKeyDown = event => {
    if (event.key === 'Escape' && this.state.menuOpen) {
      this.setState({ menuOpen: false });
    }
  };

  selectDashboard = () => {
    this.setState({ menuOpen: false });
    if (this.props.redirectToDashboard) {
      this.props.redirectToDashboard();
    }
  };

  componentDidMount() {
    this.measure(true);
    window.addEventListener('resize', this.scheduleMeasure);
    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  componentDidUpdate(previousProps) {
    const previousSelector = previousProps.currentDashboard && previousProps.currentDashboard.selector;
    const currentSelector = this.props.currentDashboard && this.props.currentDashboard.selector;
    const listChanged =
      previousProps.dashboards !== this.props.dashboards || previousProps.tabletMode !== this.props.tabletMode;
    if (listChanged) {
      this.measure(true);
      return;
    }
    if (previousSelector === currentSelector) {
      return;
    }
    if (this.state.scrollable) {
      // The switch just re-rendered the pills but their widths settle with
      // THIS paint (the active pill regains its name): measure a frame later
      requestAnimationFrame(() => {
        this.updateTrackState();
        this.scrollActiveIntoView();
      });
    } else {
      // the active pill is wider (it keeps its name, the overflow button
      // grows when the active dashboard is collapsed): re-fit on switch
      this.measure();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.scheduleMeasure);
    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  }

  renderPill = (dashboard, index, activeIndex, hidden) => {
    const appearance = getTabAppearance(dashboard);
    return (
      <Link
        data-dashboard-pill
        data-active={index === activeIndex ? true : undefined}
        href={`/dashboard/${dashboard.selector}`}
        onClick={this.selectDashboard}
        class={cx(style.dashboardTab, {
          [style.dashboardTabActive]: index === activeIndex,
          'd-none': hidden
        })}
        title={dashboard.name}
      >
        <i class={`fe fe-${appearance.icon}`} />
        {!this.props.tabletMode && appearance.name && (
          <span class={style.dashboardTabName}>{wrapEmojisJSX(appearance.name)}</span>
        )}
      </Link>
    );
  };

  // The full named list: the only place every dashboard shows its complete
  // name, whatever the pills collapsed to
  renderMenu = activeIndex => (
    <div class={cx('dropdown-menu dropdown-menu-right', style.dashboardTabsMenu, { show: this.state.menuOpen })}>
      {this.props.dashboards.map((dashboard, index) => {
        const appearance = getTabAppearance(dashboard);
        return (
          <Link
            class={cx('dropdown-item', { active: index === activeIndex })}
            href={`/dashboard/${dashboard.selector}`}
            onClick={this.selectDashboard}
          >
            <i class={cx(`fe fe-${appearance.icon}`, style.dashboardTabsMenuIcon)} />
            {wrapEmojisJSX(appearance.name)}
          </Link>
        );
      })}
    </div>
  );

  render({ dashboards, currentDashboard, tabletMode }, { visibleCount, menuOpen, scrollable, trackOverflows }) {
    const activeIndex = currentDashboard ? dashboards.findIndex(d => d.selector === currentDashboard.selector) : -1;

    if (scrollable) {
      return (
        <div
          class={cx(style.dashboardTabs, style.dashboardTabsScrollable, {
            [style.dashboardTabsIconsOnly]: tabletMode
          })}
          ref={this.setContainerRef}
        >
          <div
            class={cx(style.dashboardTabsTrack, {
              [style.dashboardTabsTrackFadeStart]: this.state.fadeStart,
              [style.dashboardTabsTrackFadeEnd]: this.state.fadeEnd
            })}
            ref={this.setTrackRef}
            onScroll={this.handleTrackScroll}
          >
            {dashboards.map((dashboard, index) => this.renderPill(dashboard, index, activeIndex, false))}
          </div>
          {trackOverflows && (
            <div class={cx('dropdown', style.dashboardTabsOverflow)}>
              <Localizer>
                <button
                  type="button"
                  data-dashboard-overflow
                  class={style.dashboardTab}
                  onClick={this.toggleMenu}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? 'true' : 'false'}
                  title={<Text id="dashboard.allDashboardsButton" />}
                >
                  <i class="fe fe-list" />
                </button>
              </Localizer>
              {this.renderMenu(activeIndex)}
            </div>
          )}
        </div>
      );
    }

    const overflowing = visibleCount !== null;
    const activeCollapsed = overflowing && activeIndex >= visibleCount;
    const activeDashboard = activeIndex >= 0 ? dashboards[activeIndex] : null;
    const activeAppearance = activeDashboard && getTabAppearance(activeDashboard);
    return (
      <div
        class={cx(style.dashboardTabs, {
          [style.dashboardTabsIconsOnly]: tabletMode
        })}
        ref={this.setContainerRef}
      >
        {dashboards.map((dashboard, index) =>
          this.renderPill(dashboard, index, activeIndex, overflowing && index >= visibleCount)
        )}
        {overflowing && (
          <div class={cx('dropdown', style.dashboardTabsOverflow)}>
            <button
              type="button"
              data-dashboard-overflow
              class={cx(style.dashboardTab, {
                [style.dashboardTabActive]: activeCollapsed
              })}
              onClick={this.toggleMenu}
              aria-haspopup="true"
              aria-expanded={menuOpen ? 'true' : 'false'}
            >
              {activeCollapsed && activeDashboard ? (
                <>
                  <i class={`fe fe-${activeAppearance.icon}`} />
                  {!tabletMode && activeAppearance.name && (
                    <span class={style.dashboardTabName}>{wrapEmojisJSX(activeAppearance.name)}</span>
                  )}
                  <i class="fe fe-chevron-down" />
                </>
              ) : (
                <i class="fe fe-more-horizontal" />
              )}
            </button>
            {this.renderMenu(activeIndex)}
          </div>
        )}
      </div>
    );
  }
}

export default DashboardTabs;
