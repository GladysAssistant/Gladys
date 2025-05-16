import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const IntegrationMenu = ({ integrationCategories }) => {
  return (
    <div class="list-group list-group-transparent mb-0">
      <Link
        activeClassName="active"
        href="/dashboard/integration"
        class="list-group-item list-group-item-action d-flex align-items-center"
      >
        <span class="icon mr-3">
          <i class="fe fe-hash" />
        </span>
        <Text id="integration.root.menu.all" />
      </Link>
      {integrationCategories.map(category => (
        <Link
          activeClassName="active"
          href={`/dashboard/integration/${category.type}`}
          class="list-group-item list-group-item-action d-flex align-items-center"
        >
          <span class="icon mr-3">
            <i class={`fe fe-${category.icon}`} />
          </span>
          <Text id={`integration.root.menu.${category.type}`} />
        </Link>
      ))}
    </div>
  );
};

export default IntegrationMenu;
