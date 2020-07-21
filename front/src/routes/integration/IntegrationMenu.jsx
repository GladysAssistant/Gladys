import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import actions from '../../actions/integration';

const IntegrationMenu = connect(
  'integrationCategories',
  actions
)(({ integrationCategories, getIntegrationByCategory }) => {
  const refreshIntegrations = category => () => getIntegrationByCategory(category);

  return (
    <div class="list-group list-group-transparent mb-0">
      <Link
        activeClassName="active"
        onClick={refreshIntegrations(null)}
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
          onClick={refreshIntegrations(category.type)}
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
});

export default IntegrationMenu;
