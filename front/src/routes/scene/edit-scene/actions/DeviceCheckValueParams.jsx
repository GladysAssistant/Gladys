import { Component } from 'preact';
import { connect } from 'unistore/preact';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import BinaryDeviceState from '../triggers/device-states/BinaryDeviceState';
import ButtonClickDeviceState from '../triggers/device-states/ButtonClickDeviceState';
import DefaultDeviceState from '../triggers/device-states/DefaultDeviceState';
import PilotWireModeDeviceState from '../triggers/device-states/PilotWireModeDeviceState';
import LevelSensorDeviceState from '../triggers/device-states/LevelSensorDeviceState';
import LevelMatterSensorDeviceState from '../triggers/device-states/LevelMatterSensorDeviceState';

class DeviceCheckValueParams extends Component {
  onDeviceFeatureChange = deviceFeature => {
    this.setState({ selectedDeviceFeature: deviceFeature });
    if (deviceFeature) {
      this.props.updateActionProperty(this.props.path, 'device_feature', deviceFeature.selector);
      if (deviceFeature.selector !== this.props.action.device_feature) {
        this.props.updateActionProperty(this.props.path, 'value', undefined);
        this.props.updateActionProperty(this.props.path, 'operator', undefined);
      }
    } else {
      this.props.updateActionProperty(this.props.path, 'device_feature', null);
    }
  };

  // Adapts action props into trigger-compatible props for reuse of device state sub-components
  getTriggerProps = () => ({
    trigger: { value: this.props.action.value, operator: this.props.action.operator },
    index: 0,
    updateTriggerProperty: (index, key, value) => {
      if (key === 'threshold_only') return;
      this.props.updateActionProperty(this.props.path, key, value);
    },
    selectedDeviceFeature: this.state.selectedDeviceFeature
  });

  render(props, { selectedDeviceFeature }) {
    let binaryDevice = false;
    let buttonClickDevice = false;
    let pilotWireModeDevice = false;
    let levelSensorDevice = false;
    let levelMatterSensorDevice = false;

    if (selectedDeviceFeature) {
      const { category, type } = selectedDeviceFeature;
      binaryDevice =
        type === DEVICE_FEATURE_TYPES.SWITCH.BINARY ||
        category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR;
      buttonClickDevice = category === DEVICE_FEATURE_CATEGORIES.BUTTON;
      pilotWireModeDevice = category === DEVICE_FEATURE_CATEGORIES.HEATER;
      levelSensorDevice =
        category === DEVICE_FEATURE_CATEGORIES.LEVEL_SENSOR &&
        type === DEVICE_FEATURE_TYPES.LEVEL_SENSOR.LIQUID_STATE;
      levelMatterSensorDevice = category === DEVICE_FEATURE_CATEGORIES.VOC_MATTER_INDEX_SENSOR;
    }

    const defaultDevice =
      selectedDeviceFeature &&
      !binaryDevice &&
      !buttonClickDevice &&
      !pilotWireModeDevice &&
      !levelSensorDevice &&
      !levelMatterSensorDevice;

    const triggerProps = this.getTriggerProps();

    return (
      <div>
        <div class="row">
          <div class="col-12 col-md-6">
            <div class="form-group">
              <SelectDeviceFeature
                value={props.action.device_feature}
                onDeviceFeatureChange={this.onDeviceFeatureChange}
              />
            </div>
          </div>
          {binaryDevice && <BinaryDeviceState {...triggerProps} />}
          {buttonClickDevice && <ButtonClickDeviceState {...triggerProps} />}
          {pilotWireModeDevice && <PilotWireModeDeviceState {...triggerProps} />}
          {levelSensorDevice && <LevelSensorDeviceState {...triggerProps} />}
          {levelMatterSensorDevice && <LevelMatterSensorDeviceState {...triggerProps} />}
          {defaultDevice && <DefaultDeviceState {...triggerProps} />}
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceCheckValueParams);
