import { Component } from 'preact';
import { connect } from 'unistore/preact';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import BinaryDeviceState from './device-states/BinaryDeviceState';
import PresenceSensorDeviceState from './device-states/PresenceSensorDeviceState';
import ThresholdDeviceState from './device-states/ThresholdDeviceState';
import DefaultDeviceState from './device-states/DefaultDeviceState';
import ButtonClickDeviceState from './device-states/ButtonClickDeviceState';

class TurnOnLight extends Component {
  onDeviceFeatureChange = deviceFeature => {
    this.setState({ selectedDeviceFeature: deviceFeature });
    if (deviceFeature) {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', deviceFeature.selector);
      if (deviceFeature.selector !== this.props.trigger.device_feature) {
        this.props.updateTriggerProperty(this.props.index, 'value', null);
      }
    } else {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', null);
    }
  };

  render(props, { selectedDeviceFeature }) {
    let binaryDevice = false;
    let presenceDevice = false;
    let buttonClickDevice = false;

    if (selectedDeviceFeature) {
      const { category, type } = selectedDeviceFeature;

      binaryDevice = type === DEVICE_FEATURE_TYPES.SWITCH.BINARY;
      presenceDevice = category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR;
      buttonClickDevice = category === DEVICE_FEATURE_CATEGORIES.BUTTON;
    }

    const defaultDevice = selectedDeviceFeature && !binaryDevice && !presenceDevice && !buttonClickDevice;
    const thresholdDevice = selectedDeviceFeature && !presenceDevice && !buttonClickDevice;

    return (
      <div>
        <div class="row">
          <div class="col-12 col-md-6">
            <div class="form-group">
              <SelectDeviceFeature
                value={props.trigger.device_feature}
                onDeviceFeatureChange={this.onDeviceFeatureChange}
              />
            </div>
          </div>
          {binaryDevice && <BinaryDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
          {presenceDevice && <PresenceSensorDeviceState {...props} />}
          {buttonClickDevice && <ButtonClickDeviceState {...props} />}
          {defaultDevice && <DefaultDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
        </div>
        {thresholdDevice && <ThresholdDeviceState {...props} />}
      </div>
    );
  }
}

export default connect('httpClient', {})(TurnOnLight);
