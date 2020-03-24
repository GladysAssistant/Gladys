import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';

const createDevice = (props, device) => () => {
  props.createDevice(device);
};
const FoundDevices = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.netatmo.device.foundDevice" />
      </h3>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active:
            props.getNetatmoNewDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getNetatmoNewDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.netatmoNewDevices && props.netatmoNewDevices.length === 0 && (
              <div class="col-md-12">
                <div class="alert alert-info">
                  <Text id="integration.netatmo.device.noDevicesFound" />
                </div>
              </div>
            )}
            {props.netatmoNewDevices &&
              props.netatmoNewDevices.map((device, index) => (
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">{device.name}</h3>
                    </div>
                    <div class="card-body">
                      {!device.not_handled && (
                        <button class="btn btn-success" onClick={createDevice(props, device)}>
                          <Text id="integration.netatmo.device.addDeviceButton" />
                        </button>
                      )}
                      {device.not_handled && (
                        <div class="alert alert-warning">
                          <Text id="integration.netatmo.device.deviceNotHandled" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {props.netatmoDevices && props.netatmoDevices.length === 0 && (
              <Text id="integration.netatmo.device.noDevices" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FoundDevices;
