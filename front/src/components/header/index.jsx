import { Text } from 'preact-i18n';
import { h } from 'preact';
import { Link } from 'preact-router/match';
import { isUrlInArray } from '../../utils/url';

const PAGES_WITHOUT_HEADER = [
  '/login',
  '/signup',
  '/signup/create-account-local',
  '/signup/create-account-gladys-gateway',
  '/signup/preference',
  '/signup/configure-house',
  '/signup/success',
  '/forgot-password',
  '/reset-password'
];

const Header = ({ ...props }) => {
  if (isUrlInArray(props.currentUrl, PAGES_WITHOUT_HEADER)) {
    return null;
  }
  return (
    <div>
      <div class="header py-4">
        <div class="container">
          <div class="d-flex">
            <a class="header-brand" href="/dashboard">
              <img src="/assets/icons/favicon-96x96.png" class="header-brand-img" alt="Gladys logo" />
              <span id="header-title">
                <Text id="header.gladysAssistant" />
              </span>
            </a>
            <div class="d-flex order-lg-2 ml-auto">
              <div class={'dropdown' + (props.showDropDown && ' show')}>
                <a onClick={props.toggleDropDown} class="nav-link pr-0 leading-none" data-toggle="dropdown">
                  <span class="avatar" style={`background-image: url(${props.profilePicture})`} />
                  <span class="ml-2 d-none d-lg-block">
                    <span class="text-default">{props.user.firstname}</span>
                    <small class="text-muted d-block mt-1">
                      {props.user.role === 'admin' ? 'Administrator' : 'User'}
                    </small>
                  </span>
                </a>
                <div class={'dropdown-menu dropdown-menu-right dropdown-menu-arrow' + (props.showDropDown && ' show')}>
                  <a class="dropdown-item" href="/dashboard/profile">
                    <i class="dropdown-icon fe fe-user" /> <Text id="header.profile" />
                  </a>
                  <a class="dropdown-item" href="/dashboard/settings/house">
                    <i class="dropdown-icon fe fe-settings" /> <Text id="header.settings" />
                  </a>
                  <div class="dropdown-divider" />
                  <a class="dropdown-item" href="https://community.gladysassistant.com/">
                    <i class="dropdown-icon fe fe-help-circle" /> <Text id="header.needHelp" />
                  </a>
                  <a class="dropdown-item" href="" onClick={props.logout}>
                    <i class="dropdown-icon fe fe-log-out" /> <Text id="header.signOut" />
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
      <div class={'header collapse d-lg-flex p-0 ' + (props.showCollapsedMenu && ' show')} id="headerMenuCollapse">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-lg order-lg-first">
              <ul class="nav nav-tabs border-0 flex-column flex-lg-row">
                <li class="nav-item">
                  <Link activeClassName="active" href="/dashboard" class="nav-link">
                    <i class="fe fe-home" /> <Text id="header.home" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link activeClassName="active" href="/dashboard/chat" class="nav-link">
                    <i class="fe fe-message-square" /> <Text id="header.chat" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link activeClassName="active" href="/dashboard/device" class="nav-link">
                    <i class="fe fe-toggle-right" /> <Text id="header.devices" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link
                    href="/dashboard/integration/device"
                    class={props.currentUrl.startsWith('/dashboard/integration') ? 'active nav-link' : 'nav-link'}
                  >
                    <i class="fe fe-grid" /> <Text id="header.integrations" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link activeClassName="active" href="/dashboard/calendar" class="nav-link">
                    <i class="fe fe-calendar" /> <Text id="header.calendar" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link activeClassName="active" href="/dashboard/maps" class="nav-link">
                    <i class="fe fe-map" /> <Text id="header.maps" />
                  </Link>
                </li>
                <li class="nav-item">
                  <Link
                    href="/dashboard/scene"
                    class={props.currentUrl.startsWith('/dashboard/scene') ? 'active nav-link' : 'nav-link'}
                  >
                    <i class="fe fe-play" /> <Text id="header.scenes" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
