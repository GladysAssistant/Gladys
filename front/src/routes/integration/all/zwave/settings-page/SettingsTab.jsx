import { Text } from 'preact-i18n';

const SettingsTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.zwave.settings.title" />
      </h2>
    </div>
    <div class="card-body">
      <div class="dimmer">
        <div class="dimmer-content">
          <h3>
            <Text id="integration.zwave.settings.ino" />
          </h3>
          <p>
            <Text id="integration.zwave.settings.description" />
          </p>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zwave.settings.zwaveUsbDriverPathLabel" />
            </label>
            <select class="form-control" onChange={props.updateZwaveDriverPath}>
              <option>
                <Text id="global.emptySelectOption" />
              </option>
              {props.usbPorts &&
                props.usbPorts.map(usbPort => (
                  <option selected={props.zwaveDriverPath === usbPort.comName}>{usbPort.comName}</option>
                ))}
            </select>
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
