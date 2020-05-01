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
        <Text id="integration.rflink.device.deviceOnNetworkTitle" />
      </h3>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active:
            props.getRflinkNewDevicesStatus === RequestStatus.Getting ||
            props.getRflinkCreateDeviceStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getRflinkNewDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.rflinkNewDevices && props.rflinkNewDevices.length === 0 && (
              <div class="col-md-12">
                <div class="alert alert-info">
                  <Text id="integration.rflink.device.noDevicesFound" />
                </div>
              </div>
            )}
            {props.rflinkNewDevices &&
              props.rflinkNewDevices.map((device, index) => (
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">{device.name}</h3>
                    </div>
                    <div class="card-body">
                      <button class="btn btn-success" onClick={createDevice(props, device)}>
                        <Text id="integration.rflink.device.connectButton" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FoundDevices;
