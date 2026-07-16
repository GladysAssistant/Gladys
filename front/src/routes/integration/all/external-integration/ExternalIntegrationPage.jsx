import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import get from 'get-value';

const ExternalIntegrationPage = ({ selector, integration, children }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">{get(integration, 'manifest.name') || selector}</h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
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

export default ExternalIntegrationPage;
