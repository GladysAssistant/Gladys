import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import style from './style.css';

const getMenuItems = integrationCategories => [
  { href: '/dashboard/integration', icon: 'hash', labelKey: 'integration.root.menu.all' },
  { href: '/dashboard/integration/favorites', icon: 'star', labelKey: 'integration.root.menu.favorites' },
  ...integrationCategories.map(category => ({
    href: `/dashboard/integration/${category.type}`,
    icon: category.icon,
    labelKey: `integration.root.menu.${category.type}`
  }))
];

export const IntegrationMenuMobile = ({ integrationCategories }) => (
  <nav class={style.mobileCategoryNav} aria-label="Integration categories">
    <div class={style.mobileCategoryScroll}>
      {getMenuItems(integrationCategories).map(item => (
        <Link
          key={item.href}
          href={item.href}
          class={style.mobileCategoryChip}
          activeClassName={style.mobileCategoryChipActive}
        >
          <i class={`fe fe-${item.icon}`} />
          <Text id={item.labelKey} />
        </Link>
      ))}
    </div>
  </nav>
);

const IntegrationMenu = ({ integrationCategories }) => (
  <div class="list-group list-group-transparent mb-0">
    {getMenuItems(integrationCategories).map(item => (
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
      </Link>
    ))}
  </div>
);

export default IntegrationMenu;
