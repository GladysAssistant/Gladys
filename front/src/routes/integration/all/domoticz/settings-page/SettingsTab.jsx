import { Text } from 'preact-i18n';
import cx from 'classnames';

const SettingsTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.domoticz.settings.title" />
      </h2>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.domoticzStatus === 'connected' && (
            <div class="alert alert-success">
              <Text
                id="integration.domoticz.settings.connectedWithSuccess"
                fields={{ version: props.domoticzVersion.version }}
              />
            </div>
          )}
          {props.domoticzStatus === 'connecting' && (
            <div class="alert alert-warning">
              <Text id="integration.domoticz.settings.notConnected" />
            </div>
          )}
          {props.domoticzStatus === 'failed' && (
            <div class="alert alert-warning">
              <Text id="integration.domoticz.settings.connectionFailed" />
            </div>
          )}
          <p>
            <Text id="integration.domoticz.settings.description" />
          </p>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.domoticz.settings.serveraddress" />
            </label>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="integration.domoticz.settings.serveraddressplaceholder" />}
              onChange={props.updateDomoticzServerAddress}
              value={props.domoticzServerAddress}
            />
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.domoticz.settings.serverport" />
            </label>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="integration.domoticz.settings.serverportplaceholder" />}
              onChange={props.updateDomoticzServerPort}
              value={props.domoticzServerPort}
            />
          </div>
          <div class="form-group">
            <button class="btn btn-success" onClick={props.saveServerAndConnect}>
              <Text id="integration.domoticz.settings.connectButton" />
            </button>
            <button class="btn btn-danger ml-2" onClick={props.disconnect}>
              <Text id="integration.domoticz.settings.disconnectButton" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsTab;
