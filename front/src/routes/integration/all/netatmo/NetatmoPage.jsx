import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const NetatmoPage = props => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.netatmo.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/device/netatmo"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-link" />
                    </span>
                    <Text id="integration.netatmo.deviceTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/netatmo/discover"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-radio" />
                    </span>
                    <Text id="integration.netatmo.discoverTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/netatmo/setup"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-sliders-horizontal" />
                    </span>
                    <Text id="integration.netatmo.setupTab" />
                  </Link>

                  <DeviceConfigurationLink
                    user={props.user}
                    configurationKey="integrations"
                    documentKey="netatmo"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="icon-book-open" />
                    </span>
                    <Text id="integration.netatmo.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
            </div>
            <div class="col-lg-9">{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NetatmoPage;
