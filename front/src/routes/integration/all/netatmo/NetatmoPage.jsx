import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import { STATUS } from '../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

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
                      <i class="fe fe-link" />
                    </span>
                    <Text id="integration.netatmo.deviceTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/netatmo/discover"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-radio" />
                    </span>
                    <Text id="integration.netatmo.discoverTab" />
                  </Link>

                  <Link
                    href="/dashboard/integration/device/netatmo/setup"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-sliders" />
                    </span>
                    <Text id="integration.netatmo.setupTab" />
                  </Link>

                  <DeviceConfigurationLink
                    user={props.user}
                    documentKey="netatmo"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.netatmo.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
              {props.state.showConnect &&
                ((!props.state.accessDenied && props.state.errored && (
                  <p class="alert alert-danger">
                    <Text id="integration.netatmo.setup.error" />
                  </p>
                )) ||
                  (props.state.accessDenied && (props.state.messageAlert === 'other_error' && (
                    <p class="text-center alert alert-warning">
                      <Text id={`integration.netatmo.setup.errorConnecting.${props.state.messageAlert}_NetatmoPage`} />
                    </p>
                  ) || (
                      <p class="text-center alert alert-warning">
                        <Text id={`integration.netatmo.setup.errorConnecting.${props.state.messageAlert}`} />
                      </p>
                    ))) ||
                  (!props.state.accessDenied &&
                    ((props.state.connectNetatmoStatus === STATUS.CONNECTING && (
                      <p class="text-center alert alert-info">
                        <Text id="integration.netatmo.setup.connecting" />
                      </p>
                    )) ||
                      (props.state.connectNetatmoStatus === STATUS.NOT_INITIALIZED && (
                        <p class="text-center alert alert-warning">
                          <Text id="integration.netatmo.setup.notConfigured" />
                        </p>
                      )) ||
                      (props.state.connectNetatmoStatus === STATUS.CONNECTED && (
                        <p class="text-center alert alert-success">
                          <Text id="integration.netatmo.setup.connect" />
                        </p>
                      )) ||
                      (props.state.connectNetatmoStatus === STATUS.DISCONNECTED && (
                        <p class="text-center alert alert-danger">
                          <Text id="integration.netatmo.setup.disconnect" />
                        </p>
                      )))))}
            </div>

            <div class="col-lg-9">{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NetatmoPage;
