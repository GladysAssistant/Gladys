import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import get from 'get-value';

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

const ExternalIntegrationPage = ({ selector, integration, children }) => {
  // communication integrations have no device screens: the generic page
  // branches by type and only shows Configuration and Logs
  const isCommunication = get(integration, 'manifest.type') === 'communication';
  return (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class="row">
              <div class="col-lg-3">
                <h3 class="page-title mb-5">{getDisplayName(selector, integration)}</h3>
                <div>
                  <div class="list-group list-group-transparent mb-0">
                    {!isCommunication && (
                      <Link
                        href={`/dashboard/integration/device/external/${selector}`}
                        activeClassName="active"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-link" />
                        </span>
                        <Text id="integration.externalIntegration.deviceTab" />
                      </Link>
                    )}

                    {!isCommunication && (
                      <Link
                        href={`/dashboard/integration/device/external/${selector}/discover`}
                        activeClassName="active"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-radio" />
                        </span>
                        <Text id="integration.externalIntegration.discoverTab" />
                      </Link>
                    )}

                    <Link
                      href={`/dashboard/integration/device/external/${selector}/config`}
                      activeClassName="active"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <span class="icon mr-3">
                        <i class="fe fe-sliders" />
                      </span>
                      <Text id="integration.externalIntegration.configTab" />
                    </Link>

                    <Link
                      href={`/dashboard/integration/device/external/${selector}/supervision`}
                      activeClassName="active"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <span class="icon mr-3">
                        <i class="fe fe-activity" />
                      </span>
                      <Text id="integration.externalIntegration.supervisionTab" />
                    </Link>

                    <Link
                      href={`/dashboard/integration/device/external/${selector}/logs`}
                      activeClassName="active"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <span class="icon mr-3">
                        <i class="fe fe-file-text" />
                      </span>
                      <Text id="integration.externalIntegration.logsTab" />
                    </Link>
                  </div>
                </div>
              </div>

              <div class="col-lg-9">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalIntegrationPage;
