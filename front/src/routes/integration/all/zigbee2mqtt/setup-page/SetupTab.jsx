import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import CheckStatus from './CheckStatus.js';
import classNames from 'classnames/bind';
import style from './style.css';

let cx = classNames.bind(style);

class SetupTab extends Component {
  toggle = () => {
    let checked = this.props.z2mEnabled;
    checked = !checked;

    if (checked) {
      this.props.startContainer();
    } else {
      this.props.stopContainer();
    }

    this.props.z2mEnabled = checked;
  };

  render(props, {}) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.zigbee2mqtt.setup.title" />
          </h3>
        </div>
        <div class="card-body">
          <p>
            <MarkupText id="integration.zigbee2mqtt.setup.description" />
          </p>
          {props.zigbee2mqttContainerStatus === RequestStatus.Error && (
            <p class="alert alert-danger">
              <Text id="integration.zigbee2mqtt.setup.error" />
            </p>
          )}
          <CheckStatus />

          {props.zigbee2mqttConnected && (
            <p class="alert alert-success">
              <Text id="integration.zigbee2mqtt.setup.connected" />
            </p>
          )}

          {props.zigbee2mqttConnected && props.z2mUrl && (
            <div class="form-group">
              <MarkupText
                id="integration.zigbee2mqtt.setup.connectionUrl"
                fields={{
                  url: props.z2mUrl
                }}
              />
            </div>
          )}

          <div class="form-group">
            <label for="enableZigbee2mqtt" class="form-label">
              <Text id={`integration.zigbee2mqtt.setup.enableLabel`} />
            </label>
            <label class="custom-switch">
              <input
                type="checkbox"
                id="enableZigbee2mqtt"
                name="enableZigbee2mqtt"
                class="custom-switch-input"
                checked={props.z2mEnabled}
                onClick={this.toggle}
                disabled={!props.dockerBased || !props.networkModeValid || !props.usbConfigured}
              />
              <span class="custom-switch-indicator" />
              <span class="custom-switch-description">
                {!props.dockerBased && <Text id="integration.zigbee2mqtt.setup.nonDockerEnv" />}
                {props.dockerBased && !props.networkModeValid && (
                  <Text id="integration.zigbee2mqtt.setup.invalidDockerNetwork" />
                )}
                {props.dockerBased && props.networkModeValid && (
                  <Text id="integration.zigbee2mqtt.setup.enableZigbee2mqtt" />
                )}
              </span>
            </label>
          </div>
          <div class="card-header d-none d-sm-block">
            <h2 class="card-title">
              <Text id="integration.zigbee2mqtt.setup.serviceStatus" />
            </h2>
          </div>
          <div class="row justify-content-center">
            <div class="col-auto">
              <table class="table table-responsive table-borderless table-sm d-none d-sm-block">
                <thead class="text-center">
                  <tr>
                    <th class="text-center">
                      <Text id="integration.zigbee2mqtt.setup.gladys" />
                    </th>
                    <th class="text-center" />
                    <th class="text-center">{props.mqttExist && 'MQTT'}</th>
                    <th class="text-center" />
                    <th class="text-center">{props.zigbee2mqttExist && 'Zigbee2mqtt'}</th>
                  </tr>
                </thead>
                <tbody class="text-center">
                  <tr>
                    <td class="text-center">
                      <img
                        src="/assets/icons/favicon-96x96.png"
                        alt={`Gladys`}
                        title={`Gladys`}
                        width="80"
                        height="80"
                      />
                    </td>
                    {props.mqttRunning && (
                      <td className={style.tdCenter}>
                        <hr className={style.line} />
                        <i
                          className={cx('fe', {
                            'fe-check': props.gladysConnected,
                            'fe-x': !props.gladysConnected,
                            greenIcon: props.gladysConnected,
                            redIcon: !props.gladysConnected
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
                    {props.zigbee2mqttRunning && (
                      <td className={('text-center', style.tdCenter)}>
                        <hr className={style.line} />
                        <i
                          className={cx('fe', {
                            'fe-check': props.zigbee2mqttConnected,
                            'fe-x': !props.zigbee2mqttConnected,
                            greenIcon: props.zigbee2mqttConnected,
                            redIcon: !props.zigbee2mqttConnected
                          })}
                        />
                        <hr className={style.line} />
                      </td>
                    )}
                    <td class="text-center">
                      {props.zigbee2mqttExist && (
                        <img
                          src="/assets/integrations/logos/logo_zigbee2mqtt.png"
                          alt={`Zigbee2mqtt`}
                          title={`Zigbee2mqtt`}
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
                      {props.zigbee2mqttRunning && (
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
              <Text id="integration.zigbee2mqtt.setup.containersStatus" />
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
                      <Text id="integration.zigbee2mqtt.setup.status" />
                    </th>
                  </tr>
                </thead>
                <tbody class="text-center">
                  <tr>
                    <td>
                      <Text id="integration.zigbee2mqtt.setup.gladys" />
                    </td>
                    <td>
                      <span class="tag tag-success">
                        <Text id={`systemSettings.containerState.running`} />
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Text id="integration.zigbee2mqtt.setup.mqtt" />
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
                      <Text id="integration.zigbee2mqtt.setup.zigbee2Mqtt" />
                    </td>
                    <td>
                      {props.zigbee2mqttRunning && (
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
              <Text id="integration.zigbee2mqtt.setup.serviceStatus" />
            </h2>
          </div>
          <div class="row justify-content-center d-sm-none">
            <div class="col-auto">
              <table class="table table-responsive table-borderless table-sm">
                <thead class="text-center">
                  <tr>
                    <th>
                      <Text id="integration.zigbee2mqtt.setup.link" />
                    </th>
                    <th>
                      <Text id="integration.zigbee2mqtt.setup.status" />
                    </th>
                  </tr>
                </thead>
                <tbody class="text-center">
                  <tr>
                    <td>
                      <Text id="integration.zigbee2mqtt.setup.gladysMqttLink" />
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
                      <Text id="integration.zigbee2mqtt.setup.mqttZigbeeLink" />
                    </td>
                    <td>
                      {props.zigbee2mqttRunning && (
                        <i
                          className={cx('fe', {
                            'fe-check': props.zigbee2mqttConnected,
                            'fe-x': !props.zigbee2mqttConnected,
                            greenIcon: props.zigbee2mqttConnected,
                            redIcon: !props.zigbee2mqttConnected
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
    );
  }
}

export default SetupTab;
