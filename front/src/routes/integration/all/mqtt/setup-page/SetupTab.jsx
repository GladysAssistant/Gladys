import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import SetupForm from './SetupForm';
import SetupBrokerContainer from './SetupBrokerContainer';

class SetupTab extends Component {
  updateDockerUsage = () => {
    const useEmbeddedBroker = !this.props.useEmbeddedBroker;
    const config = { useEmbeddedBroker };
    this.props.updateConfiguration(config);
  };

  render(props) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.mqtt.setup.title" />
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
                <MarkupText id="integration.mqtt.setup.mqttDescription" />
              </p>
              {props.connectMqttStatus === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <Text id="integration.mqtt.setup.error" />
                </p>
              )}
              {props.connectMqttStatus === RequestStatus.Success && !props.mqttConnected && (
                <p class="alert alert-info">
                  <Text id="integration.mqtt.setup.connecting" />
                </p>
              )}
              {props.mqttConnected && (
                <p class="alert alert-success">
                  <Text id="integration.mqtt.setup.connected" />
                </p>
              )}
              {props.mqttConnectionError && (
                <p class="alert alert-danger">
                  <Text id="integration.mqtt.setup.connectionError" />
                </p>
              )}

              <div class="form-group">
                <label for="embeddedBroker" class="form-label">
                  <Text id={`integration.mqtt.setup.embeddedBrokerLabel`} />
                </label>
                <label class="custom-swith">
                  <input
                    type="checkbox"
                    id="useEmbeddedBroker"
                    name="useEmbeddedBroker"
                    class="custom-switch-input"
                    checked={props.useEmbeddedBroker}
                    onClick={this.updateDockerUsage}
                    disabled={!props.dockerBased}
                  />
                  <span class="custom-switch-indicator" />
                  <span class="custom-switch-description">
                    {!props.dockerBased && <Text id="integration.mqtt.setup.nonDockerEnv" />}
                    {props.dockerBased && <Text id="integration.mqtt.setup.installBrokerContainer" />}
                  </span>
                </label>
              </div>

              {props.useEmbeddedBroker && !props.brokerContainerAvailable && <SetupBrokerContainer {...props} />}

              {(!props.useEmbeddedBroker || props.brokerContainerAvailable) && <SetupForm {...props} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SetupTab;
