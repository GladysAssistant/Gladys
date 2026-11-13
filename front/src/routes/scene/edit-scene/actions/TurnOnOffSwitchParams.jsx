import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from '../../../../components/form/Select';
import DevicePickerField from '../../../../components/device/DevicePickerField';

import { ACTIONS } from '../../../../../../server/utils/constants';

class TurnOnOffSwitch extends Component {
  getOptions = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: 'switch',
        device_feature_type: 'binary'
      });
      // keep only write switches, not read only
      const devicesFiltered = devices.filter(device => {
        const writeSwitch = device.features.find(f => f.read_only === false);
        return writeSwitch !== undefined;
      });
      const deviceOptions = devicesFiltered.map(device => ({
        value: device.selector,
        label: device.name
      }));
      await this.setState({ deviceOptions, devices: devicesFiltered });
      this.refreshSelectedOptions(this.props);
      return deviceOptions;
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOptions => {
    if (selectedOptions) {
      const switches = selectedOptions.map(selectedOption => selectedOption.value);
      this.props.updateActionProperty(this.props.path, 'devices', switches);
    } else {
      this.props.updateActionProperty(this.props.path, 'devices', []);
    }
  };
  // on a phone the switches are picked in the device picker sheet, by room
  handlePickerChange = switches => {
    this.props.updateActionProperty(this.props.path, 'devices', switches);
  };
  refreshSelectedOptions = nextProps => {
    const selectedOptions = [];
    if (nextProps.action.devices && this.state.deviceOptions) {
      nextProps.action.devices.forEach(switches => {
        const deviceOption = this.state.deviceOptions.find(deviceOption => deviceOption.value === switches);
        if (deviceOption) {
          selectedOptions.push(deviceOption);
        }
      });
    }
    this.setState({ selectedOptions });
  };
  constructor(props) {
    super(props);
    this.state = {
      deviceOptions: null,
      devices: null,
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
          selected={props.action.devices}
          onChange={this.handlePickerChange}
          pickDevices
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

export default connect('httpClient', {})(TurnOnOffSwitch);
