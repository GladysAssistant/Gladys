import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import { splitLeadingEmoji, wrapEmojisJSX } from '../../utils/emojiWrapper';
import style from './style.css';

// The icon is often all that identifies a pill (tablet dock, collapsed
// mobile pills), and dashboards created before icons existed all fall back
// to the same house glyph. Many of them carry the distinguishing mark in
// the name instead — a leading emoji — so use it as the icon and take it
// out of the pill name so it doesn't show twice.
const getTabAppearance = dashboard => {
  if (dashboard.icon) {
    return { icon: dashboard.icon, emoji: null, name: dashboard.name };
  }
  const { emoji, rest } = splitLeadingEmoji(dashboard.name);
  if (emoji) {
    return { icon: null, emoji, name: rest };
  }
  return { icon: 'home', emoji: null, name: dashboard.name };
};

const TabGlyph = ({ icon, emoji, class: extraClass }) =>
  emoji ? (
    <span class={cx(style.dashboardTabEmoji, 'emoji-no-invert', extraClass)}>{emoji}</span>
  ) : (
    <i class={cx('fe', `fe-${icon}`, extraClass)} />
  );

// "Priority+" navigation: a single row of one-tap pills in dashboard order —
// the order the user already controls in the edit view — and everything that
// doesn't fit collapses behind a trailing "…" button opening the full list.
// When the current dashboard is one of the collapsed ones, the button shows it.
class DashboardTabs extends Component {
  state = {
    // null = render everything (also the measuring state)
    visibleCount: null,
    menuOpen: false
  };

  setContainerRef = element => {
    this.container = element;
  };

  // Collapse pills one by one until everything visible — the "…" button
  // included — sits on the first row
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

  measure = () => {
    this.setState({ visibleCount: null, menuOpen: false }, this.ensureRowFits);
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
    this.measure();
    window.addEventListener('resize', this.scheduleMeasure);
    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  componentDidUpdate(previousProps) {
    const previousSelector = previousProps.currentDashboard && previousProps.currentDashboard.selector;
    const currentSelector = this.props.currentDashboard && this.props.currentDashboard.selector;
    if (
      previousProps.dashboards !== this.props.dashboards ||
      previousProps.tabletMode !== this.props.tabletMode ||
      // the active pill is wider (it keeps its name on mobile, the overflow
      // button grows when the active dashboard is collapsed): re-fit on switch
      previousSelector !== currentSelector
    ) {
      this.measure();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.scheduleMeasure);
    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  }

  render({ dashboards, currentDashboard, tabletMode }, { visibleCount, menuOpen }) {
    const activeIndex = currentDashboard ? dashboards.findIndex(d => d.selector === currentDashboard.selector) : -1;
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
        {dashboards.map((dashboard, index) => {
          const appearance = getTabAppearance(dashboard);
          return (
            <Link
              data-dashboard-pill
              href={`/dashboard/${dashboard.selector}`}
              onClick={this.selectDashboard}
              class={cx(style.dashboardTab, {
                [style.dashboardTabActive]: index === activeIndex,
                'd-none': overflowing && index >= visibleCount
              })}
              title={dashboard.name}
            >
              <TabGlyph icon={appearance.icon} emoji={appearance.emoji} />
              {!tabletMode && appearance.name && (
                <span class={style.dashboardTabName}>{wrapEmojisJSX(appearance.name)}</span>
              )}
            </Link>
          );
        })}
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
                  <TabGlyph icon={activeAppearance.icon} emoji={activeAppearance.emoji} />
                  {!tabletMode && activeAppearance.name && (
                    <span class={style.dashboardTabName}>{wrapEmojisJSX(activeAppearance.name)}</span>
                  )}
                  <i class="fe fe-chevron-down" />
                </>
              ) : (
                <i class="fe fe-more-horizontal" />
              )}
            </button>
            <div class={cx('dropdown-menu dropdown-menu-right', style.dashboardTabsMenu, { show: menuOpen })}>
              {dashboards.map((dashboard, index) => {
                const appearance = getTabAppearance(dashboard);
                return (
                  <Link
                    class={cx('dropdown-item', { active: index === activeIndex })}
                    href={`/dashboard/${dashboard.selector}`}
                    onClick={this.selectDashboard}
                  >
                    <TabGlyph icon={appearance.icon} emoji={appearance.emoji} class={style.dashboardTabsMenuIcon} />
                    {wrapEmojisJSX(appearance.name)}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default DashboardTabs;
