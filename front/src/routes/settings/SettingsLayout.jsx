import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const DashboardSettings = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">Settings</h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/settings/house"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-home" />
                    </span>
                    <Text id="settings.housesTab" />
                  </Link>

                  <Link
                    href="/dashboard/settings/session"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-smartphone" />
                    </span>
                    <Text id="settings.sessionsTab" />
                  </Link>

                  <Link
                    href="/dashboard/settings/gateway"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-globe" />
                    </span>
                    <Text id="settings.gatewayTab" />
                  </Link>

                  <Link
                    href="/dashboard/settings/backup"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-database" />
                    </span>
                    <Text id="settings.backupTab" />
                  </Link>

                  <Link
                    href="/dashboard/settings/system"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-power" />
                    </span>
                    <Text id="settings.systemTab" />
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
