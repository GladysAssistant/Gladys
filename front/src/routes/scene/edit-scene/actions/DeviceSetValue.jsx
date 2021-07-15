import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import ColorPicker from '../../../../components/device/ColorPicker';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import '../../../../components/boxs/device-in-room/device-features/style.css';

class DeviceSetValue extends Component {
  onDeviceFeatureChange = (deviceFeature, device) => {
    const { columnIndex, index } = this.props;
    const deviceFeatureChanged = this.props.action.device_feature !== deviceFeature.selector;
    if (deviceFeature) {
      this.props.updateActionProperty(columnIndex, index, 'device_feature', deviceFeature.selector);
    } else {
      this.props.updateActionProperty(columnIndex, index, 'device_feature', null);
    }
    if (deviceFeatureChanged) {
      this.props.updateActionProperty(columnIndex, index, 'value', undefined);
    }
    this.setState({ deviceFeature, device });
  };

  handleNewValue = e => {
    const { columnIndex, index } = this.props;
    this.props.updateActionProperty(columnIndex, index, 'value', e.target.value);
  };

  handleNewColorValue = color => {
    const { columnIndex, index } = this.props;
    this.props.updateActionProperty(columnIndex, index, 'value', color);
  };

  toggleBinaryValue = e => {
    const { columnIndex, index, action } = this.props;
    const previousValue = action.value !== undefined ? action.value : 0;
    const newValue = previousValue === 1 ? 0 : 1;
    this.props.updateActionProperty(columnIndex, index, 'value', newValue);
  };

  getDeviceFeatureControl = () => {
    if (!this.state.deviceFeature) {
      return null;
    }

    if (this.state.deviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
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
      return <ColorPicker value={this.props.action.value} updateValue={this.handleNewColorValue} />;
    }

    return (
      <div>
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

        <input
          style={{
            minHeight: '30px'
          }}
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
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.deviceSetValue.valueLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
        </div>
        <div class="form-group">{this.getDeviceFeatureControl()}</div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(DeviceSetValue));
