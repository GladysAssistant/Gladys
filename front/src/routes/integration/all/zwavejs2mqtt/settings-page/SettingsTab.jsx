import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import classNames from 'classnames/bind';
import style from './style.css';
import { DEFAULT } from '../../../../../../../server/services/zwavejs2mqtt/lib/constants';

let cx = classNames.bind(style);

class SettingsTab extends Component {

  toggleMode = () => {
    this.props.zwaveMode =
      this.props.zwaveMode === DEFAULT.MODE_ZWAVE2MQTT ? DEFAULT.MODE_ZWAVEJS : DEFAULT.MODE_ZWAVE2MQTT;
    this.props.updateConfiguration({ zwaveMode: this.props.zwaveMode });
  };
  
  toggleExternalZwave2Mqtt = () => {
    this.props.externalZwave2Mqtt = !this.props.externalZwave2Mqtt;
    this.props.updateConfiguration({ externalZwave2Mqtt: this.props.externalZwave2Mqtt });
  };

  updateUrl = e => {
    this.props.updateConfiguration({ zwave2zwave2mqttUrl: e.target.value });
  };

  updateUsername = e => {
    this.props.updateConfiguration({ zwave2zwave2mqttUsername: e.target.value });
  };

  updatePassword = e => {
    this.props.updateConfiguration({ zwave2zwave2mqttPassword: e.target.value, passwordChanges: true });
  };

  showPassword = () => {
    this.setState({ showPassword: true });
    setTimeout(() => this.setState({ showPassword: false }), 5000);
  };


  updateZwaveDriverPath = e => {
    this.props.updateConfiguration({ zwaveDriverPath: e.target.value });
  };

