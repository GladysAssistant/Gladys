import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const Gradium = ({ children, user }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.gradium.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/communication/gradium/voice"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-volume-2" />
                    </span>
                    <Text id="integration.gradium.voiceTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/communication/gradium/account"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-user" />
                    </span>
                    <Text id="integration.gradium.accountTab" />
                  </Link>

                  <DeviceConfigurationLink
                    user={user}
                    configurationKey="integrations"
                    documentKey="gradium"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.gradium.documentation" />
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

export default Gradium;
