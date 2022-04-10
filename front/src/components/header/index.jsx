import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router/match';
import { isUrlInArray } from '../../utils/url';
import { USER_ROLE } from '../../../../server/utils/constants';

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
  '/dashboard/integration/device/google-home/authorize'
];

const Header = ({ ...props }) => {
  if (isUrlInArray(props.currentUrl, PAGES_WITHOUT_HEADER)) {
    return null;
  }
  if (props.fullScreen) {
    return null;
  }
  return (
    <div>
      <div class="header py-4">
        <div class="container">
          <div class="d-flex">
            <a class="header-brand" href="/dashboard">
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
            <div class="d-flex order-lg-2 ml-auto">
              <div class={cx('dropdown', { show: props.showDropDown })}>
                <a onClick={props.toggleDropDown} class="nav-link pr-0 leading-none" data-toggle="dropdown">
                  <span class="avatar" style={`background-image: url(${props.profilePicture})`} />
                  <span class="ml-2 d-none d-lg-block">
                    <span class="text-default">{props.user.firstname}</span>
                    <small class="text-muted d-block mt-1">
                      {props.user.role === USER_ROLE.ADMIN && <Text id="profile.adminRole" />}
                      {props.user.role !== USER_ROLE.ADMIN && <Text id="profile.userRole" />}
                    </small>
                  </span>
                </a>
                <div
                  class={cx('dropdown-menu', 'dropdown-menu-right', 'dropdown-menu-arrow', {
                    show: props.showDropDown
                  })}
                >
                  <a class="dropdown-item" href="/dashboard/profile">
                    <i class="dropdown-icon ti ti-user" /> <Text id="header.profile" />
                  </a>
                  {props.user.role === USER_ROLE.ADMIN && (
                    <a class="dropdown-item" href="/dashboard/settings/house">
                      <i class="dropdown-icon ti ti-settings" /> <Text id="header.settings" />
                    </a>
                  )}
                  <div class="dropdown-divider" />
                  <a
                    class="dropdown-item"
                    href="https://community.gladysassistant.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i class="dropdown-icon ti ti-help" /> <Text id="header.needHelp" />
                  </a>
                  <a class="dropdown-item" href="" onClick={props.logout}>
                    <i class="dropdown-icon ti ti-logout" /> <Text id="header.signOut" />
                  </a>
                </div>
              </div>
            </div>
            <a
              class="header-toggler d-lg-none ml-3 ml-lg-0"
              data-toggle="collapse"
              data-target="#headerMenuCollapse"
              onClick={props.toggleCollapsedMenu}
            >
              <span class="header-toggler-icon" />
            </a>
          </div>
        </div>
      </div>
      <div
        class={cx('header', 'collapse', 'd-lg-flex', 'p-0', { show: props.showCollapsedMenu })}
        id="headerMenuCollapse"
      >
        <div class="container">
          <div class="row align-items-center">
            <div class="col-lg order-lg-first">
              <ul class="nav nav-tabs border-0 flex-column flex-lg-row">
                <li class="nav-item">
                  <Link
                    href="/dashboard"
                    class={cx('nav-link', {
                      active: props.currentUrl === '/dashboard'
                    })}
                  >
                    <i class="ti ti-home" /> <Text id="header.home" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link
                    href="/dashboard/chat"
                    class={cx('nav-link', {
                      active: props.currentUrl === '/dashboard/chat'
                    })}
                  >
                    <i class="ti ti-message" /> <Text id="header.chat" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link
                    href="/dashboard/integration"
                    class={props.currentUrl.startsWith('/dashboard/integration') ? 'active nav-link' : 'nav-link'}
                  >
                    <i class="ti ti-layout-grid" /> <Text id="header.integrations" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link
                    href="/dashboard/calendar"
                    class={cx('nav-link', {
                      active: props.currentUrl === '/dashboard/calendar'
                    })}
                  >
                    <i class="ti ti-calendar" /> <Text id="header.calendar" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link
                    activeClassName="active"
                    href="/dashboard/maps"
                    class={cx('nav-link', {
                      active: props.currentUrl === '/dashboard/maps'
                    })}
                  >
                    <i class="ti ti-map" /> <Text id="header.maps" />
                  </Link>
                </li>
                {props.user.role === USER_ROLE.ADMIN && (
                  <li class="nav-item">
                    <Link
                      href="/dashboard/scene"
                      class={props.currentUrl.startsWith('/dashboard/scene') ? 'active nav-link' : 'nav-link'}
                    >
                      <i class="ti ti-player-play" /> <Text id="header.scenes" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
