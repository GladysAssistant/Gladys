import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import classNames from 'classnames/bind';
import style from './style.css';

let cx = classNames.bind(style);

class SettingsTab extends Component {
  toggleExternalZwavejsUI = () => {
    this.props.externalZwaveJSUI = !this.props.externalZwaveJSUI;
    this.props.updateConfiguration({ externalZwaveJSUI: this.props.externalZwaveJSUI });
  };

  toggleMqttTopicWithLocation = () => {
    this.props.mqttTopicWithLocation = !this.props.mqttTopicWithLocation;
    this.props.updateConfiguration({ mqttTopicWithLocation: this.props.mqttTopicWithLocation });
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

  updateMqttTopicPrefix = e => {
    this.props.updateConfiguration({ mqttTopicPrefix: e.target.value });
  };

  render(props, { showPassword }) {
    return (
      <>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <Text id="integration.zwavejsui.settings.title" />
            </h2>
            {!props.externalZwaveJSUI && (
              <div class="page-options d-flex">
                <button class="btn btn-info" onClick={props.getUsbPorts}>
                  <Text id="integration.zwavejsui.settings.refreshButton" />
                </button>
              </div>
            )}
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
                  <Text id="integration.zwavejsui.settings.description" />
                  {!props.externalZwaveJSUI && (
                    <>
                      <br />
                      <Link href="http://localhost:8091" target="zwave-js-ui">
                        <span class="icon mr-3">
                          <i class="fe fe-external-link" />
                        </span>
                        <Text id="integration.zwavejsui.settings.zwave-js-ui" />
                      </Link>
                    </>
                  )}
                </p>

                {!props.usbConfigured && (
                  <div class="alert alert-danger">
                    <Text id="integration.zwavejsui.settings.zwaveNotConfiguredError" />
                  </div>
                )}

                {!props.mqttConnected && (
                  <div class="alert alert-warning">
                    <Text id="integration.zwavejsui.settings.notConnected" />
                  </div>
                )}

                {props.mqttConnected && (
                  <div class="alert alert-info">
                    <Text id="integration.zwavejsui.settings.connected" />
                  </div>
                )}

                <div class="form-group">
                  <label for="externalZwaveJSUI" class="form-label">
                    <Text id={`integration.zwavejsui.settings.externalZwaveJSUI`} />
                  </label>
                  <label class="custom-switch">
                    <input
                      type="checkbox"
                      id="externalZwaveJSUI"
                      name="externalZwaveJSUI"
                      class="custom-switch-input"
                      checked={props.externalZwaveJSUI}
                      onClick={this.toggleExternalZwavejsUI}
                    />
                    <span class="custom-switch-indicator" />
                    <span class="custom-switch-description">
                      <Text id="integration.zwavejsui.settings.externalZwaveJSUI" />
                    </span>
                  </label>
                </div>

                {props.externalZwaveJSUI && (
                  <>
                    <div class="form-group">
                      <label for="mqttUrl" class="form-label">
                        <Text id={`integration.zwavejsui.settings.urlLabel`} />
                      </label>
                      <Localizer>
                        <input
                          id="mqttUrl"
                          name="mqttUrl"
                          placeholder={<Text id="integration.zwavejsui.settings.urlPlaceholder" />}
                          value={props.mqttUrl}
                          class="form-control"
                          onInput={this.updateUrl}
                        />
                      </Localizer>
                    </div>
                    <div class="form-group">
                      <label for="mqttUsername" class="form-label">
                        <Text id={`integration.zwavejsui.settings.userLabel`} />
                      </label>
                      <Localizer>
                        <input
                          id="mqttUsername"
                          name="mqttUsername"
                          placeholder={<Text id="integration.zwavejsui.settings.userPlaceholder" />}
                          value={props.mqttUsername}
                          class="form-control"
                          onInput={this.updateUsername}
                          autoComplete="no"
                        />
                      </Localizer>
                    </div>
                    <div class="form-group">
                      <label for="mqttPassword" class="form-label">
                        <Text id={`integration.zwavejsui.settings.passwordLabel`} />
                      </label>
                      <div class="input-icon mb-3">
                        <Localizer>
                          <input
                            id="mqttPassword"
                            name="mqttPassword"
                            type={props.externalZwaveJSUI && showPassword ? 'text' : 'password'}
                            placeholder={<Text id="integration.zwavejsui.settings.passwordPlaceholder" />}
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
                    <div class="form-group">
                      <label for="mqttTopicPrefix" class="form-label">
                        <Text id={`integration.zwavejsui.settings.mqttTopicPrefixLabel`} />
                      </label>
                      <Localizer>
                        <input
                          id="mqttTopicPrefix"
                          name="mqttTopicPrefix"
                          placeholder={<Text id="integration.zwavejsui.settings.mqttTopicPrefixPlaceholder" />}
                          value={props.mqttTopicPrefix}
                          class="form-control"
                          onInput={this.updateMqttTopicPrefix}
                          autoComplete="no"
                        />
                      </Localizer>
                    </div>
                    <div class="form-group">
                      <label for="mqttTopicWithLocation" class="form-label">
                        <Text id={`integration.zwavejsui.settings.mqttTopicWithLocationLabel`} />
                      </label>
                      <label class="custom-switch">
                        <input
                          type="checkbox"
                          id="mqttTopicWithLocation"
                          name="mqttTopicWithLocation"
                          class="custom-switch-input"
                          checked={props.mqttTopicWithLocation}
                          onClick={this.toggleMqttTopicWithLocation}
                        />
                        <span class="custom-switch-indicator" />
                        <span class="custom-switch-description">
                          <Text id="integration.zwavejsui.settings.mqttTopicWithLocationDescription" />
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {!props.externalZwaveJSUI && (
                  <>
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.zwavejsui.settings.zwaveUsbDriverPathLabel" />
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
                    </div>
                    <p>
                      <Text id={`integration.zwavejsui.settings.securityKeysDescription`} />
                    </p>
                    <div class="form-group">
                      <label for="s2UnauthenticatedKey" class="form-label">
                        <Text id={`integration.zwavejsui.settings.s2UnauthenticatedKeyLabel`} />
                      </label>
                      <Localizer>
                        <input
                          id="s2UnauthenticatedKey"
                          name="s2UnauthenticatedKey"
                          placeholder={<Text id="integration.zwavejsui.settings.s2UnauthenticatedKeyPlaceholder" />}
                          value={props.s2UnauthenticatedKey}
                          class="form-control"
                          onInput={this.updateS2UnauthenticatedKey}
                          autoComplete="no"
                        />
                      </Localizer>
                    </div>
                    <div class="form-group">
                      <label for="s2AuthenticatedKey" class="form-label">
                        <Text id={`integration.zwavejsui.settings.s2AuthenticatedKeyLabel`} />
                      </label>
                      <Localizer>
                        <input
                          id="s2AuthenticatedKey"
                          name="s2AuthenticatedKey"
                          placeholder={<Text id="integration.zwavejsui.settings.s2AuthenticatedKeyPlaceholder" />}
                          value={props.s2AuthenticatedKey}
                          class="form-control"
                          onInput={this.updateS2AuthenticatedKey}
                          autoComplete="no"
                        />
                      </Localizer>
                    </div>
                    <div class="form-group">
                      <label for="s2AccessControlKey" class="form-label">
                        <Text id={`integration.zwavejsui.settings.s2AccessControlKeyLabel`} />
                      </label>
                      <Localizer>
                        <input
                          id="s2AccessControlKey"
                          name="s2AccessControlKey"
                          placeholder={<Text id="integration.zwavejsui.settings.s2AccessControlKeyPlaceholder" />}
                          value={props.s2AccessControlKey}
                          class="form-control"
                          onInput={this.updateS2AccessControlKey}
                          autoComplete="no"
                        />
                      </Localizer>
                    </div>
                    <div class="form-group">
                      <label for="s0LegacyKey" class="form-label">
                        <Text id={`integration.zwavejsui.settings.s0LegacyKeyLabel`} />
                      </label>
                      <Localizer>
                        <input
                          id="s0LegacyKey"
                          name="s0LegacyKey"
                          placeholder={<Text id="integration.zwavejsui.settings.s0LegacyKeyPlaceholder" />}
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
                    <Text id="integration.zwavejsui.settings.connectButton" />
                  </button>
                  <button class="btn btn-danger ml-2" onClick={props.disconnect}>
                    <Text id="integration.zwavejsui.settings.disconnectButton" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-header d-none d-sm-block">
          <h2 class="card-title">
            <Text id="integration.zwavejsui.settings.serviceStatus" />
          </h2>
        </div>
        <div class="row justify-content-center">
          <div class="col-auto">
            <table class="table table-responsive table-borderless table-sm d-none d-sm-block">
              <thead class="text-center">
                <tr>
                  <th class="text-center">
                    <Text id="integration.zwavejsui.settings.gladys" />
                  </th>
                  <th class="text-center" />
                  <th class="text-center">{props.mqttExist && 'MQTT'}</th>
                  <th class="text-center" />
                  <th class="text-center">{props.zwaveJSUIExist && 'zwaveJSUI'}</th>
                </tr>
              </thead>
              <tbody class="text-center">
                <tr>
                  <td class="text-center">
                    <img src="/assets/icons/favicon-96x96.png" alt={`Gladys`} title={`Gladys`} width="80" height="80" />
                  </td>
                  {props.mqttRunning && (
                    <td className={style.tdCenter}>
                      <hr className={style.line} />
                      <i
                        className={cx('fe', {
                          'fe-check': props.mqttConnected,
                          'fe-x': !props.mqttConnected,
                          greenIcon: props.mqttConnected,
                          redIcon: !props.mqttConnected
                        })}
                      />
                      <hr className={style.line} />
                    </td>
                  )}
                  <td class="text-center">
                    {props.mqttExist && (
                      <img
                        src="/assets/integrations/logos/logo_mqtt.png"
                        alt={`MQTT`}
                        title={`MQTT`}
                        width="80"
                        height="80"
                      />
                    )}
                  </td>
                  {props.zwaveJSUIRunning && (
                    <td className={('text-center', style.tdCenter)}>
                      <hr className={style.line} />
                      <i
                        className={cx('fe', {
                          'fe-check': props.zwaveJSUIConnected,
                          'fe-x': !props.zwaveJSUIConnected,
                          greenIcon: props.zwaveJSUIConnected,
                          redIcon: !props.zwaveJSUIConnected
                        })}
                      />
                      <hr className={style.line} />
                    </td>
                  )}
                  <td class="text-center">
                    {props.zwaveJSUIExist && (
                      <img
                        src="/assets/integrations/logos/logo_zwave-js-ui.png"
                        alt={`zwaveJSUI`}
                        title={`zwaveJSUI`}
                        width="80"
                        height="80"
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <td class="text-center">
                    <div class="tag tag-success">
                      <Text id={`systemSettings.containerState.running`} />
                    </div>
                  </td>
                  <td class="text-center" />
                  <td class="text-center">
                    {props.mqttRunning && (
                      <span class="tag tag-success">
                        <Text id={`systemSettings.containerState.running`} />
                      </span>
                    )}
                  </td>
                  <td class="text-center" />
                  <td class="text-center">
                    {props.zwaveJSUIRunning && (
                      <span class="tag tag-success">
                        <Text id={`systemSettings.containerState.running`} />
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-header d-sm-none">
          <h2 class="card-title">
            <Text id="integration.zwavejsui.settings.containersStatus" />
          </h2>
        </div>
        <div class="row justify-content-center d-sm-none">
          <div class="col-auto">
            <table class="table table-responsive table-borderless table-sm">
              <thead class="text-center">
                <tr>
                  <th>
                    <Text id="systemSettings.containers" />
                  </th>
                  <th>
                    <Text id="integration.zwavejsui.settings.status" />
                  </th>
                </tr>
              </thead>
              <tbody class="text-center">
                <tr>
                  <td>
                    <Text id="integration.zwavejsui.settings.gladys" />
                  </td>
                  <td>
                    <span class="tag tag-success">
                      <Text id={`systemSettings.containerState.running`} />
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Text id="integration.zwavejsui.settings.mqtt" />
                  </td>
                  <td>
                    {props.mqttRunning && (
                      <span class="tag tag-success">
                        <Text id={`systemSettings.containerState.running`} />
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <Text id="integration.zwavejsui.settings.zwaveJSUI" />
                  </td>
                  <td>
                    {props.zwaveJSUIRunning && (
                      <span class="tag tag-success">
                        <Text id={`systemSettings.containerState.running`} />
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-header d-sm-none">
          <h2 class="card-title">
            <Text id="integration.zwavejsui.settings.serviceStatus" />
          </h2>
        </div>
        <div class="row justify-content-center d-sm-none">
          <div class="col-auto">
            <table class="table table-responsive table-borderless table-sm">
              <thead class="text-center">
                <tr>
                  <th>
                    <Text id="integration.zwavejsui.settings.link" />
                  </th>
                  <th>
                    <Text id="integration.zwavejsui.settings.status" />
                  </th>
                </tr>
              </thead>
              <tbody class="text-center">
                <tr>
                  <td>
                    <Text id="integration.zwavejsui.settings.gladysMqttLink" />
                  </td>
                  <td>
                    {props.mqttRunning && (
                      <i
                        className={cx('fe', {
                          'fe-check': props.mqttConnected,
                          'fe-x': !props.mqttConnected,
                          greenIcon: props.mqttConnected,
                          redIcon: !props.mqttConnected
                        })}
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <Text id="integration.zwavejsui.settings.mqttZwavejsLink" />
                  </td>
                  <td>
                    {props.zwaveJSUIRunning && (
                      <i
                        className={cx('fe', {
                          'fe-check': props.zwaveJSUIRunning,
                          'fe-x': !props.zwaveJSUIRunning,
                          greenIcon: props.zwaveJSUIRunning,
                          redIcon: !props.zwaveJSUIRunning
                        })}
                      />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }
}

export default SettingsTab;
