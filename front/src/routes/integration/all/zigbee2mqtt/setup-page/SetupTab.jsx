import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import CheckStatus from '../commons/CheckStatus.js';

class SetupTab extends Component {
  toggle = e => {
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
          <CheckStatus />

          <p>
            <MarkupText id="integration.zigbee2mqtt.setup.description" />
          </p>
          {props.zigbee2mqttContainerStatus === RequestStatus.Error && (
            <p class="alert alert-danger">
              <Text id="integration.zigbee2mqtt.setup.error" />
            </p>
          )}
          {props.mqttConnected && (
            <p class="alert alert-success">
              <Text id="integration.zigbee2mqtt.setup.connected" />
            </p>
          )}

          <tr>
            <td class="text-right">
              <label>
                <input
                  type="checkbox"
                  class="custom-switch-input"
                  checked={props.z2mEnabled}
                  onClick={this.toggle}
                  disabled={this.props.zigbee2mqttContainerStatus === RequestStatus.Getting}
                />
                <span class="custom-switch-indicator" />
              </label>
            </td>
            <td>
              &nbsp;
              <Text id="integration.zigbee2mqtt.setup.enable" />
            </td>
          </tr>

          <h3 class="card-header">
            <Text id="integration.zigbee2mqtt.setup.containersTitle" />
            <div class="page-options">
              <button class="btn btn-info" onClick={props.getContainers}>
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
      </div>
    );
  }
}

export default SetupTab;
