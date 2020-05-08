import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import SetupDevice from './SetupDevice';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.arduino.setup.title" />
        </h3>
        <div class="page-options d-flex">
          <button class="btn btn-info" onClick={props.getUsbPorts && props.checkConnected}>
            <Text id="integration.arduino.setup.refreshButton" />
          </button>
        </div>
        <button class="btn btn-outline-primary ml-2" onClick={props.addDevice}>
          <Text id="scene.newButton" /> <i class="fe fe-plus" />
        </button>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.getArduinoDevicesStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.arduinoConnected && (
              <p class="alert alert-success">
                <Text id="integration.arduino.device.arduinoConnected" /> : {props.arduinoModel}
              </p>
            )}
            {!props.arduinoDevices || props.arduinoDevices.length === 0 && (
              <p class="alert alert-danger">
                <Text id="integration.arduino.device.arduinoNotConnected" />
              </p>
            )}
            {props.getArduinoDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
            <div class="row">
              {props.arduinoDevices &&
                props.arduinoDevices.map((arduinoDevice, index) => (
                  <SetupDevice
                    device={arduinoDevice}
                    deviceIndex={index}
                    houses={props.houses}
                    updateDeviceProperty={props.updateDeviceProperty}
                    saveDevice={props.saveDevice}
                    deleteDevice={props.deleteDevice}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
