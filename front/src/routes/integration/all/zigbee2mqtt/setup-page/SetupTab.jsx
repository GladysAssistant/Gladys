import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import CheckStatus from './CheckStatus.js';
import logoGladys from './logo_gladys.png';
import logoMqtt from './logo_mqtt.png';
import logoZigbee2mqtt from './logo_zigbee2mqtt.png';

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
                disabled={!props.dockerBased || !props.networkModeValid}
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
                    <th class="text-center">{`Gladys`}</th>
                    <th class="text-center" />
                    <th class="text-center">{props.mqttExist && 'MQTT'}</th>
                    <th class="text-center" />
                    <th class="text-center">{props.zigbee2mqttExist && 'Zigbee2mqtt'}</th>
                  </tr>
                </thead>
                <tbody class="text-center">
                  <tr>
                    <td class="text-center">
                      <img src={logoGladys} alt={`Gladys`} title={`Gladys`} width="80" height="80" />
                    </td>
                    <td class="text-center" style="vertical-align:middle;display:flex;align-items:center;">
                      {props.mqttRunning && (
                        <hr
                          style={{ color: '#00f', backgroundColor: '#00f', borderColor: '#00f', height: 2, width: 40 }}
                        />
                      )}
                      {props.mqttRunning && props.gladysConnected && (
                        <i style={{ color: '#0f0', fontSize: '24px' }} class="fe fe-check" />
                      )}
                      {props.mqttRunning && !props.gladysConnected && (
                        <i style={{ color: '#f00', fontSize: '24px' }} class="fe fe-x" />
                      )}
                      {props.mqttRunning && (
                        <hr
                          style={{ color: '#00f', backgroundColor: '#00f', borderColor: '#00f', height: 2, width: 40 }}
                        />
                      )}
                    </td>
                    <td class="text-center">
                      {props.mqttExist && <img src={logoMqtt} alt={`MQTT`} title={`MQTT`} width="80" height="80" />}
                    </td>
                    <td class="text-center" style="vertical-align:middle;display:flex;align-items:center;">
                      {props.zigbee2mqttRunning && (
                        <hr
                          style={{ color: '#00f', backgroundColor: '#00f', borderColor: '#00f', height: 2, width: 40 }}
                        />
                      )}
                      {props.zigbee2mqttRunning && props.zigbee2mqttConnected && (
                        <i style={{ color: '#0f0', fontSize: '24px' }} class="fe fe-check" />
                      )}
                      {props.zigbee2mqttRunning && !props.zigbee2mqttConnected && (
                        <i style={{ color: '#f00', fontSize: '24px' }} class="fe fe-x" />
                      )}
                      {props.zigbee2mqttRunning && (
                        <hr
                          style={{ color: '#00f', backgroundColor: '#00f', borderColor: '#00f', height: 2, width: 40 }}
                        />
                      )}
                    </td>
                    <td class="text-center">
                      {props.zigbee2mqttExist && (
                        <img src={logoZigbee2mqtt} alt={`Zigbee2mqtt`} title={`Zigbee2mqtt`} width="80" height="80" />
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
                  <th>
                    <Text id="systemSettings.containers" />
                  </th>
                  <th>{`Status`}</th>
                </thead>
                <tbody class="text-center">
                  <tr>
                    <td>{`Gladys`}</td>
                    <td>
                      <span class="tag tag-success">
                        <Text id={`systemSettings.containerState.running`} />
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>{`MQTT`}</td>
                    <td>
                      {props.mqttRunning && (
                        <span class="tag tag-success">
                          <Text id={`systemSettings.containerState.running`} />
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>{`Zigbee2mqtt`}</td>
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
                  <th>
                    <Text id="integration.zigbee2mqtt.setup.link" />
                  </th>
                  <th>{`Status`}</th>
                </thead>
                <tbody class="text-center">
                  <tr>
                    <td>{`Gladys - MQTT`}</td>
                    <td>
                      {props.zigbee2mqttExist && props.zigbee2mqttConnected && (
                        <i style={{ color: '#0f0', fontSize: '24px' }} class="fe fe-check" />
                      )}
                      {props.zigbee2mqttExist && !props.zigbee2mqttConnected && (
                        <i style={{ color: '#f00', fontSize: '24px' }} class="fe fe-x" />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>{`MQTT - Zigbee`}</td>
                    <td>
                      {props.zigbee2mqttExist && props.zigbee2mqttConnected && (
                        <i style={{ color: '#0f0', fontSize: '24px' }} class="fe fe-check" />
                      )}
                      {props.zigbee2mqttExist && !props.zigbee2mqttConnected && (
                        <i style={{ color: '#f00', fontSize: '24px' }} class="fe fe-x" />
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
