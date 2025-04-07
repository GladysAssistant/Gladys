import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const MatterPage = ({ children, user }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.matter.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/device/matter"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-cpu" />
                    </span>
                    <Text id="integration.matter.deviceTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/matter/discover"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-plus-circle" />
                    </span>
                    <Text id="integration.matter.addTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/matter/settings"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-settings" />
                    </span>
                    <Text id="integration.matter.settingsTab" />
                  </Link>

                  <DeviceConfigurationLink
                    user={user}
                    documentKey="matter"
                    configurationKey="integrations"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.matter.documentation" />
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

export default MatterPage;