  render(props) {
    return (
      <>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <Text id="integration.zwave.settings.title" />
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
                <p>
                  <Text id="integration.zwave.settings.zwavejs.description" />
                </p>

                {props.ready && (
                  <div class="alert alert-success">
                    <Text id="integration.zwave.settings.zwavejs.connectedWithSuccess" />
                  </div>
                )}
                {!props.ready && (
                  <div class="alert alert-warning">
                    <Text id="integration.zwave.settings.zwavejs.notConnected" />
                  </div>
                )}

                {props.zwaveConnectionInProgress && (
                  <div class="alert alert-info">
                    <Text id="integration.zwave.settings.zwavejs.connecting" />
                  </div>
                )}

                {props.restartRequired && (
                  <div class="alert alert-danger">
                    <Text id="integration.zwave.status.restartRequired" />
                  </div>
                )}

                {props.zwaveContainerStatus === RequestStatus.Error && (
                  <p class="alert alert-danger">
                    <Text id="integration.zwave.status.error" />
                  </p>
                )}

                {props.zwaveConnected && (
                  <p class="alert alert-success">
                    <Text id="integration.zwave.status.connected" />
                  </p>
                )}

                <p>
                  <Text id="integration.zwave.settings.zwave2mqtt.description" />
                </p>

                <form>
                  <div class="form-group">
                    <label for="enablezwave" class="form-label">
                      <Text id={`integration.zwave.settings.zwave2mqtt.enableLabel`} />
                    </label>
                    <label class="custom-switch">
                      <input
                        type="checkbox"
                        id="enableZwave2mqtt"
                        name="enableZwave2mqtt"
                        class="custom-switch-input"
                        checked={props.zwaveMode === DEFAULT.MODE_ZWAVE2MQTT}
                        onClick={this.toggleMode}
                      />
                      <span class="custom-switch-indicator" />
                      <span class="custom-switch-description">
                        <Text id="integration.zwave.settings.zwave2mqtt.enableZwave2mqtt" />
                      </span>
                    </label>
                  </div>

                  <div class="form-group">
                    <label for="enablezwave" class="form-label">
                      <Text id={`integration.zwave.settings.zwave2mqtt.enableLabel`} />
                    </label>
                    <label class="custom-switch">
                      <input
                        type="checkbox"
                        id="externalZwave2Mqtt"
                        name="externalZwave2Mqtt"
                        class="custom-switch-input"
                        checked={props.externalZwave2Mqtt}
                        onClick={this.toggleExternalZwave2Mqtt}
                      />
                      <span class="custom-switch-indicator" />
                      <span class="custom-switch-description">
                        <Text id="integration.zwave.settings.zwave2mqtt.externalZwave2Mqtt" />
                      </span>
                    </label>
                  </div>

                  <div class="form-group">
                    <label for="zwave2mqttUrl" class="form-label">
                      <Text id={`integration.zwave.settings.zwave2mqtt.urlLabel`} />
                    </label>
                    <Localizer>
                      <input
                        id="zwave2mqttUrl"
                        name="zwave2mqttUrl"
                        placeholder={<Text id="integration.zwave.settings.zwave2mqtt.urlPlaceholder" />}
                        value={props.zwave2mqttUrl}
                        class="form-control"
                        onInput={this.updateUrl}
                        disabled={props.externalZwave2Mqtt}
                      />
                    </Localizer>
                  </div>

                  <div class="form-group">
                    <label for="zwave2mqttUsername" class="form-label">
                      <Text id={`integration.zwave.settings.zwave2mqtt.userLabel`} />
                    </label>
                    <Localizer>
                      <input
                        id="zwave2mqttUsername"
                        name="zwave2mqttUsername"
                        placeholder={<Text id="integration.zwave.settings.zwave2mqtt.userPlaceholder" />}
                        value={props.zwave2mqttUsername}
                        class="form-control"
                        onInput={this.updateUsername}
                        autoComplete="no"
                      />
                    </Localizer>
                  </div>

                  <div class="form-group">
                    <label for="zwave2mqttPassword" class="form-label">
                      <Text id={`integration.zwave.settings.zwave2mqtt.passwordLabel`} />
                    </label>
                    <div class="input-icon mb-3">
                      <Localizer>
                        <input
                          id="zwave2mqttPassword"
                          name="zwave2mqttPassword"
                          type={props.externalZwave2Mqtt && showPassword ? 'text' : 'password'}
                          placeholder={<Text id="integration.zwave.settings.zwave2mqtt.passwordPlaceholder" />}
                          value={props.zwave2mqttPassword}
                          class="form-control"
                          onInput={this.updatePassword}
                          autoComplete="new-password"
                        />
                      </Localizer>
                      {props.externalZwave2Mqtt && (
                        <span class="input-icon-addon cursor-pointer" onClick={this.showPassword}>
                          <i
                            class={cx('fe', {
                              'fe-eye': !showPassword,
                              'fe-eye-off': showPassword
                            })}
                          />
                        </span>
                      )}
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.zwave.settings.zwavejs.zwaveUsbDriverPathLabel" />
                    </label>
                    <select class="form-control" onChange={this.updateZwaveDriverPath}>
                      <option>
                        <Text id="global.emptySelectOption" />
                      </option>
                      {props.usbPorts &&
                        props.usbPorts.map(
                          usbPort =>
                            usbPort.comPath && (
                              <option value={usbPort.comPath} selected={props.zwaveDriverPath === usbPort.comPath}>
                                {usbPort.comPath}
                                {usbPort.comName ? ` - ${usbPort.comName}` : ''}
                                {usbPort.comVID ? ` - ${usbPort.comVID}` : ''}
                              </option>
                            )
                        )}
                    </select>
                    <button class="btn btn-info ml-2" onClick={props.getUsbPorts}>
                      <Text id="integration.zwave.settings.zwavejs.refreshButton" />
                    </button>
                  </div>

                  <div class="form-group">
                    <button class="btn btn-success" onClick={props.connect}>
                      <Text id="integration.zwave.settings.connectButton" />
                    </button>
                    <button class="btn btn-danger ml-2" onClick={props.disconnect}>
                      <Text id="integration.zwave.settings.disconnectButton" />
                    </button>
                    <button type="submit" class="btn btn-info ml-2" onClick={props.saveConfiguration}>
                      <Text id="integration.zwave.settings.saveLabel" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <Text id="integration.zwave.settings.zwave2mqtt.serviceStatus" />
            </h2>
          </div>
          <div class="card-body" />
        </div>
      </>
    );
  }
}

export default SettingsTab;
