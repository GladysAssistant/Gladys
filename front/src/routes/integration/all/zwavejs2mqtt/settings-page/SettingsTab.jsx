import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import classNames from 'classnames/bind';
import style from './style.css';

let cx = classNames.bind(style);

class SettingsTab extends Component {
  toggleExternalZwavejs2Mqtt = () => {
    this.props.externalZwavejs2mqtt = !this.props.externalZwavejs2mqtt;
    this.props.updateConfiguration({ externalZwavejs2mqtt: this.props.externalZwavejs2mqtt });
  };

  updateS2UnauthenticatedKey = e => {
    this.props.updateConfiguration({ s2UnauthenticatedKey: e.target.value });
  };

  updateS2AuthenticatedKey = e => {
    this.props.updateConfiguration({ s2AuthenticatedKey: e.target.value });
  };

  updateS2AccessControlKey = e => {
    this.props.updateConfiguration({ s2AccessControlKey: e.target.value });
  };

  updateS0LegacyKey = e => {
    this.props.updateConfiguration({ s0LegacyKey: e.target.value });
  };

  updateUrl = e => {
    this.props.updateConfiguration({ mqttUrl: e.target.value });
  };

  updateUsername = e => {
    this.props.updateConfiguration({ mqttUsername: e.target.value });
  };

  updatePassword = e => {
    this.props.updateConfiguration({ mqttPassword: e.target.value, passwordChanges: true });
  };

  showPassword = () => {
    this.setState({ showPassword: true });
    setTimeout(() => this.setState({ showPassword: false }), 5000);
  };

  updateUsbDriverPath = e => {
    this.props.updateConfiguration({ driverPath: e.target.value });
  };

