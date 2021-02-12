import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';

const createDevice = (props, device, index) => () => {
  props.createDevice(device, index);
};

const FoundDevices = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <div class="col-8">
        <h3 class="card-title">
          <Text id="integration.netatmo.discover.title" />
        </h3>
      </div>
      <div class="col text-right">
        <button class="btn btn-outline-primary" onClick={''}>
          <Text id="integration.netatmo.discover.refreshButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getNetatmoNewDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.connectNetatmoStatus === RequestStatus.ServiceDisconnected && (
            <div class="alert alert-danger">
              <Text id="integration.netatmo.discover.disconnect" />
            </div>
          )}
          {props.connectNetatmoStatus === RequestStatus.ServiceNotConfigured && (
            <div class="alert alert-danger">
              <Text id="integration.netatmo.discover.noConnect" />
            </div>
          )}
          {props.getNetatmoNewDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          {props.connectNetatmoStatus === RequestStatus.ServiceConnected && (
            <div class="row">
              {props.netatmoNewDevices && props.netatmoNewDevices.length === 0 && (
                <div class="col-md-12">
                  <div class="alert alert-info">
                    <Text id="integration.netatmo.device.noDevices" />
                  </div>
                </div>
              )}
              {props.netatmoSensors &&
                props.netatmoSensors.map((device, index) => (
                  <div class="col-md-4">
                    <div class="card">
                      <div class="card-header">
                        <h3 class="card-title">{device.name}</h3>
                      </div>
                      <div class="card-body">
                        <t>
                          {!device.not_handled && (
                            <button class="btn btn-success" onClick={createDevice(props, device, index)}>
                              <Text id="integration.netatmo.device.addDeviceButton" />
                            </button>
                          )}
                          {device.not_handled && (
                            <button class="btn btn-primary mr-2" disabled="true">
                              <Text id="integration.netatmo.discover.alreadyCreatedButton" />
                            </button>
                          )}
                        </t>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default FoundDevices;
