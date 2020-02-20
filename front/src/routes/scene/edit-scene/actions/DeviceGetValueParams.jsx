import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';

@connect('httpClient', {})
class DeviceGetValue extends Component {
  onDeviceFeatureChange = deviceFeature => {
    const { columnIndex, index } = this.props;
    if (deviceFeature) {
      this.props.updateActionProperty(columnIndex, index, 'device_feature', deviceFeature.selector);
    } else {
      this.props.updateActionProperty(columnIndex, index, 'device_feature', null);
    }
  };

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
            <span class="form-required">*</span>
          </label>
          <SelectDeviceFeature value={action.device_feature} onDeviceFeatureChange={this.onDeviceFeatureChange} />
        </div>
      </div>
    );
  }
}

export default DeviceGetValue;
