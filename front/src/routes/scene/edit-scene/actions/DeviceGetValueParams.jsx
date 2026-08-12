import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import { getDeviceFeatureName } from '../../../../utils/device';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import { DeviceFeatureTypesString } from '../../../../utils/consts';

class DeviceGetValue extends Component {
  onDeviceFeatureChange = (deviceFeature, device) => {
    if (deviceFeature) {
      this.props.updateActionProperty(this.props.path, 'device_feature', deviceFeature.selector);
      this.setVariables(device, deviceFeature);
    } else {
      this.props.updateActionProperty(this.props.path, 'device_feature', null);
      this.setVariables();
    }
    this.setState({ deviceFeature, device });
  };

  setVariables = (device, deviceFeature) => {
    const DEFAULT_VARIABLE_NAME = get(this.props.intl.dictionary, 'editScene.variables.device.get-value.last_value');
    let name = 'last_value';
    if (device && DeviceFeatureTypesString.includes(deviceFeature.type)) {
      name = 'last_value_string';
    }

    this.props.setVariables(this.props.path, [
      {
        name,
        type: 'device_feature',
        ready: device && deviceFeature,
        label:
          device && deviceFeature
            ? getDeviceFeatureName(this.props.intl.dictionary, device, deviceFeature)
            : DEFAULT_VARIABLE_NAME,
        data: {
          device,
          deviceFeature
        }
      }
    ]);
  };

  componentDidMount() {
    const { device, deviceFeature } = this.state;
    this.setVariables(device, deviceFeature);
  }

  render(props, {}) {
    const { action } = props;
    return (
      <div>
        <div class="form-group">
          <p>
            <Text id="editScene.actionsCard.deviceGetValue.description" />
          </p>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.deviceGetValue.deviceLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <SelectDeviceFeature value={action.device_feature} onDeviceFeatureChange={this.onDeviceFeatureChange} />
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(DeviceGetValue));
