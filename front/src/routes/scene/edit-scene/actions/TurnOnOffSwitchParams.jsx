import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from '../../../../components/form/Select';
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
      const deviceOptions = [];
      devices.forEach(device => {
        const switches = device.features.filter(
          f =>
            f.category === DEVICE_FEATURE_CATEGORIES.SWITCH &&
            f.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY &&
            f.read_only === false
        );
        switches.forEach(feature => {
          deviceOptions.push({
            value: feature.selector,
            label: getDeviceFeatureName(this.props.intl.dictionary, device, feature),
            deviceSelector: device.selector
          });
        });
      });
      await this.setState({ deviceOptions });
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
    // as all their switches selected: the selection now lives in device_features only
    if (this.props.action.devices) {
      this.props.updateActionProperty(this.props.path, 'devices', undefined);
    }
  };
  refreshSelectedOptions = nextProps => {
    const { device_features: deviceFeatures = [], devices = [] } = nextProps.action;
    // Same rule as the execution: the devices are only a fallback when no switch is selected
    const selectedOptions = (this.state.deviceOptions || []).filter(deviceOption =>
      deviceFeatures.length > 0
        ? deviceFeatures.includes(deviceOption.value)
        : devices.includes(deviceOption.deviceSelector)
    );
    this.setState({ selectedOptions });
  };
  constructor(props) {
    super(props);
    this.state = {
      deviceOptions: null,
      selectedOptions: []
    };
  }
  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOptions, deviceOptions }) {
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
        <Select
          defaultValue={[]}
          isMulti
          value={selectedOptions}
          onChange={this.handleChange}
          options={deviceOptions}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(TurnOnOffSwitch));
