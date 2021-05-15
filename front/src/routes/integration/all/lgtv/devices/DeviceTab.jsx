import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from '../EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import Device from '../Device';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <tr>
          <td class="text-right">
            <Text id="integration.lgtv.device.title" />
          </td>
          <td>{props.lgtvDevices && <div>&nbsp;{`(${props.lgtvDevices.length})`}</div>}</td>
        </tr>
      </h1>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getLGTVDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content')}>
          <div class="row">
            {props.lgtvDevices &&
              props.lgtvDevices.map((device, index) => (
                <Device
                  updateDeviceProperty={props.updateDeviceProperty}
                  onDeviceUpdate={props.updateDevice}
                  onDeviceDelete={props.deleteDevice}
                  houses={props.houses}
                  device={device}
                  showDeleteButton
                  showTitle
                />
              ))}
            {props.lgtvDevices && props.lgtvDevices.length === 0 && (
              <EmptyState onScan={props.onScan} onAdd={props.onAdd} />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
