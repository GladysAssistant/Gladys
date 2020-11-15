import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import CheckStatus from './CheckStatus.js';
import logo_gladys from './logo_gladys.png'
import logo_mqtt from './logo_mqtt.png'
import logo_zigbee2mqtt from './logo_zigbee2mqtt.png'

class SetupTab extends Component {
  toggle = e => {
    console.log('toggle : ', checked);
    let checked = this.props.z2mEnabled;
    checked = !checked;
    console.log('toggle : ', checked);
    console.log(this.props.dockerContainers);

    if (checked) {
      console.log('Starting Containers :');
      this.props.startContainer();
    } else {
      console.log('Stopping Containers :');
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
          { props.zigbee2mqttContainerStatus === RequestStatus.Error && (
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
            <label class="custom-swith">
              <input
                type="checkbox"
                id="enableZigbee2mqtt"
                name="enableZigbee2mqtt"
                class="custom-switch-input"
                checked={props.z2mEnabled}
                onClick={this.toggle}
                disabled={!props.dockerBased || !props.networkModeValid /*|| this.props.zigbee2mqttStatus === RequestStatus.Getting*/}
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

          <br />
          <div class="card-header">
            <h2 class="card-title">
              <Text id="integration.zigbee2mqtt.setup.containersStatus" />
            </h2>
          </div>
          <table class="table table-responsive table-borderless table-sm">
            <thead>
              <tr>
                <th class="text-center">Gladys</th>
                <th class="text-center"></th>
                <th class="text-center">{ props.mqttExist && "MQTT" }</th>
                <th class="text-center"></th>
                <th class="text-center">{ props.zigbee2mqttExist && "Zigbee2mqtt" }</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-center"><img src={logo_gladys} alt="Gladys" title="Gladys" width="80" height="80" /></td>
                <td class="text-center" style="vertical-align:middle;display:flex;align-items:center;">
                   <hr style={{ color: '#00f', backgroundColor: '#00f', borderColor: '#00f', height: 2, width: 40 }}></hr>
                    { props.mqttRunning && props.gladysConnected && <i style={{ color: '#0f0', fontSize: '24px' }} class="fe fe-check"></i> }
                    { props.mqttRunning && !props.gladysConnected && <i style={{ color: '#f00', fontSize: '24px' }} class="fe fe-x"></i> }
                    <hr style={{ color: '#00f', backgroundColor: '#00f', borderColor: '#00f', height: 2, width: 40 }}></hr>
                </td>
                <td class="text-center">{ props.mqttExist && <img src={logo_mqtt} alt="MQTT" title="MQTT" width="80" height="80" /> }</td>
                <td class="text-center" style="vertical-align:middle;display:flex;align-items:center;">
                  { props.zigbee2mqttExist && <hr style={{ color: '#00f', backgroundColor: '#00f', borderColor: '#00f', height: 2, width: 40 }}></hr> }
                  { props.zigbee2mqttRunning && props.zigbee2mqttConnected && <i style={{ color: '#0f0', fontSize: '24px' }} class="fe fe-check"></i> }
                  { props.zigbee2mqttRunning && !props.zigbee2mqttConnected && <i style={{ color: '#f00', fontSize: '24px' }} class="fe fe-x"></i> }
                  { props.zigbee2mqttExist && <hr style={{ color: '#00f', backgroundColor: '#00f', borderColor: '#00f', height: 2, width: 40 }}></hr> }
                </td>
                <td class="text-center">{ props.zigbee2mqttExist && <img src={logo_zigbee2mqtt} alt="Zigbee2mqtt" title="Zigbee2mqtt" width="80" height="80" /> }</td>
              </tr>
              <tr>
                <td class="text-center"><div class="tag tag-success">Running</div></td>
                <td class="text-center"></td>
                <td class="text-center">{ props.mqttRunning && <span class="tag tag-success">Running</span> }</td>
                <td class="text-center"></td>
                <td class="text-center">{ props.zigbee2mqttRunning && <span class="tag tag-success">Running</span> }</td>
              </tr>
            </tbody>
          </table>
        </div>
        <br />
        <br />
        <div class="card-header">
          <h2 class="card-title">
            <Text id="integration.zigbee2mqtt.setup.containersTitle" />
          </h2>
          <div class="page-options d-flex">
            <button class="btn btn-info" onClick={props.getContainers}>
              Refresh <i class="fe fe-refresh-cw" />
            </button>
          </div>
        </div>
        <div class="table-responsive" style={{ maxHeight: '200px' }}>
          <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
            <thead>
              <tr>
                <th>
                  <Text id="systemSettings.containerName" />
                </th>
                <th>
                  <Text id="systemSettings.containerCreated" />
                </th>
                <th>
                  <Text id="systemSettings.containerStatus" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {props.dockerContainers &&
                props.dockerContainers.map(container => (
                  <tr>
                    <td>{container.name}</td>
                    <td>{container.created_at_formatted}</td>
                    <td>
                      <span
                        class={cx('badge', {
                          'badge-success': container.state === 'running',
                          'badge-warning': container.state !== 'running'
                        })}
                      >
                        <Text id={`systemSettings.containerState.${container.state}`} />
                      </span>
                    </td>
                    <td>
                      <span
                        class={cx('dimmer', {
                          active: container.state === 'starting' || container.state === 'stopping'
                        })}
                      >
                        <div class="loader" />
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default SetupTab;
