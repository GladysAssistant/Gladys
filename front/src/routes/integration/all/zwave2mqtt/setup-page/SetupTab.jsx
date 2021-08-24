import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import classNames from 'classnames/bind';
import style from './style.css';

let cx = classNames.bind(style);

class SetupTab extends Component {
  toggle = e => {
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
            <Text id="integration.zwave2mqtt.setup.title" />
          </h3>
        </div>
        <div class="card-body">
          <p>
            <MarkupText id="integration.zwave2mqtt.setup.description" />
          </p>
          {props.zwave2mqttContainerStatus === RequestStatus.Error && (
            <p class="alert alert-danger">
              <Text id="integration.zwave2mqtt.setup.error" />
            </p>
          )}

          {props.zwave2mqttConnected && (
            <p class="alert alert-success">
              <Text id="integration.zwave2mqtt.setup.connected" />
            </p>
          )}

          <div class="form-group">
            <label for="enableZwave2mqtt" class="form-label">
              <Text id={`integration.zwave2mqtt.setup.enableLabel`} />
            </label>
            <label class="custom-switch">
              <input
                type="checkbox"
                id="enableZwave2mqtt"
                name="enableZwave2mqtt"
                class="custom-switch-input"
                checked={props.z2mEnabled}
                onClick={this.toggle}
                disabled={!props.dockerBased || !props.networkModeValid || !props.zwave2mqttConfigured}
              />
              <span class="custom-switch-indicator" />
              <span class="custom-switch-description">
                {!props.dockerBased && <Text id="integration.zwave2mqtt.setup.nonDockerEnv" />}
                {props.dockerBased && !props.networkModeValid && (
                  <Text id="integration.zwave2mqtt.setup.invalidDockerNetwork" />
                )}
                {props.dockerBased && props.networkModeValid && (
                  <Text id="integration.zwave2mqtt.setup.enableZwave2mqtt" />
                )}
              </span>
            </label>
          </div>
          <div class="card-header d-none d-sm-block">
            <h2 class="card-title">
              <Text id="integration.zwave2mqtt.setup.serviceStatus" />
            </h2>
          </div>
          <div class="row justify-content-center">
            <div class="col-auto">
              <table class="table table-responsive table-borderless table-sm d-none d-sm-block">
                <thead class="text-center">
                  <tr>
                    <th class="text-center">
                      <Text id="integration.zwave2mqtt.setup.gladys" />
                    </th>
                    <th class="text-center" />
                    <th class="text-center">{props.mqttExist && 'MQTT'}</th>
                    <th class="text-center" />
                    <th class="text-center">{props.zwave2mqttExist && 'Zwave2mqtt'}</th>
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
                    {props.mqttExist && (
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
                    {props.zwave2mqttExist && (
                      <td className={('text-center', style.tdCenter)}>
                        <hr className={style.line} />
                        <i
                          className={cx('fe', {
                            'fe-check': props.zwave2mqttConnected,
                            'fe-x': !props.zwave2mqttConnected,
                            greenIcon: props.zwave2mqttConnected,
                            redIcon: !props.zwave2mqttConnected
                          })}
                        />
                        <hr className={style.line} />
                      </td>
                    )}
                    <td class="text-center">
                      {props.zwave2mqttExist && (
                        <img
                          src="/assets/integrations/logos/logo_zwave2mqtt.png"
                          alt={`Zwave2mqtt`}
                          title={`Zwave2mqtt`}
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
                      {props.mqttConnected && (
                        <span class="tag tag-success">
                          <Text id={`systemSettings.containerState.running`} />
                        </span>
                      )}
                    </td>
                    <td class="text-center" />
                    <td class="text-center">
                      {props.zwave2mqttConnected && (
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
              <Text id="integration.zwave2mqtt.setup.containersStatus" />
            </h2>
          </div>
          <div class="row justify-content-center d-sm-none">
            <div class="col-auto">
              <table class="table table-responsive table-borderless table-sm">
                <thead class="text-center">
                  <th>
                    <Text id="systemSettings.containers" />
                  </th>
                  <th>
                    <Text id="integration.zwave2mqtt.setup.status" />
                  </th>
                </thead>
                <tbody class="text-center">
                  <tr>
                    <td>
                      <Text id="integration.zwave2mqtt.setup.gladys" />
                    </td>
                    <td>
                      <span class="tag tag-success">
                        <Text id={`systemSettings.containerState.running`} />
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Text id="integration.zwave2mqtt.setup.mqtt" />
                    </td>
                    <td>
                      {props.mqttConnected && (
                        <span class="tag tag-success">
                          <Text id={`systemSettings.containerState.running`} />
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Text id="integration.zwave2mqtt.setup.zwave2Mqtt" />
                    </td>
                    <td>
                      {props.zwave2mqttConnected && (
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
              <Text id="integration.zwave2mqtt.setup.serviceStatus" />
            </h2>
          </div>
          <div class="row justify-content-center d-sm-none">
            <div class="col-auto">
              <table class="table table-responsive table-borderless table-sm">
                <thead class="text-center">
                  <th>
                    <Text id="integration.zwave2mqtt.setup.link" />
                  </th>
                  <th>
                    <Text id="integration.zwave2mqtt.setup.status" />
                  </th>
                </thead>
                <tbody class="text-center">
                  <tr>
                    <td>
                      <Text id="integration.zwave2mqtt.setup.gladysMqttLink" />
                    </td>
                    <td>
                      {props.mqttExist && (
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
                      <Text id="integration.zwave2mqtt.setup.mqttZwaveLink" />
                    </td>
                    <td>
                      {props.zwave2mqttExist && (
                        <i
                          className={cx('fe', {
                            'fe-check': props.zwave2mqttConnected,
                            'fe-x': !props.zwave2mqttConnected,
                            greenIcon: props.zwave2mqttConnected,
                            redIcon: !props.zwave2mqttConnected
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
