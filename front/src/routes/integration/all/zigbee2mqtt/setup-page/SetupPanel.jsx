import { Component } from 'preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../../utils/consts';

import { SETUP_MODES } from './constants.js';
import SetupModePanel from './SetupModePanel.jsx';
import SetupLocalMode from './local/SetupLocalMode.jsx';
import RunningStatus from './RunningStatus';

class SetupPanel extends Component {
  resetSetupMode = () => {
    this.setState({ setupMode: null, edited: true });
  };

  selectSetupMode = setupMode => {
    this.setState({ setupMode, edited: true });
  };

  resetConfiguration = () => {
    const { configuration } = this.props;
    this.setState({ configuration, edited: false });
  };

  saveConfiguration = configuration => {
    this.setState({ configuration, edited: true });
  };

  setup = () => {
    this.props.saveConfiguration(this.state.configuration);
  };

  constructor(props) {
    super(props);

    const { configuration, zigbee2mqttStatus = {} } = props;

    this.state = {
      setupMode: zigbee2mqttStatus.usbConfigured ? SETUP_MODES.LOCAL : null,
      configuration
    };
  }

  render({ zigbee2mqttStatus = {}, setupZigee2mqttStatus, httpClient }, { setupMode, configuration, edited }) {
    const { dockerBased, networkModeValid, usbConfigured } = zigbee2mqttStatus;
    const disabled = setupZigee2mqttStatus === RequestStatus.Getting;

    return (
      <div class="card-body">
        <ul class="list-group list-group-flush list-unstyled">
          <li class="list-group-item">
            <SetupModePanel
              dockerBased={dockerBased}
              networkModeValid={networkModeValid}
              usbConfigured={usbConfigured}
              setupMode={setupMode}
              selectSetupMode={this.selectSetupMode}
              resetSetupMode={this.resetSetupMode}
              disabled={disabled}
            />
          </li>
          {setupMode === SETUP_MODES.LOCAL && (
            <li class="list-group-item">
              <SetupLocalMode
                configuration={configuration}
                httpClient={httpClient}
                saveConfiguration={this.saveConfiguration}
                disabled={disabled}
              />
            </li>
          )}
          {edited && configuration && (
            <li class="list-group-item">
              {setupZigee2mqttStatus === RequestStatus.Error && (
                <div class="alert alert-danger" data-cy="z2m-setup-save-error">
                  <Text id="integration.zigbee2mqtt.setup.saveError" />
                </div>
              )}
              <div class="alert alert-secondary" data-cy="z2m-setup-save-information">
                <Text id="integration.zigbee2mqtt.setup.saveInformation" />
              </div>
              <div class="d-flex">
                <button
                  class="btn btn-success mx-auto"
                  onClick={this.setup}
                  disabled={disabled}
                  data-cy="z2m-setup-save"
                >
                  <i class="fe fe-save mr-2" />
                  <Text id="global.save" />
                </button>
                <button
                  class="btn btn-primary mx-auto"
                  onClick={this.resetConfiguration}
                  disabled={disabled}
                  data-cy="z2m-setup-reset"
                >
                  <i class="fe fe-rotate-ccw mr-2" />
                  <Text id="integration.zigbee2mqtt.setup.resetLabel" />
                </button>
              </div>
            </li>
          )}
          {!edited && (
            <li class="list-group-item">
              <RunningStatus zigbee2mqttStatus={zigbee2mqttStatus} />
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default SetupPanel;
