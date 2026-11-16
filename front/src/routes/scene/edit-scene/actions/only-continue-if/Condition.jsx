import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import Select from '../../../../../components/form/Select';
import update from 'immutability-helper';

import DevicePickerField from '../../../../../components/device/DevicePickerField';
import SelectDeviceFeatureValue from '../../../../../components/device/SelectDeviceFeatureValue';
import TextWithVariablesInjected from '../../../../../components/scene/TextWithVariablesInjected';
import getDeviceFeatureValueOptions, { isValueInOptions } from '../../../../../utils/deviceFeatureValueOptions';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { filterOptionByWords } from '../../../../../utils/searchOptions';
import { isMobileViewport, watchMobileViewport } from '../../../../../utils/mobileViewport';

import style from './Condition.css';

const getDeviceFeature = option => (option && option.data ? option.data.deviceFeature : null);

const isSet = value => value !== undefined && value !== null && value !== '';

// What a condition compares: the current state of a device, or a variable of the scene
const SOURCE_DEVICE = 'device';
const SOURCE_VARIABLE = 'variable';
const SOURCE_ATTRIBUTES = { [SOURCE_DEVICE]: 'device_feature', [SOURCE_VARIABLE]: 'variable' };

class Condition extends Component {
  state = {
    isMobile: isMobileViewport()
  };

  componentDidMount() {
    this.unwatchViewport = watchMobileViewport(isMobile => this.setState({ isMobile }));
  }

  componentWillUnmount() {
    if (this.unwatchViewport) {
      this.unwatchViewport();
    }
  }

  // The current value can be displayed in the list only if it's a raw value present in that list
  isValueInValueOptions = valueOptions => {
    const { value, evaluate_value: evaluateValue } = this.props.condition;
    return evaluateValue === undefined && isValueInOptions(valueOptions, value);
  };

