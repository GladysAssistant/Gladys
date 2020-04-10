import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

class SetupTab extends Component {
  toggle = e => {
    let checked;
    console.log("Setup props : ", this.props);

    if (this.props.zigbee2mqttContainerStatus !== RequestStatus.Getting && this.props.dockerContainers) {
      checked = !this.checked;

      console.log('toggle : ', checked);

      if (checked) {
        // query API for container start
        //        this.props.startContainer("xplanet");
        this.props.startContainer();
      } else {
        this.props.stopContainer();
      }

      this.setState(checked);
    }
  };

  refreshContainersList = e => {
    this.props.getContainers();
  };

  render(props, { checked }, {}) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.zigbee2mqtt.setup.title" />
          </h3>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: props.connectMqttStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <p>
                <MarkupText id="integration.zigbee2mqtt.setup.zigbee2mqttDescription" />
              </p>
              {props.connectMqttStatus === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <Text id="integration.zigbee2mqtt.setup.error" />
                </p>
              )}
              {props.connectMqttStatus === RequestStatus.Success && !props.mqttConnected && (
                <p class="alert alert-info">
                  <Text id="integration.zigbee2mqtt.setup.connecting" />
                </p>
              )}
              {props.zigbee2mqttContainerStatus === RequestStatus.Getting && !props.mqttConnected && (
                <p class="alert alert-info">
                  <Text id="integration.zigbee2mqtt.setup.connecting" />
                </p>
              )}
              {props.mqttConnected && (
                <p class="alert alert-success">
                  <Text id="integration.zigbee2mqtt.setup.connected" />
                </p>
              )}
              {props.mqttConnectionError && (
                <p class="alert alert-danger">
                  <Text id="integration.zigbee2mqtt.setup.connectionError" /> - {props.mqttConnectionError}
                </p>
              )}

              <tr>
                <td class="text-right">
                  <label>
                    <input type="radio" class="custom-switch-input" checked={checked} onClick={this.toggle} />
                    <span class="custom-switch-indicator" />
                  </label>
                </td>
                <td>{' Enable Zigbee2mqtt'}</td>
              </tr>

              <h3 class="card-header">
                <Text id="systemSettings.containers" />
                <div class="page-options">
                  <button class="btn btn-info" onClick={this.refreshContainersList()}>
                    Refresh <i class="fe fe-refresh-cw" />
                  </button>
                </div>
              </h3>
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
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SetupTab;
