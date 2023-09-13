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
    if (useEmbeddedBroker) {
      config.mqttUrl = 'mqtt://localhost';
    }
    this.props.updateConfiguration(config);
  };

  render(props) {
    let alertMessage = null;

    const { connectMqttStatus, mqttConnected, mqttConnectionError } = props;
    switch (connectMqttStatus) {
      case RequestStatus.Error:
        // Error while updating setup
        alertMessage = (
          <p class="alert alert-danger">
            <Text id="integration.mqtt.setup.error" />
          </p>
        );
        break;
      case RequestStatus.Success:
        // Updating setup with success = connecting...
        alertMessage = (
          <p class="alert alert-info">
            <Text id="integration.mqtt.setup.connecting" />
          </p>
        );
        break;
      default:
        if (mqttConnectionError === 'DISCONNECTED') {
          alertMessage = (
            <p class="alert alert-info">
              <Text id="integration.mqtt.setup.disconnected" />
            </p>
          );
        } else if (mqttConnectionError === RequestStatus.NetworkError) {
          alertMessage = (
            <p class="alert alert-danger">
              <Text id="integration.mqtt.setup.networkError" />
            </p>
          );
        } else if (mqttConnectionError || mqttConnected === false) {
          alertMessage = (
            <p class="alert alert-danger">
              <Text id="integration.mqtt.setup.connectionError" />
            </p>
          );
        } else if (mqttConnected) {
          // Well connected
          alertMessage = (
            <p class="alert alert-success">
              <Text id="integration.mqtt.setup.connected" />
            </p>
          );
        }
    }

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
              {alertMessage}

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
                    disabled={!props.dockerBased || !props.networkModeValid}
                  />
                  <span class="custom-switch-indicator" />
                  <span class="custom-switch-description">
                    {!props.dockerBased && <Text id="integration.mqtt.setup.nonDockerEnv" />}
                    {props.dockerBased && !props.networkModeValid && (
                      <Text id="integration.mqtt.setup.invalidDockerNetwork" />
                    )}
                    {props.dockerBased && props.networkModeValid && (
                      <Text id="integration.mqtt.setup.installBrokerContainer" />
                    )}
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
