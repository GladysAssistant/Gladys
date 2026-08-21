import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import ColorPicker from '../../../../components/device/ColorPicker';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import SelectDeviceFeatureValue from '../../../../components/device/SelectDeviceFeatureValue';
import getDeviceFeatureValueOptions, { isValueInOptions } from '../../../../utils/deviceFeatureValueOptions';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import FormulaFunctionsHelp from '../../../../components/scene/FormulaFunctionsHelp';

import '../../../../components/boxs/device-in-room/device-features/style.css';
import style from './DeviceSetValue.css';
import ShutterButtons from '../../../../components/device/ShutterButtons';
import SelectPilotWireMode from '../../../../components/device/SelectPilotWireMode';
import SelectWaterHeaterMode from '../../../../components/device/SelectWaterHeaterMode';
import SelectFanMode from '../../../../components/device/SelectFanMode';
import SelectFanFeatureValue from '../../../../components/device/SelectFanFeatureValue';

class DeviceSetValue extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      computed: props.action.evaluate_value !== undefined,
      customValue: false
    };
  }

  toggleType = () => this.setState({ computed: !this.state.computed });

  onDeviceFeatureChange = (deviceFeature, device) => {
    // SelectDeviceFeature passes null both when the user clears the select and when a saved
    // selector no longer resolves to a loaded feature; reading .selector before this guard threw
    // and took the whole scene editor down. Same shape as the trigger side's handler.
    if (!deviceFeature) {
      this.props.updateActionProperty(this.props.path, 'device_feature', null);
      this.setState({ deviceFeature: null, device: null, customValue: false });
      return;
    }

    const deviceFeatureChanged = this.props.action.device_feature !== deviceFeature.selector;
    this.props.updateActionProperty(this.props.path, 'device_feature', deviceFeature.selector);

    if (deviceFeatureChanged) {
      if (
        deviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY ||
        deviceFeature.type === DEVICE_FEATURE_TYPES.WATER_VALVE.AUTO_CLOSE_WHEN_WATER_SHORTAGE ||
        (deviceFeature.category === DEVICE_FEATURE_CATEGORIES.WATER_HEATER &&
          deviceFeature.type === DEVICE_FEATURE_TYPES.WATER_HEATER.BOOST)
      ) {
        this.props.updateActionProperty(this.props.path, 'value', 0);
        this.props.updateActionProperty(this.props.path, 'evaluate_value', undefined);
      } else {
        this.props.updateActionProperty(this.props.path, 'value', undefined);
        this.props.updateActionProperty(this.props.path, 'evaluate_value', undefined);
      }
      // The new feature comes with its own list of values, so we go back to that list
      this.setState({ customValue: false });
    }
    this.setState({ deviceFeature, device });
  };

  handleNewValue = e => {
    this.props.updateActionProperty(this.props.path, 'value', e.target.value);
    this.props.updateActionProperty(this.props.path, 'evaluate_value', undefined);
  };

  handleNewPureValue = value => {
    this.props.updateActionProperty(this.props.path, 'value', value);
    this.props.updateActionProperty(this.props.path, 'evaluate_value', undefined);
  };

  toggleBinaryValue = () => {
    const { action } = this.props;
    const previousValue = action.value !== undefined ? action.value : 0;
    const newValue = previousValue === 1 ? 0 : 1;
    this.props.updateActionProperty(this.props.path, 'value', newValue);
    this.props.updateActionProperty(this.props.path, 'evaluate_value', undefined);
  };

  displayCustomValue = e => {
    e.preventDefault();
    this.setState({ customValue: true });
  };

  displayValueOptions = e => {
    e.preventDefault();
    this.setState({ customValue: false });
    // A value that cannot be pre-selected in the list is dropped, otherwise the select would
    // display nothing while the action still carries the old value
    if (!isValueInOptions(this.getValueOptions(), this.props.action.value)) {
      this.props.updateActionProperty(this.props.path, 'value', undefined);
      this.props.updateActionProperty(this.props.path, 'evaluate_value', undefined);
    }
  };

  getValueOptions = () => getDeviceFeatureValueOptions(this.props.intl.dictionary, this.state.deviceFeature);

  // We display the list of values only if the feature holds constants, and if the current value can
  // be represented in that list (it's not a value saved before this list existed)
  shouldDisplayValueOptions = valueOptions => {
    if (!valueOptions || this.state.customValue) {
      return false;
    }
    const { value } = this.props.action;
    return value === undefined || value === null || value === '' || isValueInOptions(valueOptions, value);
  };

  handleNewEvalValue = text => {
    this.props.updateActionProperty(this.props.path, 'value', undefined);
    this.props.updateActionProperty(this.props.path, 'evaluate_value', text);
  };

  isTextFeature = () =>
    this.state.deviceFeature &&
    this.state.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT &&
    this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.TEXT.TEXT;

  getDeviceFeatureControl = () => {
    if (!this.state.deviceFeature) {
      return null;
    }

    // A text feature always receives free text with scene variables injected,
    // the simple/computed distinction does not apply
    if (this.isTextFeature()) {
      return (
        <div>
          <div className={style.explanationText}>
            <Text id="editScene.actionsCard.deviceSetValue.textExplanationText" />
          </div>
          <div class="input-group">
            <Localizer>
              <TextWithVariablesInjected
                text={
                  this.props.action.evaluate_value !== undefined
                    ? this.props.action.evaluate_value
                    : this.props.action.value
                }
                triggersVariables={this.props.triggersVariables}
                actionsGroupsBefore={this.props.actionsGroupsBefore}
                variables={this.props.variables}
                path={this.props.path}
                updateText={this.handleNewEvalValue}
              />
            </Localizer>
          </div>
        </div>
      );
    }

    if (this.state.computed) {
      return (
        <div>
          <div className={style.explanationText}>
            <Text id="editScene.actionsCard.deviceSetValue.computedExplanationText" />
          </div>
          <FormulaFunctionsHelp />
          <div class="input-group">
            <Localizer>
              <TextWithVariablesInjected
                text={
                  this.props.action.value !== undefined
                    ? // A select feature can carry a non-numeric value ('netflix'): it is kept
                      // as-is instead of being displayed as NaN
                      Number.isNaN(Number(this.props.action.value))
                      ? `${this.props.action.value}`
                      : Number(this.props.action.value).toString()
                    : this.props.action.evaluate_value
                }
                triggersVariables={this.props.triggersVariables}
                actionsGroupsBefore={this.props.actionsGroupsBefore}
                variables={this.props.variables}
                path={this.props.path}
                updateText={this.handleNewEvalValue}
              />
            </Localizer>
            {this.state.deviceFeature.unit && (
              <span class="input-group-append" id="basic-addon2">
                <span class="input-group-text">
                  <Text id={`deviceFeatureUnitShort.${this.state.deviceFeature.unit}`} />
                </span>
              </span>
            )}
          </div>
        </div>
      );
    }

    if (
      this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY ||
      this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.WATER_VALVE.AUTO_CLOSE_WHEN_WATER_SHORTAGE ||
      (this.state.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.WATER_HEATER &&
        this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.WATER_HEATER.BOOST)
    ) {
      return (
        <label class="custom-switch">
          <input
            type="radio"
            name={this.state.deviceFeature.id}
            value="1"
            class="custom-switch-input"
            checked={this.props.action.value === 1}
            onClick={this.toggleBinaryValue}
          />
          <span class="custom-switch-indicator" />
        </label>
      );
    }

    if (this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.LIGHT.COLOR) {
      return <ColorPicker value={this.props.action.value} updateValue={this.handleNewPureValue} />;
    }

    if (
      [DEVICE_FEATURE_TYPES.SHUTTER.STATE, DEVICE_FEATURE_TYPES.CURTAIN.STATE].includes(
        this.state.deviceFeature.type
      ) &&
      [DEVICE_FEATURE_CATEGORIES.SHUTTER, DEVICE_FEATURE_CATEGORIES.CURTAIN].includes(this.state.deviceFeature.category)
    ) {
      return (
        <ShutterButtons
          value={this.props.action.value}
          category={this.state.deviceFeature.category}
          type={this.state.deviceFeature.type}
          updateValue={this.handleNewPureValue}
        />
      );
    }

    if (this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE) {
      return (
        <SelectPilotWireMode
          category={this.state.deviceFeature.category}
          type={this.state.deviceFeature.type}
          updateValue={this.handleNewPureValue}
          value={this.props.action.value}
        />
      );
    }

    if (
      this.state.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.WATER_HEATER &&
      this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.WATER_HEATER.MODE
    ) {
      return (
        <SelectWaterHeaterMode
          deviceFeature={this.state.deviceFeature}
          updateValue={this.handleNewPureValue}
          value={this.props.action.value}
        />
      );
    }

    if (this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.FAN.MODE) {
      return <SelectFanMode updateValue={this.handleNewPureValue} value={this.props.action.value} />;
    }

    if (
      this.state.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.FAN &&
      [
        DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING,
        DEVICE_FEATURE_TYPES.FAN.WIND_SETTING,
        DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION
      ].includes(this.state.deviceFeature.type)
    ) {
      return (
        <SelectFanFeatureValue
          deviceFeature={this.state.deviceFeature}
          updateValue={this.handleNewPureValue}
          value={this.props.action.value}
        />
      );
    }

    // Features holding a known list of constants (vacuum cleaner run mode, lock state, siren
    // mode...) get the same labeled list as the device widget, instead of a raw number to guess
    const valueOptions = this.getValueOptions();
    if (this.shouldDisplayValueOptions(valueOptions)) {
      return (
        <div>
          <div className={style.explanationText}>
            <Text id="editScene.actionsCard.deviceSetValue.simpleExplanationText" />
          </div>
          <SelectDeviceFeatureValue
            options={valueOptions}
            value={this.props.action.value}
            updateValue={this.handleNewPureValue}
          />
          <small class="form-text">
            <a href="#" onClick={this.displayCustomValue}>
              <Text id="editScene.actionsCard.deviceSetValue.useCustomValue" />
            </a>
          </small>
        </div>
      );
    }

    return (
      <div>
        <div className={style.explanationText}>
          <Text id="editScene.actionsCard.deviceSetValue.simpleExplanationText" />
        </div>
        <div class="input-group">
          <Localizer>
            <input
              type="text"
              placeholder={<Text id="editScene.actionsCard.deviceSetValue.valueLabel" />}
              class="form-control"
              onChange={this.handleNewValue}
              value={this.props.action.value}
            />
          </Localizer>
          {this.state.deviceFeature.unit && (
            <span class="input-group-append" id="basic-addon2">
              <span class="input-group-text">
                <Text id={`deviceFeatureUnitShort.${this.state.deviceFeature.unit}`} />
              </span>
            </span>
          )}
        </div>

        {/* A feature holding constants has no continuous range to slide through: min/max are only
            the bounds of its values, so the slider would be misleading next to a custom value */}
        {!valueOptions && (
          <input
            type="range"
            value={this.props.action.value}
            onChange={this.handleNewValue}
            class={cx('form-control custom-range', {
              'light-temperature': this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE
            })}
            step="1"
            min={this.state.deviceFeature.min}
            max={this.state.deviceFeature.max}
          />
        )}
        {valueOptions && (
          <small class="form-text">
            <a href="#" onClick={this.displayValueOptions}>
              <Text id="editScene.actionsCard.deviceSetValue.useValueList" />
            </a>
          </small>
        )}
      </div>
    );
  };

  render(props, {}) {
    const { action } = props;
    return (
      <div>
        <div class="form-group">
          <p>
            <Text id="editScene.actionsCard.deviceSetValue.description" />
          </p>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.deviceSetValue.deviceLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <SelectDeviceFeature
            exclude_read_only_device_features
            value={action.device_feature}
            onDeviceFeatureChange={this.onDeviceFeatureChange}
          />
        </div>
        {!this.isTextFeature() && (
          <div class="form-group">
            <div className={cx('nav-tabs', style.valueTypeTab)}>
              <span
                class={cx('nav-link', style.valueTypeLink, { active: !this.state.computed })}
                onClick={this.toggleType}
              >
                <Text id="editScene.actionsCard.deviceSetValue.valueTypeSimple" />
              </span>
              <span
                class={cx('nav-link', style.valueTypeLink, { active: this.state.computed })}
                onClick={this.toggleType}
              >
                <Text id="editScene.actionsCard.deviceSetValue.valueTypeComputed" />
              </span>
            </div>
          </div>
        )}
        <div class="form-group">{this.getDeviceFeatureControl()}</div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(DeviceSetValue));
