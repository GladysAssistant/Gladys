import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import get from 'get-value';

import actions from './actions';
import { RequestStatus } from '../../utils/consts';

import IntegrationDeviceCard from './IntegrationDeviceCard';
import IntegrationDeviceListOptions from './IntegrationDeviceListOptions';
import IntegrationEmptyState from './IntegrationEmptyState';

@connect('integration,houses,devices,getDevicesStatus', actions)
class IntegrationDeviceList extends Component {
  componentWillMount() {
    this.props.getIntegration(this.props.integrationName);
    this.props.getHouses();
    this.props.getIntegrationDevices();
  }

  render({ integration, getDevicesStatus, houses, deviceOptions = {}, devices = [], ...props }) {
    if (!integration) {
      return null;
    }

    const integrationLink = integration.link || integration.key;
    const integrationText = get(this.context.intl.dictionary, `integration.${integration.key}.title`);

    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.root.device.title" fields={{ integration: integrationText }} />
          </h3>
          <div class="page-options d-flex">
            <IntegrationDeviceListOptions
              changeOrderDir={props.changeOrderDir}
              debouncedSearch={props.debouncedSearch}
            />
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: getDevicesStatus === RequestStatus.Getting,
              deviceList: getDevicesStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="row">
                {devices.map(device => (
                  <div class="col-md-6">
                    <IntegrationDeviceCard
                      {...deviceOptions}
                      device={device}
                      houses={houses}
                      editUrl={`/dashboard/integration/device/${integrationLink}/edit/${device.selector}`}
                    />
                  </div>
                ))}
                {devices.length === 0 && (
                  <IntegrationEmptyState>
                    <Text id="integration.root.device.noDevices" fields={{ integration: integrationText }} />
                  </IntegrationEmptyState>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default IntegrationDeviceList;
