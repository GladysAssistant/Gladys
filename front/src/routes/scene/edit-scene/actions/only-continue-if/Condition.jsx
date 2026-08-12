import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import Select from 'react-select';
import update from 'immutability-helper';

import SelectDeviceFeatureValue from '../../../../../components/device/SelectDeviceFeatureValue';
import TextWithVariablesInjected from '../../../../../components/scene/TextWithVariablesInjected';
import getDeviceFeatureValueOptions, { isValueInOptions } from '../../../../../utils/deviceFeatureValueOptions';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

import style from './Condition.css';

const getDeviceFeature = option => (option && option.data ? option.data.deviceFeature : null);

class Condition extends Component {
  // The current value can be displayed in the list only if it's a raw value present in that list
  isValueInValueOptions = valueOptions => {
    const { value, evaluate_value: evaluateValue } = this.props.condition;
    return evaluateValue === undefined && isValueInOptions(valueOptions, value);
  };

  handleChange = selectedOption => {
    const valueOptions = getDeviceFeatureValueOptions(this.props.intl.dictionary, getDeviceFeature(selectedOption));
    // If the new variable only accepts a list of values, we drop the previous value if it's not in that list
    const shouldResetValue = Boolean(valueOptions) && !this.isValueInValueOptions(valueOptions);

    // A condition compares either a device feature (instantaneous value) or a scene variable
    let newCondition = update(this.props.condition, {
      $unset: ['variable', 'device_feature'],
      ...(shouldResetValue
        ? {
            value: { $set: undefined },
            evaluate_value: { $set: undefined }
          }
        : {})
    });
    if (selectedOption && selectedOption.value) {
      newCondition = update(newCondition, {
        [selectedOption.isDeviceFeature ? 'device_feature' : 'variable']: {
          $set: selectedOption.value
        }
      });
    } else {
      newCondition = update(newCondition, {
        variable: {
          $set: null
        }
      });
    }
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

  getSelectedOption = () => {
    let selectedOption = null;

    this.props.variableOptions.forEach(variableOption => {
      const foundOption = variableOption.options.find(option =>
        option.isDeviceFeature
          ? this.props.condition.device_feature === option.value
          : this.props.condition.variable === option.value
      );
      if (foundOption) {
        selectedOption = foundOption;
      }
    });

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

  render(props, { customValue }) {
    const selectedOption = this.getSelectedOption();
    const valueOptions = this.getValueOptions(selectedOption);
    const showValueOptions = this.shouldDisplayValueOptions(valueOptions, customValue);
    return (
      <div>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.actionsCard.onlyContinueIf.variableLabel" />
                <span class="form-required">
                  <Text id="global.requiredField" />
                </span>
              </label>
              <Select
                defaultValue={''}
                value={selectedOption}
                onChange={this.handleChange}
                options={props.variableOptions}
                className="react-select-container"
                classNamePrefix="react-select"
              />
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
