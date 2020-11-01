import { Text } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router/match';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import CheckMqttPanel from '../commons/CheckMqttPanel';
import IntegrationDeviceCard from '../../../../../components/integration/IntegrationDeviceCard';
import IntegrationDeviceListOptions from '../../../../../components/integration/IntegrationDeviceListOptions';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.mqtt.device.title" />
      </h3>
      <div class="page-options d-flex">
        <IntegrationDeviceListOptions changeOrderDir={props.changeOrderDir} debouncedSearch={props.debouncedSearch} />
        <Link href="/dashboard/integration/device/mqtt/edit">
          <button class="btn btn-outline-primary ml-2">
            <Text id="scene.newButton" /> <i class="fe fe-plus" />
          </button>
        </Link>
      </div>
    </div>
    <div class="card-body">
      <CheckMqttPanel />

      <div
        class={cx('dimmer', {
          active: props.getMqttDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getMqttDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.mqttDevices &&
              props.mqttDevices.map(mqttDevice => (
                <div class="col-md-6">
                  <IntegrationDeviceCard
                    device={mqttDevice}
                    houses={props.houses}
                    editUrl={`/dashboard/integration/device/mqtt/edit/${mqttDevice.selector}`}
                  />
                </div>
              ))}
            {props.mqttDevices && props.mqttDevices.length === 0 && <Text id="integration.mqtt.device.noDevices" />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
