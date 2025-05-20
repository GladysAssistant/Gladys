import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import BinaryDeviceState from './device-states/BinaryDeviceState';
import PresenceSensorDeviceState from './device-states/PresenceSensorDeviceState';
import ThresholdDeviceState from './device-states/ThresholdDeviceState';
import DefaultDeviceState from './device-states/DefaultDeviceState';
import ButtonClickDeviceState from './device-states/ButtonClickDeviceState';
import PilotWireModeDeviceState from './device-states/PilotWireModeDeviceState';
import LevelSensorDeviceState from './device-states/LevelSensorDeviceState';

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

  onForDurationChange = e => {
    e.preventDefault();
    if (e.target.value) {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', Number(e.target.value) * 60 * 1000);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', '');
    }
  };

  enableOrDisableForDuration = e => {
    e.preventDefault();
    if (e.target.checked) {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', 60 * 1000);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', undefined);
    }
  };

  render(props, { selectedDeviceFeature }) {
    let binaryDevice = false;
    let presenceDevice = false;
    let buttonClickDevice = false;
    let pilotWireModeDevice = false;
    let levelSensorDevice = false;

    if (selectedDeviceFeature) {
      const { category, type } = selectedDeviceFeature;

      binaryDevice = type === DEVICE_FEATURE_TYPES.SWITCH.BINARY;
      presenceDevice = category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR;
      buttonClickDevice = category === DEVICE_FEATURE_CATEGORIES.BUTTON;
      pilotWireModeDevice = category === DEVICE_FEATURE_CATEGORIES.HEATER;
      levelSensorDevice =
        category === DEVICE_FEATURE_CATEGORIES.LEVEL_SENSOR && type === DEVICE_FEATURE_TYPES.LEVEL_SENSOR.LIQUID_STATE;
    }

    const defaultDevice =
      selectedDeviceFeature &&
      !binaryDevice &&
      !presenceDevice &&
      !buttonClickDevice &&
      !pilotWireModeDevice &&
      !levelSensorDevice;

    const thresholdDevice =
      selectedDeviceFeature && !presenceDevice && !buttonClickDevice && !pilotWireModeDevice && !levelSensorDevice;

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
          {presenceDevice && <PresenceSensorDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
          {buttonClickDevice && <ButtonClickDeviceState {...props} />}
          {pilotWireModeDevice && <PilotWireModeDeviceState {...props} />}
          {levelSensorDevice && <LevelSensorDeviceState {...props} />}
          {defaultDevice && <DefaultDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
        </div>
        {thresholdDevice && <ThresholdDeviceState {...props} />}
        <div class="row">
          <div class="col-12">
            <label class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                checked={props.trigger.for_duration !== undefined}
                onChange={this.enableOrDisableForDuration}
              />
              <span class="form-check-label">
                <Text id="editScene.triggersCard.newState.activateOrDeactivateForDuration" />
              </span>
            </label>
          </div>
        </div>
        {props.trigger.for_duration !== undefined && (
          <div class="row">
            <div class="col">
              <div class="form-group">
                <div class="input-group">
                  <Localizer>
                    <input
                      type="number"
                      class="form-control"
                      placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
                      value={
                        Number.isInteger(props.trigger.for_duration)
                          ? props.trigger.for_duration / 60 / 1000
                          : props.trigger.for_duration
                      }
                      onChange={this.onForDurationChange}
                    />
                  </Localizer>
                  <span class="input-group-append" id="basic-addon2">
                    <span class="input-group-text">
                      <Text id="deviceFeatureUnitShort.minutes" />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect('httpClient', {})(TurnOnLight);
