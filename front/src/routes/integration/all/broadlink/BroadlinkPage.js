import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const BroadlinkPage = ({ children }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.broadlink.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/device/broadlink"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-radio" />
                    </span>
                    <Text id="integration.broadlink.remoteTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/broadlink/peripheral"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-wifi" />
                    </span>
                    <Text id="integration.broadlink.peripheralTab" />
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

export default BroadlinkPage;
