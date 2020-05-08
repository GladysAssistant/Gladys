import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import style from './style.css';
import PageOptions from '../../../../../components/form/PageOptions';

const NodeTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.zwave.device.title" />
      </h3>
      <PageOptions
        changeOrderDir={props.changeOrderDir}
        debouncedSearch={props.debouncedSearch}
        searchPlaceholder={<Text id="integration.zwave.device.search" />}
      />
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getZwaveDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.zwaveDevices && props.zwaveDevices.length === 0 && (
            <div class="alert alert-info">
              <Text id="integration.zwave.device.noDevices" />
            </div>
          )}
          {props.getZwaveDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.zwaveDevices &&
              props.zwaveDevices.map((zwaveDevice, index) => (
                <Device
                  device={zwaveDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                  user={props.user}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NodeTab;
