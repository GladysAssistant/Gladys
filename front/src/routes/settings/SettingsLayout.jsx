import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import config from '../../config';

const DashboardSettings = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="settings.title" />
              </h3>
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
                    href="/dashboard/settings/user"
                    activeClassName="active"
                    class={cx('list-group-item list-group-item-action d-flex align-items-center', {
                      active: props.currentUrl && props.currentUrl.startsWith('/dashboard/settings/user')
                    })}
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-user" />
                    </span>
                    <Text id="settings.usersTab" />
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

                  {config.gatewayMode && (
                    <Link
                      href="/dashboard/settings/gateway-users"
                      activeClassName="active"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <span class="icon mr-3">
                        <i class="fe fe-user" />
                      </span>
                      <Text id="settings.gatewayUsersTab" />
                    </Link>
                  )}

                  {config.gatewayMode && (
                    <Link
                      href="/dashboard/settings/gateway-open-api"
                      activeClassName="active"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <span class="icon mr-3">
                        <i class="fe fe-globe" />
                      </span>
                      <Text id="settings.gatewayOpenApiTab" />
                    </Link>
                  )}

                  {config.gatewayMode && (
                    <Link
                      href="/dashboard/settings/billing"
                      activeClassName="active"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <span class="icon mr-3">
                        <i class="fe fe-credit-card" />
                      </span>
                      <Text id="settings.billingTab" />
                    </Link>
                  )}

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
                    href="/dashboard/settings/jobs"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-cpu" />
                    </span>
                    <Text id="settings.jobsTab" />
                  </Link>

                  <Link
                    href="/dashboard/settings/service"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-grid" />
                    </span>
                    <Text id="settings.serviceTab" />
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
