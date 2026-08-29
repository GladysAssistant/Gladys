import { Component, createRef } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { Link } from 'preact-router/match';
import { isUrlInArray } from '../../utils/url';
import { USER_ROLE } from '../../../../server/utils/constants';
import DarkModeToggle from '../darkmode/DarkModeToggle';
import GatewayTrialIndicator from './GatewayTrialIndicator';
import InstanceUpdateNotice from './InstanceUpdateNotice';
import { isInstanceBehindFront, isUpdateNoticeDismissed } from '../../utils/instanceVersion';
import style from './style.css';

const PAGES_WITHOUT_HEADER = [
  '/login',
  '/signup',
  '/signup/create-account-local',
  '/signup/create-account-gladys-gateway',
  '/signup/preference',
  '/signup/configure-house',
  '/signup/success',
  '/forgot-password',
  '/reset-password',
  '/link-gateway-user',
  '/signup-gateway',
  '/subscribe-gateway',
  '/gateway-configure-two-factor',
  '/confirm-email',
  '/dashboard/integration/device/google-home/authorize',
  '/dashboard/integration/device/alexa/authorize',
  '/locked'
];

// /dashboard/<selector> is a dashboard view, but the same position in the URL
// also carries the app sections below: only a segment that is none of them
// (nor an admin page) is a dashboard selector
const NON_DASHBOARD_SECTIONS = [
  'history',
  'chat',
  'devices',
  'integration',
  'calendar',
  'maps',
  'scene',
  'profile',
  'settings',
  'create'
];

const isDashboardView = url => {
  if (url === '/dashboard') {
    return true;
  }
  if (!url.startsWith('/dashboard/')) {
    return false;
  }
  return !NON_DASHBOARD_SECTIONS.includes(url.split('/')[2]);
};

// App-level navigation, in the left sidebar: the top of the screen stays
// free for the current page — on dashboards, for the dashboard switcher
const NAV_ITEMS = [
  { href: '/dashboard', icon: 'home', labelKey: 'header.home', isActive: isDashboardView },
  {
    href: '/dashboard/history',
    icon: 'clock',
    labelKey: 'header.history',
    isActive: url => url === '/dashboard/history'
  },
  {
    href: '/dashboard/chat',
    icon: 'message-square',
    labelKey: 'header.chat',
    isActive: url => url === '/dashboard/chat'
  },
  {
    href: '/dashboard/devices',
    icon: 'toggle-right',
    labelKey: 'header.devices',
    isActive: url => url === '/dashboard/devices'
  },
  {
    href: '/dashboard/integration',
    icon: 'grid',
    labelKey: 'header.integrations',
    isActive: url => url.startsWith('/dashboard/integration'),
    withUpdatesBadge: true
  },
  {
    href: '/dashboard/calendar',
    icon: 'calendar',
    labelKey: 'header.calendar',
    isActive: url => url === '/dashboard/calendar'
  },
  {
    href: '/dashboard/maps',
    icon: 'map',
    labelKey: 'header.maps',
    // nested area pages (/maps/area/new, /maps/area/edit/:selector) belong here
    isActive: url => url.startsWith('/dashboard/maps')
  },
  {
    href: '/dashboard/scene',
    icon: 'play',
    labelKey: 'header.scenes',
    isActive: url => url.startsWith('/dashboard/scene'),
    adminOnly: true
  }
];

class Header extends Component {
  dropdownRef = createRef(null);

  handleClickOutside = e => {
    if (this.dropdownRef.current && !this.dropdownRef.current.contains(e.target)) {
      this.props.closeDropDown();
    }
  };

  // The open mobile drawer covers the page: Escape must give it back, as it
  // does for any other overlay. Only relevant while that drawer is open — on
  // desktop the rail (expanded or collapsed) is part of the layout, never an
  // overlay, so Escape means nothing to it.
  handleKeyDown = e => {
    if (e.key === 'Escape' && this.props.showCollapsedMenu) {
      this.props.toggleCollapsedMenu();
    }
  };

  isHidden = () => isUrlInArray(this.props.currentUrl, PAGES_WITHOUT_HEADER) || this.props.fullScreen;

  // the dismissal is written to localStorage by the notice itself: this only
  // forces the re-render that reads it back, hiding the notice and the
  // mobile dot echoing it in the same pass
  handleInstanceNoticeDismiss = () => {
    this.setState({});
  };

