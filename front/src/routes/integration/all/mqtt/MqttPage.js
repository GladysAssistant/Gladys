import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const DashboardSettings = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.mqtt.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/device/mqtt"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-radio" />
                    </span>
                    <Text id="integration.mqtt.deviceTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/mqtt/setup"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-sliders" />
                    </span>
                    <Text id="integration.mqtt.setupTab" />
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

export default DashboardSettings;
