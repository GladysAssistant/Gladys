import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import actions from '../../actions/integration';

const IntegrationMenu = connect(
  'integrations',
  actions
)(({ getIntegrationByCategory }) => {
  const refreshIntegrations = category => () => getIntegrationByCategory(category);

  return (
    <div class="list-group list-group-transparent mb-0">
      <Link
        activeClassName="active"
        onClick={refreshIntegrations('device')}
        href="/dashboard/integration/device"
        class="list-group-item list-group-item-action d-flex align-items-center"
      >
        <span class="icon mr-3">
          <i class="fe fe-toggle-right" />
        </span>
        <Text id="integration.root.menu.device" />
      </Link>

      <Link
        activeClassName="active"
        onClick={refreshIntegrations('communication')}
        href="/dashboard/integration/communication"
        class="list-group-item list-group-item-action d-flex align-items-center"
      >
        <span class="icon mr-3">
          <i class="fe fe-message-square" />
        </span>
        <Text id="integration.root.menu.communication" />
      </Link>

      {false && (
        <Link
          activeClassName="active"
          href="/dashboard/integration/calendar"
          class="list-group-item list-group-item-action d-flex align-items-center"
        >
          <span class="icon mr-3">
            <i class="fe fe-calendar" />
          </span>
          <Text id="integration.root.menu.calendar" />
        </Link>
      )}

      {false && (
        <Link
          activeClassName="active"
          href="/dashboard/integration/music"
          class="list-group-item list-group-item-action d-flex align-items-center"
        >
          <span class="icon mr-3">
            <i class="fe fe-music" />
          </span>
          <Text id="integration.root.menu.music" />
        </Link>
      )}

      {false && (
        <Link
          activeClassName="active"
          href="/dashboard/integration/health"
          class="list-group-item list-group-item-action d-flex align-items-center"
        >
          <span class="icon mr-3">
            <i class="fe fe-heart" />
          </span>
          <Text id="integration.root.menu.health" />
        </Link>
      )}

      <Link
        activeClassName="active"
        href="/dashboard/integration/weather"
        class="list-group-item list-group-item-action d-flex align-items-center"
      >
        <span class="icon mr-3">
          <i class="fe fe-cloud" />
        </span>
        <Text id="integration.root.menu.weather" />
      </Link>

      {false && (
        <Link
          activeClassName="active"
          href="/dashboard/integration/navigation"
          class="list-group-item list-group-item-action d-flex align-items-center"
        >
          <span class="icon mr-3">
            <i class="fe fe-navigation" />
          </span>
          <Text id="integration.root.menu.navigation" />
        </Link>
      )}
    </div>
  );
});

export default IntegrationMenu;
