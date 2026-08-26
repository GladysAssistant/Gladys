import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import config from '../../config';
import { USER_ROLE } from '../../../../server/utils/constants';

import style from './style.css';
import dashboardStyle from '../dashboard/style.css';

const MENU_ITEMS = [
  { href: '/dashboard/settings/house', icon: 'home', textId: 'settings.housesTab' },
  { href: '/dashboard/settings/user', icon: 'user', textId: 'settings.usersTab', matchPrefix: true },
  { href: '/dashboard/settings/session', icon: 'smartphone', textId: 'settings.sessionsTab' },
  { href: '/dashboard/settings/security', icon: 'shield', textId: 'settings.securityTab', gatewayOnly: true },
  { href: '/dashboard/settings/gateway', icon: 'globe', textId: 'settings.gatewayTab', adminOnly: true },
  { href: '/dashboard/settings/gateway-users', icon: 'user', textId: 'settings.gatewayUsersTab', gatewayOnly: true },
  {
    href: '/dashboard/settings/gateway-open-api',
    icon: 'globe',
    textId: 'settings.gatewayOpenApiTab',
    gatewayOnly: true
  },
  { href: '/dashboard/settings/billing', icon: 'credit-card', textId: 'settings.billingTab', gatewayOnly: true },
  { href: '/dashboard/settings/backup', icon: 'database', textId: 'settings.backupTab', adminOnly: true },
  { href: '/dashboard/settings/jobs', icon: 'cpu', textId: 'settings.jobsTab', adminOnly: true },
  { href: '/dashboard/settings/service', icon: 'grid', textId: 'settings.serviceTab' },
  { href: '/dashboard/settings/system', icon: 'power', textId: 'settings.systemTab', adminOnly: true }
];

// `adminOnly` marks the tabs whose API is reserved to admins: the system
// settings and the backup key are instance-wide, the Gladys Plus status and the
// background jobs are admin routes of their own. A non-admin used to reach them
// and land on error states. Hiding the entry mirrors the app nav
// (components/header), the server stays the authority on a deep link.
// The settings live on the same Horizon glass scene as the dashboard: the
// global .glass-theme class gates the shared theme layer (cards, alerts,
// badges, buttons), .settings-page scopes the settings-only pass (style.css
// next to this file), and the wallpaper reuses the dashboard's default scene.
// Navigation is a horizontal frosted pill row (the dashboard switcher's
// grammar) — with the app nav in the left rail, a second vertical menu was
// redundant and cost a quarter of the content width. Labels are kept at
// every width (several entries share an icon), the row simply wraps.
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
      {/* padding, not margin: a top margin collapses through the glass
          page-main and shifts the scene down (same move as new-dashboard) */}
      <div class="py-3 py-md-5">
        <div class="container">
          <h3 class={cx('page-title', 'mb-3', style.settingsTitle)}>
            <Text id="settings.title" />
          </h3>
          <div class={style.settingsTabs}>
            {MENU_ITEMS.filter(
              item =>
                (!item.gatewayOnly || config.gatewayMode) &&
                (!item.adminOnly || (props.user && props.user.role === USER_ROLE.ADMIN))
            ).map(item => (
              <Link
                key={item.href}
                href={item.href}
                activeClassName={style.tabLinkActive}
                class={cx(style.tabLink, {
                  [style.tabLinkActive]: item.matchPrefix && props.currentUrl && props.currentUrl.startsWith(item.href)
                })}
              >
                <i class={`fe fe-${item.icon}`} />
                <span>
                  <Text id={item.textId} />
                </span>
              </Link>
            ))}
          </div>

          {children}
        </div>
      </div>
    </div>
  </div>
);

// connected rather than fed by its callers: the layout is rendered from sixteen
// settings pages, none of which pass the user down
export default connect('user', {})(DashboardSettings);
