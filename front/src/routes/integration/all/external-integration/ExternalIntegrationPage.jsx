import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import get from 'get-value';

import { USER_ROLE } from '../../../../../../server/utils/constants';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

// last known display name per integration: each tab reloads the integration
// on mount, and showing the raw selector while it loads made the title
// flash on every tab switch
const NAME_CACHE = new Map();

const getDisplayName = (selector, integration) => {
  const name = get(integration, 'manifest.name');
  if (name) {
    NAME_CACHE.set(selector, name);
    return name;
  }
  // non-breaking space: the title keeps its height on the very first
  // load instead of showing the raw selector
  return NAME_CACHE.get(selector) || '\u00A0';
};

const ExternalIntegrationPage = ({ selector, integration, user, children }) => {
  // communication, weather and movies integrations have no device screens
  // (they are dedicated provider APIs, not device controllers): the generic
  // page branches by type and only shows Configuration and Logs. An unknown
  // type (metadata still loading) hides the tabs too, instead of flashing them.
  const integrationType = get(integration, 'manifest.type');
  const hasDeviceScreens =
    Boolean(integrationType) && !['communication', 'weather', 'movies'].includes(integrationType);
  // a non-admin user only comes here to link their own account: supervision
  // and logs are administration screens (and their routes are admin-only)
  const isAdmin = get(user, 'role') === USER_ROLE.ADMIN;
  return (
    <IntegrationSubPageLayout
      title={getDisplayName(selector, integration)}
      tabs={
        <Fragment>
          {hasDeviceScreens && isAdmin && (
            <Link
              href={`/dashboard/integration/device/external/${selector}`}
              activeClassName="active"
              class="hz-tab-link"
            >
              <i class="fe fe-link" />
              <span>
                <Text id="integration.externalIntegration.deviceTab" />
              </span>
            </Link>
          )}

          {hasDeviceScreens && isAdmin && (
            <Link
              href={`/dashboard/integration/device/external/${selector}/discover`}
              activeClassName="active"
              class="hz-tab-link"
            >
              <i class="fe fe-radio" />
              <span>
                <Text id="integration.externalIntegration.discoverTab" />
              </span>
            </Link>
          )}

          <Link
            href={`/dashboard/integration/device/external/${selector}/config`}
            activeClassName="active"
            class="hz-tab-link"
          >
            <i class="fe fe-sliders" />
            <span>
              <Text id="integration.externalIntegration.configTab" />
            </span>
          </Link>

          {isAdmin && (
            <Link
              href={`/dashboard/integration/device/external/${selector}/supervision`}
              activeClassName="active"
              class="hz-tab-link"
            >
              <i class="fe fe-activity" />
              <span>
                <Text id="integration.externalIntegration.supervisionTab" />
              </span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href={`/dashboard/integration/device/external/${selector}/logs`}
              activeClassName="active"
              class="hz-tab-link"
            >
              <i class="fe fe-file-text" />
              <span>
                <Text id="integration.externalIntegration.logsTab" />
              </span>
            </Link>
          )}
        </Fragment>
      }
    >
      {children}
    </IntegrationSubPageLayout>
  );
};

export default connect('user', {})(ExternalIntegrationPage);
