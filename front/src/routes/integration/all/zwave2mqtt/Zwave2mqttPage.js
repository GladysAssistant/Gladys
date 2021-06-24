import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const Zwave2mqttPage = ({ children, user }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.zwave2mqtt.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/device/zwave2mqtt"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-link" />
                    </span>
                    <Text id="integration.zwave2mqtt.deviceTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/zwave2mqtt/discover"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-radio" />
                    </span>
                    <Text id="integration.zwave2mqtt.discoverTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/zwave2mqtt/settings"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-settings" />
                    </span>
                    <Text id="integration.zwave2mqtt.settingsTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/zwave2mqtt/setup"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-sliders" />
                    </span>
                    <Text id="integration.zwave2mqtt.setupTab" />
                  </Link>

                  <DeviceConfigurationLink
                    user={user}
                    documentKey="zwave2mqtt"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.zwave2mqtt.discover.documentation" />
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

export default Zwave2mqttPage;