  // The instance version is normally loaded at session check, but a
  // client-side login never gets there: /login is an open page checkSession
  // returns early from, and finishing the login routes here without
  // remounting the app. The header is the consumer of the version, so it
  // asks for it whenever it renders for a signed-in user — the action guards
  // itself (gateway mode only, settled marker, one call a minute), so these
  // calls are almost always a no-op, and double as the retry path when the
  // instance was unreachable on the first attempt.
  maybeRefreshInstanceVersion = () => {
    if (!this.isHidden() && this.props.user && this.props.user.id) {
      this.props.refreshInstanceVersionState();
    }
  };

  // Content offsets (style/index.css) key off these body classes so they
  // vanish together with the sidebar on auth pages and in fullscreen mode.
  // The second one is the collapsed rail: the page then keeps only the slim
  // gutter the expand button sits in, instead of a full rail-wide column.
  syncBodyClass = () => {
    const visible = !this.isHidden();
    document.body.classList.toggle('gladys-sidebar-nav', visible);
    document.body.classList.toggle('gladys-sidebar-collapsed', visible && Boolean(this.props.sidebarCollapsed));
  };

  constructor(props) {
    super(props);
    // before the first paint, not only in componentDidMount: the content
    // offsets must be present on the very first frame, or the rail overlays
    // the page for an instant and then everything jumps into place
    this.syncBodyClass();
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('keydown', this.handleKeyDown);
    this.syncBodyClass();
    this.maybeRefreshInstanceVersion();
  }

  componentDidUpdate() {
    this.syncBodyClass();
    this.maybeRefreshInstanceVersion();
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.classList.remove('gladys-sidebar-nav');
    document.body.classList.remove('gladys-sidebar-collapsed');
  }

