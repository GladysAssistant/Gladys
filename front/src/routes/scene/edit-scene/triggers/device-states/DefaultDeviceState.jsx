import { Component, Fragment } from 'preact';
import { Text, Localizer } from 'preact-i18n';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';

import SelectDeviceFeatureValue from '../../../../../components/device/SelectDeviceFeatureValue';
import getDeviceFeatureValueOptions, { isValueInOptions } from '../../../../../utils/deviceFeatureValueOptions';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class DefaultDeviceState extends Component {
  constructor(props) {
    super(props);
    this.state = {
      customValueSelector: null
    };
  }

  handleOperatorChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'operator', e.target.value);
  };

  handleValueChange = e => {
    let value = e.target.value;
    const { selectedDeviceFeature } = this.props;
    const isTextFeature = selectedDeviceFeature && selectedDeviceFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT;

    if (isTextFeature) {
      this.props.updateTriggerProperty(this.props.index, 'value', value);
    } else {
      if (value.includes(',')) {
        value = value.replaceAll(',', '.');
      }
      const lastCharacter = value.length > 0 ? value[value.length - 1] : '';
      if (!isNaN(parseFloat(e.target.value)) && lastCharacter !== '.') {
        this.props.updateTriggerProperty(this.props.index, 'value', parseFloat(value));
      } else {
        this.props.updateTriggerProperty(this.props.index, 'value', value);
      }
    }
  };

  handleValueOptionChange = value => {
    this.props.updateTriggerProperty(this.props.index, 'value', value);
  };

  displayCustomValue = e => {
    e.preventDefault();
    // Tied to the feature it was asked for: this component is not remounted when another feature is
    // selected, and the new one should start on its own list of values
    this.setState({ customValueSelector: this.props.selectedDeviceFeature.selector });
  };

  displayValueOptions = e => {
    e.preventDefault();
    this.setState({ customValueSelector: null });
    // A value that cannot be pre-selected in the list is dropped, otherwise the select would
    // display nothing while the trigger still carries the old value
    if (!isValueInOptions(this.getValueOptions(), this.props.trigger.value)) {
      this.props.updateTriggerProperty(this.props.index, 'value', null);
    }
  };

  getValueOptions = () => getDeviceFeatureValueOptions(this.props.intl.dictionary, this.props.selectedDeviceFeature);

  // We display the list of values only if the feature holds constants, and if the current value can
  // be represented in that list (it's not a value saved before this list existed)
  shouldDisplayValueOptions = valueOptions => {
    if (!valueOptions || this.state.customValueSelector === this.props.selectedDeviceFeature.selector) {
      return false;
    }
    const { value } = this.props.trigger;
    return value === undefined || value === null || value === '' || isValueInOptions(valueOptions, value);
  };

  render({ selectedDeviceFeature, trigger }) {
    const isTextFeature = selectedDeviceFeature && selectedDeviceFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT;
    // Features holding a known list of constants (vacuum cleaner state, lock state, siren mode...)
    // get the same labeled list as the device widget, instead of a raw number to guess
    const valueOptions = this.getValueOptions();
    const showValueOptions = this.shouldDisplayValueOptions(valueOptions);

    return (
      <Fragment>
        <div class="col-12 col-md-3">
          <div class="form-group">
            <select class="form-control" onChange={this.handleOperatorChange} value={trigger.operator}>
              <option value="">
                <Text id="global.emptySelectOption" />
              </option>
              <option value="=">
                <Text id="editScene.triggersCard.newState.equal" />
              </option>
              {!isTextFeature && (
                <option value=">=">
                  <Text id="editScene.triggersCard.newState.superiorOrEqual" />
                </option>
              )}
              {!isTextFeature && (
                <option value=">">
                  <Text id="editScene.triggersCard.newState.superior" />
                </option>
              )}
              <option value="!=">
                <Text id="editScene.triggersCard.newState.different" />
              </option>
              {!isTextFeature && (
                <option value="<=">
                  <Text id="editScene.triggersCard.newState.lessOrEqual" />
                </option>
              )}
              {!isTextFeature && (
                <option value="<">
                  <Text id="editScene.triggersCard.newState.less" />
                </option>
              )}
            </select>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="form-group">
            {showValueOptions && (
              <SelectDeviceFeatureValue
                options={valueOptions}
                value={trigger.value}
                updateValue={this.handleValueOptionChange}
              />
            )}
            {!showValueOptions && (
              <div class="input-group">
                <Localizer>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
                    value={trigger.value}
                    onChange={this.handleValueChange}
                  />
                </Localizer>
                {selectedDeviceFeature.unit && (
                  <span class="input-group-append" id="basic-addon2">
                    <span class="input-group-text">
                      <Text id={`deviceFeatureUnitShort.${selectedDeviceFeature.unit}`} />
                    </span>
                  </span>
                )}
              </div>
            )}
            {valueOptions && (
              <small class="form-text">
                <a href="#" onClick={showValueOptions ? this.displayCustomValue : this.displayValueOptions}>
                  <Text
                    id={
                      showValueOptions
                        ? 'editScene.triggersCard.newState.useCustomValue'
                        : 'editScene.triggersCard.newState.useValueList'
                    }
                  />
                </a>
              </small>
            )}
          </div>
        </div>
      </Fragment>
    );
  }
}

export default withIntlAsProp(DefaultDeviceState);
