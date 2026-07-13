import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select, { components } from 'react-select';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  BUTTON_STATUS
} from '../../../../../../server/utils/constants';
import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import get from 'get-value';

const CheckboxOption = props => (
  <components.Option {...props}>
    <input type="checkbox" checked={props.isSelected} readOnly style={{ marginRight: '8px', pointerEvents: 'none' }} />
    {props.label}
  </components.Option>
);

const SummaryValueContainer = ({ children, getValue, selectProps, ...rest }) => {
  const count = getValue().length;
  return (
    <components.ValueContainer {...rest} getValue={getValue} selectProps={selectProps}>
      <span style={{ color: count === 0 ? '#aaa' : 'inherit' }}>
        {count === 0 ? selectProps.placeholder : `${count} sélectionné${count > 1 ? 's' : ''}`}
      </span>
      {children[children.length - 1]}
    </components.ValueContainer>
  );
};

const MULTI_STYLES = {
  option: (base, { isFocused }) => ({
    ...base,
    backgroundColor: isFocused ? '#deebff' : 'transparent',
    color: 'inherit'
  })
};

const MULTI_COMPONENTS = { Option: CheckboxOption, ValueContainer: SummaryValueContainer };

class DeviceCheckMultiValueParams extends Component {
  onDeviceFeatureChange = (deviceFeature, device) => {
    this.setState({ selectedDeviceFeature: deviceFeature });
    if (deviceFeature) {
      this.props.updateActionProperty(this.props.path, 'device_feature', deviceFeature.selector);
      const label = device
        ? `${device.name} › ${deviceFeature.name || deviceFeature.selector}`
        : deviceFeature.name || deviceFeature.selector;
      this.props.updateActionProperty(this.props.path, 'device_feature_label', label);
      if (deviceFeature.selector !== this.props.action.device_feature) {
        this.props.updateActionProperty(this.props.path, 'values', []);
      }
    } else {
      this.props.updateActionProperty(this.props.path, 'device_feature', null);
      this.props.updateActionProperty(this.props.path, 'device_feature_label', null);
    }
  };

  handleMultiChange = selectedOptions => {
    const values = (selectedOptions || []).map(opt => opt.value);
    this.props.updateActionProperty(this.props.path, 'values', values);
  };

  addValue = () => {
    const current = this.props.action.values || [];
    this.props.updateActionProperty(this.props.path, 'values', [...current, '']);
  };

  removeValue = idx => {
    const current = this.props.action.values || [];
    this.props.updateActionProperty(
      this.props.path,
      'values',
      current.filter((_, i) => i !== idx)
    );
  };

  updateValue = (idx, rawValue) => {
    const current = [...(this.props.action.values || [])];
    const parsed = parseFloat(rawValue.replace(',', '.'));
    current[idx] = isNaN(parsed) ? rawValue : parsed;
    this.props.updateActionProperty(this.props.path, 'values', current);
  };

  getButtonOptions = () =>
    Object.keys(BUTTON_STATUS).map(key => {
      const value = BUTTON_STATUS[key];
      return {
        label: get(this.props.intl.dictionary, `deviceFeatureValue.category.button.click.${value}`, {
          default: String(value)
        }),
        value
      };
    });

  render(props, { selectedDeviceFeature }) {
    const isButtonDevice = selectedDeviceFeature && selectedDeviceFeature.category === DEVICE_FEATURE_CATEGORIES.BUTTON;

    const isBinaryDevice = selectedDeviceFeature && selectedDeviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY;

    const values = props.action.values || [];
    const buttonOptions = isButtonDevice ? this.getButtonOptions() : [];
    const buttonSelected = buttonOptions.filter(opt => values.includes(opt.value));

    return (
      <div class="row">
        <div class="col-12 col-md-6">
          <div class="form-group">
            <SelectDeviceFeature
              value={props.action.device_feature}
              onDeviceFeatureChange={this.onDeviceFeatureChange}
            />
          </div>
        </div>

        {isButtonDevice && (
          <div class="col-12 col-md-6">
            <div class="form-group">
              <Select
                isMulti
                value={buttonSelected}
                onChange={this.handleMultiChange}
                options={buttonOptions}
                hideSelectedOptions={false}
                closeMenuOnSelect={false}
                components={MULTI_COMPONENTS}
                styles={MULTI_STYLES}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Sélectionner..."
              />
            </div>
          </div>
        )}

        {isBinaryDevice && (
          <div class="col-12 col-md-6">
            <div class="form-group" style={{ marginTop: '8px' }}>
              <label class="form-check form-check-inline">
                <input
                  class="form-check-input"
                  type="checkbox"
                  checked={values.includes(1)}
                  onChange={e => {
                    const next = e.target.checked ? [...values, 1] : values.filter(v => v !== 1);
                    props.updateActionProperty(props.path, 'values', next);
                  }}
                />
                <span class="form-check-label">
                  <Text id="editScene.triggersCard.newState.on" />
                </span>
              </label>
              <label class="form-check form-check-inline">
                <input
                  class="form-check-input"
                  type="checkbox"
                  checked={values.includes(0)}
                  onChange={e => {
                    const next = e.target.checked ? [...values, 0] : values.filter(v => v !== 0);
                    props.updateActionProperty(props.path, 'values', next);
                  }}
                />
                <span class="form-check-label">
                  <Text id="editScene.triggersCard.newState.off" />
                </span>
              </label>
            </div>
          </div>
        )}

        {selectedDeviceFeature && !isButtonDevice && !isBinaryDevice && (
          <div class="col-12 col-md-6">
            <div class="form-group">
              {values.map((val, idx) => (
                <div class="input-group mb-1" key={idx}>
                  <input
                    type="text"
                    class="form-control"
                    value={val}
                    onInput={e => this.updateValue(idx, e.target.value)}
                  />
                  <div class="input-group-append">
                    <button class="btn btn-outline-danger" type="button" onClick={() => this.removeValue(idx)}>
                      <i class="fe fe-trash-2" />
                    </button>
                  </div>
                </div>
              ))}
              <button class="btn btn-sm btn-outline-secondary mt-1" type="button" onClick={this.addValue}>
                <i class="fe fe-plus mr-1" />
                <Text id="editScene.triggersCard.multiState.addValue" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(DeviceCheckMultiValueParams));
