import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from '../../../../components/form/Select';
import DevicePickerField from '../../../../components/device/DevicePickerField';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import { getDeviceFeatureName } from '../../../../utils/device';

import { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

class TurnOnOffSwitch extends Component {
  getOptions = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        device_feature_type: DEVICE_FEATURE_TYPES.SWITCH.BINARY
      });
      // One option per writable switch, so each switch of a multi-switch device can be picked
      // (the features are already filtered on the switch category and type by the API)
      const deviceOptions = [];
      devices.forEach(device => {
        const switches = device.features.filter(f => f.read_only === false);
        switches.forEach((feature, index) => {
          deviceOptions.push({
            value: feature.selector,
            label: getDeviceFeatureName(this.props.intl.dictionary, device, feature),
            deviceSelector: device.selector,
            isFirstSwitchOfDevice: index === 0
          });
        });
      });
      await this.setState({ deviceOptions, devices });
      this.refreshSelectedOptions(this.props);
      return deviceOptions;
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOptions => {
    const deviceFeatures = selectedOptions ? selectedOptions.map(selectedOption => selectedOption.value) : [];
    this.props.updateActionProperty(this.props.path, 'device_features', deviceFeatures);
    // Scenes saved before the switches could be picked one by one store devices, shown
    // as their first switch selected: the selection now lives in device_features only
    if (this.props.action.devices) {
      this.props.updateActionProperty(this.props.path, 'devices', undefined);
    }
  };
  // on a phone the switches are picked in the device picker sheet, by room: one row per writable
  // switch, as the options of the select
  handlePickerChange = deviceFeatures => {
    // a picker validated as it was changes nothing: a scene still storing devices keeps them
    const current = this.state.selectedOptions.map(option => option.value);
    if (current.length === deviceFeatures.length && current.every((value, index) => value === deviceFeatures[index])) {
      return;
    }
    this.handleChange(deviceFeatures.map(value => ({ value })));
  };
  isWritableSwitch = feature => feature.read_only === false;
  refreshSelectedOptions = nextProps => {
    const { device_features: deviceFeatures = [], devices = [] } = nextProps.action;
    const deviceOptions = this.state.deviceOptions || [];
    // Same rule as the execution: the devices are only a fallback when no switch is selected,
    // and drive their first writable switch. The selection keeps the stored order, which
    // react-select emits back on the next change.
    const selectedOptions =
      deviceFeatures.length > 0
        ? deviceOptions
            .filter(deviceOption => deviceFeatures.includes(deviceOption.value))
            .sort((a, b) => deviceFeatures.indexOf(a.value) - deviceFeatures.indexOf(b.value))
        : deviceOptions
            .filter(deviceOption => deviceOption.isFirstSwitchOfDevice && devices.includes(deviceOption.deviceSelector))
            .sort((a, b) => devices.indexOf(a.deviceSelector) - devices.indexOf(b.deviceSelector));
    this.setState({ selectedOptions });
  };
  constructor(props) {
    super(props);
    this.state = {
      deviceOptions: null,
      devices: [],
      selectedOptions: []
    };
  }
  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOptions, deviceOptions, devices }) {
    return (
      <div class="form-group">
        <label class="form-label">
          {props.action.type === ACTIONS.SWITCH.TURN_ON && <Text id="editScene.actionsCard.turnOnSwitches.label" />}
          {props.action.type === ACTIONS.SWITCH.TURN_OFF && <Text id="editScene.actionsCard.turnOffSwitches.label" />}
          {props.action.type === ACTIONS.SWITCH.TOGGLE && <Text id="editScene.actionsCard.toggleSwitches.label" />}
        </label>
        {props.action.type === ACTIONS.SWITCH.TOGGLE && (
          <p>
            <Text id="editScene.actionsCard.toggleSwitches.description" />
          </p>
        )}
        <DevicePickerField
          devices={devices}
          selected={selectedOptions.map(option => option.value)}
          onChange={this.handlePickerChange}
          filterFeature={this.isWritableSwitch}
        >
          <Select
            defaultValue={[]}
            isMulti
            value={selectedOptions}
            onChange={this.handleChange}
            options={deviceOptions}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </DevicePickerField>
      </div>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(TurnOnOffSwitch));
