import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../utils/consts';
import IntegrationDeviceCard from '../../../../components/integration/IntegrationDeviceCard';
import IntegrationDeviceListOptions from '../../../../components/integration/IntegrationDeviceListOptions';
import style from './style.css';

const DevicePanel = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.xiaomi.device.title" />
      </h3>
      <div class="page-options d-flex">
        <IntegrationDeviceListOptions changeOrderDir={props.changeOrderDir} debouncedSearch={props.debouncedSearch} />
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getXiaomiDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getXiaomiDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.xiaomiDevices &&
              props.xiaomiDevices.map(xiaomiDevice => (
                <div class="col-md-4">
                  <IntegrationDeviceCard
                    device={xiaomiDevice}
                    houses={props.houses}
                    editUrl={`/dashboard/integration/device/xiaomi/edit/${xiaomiDevice.selector}`}
                  >
                    <div>
                      <div class="form-group">
                        <label class="form-label">
                          <Text id="integration.xiaomi.device.sidLabel" />
                        </label>
                        <input
                          type="text"
                          value={xiaomiDevice.external_id.split(':')[1]}
                          class="form-control"
                          disabled
                        />
                      </div>
                      {xiaomiDevice.model === 'xiaomi-gateway' && (
                        <div class="form-group">
                          <label class="form-label">
                            <Text id="integration.xiaomi.device.ipLabel" />
                          </label>
                          <input type="text" value={this.getGatewayIp()} class="form-control" disabled />
                        </div>
                      )}
                    </div>
                  </IntegrationDeviceCard>
                </div>
              ))}
            {props.xiaomiDevices && props.xiaomiDevices.length === 0 && (
              <p class="text-center">
                <Text id="integration.xiaomi.device.noDevices" />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DevicePanel;