  render(props, { showPassword }) {
    return (
      <>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <Text id="integration.zwavejs2mqtt.settings.title" />
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
                  <Text id="integration.zwavejs2mqtt.settings.description" />
                  {!props.externalZwavejs2mqtt && (
                    <>
                      <br />
                      <Link href="http://localhost:8091" target="zwavejs2mqtt">
                        <span class="icon mr-3">
                          <i class="fe fe-external-link" />
                        </span>
                        <Text id="integration.zwavejs2mqtt.settings.zwavejs2mqtt" />
                      </Link>
                    </>
                  )}
                </p>

                {!props.usbConfigured && (
                  <div class="alert alert-info">
                    <Text id="integration.zwavejs2mqtt.settings.usbNotConfigured" />
                  </div>
                )}

                {!props.mqttConnected && (
                  <div class="alert alert-info">
                    <Text id="integration.zwavejs2mqtt.settings.notConnected" />
                  </div>
                )}

                {props.mqttConnected && (
                  <div class="alert alert-info">
                    <Text id="integration.zwavejs2mqtt.settings.connected" />
                  </div>
                )}

                <form>
                  <div class="form-group">
                    <label for="externalZwavejs2mqtt" class="form-label">
                      <Text id={`integration.zwavejs2mqtt.settings.externalZwavejs2mqtt`} />
                    </label>
                    <label class="custom-switch">
                      <input
                        type="checkbox"
                        id="externalZwavejs2mqtt"
                        name="externalZwavejs2mqtt"
                        class="custom-switch-input"
                        checked={props.externalZwavejs2mqtt}
                        onClick={this.toggleExternalZwavejs2Mqtt}
                      />
                      <span class="custom-switch-indicator" />
                      <span class="custom-switch-description">
                        <Text id="integration.zwavejs2mqtt.settings.externalZwavejs2mqtt" />
                      </span>
                    </label>
                  </div>

                  {props.externalZwavejs2mqtt && (
                    <>
                      <div class="form-group">
                        <label for="mqttUrl" class="form-label">
                          <Text id={`integration.zwavejs2mqtt.settings.urlLabel`} />
                        </label>
                        <Localizer>
                          <input
                            id="mqttUrl"
                            name="mqttUrl"
                            placeholder={<Text id="integration.zwavejs2mqtt.settings.urlPlaceholder" />}
                            value={props.mqttUrl}
                            class="form-control"
                            onInput={this.updateUrl}
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <label for="mqttUsername" class="form-label">
                          <Text id={`integration.zwavejs2mqtt.settings.userLabel`} />
                        </label>
                        <Localizer>
                          <input
                            id="mqttUsername"
                            name="mqttUsername"
                            placeholder={<Text id="integration.zwavejs2mqtt.settings.userPlaceholder" />}
                            value={props.mqttUsername}
                            class="form-control"
                            onInput={this.updateUsername}
                            autoComplete="no"
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <label for="mqttPassword" class="form-label">
                          <Text id={`integration.zwavejs2mqtt.settings.passwordLabel`} />
                        </label>
                        <div class="input-icon mb-3">
                          <Localizer>
                            <input
                              id="mqttPassword"
                              name="mqttPassword"
                              type={props.externalZwavejs2mqtt && showPassword ? 'text' : 'password'}
                              placeholder={<Text id="integration.zwavejs2mqtt.settings.passwordPlaceholder" />}
                              value={props.mqttPassword}
                              class="form-control"
                              onInput={this.updatePassword}
                              autoComplete="new-password"
                            />
                          </Localizer>
                          <span class="input-icon-addon cursor-pointer" onClick={this.showPassword}>
                            <i
                              class={cx('fe', {
                                'fe-eye': !showPassword,
                                'fe-eye-off': showPassword
                              })}
                            />
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {!props.externalZwavejs2mqtt && (
                    <>
                      <div class="form-group">
                        <label class="form-label">
                          <Text id="integration.zwavejs2mqtt.settings.zwaveUsbDriverPathLabel" />
                        </label>
                        <select class="form-control" onChange={this.updateUsbDriverPath}>
                          <option>
                            <Text id="global.emptySelectOption" />
                          </option>
                          {props.usbPorts &&
                            props.usbPorts.map(
                              usbPort =>
                                usbPort.comPath && (
                                  <option value={usbPort.comPath} selected={props.driverPath === usbPort.comPath}>
                                    {usbPort.comPath}
                                    {usbPort.comName ? ` - ${usbPort.comName}` : ''}
                                    {usbPort.comVID ? ` - ${usbPort.comVID}` : ''}
                                  </option>
                                )
                            )}
                        </select>
                        <button class="btn btn-info ml-2" onClick={props.getUsbPorts}>
                          <Text id="integration.zwavejs2mqtt.settings.refreshButton" />
                        </button>
                      </div>
                      <div class="form-group">
                        <label for="s2UnauthenticatedKey" class="form-label">
                          <Text id={`integration.zwavejs2mqtt.settings.s2UnauthenticatedKeyLabel`} />
                        </label>
                        <Localizer>
                          <input
                            id="s2UnauthenticatedKey"
                            name="s2UnauthenticatedKey"
                            placeholder={
                              <Text id="integration.zwavejs2mqtt.settings.s2UnauthenticatedKeyPlaceholder" />
                            }
                            value={props.s2UnauthenticatedKey}
                            class="form-control"
                            onInput={this.updateS2UnauthenticatedKey}
                            autoComplete="no"
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <label for="s2AuthenticatedKey" class="form-label">
                          <Text id={`integration.zwavejs2mqtt.settings.s2AuthenticatedKeyLabel`} />
                        </label>
                        <Localizer>
                          <input
                            id="s2AuthenticatedKey"
                            name="s2AuthenticatedKey"
                            placeholder={<Text id="integration.zwavejs2mqtt.settings.s2AuthenticatedKeyPlaceholder" />}
                            value={props.s2AuthenticatedKey}
                            class="form-control"
                            onInput={this.updateS2AuthenticatedKey}
                            autoComplete="no"
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <label for="s2AccessControlKey" class="form-label">
                          <Text id={`integration.zwavejs2mqtt.settings.s2AccessControlKeyLabel`} />
                        </label>
                        <Localizer>
                          <input
                            id="s2AccessControlKey"
                            name="s2AccessControlKey"
                            placeholder={<Text id="integration.zwavejs2mqtt.settings.s2AccessControlKeyPlaceholder" />}
                            value={props.s2AccessControlKey}
                            class="form-control"
                            onInput={this.updateS2AccessControlKey}
                            autoComplete="no"
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <label for="s0LegacyKey" class="form-label">
                          <Text id={`integration.zwavejs2mqtt.settings.s0LegacyKeyLabel`} />
                        </label>
                        <Localizer>
                          <input
                            id="s0LegacyKey"
                            name="s0LegacyKey"
                            placeholder={<Text id="integration.zwavejs2mqtt.settings.s0LegacyKeyPlaceholder" />}
                            value={props.s0LegacyKey}
                            class="form-control"
                            onInput={this.updateS0LegacyKey}
                            autoComplete="no"
                          />
                        </Localizer>
                      </div>
                    </>
                  )}

                  <div class="form-group">
                    <button class="btn btn-success" onClick={props.connect}>
                      <Text id="integration.zwavejs2mqtt.settings.connectButton" />
                    </button>
                    <button class="btn btn-danger ml-2" onClick={props.disconnect}>
                      <Text id="integration.zwavejs2mqtt.settings.disconnectButton" />
                    </button>
                    <button class="btn btn-warning ml-2" onClick={props.saveConfiguration}>
                      <Text id="integration.zwavejs2mqtt.settings.saveConfiguration" />
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
              <Text id="integration.zwavejs2mqtt.settings.serviceStatus" />
            </h2>
          </div>
          <div class="card-body">
            <div class="row justify-content-center d-sm-none">
              <div class="col-auto">
                <table class="table table-responsive table-borderless table-sm">
                  <thead class="text-center">
                    <tr>
                      <th>
                        <Text id="integration.zwavejs2mqtt.settings.link" />
                      </th>
                      <th>
                        <Text id="integration.zwavejs2mqtt.settings.status" />
                      </th>
                    </tr>
                  </thead>
                  <tbody class="text-center">
                    <tr>
                      <td>
                        <Text id="integration.zwavejs2mqtt.settings.gladysMqttLink" />
                      </td>
                      <td>
                        {props.mqttRunning && (
                          <i
                            className={cx('fe', {
                              'fe-check': props.gladysConnected,
                              'fe-x': !props.gladysConnected,
                              greenIcon: props.gladysConnected,
                              redIcon: !props.gladysConnected
                            })}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Text id="integration.zwavejs2mqtt.settings.mqttZwavejsLink" />
                      </td>
                      <td>
                        {props.zwavejs2mqttRunning && (
                          <i
                            className={cx('fe', {
                              'fe-check': props.zwavejs2mqttConnected,
                              'fe-x': !props.zwavejs2mqttConnected,
                              greenIcon: props.zwavejs2mqttConnected,
                              redIcon: !props.zwavejs2mqttConnected
                            })}
                          />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default SettingsTab;
