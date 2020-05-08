import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

import Select from '../../../../../components/form/Select';

const SettingsTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.zwave.settings.title" />
      </h2>
      <div class="page-options d-flex">
        <button class="btn btn-info" onClick={props.getUsbPorts}>
          <Text id="integration.zwave.settings.refreshButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {get(props, 'zwaveStatus.ready') && (
            <div class="alert alert-success">
              <Text id="integration.zwave.settings.connectedWithSuccess" />
            </div>
          )}
          {!get(props, 'zwaveStatus.ready') && (
            <div class="alert alert-warning">
              <Text id="integration.zwave.settings.notConnected" />
            </div>
          )}
          {props.zwaveConnectionInProgress && (
            <div class="alert alert-info">
              <Text id="integration.zwave.settings.connecting" />
            </div>
          )}
          {props.zwaveDriverFailed && (
            <div class="alert alert-danger">
              <Text id="integration.zwave.settings.driverFailedError" />
            </div>
          )}
          <p>
            <Text id="integration.zwave.settings.description" />
          </p>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zwave.settings.zwaveUsbDriverPathLabel" />
            </label>
            <Select
              onChange={props.updateZwaveDriverPath}
              value={props.zwaveDriverPath}
              uniqueKey="value"
              options={
                props.usbPorts &&
                props.usbPorts.map(usbPort => {
                  return {
                    value: usbPort.comPath,
                    label: usbPort.comName
                  };
                })
              }
            />
          </div>
          <div class="form-group">
            <button class="btn btn-success" onClick={props.saveDriverPathAndConnect}>
              <Text id="integration.zwave.settings.connectButton" />
            </button>
            <button class="btn btn-danger ml-2" onClick={props.disconnect}>
              <Text id="integration.zwave.settings.disconnectButton" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsTab;
