import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const EnergyMonitoringPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.energyMonitoring.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <DeviceConfigurationLink
                    user={props.user}
                    configurationKey="integrations"
                    documentKey="energy-monitoring"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.energyMonitoring.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
            </div>

            <div class="col-lg-9">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.energyMonitoring.title" />
                  </h1>
                </div>
                <div class="card-body">
                  <div class={cx('dimmer', { active: props.loading })}>
                    <div class="loader" />
                    <div class="dimmer-content">
                      <p>
                        <Text id="integration.energyMonitoring.introduction" />
                      </p>
                      <p>
                        <MarkupText id="integration.energyMonitoring.instructions" />
                      </p>
                      {/* TODO: Add configuration controls, charts and device lists here */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EnergyMonitoringPage;
