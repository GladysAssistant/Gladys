import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const WithingsPage = ({ children, user, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.withings.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/health/withings/device"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-radio" />
                    </span>
                    <Text id="integration.withings.device.menu" />
                  </Link>
                  <Link
                    href="/dashboard/integration/health/withings/settings"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-settings" />
                    </span>
                    <Text id="integration.withings.settings.menu" />
                  </Link>
                  <DeviceConfigurationLink
                    user={user}
                    documentKey="withings-configuration"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.withings.documentation" />
                  </DeviceConfigurationLink>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.withings.com/"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-external-link" />
                    </span>
                    <Text id="integration.withings.officialWebSite" />
                  </a>
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

export default WithingsPage;