  handleChange = selectedOption => {
    const valueOptions = getDeviceFeatureValueOptions(this.props.intl.dictionary, getDeviceFeature(selectedOption));
    // If the new variable only accepts a list of values, we drop the previous value if it's not in that list
    const shouldResetValue = Boolean(valueOptions) && !this.isValueInValueOptions(valueOptions);

    // A condition compares either the current state of a device (`device_feature`) or a variable
    // of the scene (`variable`), never both: the attribute of the other kind is removed
    const isDeviceFeature = Boolean(selectedOption && selectedOption.isDeviceFeature);
    const newCondition = update(this.props.condition, {
      $unset: [isDeviceFeature ? 'variable' : 'device_feature'],
      [isDeviceFeature ? 'device_feature' : 'variable']: {
        $set: selectedOption && selectedOption.value ? selectedOption.value : null
      },
      ...(shouldResetValue
        ? {
            value: { $set: undefined },
            evaluate_value: { $set: undefined }
          }
        : {})
    });
    if (shouldResetValue) {
      this.setState({ customValue: false });
    }
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  handleValueOptionChange = value => {
    const newCondition = update(this.props.condition, {
      value: {
        $set: value
      },
      evaluate_value: {
        $set: undefined
      }
    });
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  displayCustomValue = e => {
    e.preventDefault();
    this.setState({ customValue: true });
  };

  displayValueOptions = e => {
    e.preventDefault();
    this.setState({ customValue: false });
    // We keep the current value if it can be pre-selected in the list
    if (this.isValueInValueOptions(this.getValueOptions(this.getSelectedOption()))) {
      return;
    }
    const newCondition = update(this.props.condition, {
      value: {
        $set: undefined
      },
      evaluate_value: {
        $set: undefined
      }
    });
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  handleOperatorChange = e => {
    const newCondition = update(this.props.condition, {
      operator: {
        $set: e.target.value
      }
    });
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  handleValueChange = value => {
    let newValue;
    let evalValue;
    // We handle the case where it's a variable
    if (value.includes('{')) {
      newValue = undefined;
      evalValue = value;
    } else if (value === '') {
      newValue = undefined;
      evalValue = undefined;
    } else if (value.endsWith('.') || value.endsWith(',')) {
      // Preserve trailing decimal separator (. or , for French locale)
      newValue = value;
      evalValue = undefined;
    } else if (value.includes(',')) {
      // Handle French decimal separator: convert comma to dot for parsing
      const valueWithDot = value.replace(',', '.');
      if (!Number.isNaN(Number.parseFloat(valueWithDot))) {
        newValue = Number.parseFloat(valueWithDot);
        evalValue = undefined;
      } else {
        // Allow text values for string comparison (= and != operators)
        newValue = value;
        evalValue = undefined;
      }
    } else if (!Number.isNaN(Number.parseFloat(value))) {
      newValue = Number.parseFloat(value);
      evalValue = undefined;
    } else {
      // Allow text values for string comparison (= and != operators)
      newValue = value;
      evalValue = undefined;
    }
    const newCondition = update(this.props.condition, {
      value: {
        $set: newValue
      },
      evaluate_value: {
        $set: evalValue
      }
    });
    this.props.handleConditionChange(this.props.index, newCondition);
  };

  deleteCondition = () => {
    this.props.deleteCondition(this.props.index);
  };

  // On a phone the device and the variable are two fields (docs/specs/scene-editor-mobile.md,
  // C.6): the one shown is the one the condition holds, a device when it holds nothing yet,
  // unless the user chose the other one.
  getSource = () => {
    const { variable, device_feature: deviceFeature } = this.props.condition;
    if (isSet(deviceFeature)) {
      return SOURCE_DEVICE;
    }
    if (isSet(variable)) {
      return SOURCE_VARIABLE;
    }
    return this.state.source || SOURCE_DEVICE;
  };

  // Switching puts aside what was picked and brings back what had been picked on the other
  // side, so a tap on the wrong side loses nothing. The value is left alone: it is checked
  // against the new device or variable when one is picked.
  selectSource = source => () => {
    const current = this.getSource();
    if (source === current) {
      return;
    }
    const currentAttribute = SOURCE_ATTRIBUTES[current];
    const attribute = SOURCE_ATTRIBUTES[source];
    const putAside = { ...this.state.putAside, [current]: this.props.condition[currentAttribute] };
    const restored = putAside[source];
    this.setState({ source, putAside });
    this.props.handleConditionChange(
      this.props.index,
      update(this.props.condition, {
        $unset: [currentAttribute],
        ...(isSet(restored) ? { [attribute]: { $set: restored } } : {})
      })
    );
  };

  // The device picker of a phone hands back the selectors of its selection: one at most here.
  // A selector that is not in the list is the stored one whose device is gone: nothing changed.
  handlePickerChange = selectors => {
    const [selector] = selectors;
    if (selector === undefined) {
      this.props.handleConditionChange(this.props.index, update(this.props.condition, { $unset: ['device_feature'] }));
      return;
    }
    const option = this.findOption(this.props.deviceFeatureOptions, selector);
    if (option) {
      this.handleChange(option);
    }
  };

  findOption = (groups, value) => {
    let found = null;
    (groups || []).forEach(group => {
      found = found || group.options.find(option => option.value === value) || null;
    });
    return found;
  };

  // Every option of the field: the variables available at this step, then the devices by room
  getAllOptions = () => this.props.variableOptions.concat(this.props.deviceFeatureOptions || []);

  getSelectedOption = () => {
    const { variable, device_feature: deviceFeature } = this.props.condition;
    const isDeviceFeature = deviceFeature !== undefined && deviceFeature !== null;
    let selectedOption = null;

    this.getAllOptions().forEach(variableOption => {
      const foundOption = variableOption.options.find(option =>
        isDeviceFeature
          ? option.isDeviceFeature === true && option.value === deviceFeature
          : option.isDeviceFeature !== true && option.value === variable
      );
      if (foundOption) {
        selectedOption = foundOption;
      }
    });

    // A feature that is not in the list (deleted device, or devices still loading) is shown
    // as it is stored, like in the summary of the step: an empty field would hide a condition
    // that is saved and that stops the scene when it runs
    if (!selectedOption && isDeviceFeature && deviceFeature !== '') {
      return { value: deviceFeature, label: deviceFeature, isDeviceFeature: true };
    }

    return selectedOption;
  };

  getValueOptions = selectedOption =>
    getDeviceFeatureValueOptions(this.props.intl.dictionary, getDeviceFeature(selectedOption));

  // We display the list of values only if the variable is a device feature holding constants,
  // and if the current value can be represented in that list (it's not a scene variable or
  // a value saved before this list existed)
  shouldDisplayValueOptions = (valueOptions, customValue) => {
    if (!valueOptions || customValue) {
      return false;
    }
    const { value, evaluate_value: evaluateValue } = this.props.condition;
    if (evaluateValue !== undefined) {
      return false;
    }
    if (value === undefined || value === '') {
      return true;
    }
    return this.isValueInValueOptions(valueOptions);
  };

  // On a phone: a device is picked by room in the device picker sheet, like every device field
  // of the scene forms, and a variable in its own short select. The switch between the two is
  // only shown when this step has variables to offer (or already compares one).
  renderPhoneField(props, selectedOption) {
    const source = this.getSource();
    const showSources = props.variableOptions.length > 0 || source === SOURCE_VARIABLE;
    const deviceFeature = props.condition.device_feature;
    return (
      <div>
        {showSources && (
          <div class={style.sources}>
            <div class="nav-tabs" data-cy="scene-condition-source">
              <button
                type="button"
                class={cx('nav-link', { active: source === SOURCE_DEVICE })}
                aria-pressed={source === SOURCE_DEVICE}
                onClick={this.selectSource(SOURCE_DEVICE)}
                data-cy="scene-condition-source-device"
              >
                <Text id="editScene.actionsCard.onlyContinueIf.sourceDevice" />
              </button>
              <button
                type="button"
                class={cx('nav-link', { active: source === SOURCE_VARIABLE })}
                aria-pressed={source === SOURCE_VARIABLE}
                onClick={this.selectSource(SOURCE_VARIABLE)}
                data-cy="scene-condition-source-variable"
              >
                <Text id="editScene.actionsCard.onlyContinueIf.sourceVariable" />
              </button>
            </div>
          </div>
        )}
        {source === SOURCE_DEVICE && (
          <DevicePickerField
            devices={props.pickerDevices}
            selected={isSet(deviceFeature) ? [deviceFeature] : []}
            onChange={this.handlePickerChange}
            single
            dataCy="scene-condition-device-picker"
          />
        )}
        {source === SOURCE_VARIABLE && (
          <Select
            defaultValue={''}
            value={selectedOption}
            onChange={this.handleChange}
            options={props.variableOptions}
            filterOption={filterOptionByWords}
            placeholder={<Text id="global.selectPlaceholder" />}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        )}
      </div>
    );
  }

  render(props, { customValue, isMobile }) {
    const selectedOption = this.getSelectedOption();
    const valueOptions = this.getValueOptions(selectedOption);
    const showValueOptions = this.shouldDisplayValueOptions(valueOptions, customValue);
    return (
      <div>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group" data-cy="scene-condition-device-or-variable">
              <label class="form-label">
                <Text id="editScene.actionsCard.onlyContinueIf.variableLabel" />
                <span class="form-required">
                  <Text id="global.requiredField" />
                </span>
              </label>
              {isMobile && this.renderPhoneField(props, selectedOption)}
              {!isMobile && (
                <Select
                  defaultValue={''}
                  value={selectedOption}
                  onChange={this.handleChange}
                  options={this.getAllOptions()}
                  filterOption={filterOptionByWords}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              )}
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.actionsCard.onlyContinueIf.operatorLabel" />
                <span class="form-required">
                  <Text id="global.requiredField" />
                </span>
              </label>
              <select class="form-control" value={props.condition.operator} onChange={this.handleOperatorChange}>
                <option value="">
                  <Text id="global.emptySelectOption" />
                </option>
                <option value="=">
                  <Text id="editScene.triggersCard.newState.equal" />
                </option>
                <option value=">=">
                  <Text id="editScene.triggersCard.newState.superiorOrEqual" />
                </option>
                <option value=">">
                  <Text id="editScene.triggersCard.newState.superior" />
                </option>
                <option value="!=">
                  <Text id="editScene.triggersCard.newState.different" />
                </option>
                <option value="<=">
                  <Text id="editScene.triggersCard.newState.lessOrEqual" />
                </option>
                <option value="<">
                  <Text id="editScene.triggersCard.newState.less" />
                </option>
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.actionsCard.onlyContinueIf.valueLabel" />
                <span class="form-required">
                  <Text id="global.requiredField" />
                </span>
              </label>
              {showValueOptions && (
                <SelectDeviceFeatureValue
                  options={valueOptions}
                  value={props.condition.value}
                  updateValue={this.handleValueOptionChange}
                />
              )}
              {!showValueOptions && (
                <Localizer>
                  <TextWithVariablesInjected
                    text={
                      props.condition.value !== undefined && props.condition.value !== null
                        ? props.condition.value.toString()
                        : props.condition.evaluate_value
                    }
                    triggersVariables={props.triggersVariables}
                    actionsGroupsBefore={props.actionsGroupsBefore}
                    variables={props.variables}
                    path={props.path}
                    updateText={this.handleValueChange}
                    singleLineInput
                    class={`${style.conditionTagify}`}
                  />
                </Localizer>
              )}
              {valueOptions && (
                <small class="form-text">
                  <a href="#" onClick={showValueOptions ? this.displayCustomValue : this.displayValueOptions}>
                    <Text
                      id={
                        showValueOptions
                          ? 'editScene.actionsCard.onlyContinueIf.useCustomValue'
                          : 'editScene.actionsCard.onlyContinueIf.useValueList'
                      }
                    />
                  </a>
                </small>
              )}
            </div>
          </div>
          <div class="col-md-2">
            {props.canDeleteCondition && (
              <div class="form-group">
                <label class="form-label">
                  <Text id="editScene.actionsCard.onlyContinueIf.removeLabel" />
                </label>
                <button class="btn btn-danger" onClick={this.deleteCondition}>
                  <i class="fe fe-x" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div class="row">
          <div class="col">
            {props.lastOne && (
              <button onClick={this.props.addCondition} class="btn btn-secondary btn-sm">
                <Text id="editScene.actionsCard.onlyContinueIf.orButton" />
              </button>
            )}
            {!props.lastOne && (
              <p>
                <Text id="editScene.actionsCard.onlyContinueIf.orText" />
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(Condition);
