import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import style from './style.css';

const getMenuItems = (
  integrationCategories,
  { integrationsToUpdate = 0, installedIntegrationsCount = 0, category } = {}
) => [
  { href: '/dashboard/integration', icon: 'hash', labelKey: 'integration.root.menu.all' },
  { href: '/dashboard/integration/favorites', icon: 'star', labelKey: 'integration.root.menu.favorites' },
  // "what actually runs on this instance": community integrations are the
  // only ones that are installed on the instance rather than shipped with
  // Gladys, so the entry only exists once there is at least one of them.
  // Like "To update", it stays visible while being the displayed view so it
  // does not vanish under the user who just uninstalled the last one.
  ...(installedIntegrationsCount > 0 || category === 'installed'
    ? [
        {
          href: '/dashboard/integration/installed',
          icon: 'box',
          labelKey: 'integration.root.menu.installed',
          count: installedIntegrationsCount,
          // neutral: the count is an inventory, not something to fix
          countColor: 'secondary'
        }
      ]
    : []),
  // the entry only shows up when there is something to update: an always
  // visible "Updates (0)" would be noise on the vast majority of instances.
  // It stays visible while being displayed, so it does not vanish under the
  // user right after they updated the last integration.
  ...(integrationsToUpdate > 0 || category === 'updates'
    ? [
        {
          href: '/dashboard/integration/updates',
          icon: 'arrow-up-circle',
          labelKey: 'integration.root.menu.updates',
          count: integrationsToUpdate
        }
      ]
    : []),
  ...integrationCategories.map(integrationCategory => ({
    href: `/dashboard/integration/${integrationCategory.key}`,
    icon: integrationCategory.icon,
    labelKey: `integration.root.menu.${integrationCategory.key}`
  }))
];

const MenuItemCount = ({ count, color = 'danger', className = '' }) =>
  count > 0 ? <span class={`badge badge-${color} ${className}`.trim()}>{count}</span> : null;

export const IntegrationMenuMobile = ({
  integrationCategories,
  integrationsToUpdate,
  installedIntegrationsCount,
  category
}) => (
  <nav class={style.mobileCategoryNav} aria-label="Integration categories">
    <div class={style.mobileCategoryScroll}>
      {getMenuItems(integrationCategories, { integrationsToUpdate, installedIntegrationsCount, category }).map(item => (
        <Link
          key={item.href}
          href={item.href}
          class={style.mobileCategoryChip}
          activeClassName={style.mobileCategoryChipActive}
        >
          <i class={`fe fe-${item.icon}`} />
          <Text id={item.labelKey} />
          <MenuItemCount count={item.count} color={item.countColor} />
        </Link>
      ))}
    </div>
  </nav>
);

const IntegrationMenu = ({ integrationCategories, integrationsToUpdate, installedIntegrationsCount, category }) => (
  <div class="list-group list-group-transparent mb-0">
    {getMenuItems(integrationCategories, { integrationsToUpdate, installedIntegrationsCount, category }).map(item => (
      <Link
        key={item.href}
        href={item.href}
        activeClassName="active"
        class="list-group-item list-group-item-action d-flex align-items-center"
      >
        <span class="icon mr-3">
          <i class={`fe fe-${item.icon}`} />
        </span>
        <Text id={item.labelKey} />
        <MenuItemCount count={item.count} color={item.countColor} className="ml-auto" />
      </Link>
    ))}
  </div>
);

export default IntegrationMenu;
