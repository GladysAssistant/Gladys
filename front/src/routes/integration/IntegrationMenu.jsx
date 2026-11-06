import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { getCatalogPath } from './catalog-url';
import style from './style.css';

// the chip row scrolls horizontally and holds every shelf: with sixteen of
// them, the active one is often off-screen and nothing on screen says which
// view is open. It is scrolled into view when needed — only when it is not
// fully visible, so a row the user scrolled by hand is left alone. The chip
// is found by the `data-active-chip` mark set from the displayed view, not
// by the router's active class, which is applied a render later; measured
// on the next frame, once the row is laid out
const scrollActiveChipIntoView = scroller => {
  if (!scroller || typeof requestAnimationFrame !== 'function') {
    return;
  }
  requestAnimationFrame(() => {
    const chip = scroller.isConnected && scroller.querySelector('[data-active-chip]');
    if (!chip || typeof chip.scrollIntoView !== 'function') {
      return;
    }
    const chipRect = chip.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    if (chipRect.left < scrollerRect.left || chipRect.right > scrollerRect.right) {
      chip.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  });
};

// the shelves of the row depend on the catalog (a shelf needs enough visible
// integrations to earn its chip): compared by key, since the list is rebuilt
// on every render of the page
const getShelvesKey = integrationCategories => integrationCategories.map(({ key }) => key).join(',');

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

export class IntegrationMenuMobile extends Component {
  setScroller = scroller => {
    this.scroller = scroller;
  };

  componentDidMount() {
    scrollActiveChipIntoView(this.scroller);
  }

  // the shelf chips only appear once the catalog is loaded: the active one
  // may not exist yet when the row mounts
  componentDidUpdate(prevProps) {
    if (
      prevProps.category !== this.props.category ||
      getShelvesKey(prevProps.integrationCategories) !== getShelvesKey(this.props.integrationCategories)
    ) {
      scrollActiveChipIntoView(this.scroller);
    }
  }

  render({ integrationCategories, integrationsToUpdate, installedIntegrationsCount, category }) {
    return (
      <nav class={style.mobileCategoryNav} aria-label="Integration categories">
        {/* hz-chips-scroll: the Layout watches this scroller and shows the
            "more to the right" arrow while chips overflow (horizonIntegrations.css) */}
        <div class={`${style.mobileCategoryScroll} hz-chips-scroll`} ref={this.setScroller}>
          {getMenuItems(integrationCategories, { integrationsToUpdate, installedIntegrationsCount, category }).map(
            item => (
              <Link
                key={item.href}
                href={item.href}
                class={style.mobileCategoryChip}
                activeClassName={style.mobileCategoryChipActive}
                data-active-chip={item.href === getCatalogPath(category) || undefined}
              >
                <i class={`fe fe-${item.icon}`} />
                <Text id={item.labelKey} />
                <MenuItemCount count={item.count} color={item.countColor} />
              </Link>
            )
          )}
        </div>
      </nav>
    );
  }
}

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
