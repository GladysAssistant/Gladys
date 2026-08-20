import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import config from '../../config';

import style from './style.css';
import dashboardStyle from '../dashboard/style.css';

const MENU_ITEMS = [
  { href: '/dashboard/settings/house', icon: 'home', textId: 'settings.housesTab' },
  { href: '/dashboard/settings/user', icon: 'user', textId: 'settings.usersTab', matchPrefix: true },
  { href: '/dashboard/settings/session', icon: 'smartphone', textId: 'settings.sessionsTab' },
  { href: '/dashboard/settings/gateway', icon: 'globe', textId: 'settings.gatewayTab' },
  { href: '/dashboard/settings/gateway-users', icon: 'user', textId: 'settings.gatewayUsersTab', gatewayOnly: true },
  {
    href: '/dashboard/settings/gateway-open-api',
    icon: 'globe',
    textId: 'settings.gatewayOpenApiTab',
    gatewayOnly: true
  },
  { href: '/dashboard/settings/billing', icon: 'credit-card', textId: 'settings.billingTab', gatewayOnly: true },
  { href: '/dashboard/settings/backup', icon: 'database', textId: 'settings.backupTab' },
  { href: '/dashboard/settings/jobs', icon: 'cpu', textId: 'settings.jobsTab' },
  { href: '/dashboard/settings/service', icon: 'grid', textId: 'settings.serviceTab' },
  { href: '/dashboard/settings/system', icon: 'power', textId: 'settings.systemTab' }
];

// The settings live on the same Horizon glass scene as the dashboard: the
// global .glass-theme class gates the shared theme layer (cards, alerts,
// badges, buttons), .settings-page scopes the settings-only pass (style.css
// next to this file), and the wallpaper reuses the dashboard's default scene.
const DashboardSettings = ({ children, ...props }) => (
  <div class="page">
    <div
      class={cx(
        'page-main',
        'glass-theme',
        'settings-page',
        dashboardStyle.dashboardBackground,
        dashboardStyle.glassScene
      )}
    >
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class={cx('page-title', 'mb-4', style.settingsTitle)}>
                <Text id="settings.title" />
              </h3>
              <div class={cx(style.settingsMenu, 'mb-4')}>
                {MENU_ITEMS.filter(item => !item.gatewayOnly || config.gatewayMode).map(item => (
                  <Link
                    href={item.href}
                    activeClassName={style.menuLinkActive}
                    class={cx(style.menuLink, {
                      [style.menuLinkActive]:
                        item.matchPrefix && props.currentUrl && props.currentUrl.startsWith(item.href)
                    })}
                  >
                    <span class={style.menuIcon}>
                      <i class={`fe fe-${item.icon}`} />
                    </span>
                    <Text id={item.textId} />
                  </Link>
                ))}
              </div>
            </div>

            <div class="col-lg-9">{children}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardSettings;
