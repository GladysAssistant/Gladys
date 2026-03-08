import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const NukiPage = ({ children, user }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.nuki.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/device/nuki"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-link" />
                    </span>
                    <Text id="integration.nuki.deviceTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/nuki/mqtt"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-radio" />
                    </span>
                    <Text id="integration.nuki.mqttDiscoverTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/nuki/http"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-globe" />
                    </span>
                    <Text id="integration.nuki.httpDiscoverTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/nuki/setup"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-sliders-horizontal" />
                    </span>
                    <Text id="integration.nuki.setupTab" />
                  </Link>

                  <DeviceConfigurationLink
                    user={user}
                    configurationKey="integrations"
                    documentKey="nuki"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-book-open" />
                    </span>
                    <Text id="integration.nuki.documentation" />
                  </DeviceConfigurationLink>
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

export default NukiPage;
