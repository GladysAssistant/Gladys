import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import CheckStatus from './CheckStatus.js';
import get from 'get-value';
import classNames from 'classnames/bind';
import style from './style.css';
import { DEFAULT } from '../../../../../../../server/services/zwave/lib/constants';

let cx = classNames.bind(style);

class SettingsTab extends Component {
  toggleMode = e => {
    this.props.zwaveMode =
      this.props.zwaveMode === DEFAULT.MODE_ZWAVE2MQTT ? DEFAULT.MODE_ZWAVEJS : DEFAULT.MODE_ZWAVE2MQTT;
    this.props.updateConfiguration({ zwaveMode: this.props.zwaveMode });
  };

  updateZwaveDriverPath = e => {
    this.props.updateConfiguration({ zwaveDriverPath: e.target.value });
  };

  render(props, { showPassword }) {
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
                    <Text id="integration.zwave.settings.zwavejs.restartRequired" />
                  </div>
                )}

                {props.zwaveContainerStatus === RequestStatus.Error && (
                  <p class="alert alert-danger">
                    <Text id="integration.zwave.settings.error" />
                  </p>
                )}

                {props.zwaveConnected && (
                  <p class="alert alert-success">
                    <Text id="integration.zwave.settings.connected" />
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
          <div class="card-body"></div>
        </div>
      </>
    );
  }
}

export default SettingsTab;
