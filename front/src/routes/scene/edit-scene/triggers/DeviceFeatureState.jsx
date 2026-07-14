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
import FanModeDeviceState from './device-states/FanModeDeviceState';
import FanLabeledDeviceState from './device-states/FanLabeledDeviceState';
import LevelSensorDeviceState from './device-states/LevelSensorDeviceState';
import LevelMatterSensorDeviceState from './device-states/LevelMatterSensorDeviceState';

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

  getForDurationUnit = trigger => trigger.unit || 'minute';

  getForDurationMultiplier = unit => (unit === 'second' ? 1000 : 60 * 1000);

  getForDurationDisplayValue = trigger => {
    if (!Number.isInteger(trigger.for_duration)) {
      return trigger.for_duration;
    }

    return trigger.for_duration / this.getForDurationMultiplier(this.getForDurationUnit(trigger));
  };

  onForDurationChange = e => {
    e.preventDefault();
    if (e.target.value) {
      const unit = this.getForDurationUnit(this.props.trigger);
      this.props.updateTriggerProperty(
        this.props.index,
        'for_duration',
        Number(e.target.value) * this.getForDurationMultiplier(unit)
      );
    } else {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', '');
    }
  };

  onForDurationUnitChange = e => {
    e.preventDefault();
    const newUnit = e.target.value;
    const currentUnit = this.getForDurationUnit(this.props.trigger);

    if (newUnit !== currentUnit && Number.isInteger(this.props.trigger.for_duration)) {
      const displayValue = this.getForDurationDisplayValue(this.props.trigger);
      this.props.updateTriggerProperty(
        this.props.index,
        'for_duration',
        displayValue * this.getForDurationMultiplier(newUnit)
      );
    }

    this.props.updateTriggerProperty(this.props.index, 'unit', newUnit);
  };

  enableOrDisableForDuration = e => {
    e.preventDefault();
    if (e.target.checked) {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', 60 * 1000);
      this.props.updateTriggerProperty(this.props.index, 'unit', 'minute');
    } else {
      this.props.updateTriggerProperty(this.props.index, 'for_duration', undefined);
      this.props.updateTriggerProperty(this.props.index, 'unit', undefined);
    }
  };

  render(props, { selectedDeviceFeature }) {
    let binaryDevice = false;
    let presenceDevice = false;
    let buttonClickDevice = false;
    let pilotWireModeDevice = false;
    let fanModeDevice = false;
    let fanLabeledDevice = false;
    let levelSensorDevice = false;
    let levelMatterSensorDevice = false;

    if (selectedDeviceFeature) {
      const { category, type } = selectedDeviceFeature;

      binaryDevice = type === DEVICE_FEATURE_TYPES.SWITCH.BINARY;
      presenceDevice = category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR;
      buttonClickDevice = category === DEVICE_FEATURE_CATEGORIES.BUTTON;
      pilotWireModeDevice = category === DEVICE_FEATURE_CATEGORIES.HEATER;
      fanModeDevice = category === DEVICE_FEATURE_CATEGORIES.FAN && type === DEVICE_FEATURE_TYPES.FAN.MODE;
      fanLabeledDevice =
        category === DEVICE_FEATURE_CATEGORIES.FAN &&
        [
          DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING,
          DEVICE_FEATURE_TYPES.FAN.WIND_SETTING,
          DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION
        ].includes(type);
      levelSensorDevice =
        category === DEVICE_FEATURE_CATEGORIES.LEVEL_SENSOR && type === DEVICE_FEATURE_TYPES.LEVEL_SENSOR.LIQUID_STATE;
      levelMatterSensorDevice =
        category === DEVICE_FEATURE_CATEGORIES.VOC_MATTER_INDEX_SENSOR ||
        category === DEVICE_FEATURE_CATEGORIES.NO2_MATTER_INDEX_SENSOR;
    }

    const defaultDevice =
      selectedDeviceFeature &&
      !binaryDevice &&
      !presenceDevice &&
      !buttonClickDevice &&
      !pilotWireModeDevice &&
      !fanModeDevice &&
      !fanLabeledDevice &&
      !levelSensorDevice &&
      !levelMatterSensorDevice;

    const thresholdDevice =
      selectedDeviceFeature &&
      !presenceDevice &&
      !buttonClickDevice &&
      !pilotWireModeDevice &&
      !fanModeDevice &&
      !fanLabeledDevice &&
      !levelSensorDevice &&
      !levelMatterSensorDevice;

    return (
      <div>
        <div class="row">
          <div class="col-12 col-md-5">
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
          {pilotWireModeDevice && <PilotWireModeDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
          {fanModeDevice && <FanModeDeviceState {...props} />}
          {fanLabeledDevice && <FanLabeledDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
          {levelSensorDevice && <LevelSensorDeviceState {...props} />}
          {levelMatterSensorDevice && <LevelMatterSensorDeviceState {...props} />}
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
                      value={this.getForDurationDisplayValue(props.trigger)}
                      onChange={this.onForDurationChange}
                    />
                  </Localizer>
                  <select
                    class="custom-select"
                    value={this.getForDurationUnit(props.trigger)}
                    onChange={this.onForDurationUnitChange}
                  >
                    <option value="second">
                      <Text id="editScene.triggersCard.scheduledTrigger.units.second" />
                    </option>
                    <option value="minute">
                      <Text id="editScene.triggersCard.scheduledTrigger.units.minute" />
                    </option>
                  </select>
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
