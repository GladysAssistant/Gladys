import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

import {
  ANY_CHANGE_OPERATOR,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} from '../../../../../../server/utils/constants';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import BinaryDeviceState from './device-states/BinaryDeviceState';
import PresenceSensorDeviceState from './device-states/PresenceSensorDeviceState';
import ThresholdDeviceState from './device-states/ThresholdDeviceState';
import DefaultDeviceState from './device-states/DefaultDeviceState';
import ButtonClickDeviceState from './device-states/ButtonClickDeviceState';
import DoorbellRingDeviceState from './device-states/DoorbellRingDeviceState';
import PilotWireModeDeviceState from './device-states/PilotWireModeDeviceState';
import FanModeDeviceState from './device-states/FanModeDeviceState';
import FanLabeledDeviceState from './device-states/FanLabeledDeviceState';
import LevelSensorDeviceState from './device-states/LevelSensorDeviceState';
import LevelMatterSensorDeviceState from './device-states/LevelMatterSensorDeviceState';
import WaterValveDeviceState from './device-states/WaterValveDeviceState';
import WaterHeaterModeDeviceState from './device-states/WaterHeaterModeDeviceState';

class TurnOnLight extends Component {
  // The trigger stores its features in `device_features`; triggers saved before
  // multi-select stored a single selector in `device_feature`
  getSelectedSelectors = () => {
    if (this.props.trigger.device_features) {
      return this.props.trigger.device_features;
    }
    return this.props.trigger.device_feature ? [this.props.trigger.device_feature] : [];
  };

  onDeviceFeaturesChange = (deviceFeatures, devices, isUserChange) => {
    const previousFeature = this.state.selectedDeviceFeature;
    // all selected features share the same category/type, the first one drives the condition widget
    const firstFeature = deviceFeatures.length > 0 ? deviceFeatures[0] : null;
    this.setState({ selectedDeviceFeature: firstFeature });

    // Hydration only resolves the saved selectors for display: nothing is written back to
    // the trigger, so an unresolvable feature (deleted device, list still loading) never
    // silently truncates the saved selection or clears the saved condition value.
    if (!isUserChange) {
      return;
    }

    this.props.updateTriggerProperty(
      this.props.index,
      'device_features',
      deviceFeatures.map(feature => feature.selector)
    );
    // migrate away from the legacy single-feature format when the user edits the selection
    if (this.props.trigger.device_feature) {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', undefined);
    }

    // the saved value only stays meaningful while the kind of feature is unchanged. In
    // "any change" mode there is no value at all, and re-adding an empty one would break
    // the trigger validation.
    const featureKindChanged =
      !firstFeature ||
      !previousFeature ||
      firstFeature.category !== previousFeature.category ||
      firstFeature.type !== previousFeature.type;
    if (featureKindChanged && !this.isAnyStateChange()) {
      this.props.updateTriggerProperty(this.props.index, 'value', null);
    }
  };

  isAnyStateChange = () => this.props.trigger.operator === ANY_CHANGE_OPERATOR;

