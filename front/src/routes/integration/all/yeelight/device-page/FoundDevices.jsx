import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';

const createDevice = (props, device) => () => {
  props.createDevice(device);
};

const getYeelightNewDevices = props => () => {
  props.getYeelightNewDevices();
};

const FoundDevices = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.yeelight.device.deviceOnNetworkTitle" />
      </h3>
      <div class="page-options d-flex">
        <button
          class="btn btn-info"
          onClick={getYeelightNewDevices(props)}
          disabled={props.getYeelightNewDevicesStatus === RequestStatus.Getting}
        >
          <i class="fe fe-radio" /> <Text id="integration.yeelight.device.scanButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active:
            props.getYeelightNewDevicesStatus === RequestStatus.Getting ||
            props.getYeelightCreateDeviceStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getYeelightNewDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.yeelightNewDevices && props.yeelightNewDevices.length === 0 && (
              <div class="col-md-12">
                <div class="alert alert-info">
                  <Text id="integration.yeelight.device.noDevicesFound" />
                </div>
              </div>
            )}
            {props.yeelightNewDevices &&
              props.yeelightNewDevices.map((device, index) => (
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">{device.name}</h3>
                    </div>
                    <div class="card-body">
                      {!device.not_handled && (
                        <button class="btn btn-success" onClick={createDevice(props, device)}>
                          <Text id="integration.yeelight.device.connectButton" />
                        </button>
                      )}
                      {device.not_handled && (
                        <div class="alert alert-warning">
                          <Text id="integration.yeelight.device.deviceNotHandled" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {props.yeelightNewDevices && props.yeelightNewDevices.length === 0 && (
              <Text id="integration.yeelight.device.noDevices" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FoundDevices;
