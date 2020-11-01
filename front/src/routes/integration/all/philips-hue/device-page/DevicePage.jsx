import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import IntegrationDeviceCard from '../../../../../components/integration/IntegrationDeviceCard';
import IntegrationDeviceListOptions from '../../../../../components/integration/IntegrationDeviceListOptions';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.philipsHue.device.title" />
      </h3>
      <div class="page-options d-flex">
        <IntegrationDeviceListOptions changeOrderDir={props.changeOrderDir} debouncedSearch={props.debouncedSearch} />
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getPhilipsHueDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getPhilipsHueDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.philipsHueDevices &&
              props.philipsHueDevices.map(device => (
                <div class="col-md-6">
                  <IntegrationDeviceCard device={device} houses={props.houses} />
                </div>
              ))}
            {props.philipsHueDevices && props.philipsHueDevices.length === 0 && (
              <Text id="integration.philipsHue.device.noDevices" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