  enableOrDisableAnyStateChange = e => {
    if (e.target.checked) {
      this.props.updateTriggerProperty(this.props.index, 'operator', ANY_CHANGE_OPERATOR);
      // an "any change" trigger compares the new state with the previous one: there is no
      // value to match, and neither the threshold nor the duration option applies to a
      // change, which is instantaneous
      this.props.updateTriggerProperty(this.props.index, 'value', undefined);
      this.props.updateTriggerProperty(this.props.index, 'threshold_only', undefined);
      this.props.updateTriggerProperty(this.props.index, 'for_duration', undefined);
      this.props.updateTriggerProperty(this.props.index, 'unit', undefined);
    } else {
      // back to the condition widgets, which set the operator matching the selected feature
      this.props.updateTriggerProperty(this.props.index, 'operator', undefined);
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
    // in "any change" mode the scene starts on every state change: no condition widget, no
    // threshold and no duration is displayed, they don't apply
    const anyStateChange = this.isAnyStateChange();
    let binaryDevice = false;
    let presenceDevice = false;
    let buttonClickDevice = false;
    let doorbellRingDevice = false;
    let pilotWireModeDevice = false;
    let fanModeDevice = false;
    let fanLabeledDevice = false;
    let levelSensorDevice = false;
    let levelMatterSensorDevice = false;
    let waterValveStatusDevice = false;
    let waterHeaterModeDevice = false;

    if (selectedDeviceFeature && !anyStateChange) {
      const { category, type } = selectedDeviceFeature;

      // water-heater's own `binary` shares the 'binary' string with SWITCH, so it is already
      // covered by the first test. `boost` and `heating` are scoped to their category so that a
      // future category reusing either string does not silently inherit this widget.
      binaryDevice =
        type === DEVICE_FEATURE_TYPES.SWITCH.BINARY ||
        type === DEVICE_FEATURE_TYPES.WATER_VALVE.AUTO_CLOSE_WHEN_WATER_SHORTAGE ||
        type === DEVICE_FEATURE_TYPES.WATER_VALVE.VALVE_WORK_STATE ||
        (category === DEVICE_FEATURE_CATEGORIES.WATER_HEATER &&
          (type === DEVICE_FEATURE_TYPES.WATER_HEATER.BOOST || type === DEVICE_FEATURE_TYPES.WATER_HEATER.HEATING));
      // Scoped to `push`: the locked "device seen" widget only makes sense for a heartbeat
      // sensor. A binary presence sensor (a camera reporting a person) shares the 'binary'
      // string with SWITCH, so it is already served by BinaryDeviceState above, and both
      // widgets would show up side by side if this test stayed on the category alone.
      presenceDevice =
        category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR && type === DEVICE_FEATURE_TYPES.SENSOR.PUSH;
      buttonClickDevice = category === DEVICE_FEATURE_CATEGORIES.BUTTON;
      doorbellRingDevice = category === DEVICE_FEATURE_CATEGORIES.DOORBELL;
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
      waterValveStatusDevice =
        category === DEVICE_FEATURE_CATEGORIES.WATER_VALVE &&
        type === DEVICE_FEATURE_TYPES.WATER_VALVE.CURRENT_DEVICE_STATUS;
      waterHeaterModeDevice =
        category === DEVICE_FEATURE_CATEGORIES.WATER_HEATER && type === DEVICE_FEATURE_TYPES.WATER_HEATER.MODE;
    }

    const defaultDevice =
      selectedDeviceFeature &&
      !anyStateChange &&
      !binaryDevice &&
      !presenceDevice &&
      !buttonClickDevice &&
      !doorbellRingDevice &&
      !pilotWireModeDevice &&
      !fanModeDevice &&
      !fanLabeledDevice &&
      !levelSensorDevice &&
      !levelMatterSensorDevice &&
      !waterValveStatusDevice &&
      !waterHeaterModeDevice;

    const thresholdDevice =
      selectedDeviceFeature &&
      !anyStateChange &&
      !presenceDevice &&
      !buttonClickDevice &&
      !doorbellRingDevice &&
      !pilotWireModeDevice &&
      !fanModeDevice &&
      !fanLabeledDevice &&
      !levelSensorDevice &&
      !levelMatterSensorDevice &&
      !waterValveStatusDevice &&
      !waterHeaterModeDevice;

    return (
      <div>
        <p>
          <small>
            <Text id="editScene.triggersCard.newState.multipleFeaturesNote" />
          </small>
        </p>
        <div class="row">
          <div class="col-12 col-md-5">
            <div class="form-group">
              <SelectDeviceFeature
                isMulti
                value={this.getSelectedSelectors()}
                onDeviceFeaturesChange={this.onDeviceFeaturesChange}
              />
            </div>
          </div>
          {binaryDevice && <BinaryDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
          {presenceDevice && <PresenceSensorDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
          {buttonClickDevice && <ButtonClickDeviceState {...props} />}
          {doorbellRingDevice && <DoorbellRingDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
          {pilotWireModeDevice && <PilotWireModeDeviceState {...props} />}
          {fanModeDevice && <FanModeDeviceState {...props} />}
          {fanLabeledDevice && <FanLabeledDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
          {levelSensorDevice && <LevelSensorDeviceState {...props} />}
          {levelMatterSensorDevice && <LevelMatterSensorDeviceState {...props} />}
          {waterValveStatusDevice && <WaterValveDeviceState {...props} />}
          {waterHeaterModeDevice && (
            <WaterHeaterModeDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />
          )}
          {defaultDevice && <DefaultDeviceState {...props} selectedDeviceFeature={selectedDeviceFeature} />}
        </div>
        <div class="row">
          <div class="col-12">
            <label class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                checked={anyStateChange}
                onChange={this.enableOrDisableAnyStateChange}
              />
              <span class="form-check-label">
                <Text id="editScene.triggersCard.newState.anyStateChange" />
              </span>
            </label>
          </div>
        </div>
        {thresholdDevice && <ThresholdDeviceState {...props} />}
        {!anyStateChange && (
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
        )}
        {!anyStateChange && props.trigger.for_duration !== undefined && (
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
