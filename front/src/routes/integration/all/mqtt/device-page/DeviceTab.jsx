import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import { Link } from 'preact-router/match';
import CheckMqttPanel from '../commons/CheckMqttPanel';
import CardFilter from '../../../../../components/layout/CardFilter';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.mqtt.device.title" />
      </h1>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getMqttDeviceOrderDir}
            search={props.debouncedSearch}
            searchValue={props.mqttDeviceSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
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
              props.mqttDevices.map((mqttDevice, index) => (
                <Device
                  device={mqttDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                  user={props.user}
                />
              ))}
            {props.mqttDevices && props.mqttDevices.length === 0 && <Text id="integration.mqtt.device.noDevices" />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
