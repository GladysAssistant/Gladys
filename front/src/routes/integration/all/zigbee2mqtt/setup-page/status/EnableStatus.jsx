import { Component, Fragment } from 'preact';
import { MarkupText, Text } from 'preact-i18n';

import { RequestStatus } from '../../../../../../utils/consts';

class EnableStatus extends Component {
  toggleZ2M = e => {
    const z2mEnabled = e.target.checked;
    this.setState({
      z2mEnabled
    });
    this.props.toggleZ2M(z2mEnabled);
  };

  constructor(props) {
    super(props);

    const { zigbee2mqttStatus = {} } = props;
    const { z2mEnabled } = zigbee2mqttStatus;
    this.state = {
      z2mEnabled
    };
  }

  componentWillReceiveProps(nextProps) {
    const { setupZigee2mqttStatus, zigbee2mqttStatus = {} } = nextProps;
    if (setupZigee2mqttStatus !== RequestStatus.Getting) {
      const { z2mEnabled } = zigbee2mqttStatus;
      this.setState({
        z2mEnabled
      });
    }
  }

  render({ disabled, loadZigbee2mqttStatus, toggleZigee2mqttStatus }, { z2mEnabled }) {
    return (
      <Fragment>
        <div class="d-flex flex-row">
          <div class="form-group">
            <label for="enableZigbee2mqtt" class="form-label">
              <Text id="integration.zigbee2mqtt.setup.enableLabel" />
            </label>
            <small class="form-text">
              <MarkupText id="integration.zigbee2mqtt.setup.enableDescription" />
            </small>
          </div>
          <div class="ml-auto mr-3">
            <label class="custom-switch">
              <input
                type="checkbox"
                id="enableZigbee2mqtt"
                name="enableZigbee2mqtt"
                class="custom-switch-input"
                checked={z2mEnabled}
                onClick={this.toggleZ2M}
                disabled={disabled || loadZigbee2mqttStatus === RequestStatus.Error}
              />
              <span class="custom-switch-indicator" />
            </label>
          </div>
        </div>
        <div>
          {toggleZigee2mqttStatus === RequestStatus.Error && (
            <div class="alert alert-danger my-3" data-cy="z2m-setup-save-error">
              <Text id="integration.zigbee2mqtt.setup.toggleError" />
            </div>
          )}
        </div>
      </Fragment>
    );
  }
}

export default EnableStatus;