  render(props) {
    if (this.isHidden()) {
      return null;
    }
    // Adapt forum URL to user language
    const userLanguage = get(props, 'user.language');
    const forumUrl =
      userLanguage === 'fr' ? 'https://community.gladysassistant.com/' : 'https://community.gladysassistant.com/';
    const showInstanceUpdateNotice =
      isInstanceBehindFront(props.instanceGladysVersion) && !isUpdateNoticeDismissed(props.instanceGladysVersion);

    return (
      <div>
        <div class={cx(style.mobileTopBar, 'd-lg-none')}>
          <Localizer>
            <button
              type="button"
              class={style.mobileToggler}
              onClick={props.toggleCollapsedMenu}
              data-cy="sidebar-toggler"
              aria-label={<Text id="header.openMenu" />}
              aria-expanded={props.showCollapsedMenu ? 'true' : 'false'}
              aria-controls="sidebar-navigation"
            >
              <i class="fe fe-menu" />
              {/* on mobile the notice lives in the closed menu: this dot is
                  what tells the user there is something to open it for. Screen
                  readers get the notice content itself, in the menu. */}
              {showInstanceUpdateNotice && <span class={style.togglerDot} aria-hidden="true" />}
            </button>
          </Localizer>
          <a class={style.mobileBrand} href="/dashboard">
            <Localizer>
              <img src="/assets/icons/favicon-96x96.png" class="header-brand-img" alt={<Text id="global.logoAlt" />} />
            </Localizer>
            <span>
              <Text id="header.gladysAssistant" />
            </span>
          </a>
          <DarkModeToggle />
        </div>
        {/* Collapsed rail on desktop: this floating button, alone in the slim
            gutter the page keeps on the left, expands it back — into the
            docked rail, never an overlay. No top bar up here: a full-width
            one would cost every page a row, and width is exactly what
            collapsing is for. */}
        {props.sidebarCollapsed && (
          <Localizer>
            <button
              type="button"
              class={style.expandButton}
              onClick={props.toggleSidebarCollapsed}
              data-cy="sidebar-expand-button"
              aria-label={<Text id="header.expandMenu" />}
              aria-expanded="false"
              aria-controls="sidebar-navigation"
            >
              <i class="fe fe-menu" />
              {showInstanceUpdateNotice && <span class={style.togglerDot} aria-hidden="true" />}
            </button>
          </Localizer>
        )}
        {props.showCollapsedMenu && (
          <div class={cx(style.sidebarBackdrop, 'd-lg-none')} onClick={props.toggleCollapsedMenu} />
        )}
        <nav
          id="sidebar-navigation"
          class={cx(style.sidebar, { [style.sidebarOpen]: props.showCollapsedMenu })}
          data-cy="sidebar-nav"
        >
          <div class={style.sidebarHeader}>
            <a class={style.sidebarBrand} href="/dashboard">
              <Localizer>
                <img
                  src="/assets/icons/favicon-96x96.png"
                  class="header-brand-img"
                  alt={<Text id="global.logoAlt" />}
                />
              </Localizer>
              <span id="header-title">
                <Text id="header.gladysAssistant" />
              </span>
            </a>
            {/* Collapse, desktop only (the rail is an on-demand drawer below
                the breakpoint, where this button is hidden by CSS). Only ever
                seen expanded — collapsed, the whole rail is off-screen and
                the floating expand button takes over. */}
            <Localizer>
              <button
                type="button"
                class={style.collapseButton}
                onClick={props.toggleSidebarCollapsed}
                data-cy="sidebar-collapse-button"
                title={<Text id="header.collapseMenu" />}
                aria-label={<Text id="header.collapseMenu" />}
              >
                <i class="fe fe-chevron-left" />
              </button>
            </Localizer>
          </div>
          <ul class={style.sidebarNav}>
            {NAV_ITEMS.filter(item => !item.adminOnly || props.user.role === USER_ROLE.ADMIN).map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  class={cx(style.navLink, {
                    [style.navLinkActive]: item.isActive(props.currentUrl)
                  })}
                >
                  <i class={cx(`fe fe-${item.icon}`, style.navIcon)} />
                  <span>
                    <Text id={item.labelKey} />
                  </span>
                  {item.withUpdatesBadge && props.externalIntegrationsToUpdate > 0 && (
                    <Localizer>
                      <span
                        class={cx('badge badge-danger', style.navBadge)}
                        title={
                          <Text
                            id="header.integrationsToUpdate"
                            fields={{ count: props.externalIntegrationsToUpdate }}
                          />
                        }
                        aria-label={
                          <Text
                            id="header.integrationsToUpdate"
                            fields={{ count: props.externalIntegrationsToUpdate }}
                          />
                        }
                      >
                        {props.externalIntegrationsToUpdate}
                      </span>
                    </Localizer>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {showInstanceUpdateNotice && (
            <InstanceUpdateNotice
              instanceVersion={props.instanceGladysVersion}
              user={props.user}
              refreshInstanceVersionState={props.refreshInstanceVersionState}
              onDismiss={this.handleInstanceNoticeDismiss}
            />
          )}
          {Number.isInteger(props.gatewayTrialDaysLeft) && (
            <GatewayTrialIndicator
              daysLeft={props.gatewayTrialDaysLeft}
              hasPaymentMethod={props.gatewayTrialHasPaymentMethod}
              stripePortalKey={props.gatewayTrialStripePortalKey}
              session={props.session}
              refreshGatewayTrialState={props.refreshGatewayTrialState}
            />
          )}
          <div class={cx('dropdown', style.sidebarFooter, { show: props.showDropDown })} ref={this.dropdownRef}>
            <a onClick={props.toggleDropDown} class={style.profileButton} data-toggle="dropdown">
              <span class="avatar" style={`background-image: url(${props.profilePicture})`} />
              <span class={style.profileName}>
                <span>{props.user.firstname}</span>
                <small>
                  {props.user.role === USER_ROLE.ADMIN && <Text id="profile.adminRole" />}
                  {props.user.role !== USER_ROLE.ADMIN && <Text id="profile.userRole" />}
                </small>
              </span>
            </a>
            <DarkModeToggle />
            <div class={cx('dropdown-menu', style.profileMenu, { show: props.showDropDown })}>
              <a class="dropdown-item" href="/dashboard/profile">
                <i class="dropdown-icon fe fe-user" /> <Text id="header.profile" />
              </a>
              {props.user.role === USER_ROLE.ADMIN && (
                <a class="dropdown-item" href="/dashboard/settings/house">
                  <i class="dropdown-icon fe fe-settings" /> <Text id="header.settings" />
                </a>
              )}
              <div class="dropdown-divider" />
              <a class="dropdown-item" href={forumUrl} target="_blank" rel="noopener noreferrer">
                <i class="dropdown-icon fe fe-help-circle" /> <Text id="header.needHelp" />
              </a>
              <a class="dropdown-item" href="" onClick={props.logout}>
                <i class="dropdown-icon fe fe-log-out" /> <Text id="header.signOut" />
              </a>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

export default Header;
