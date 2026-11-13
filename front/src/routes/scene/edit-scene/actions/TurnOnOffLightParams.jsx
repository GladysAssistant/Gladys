import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from '../../../../components/form/Select';
import DevicePickerField from '../../../../components/device/DevicePickerField';

import { ACTIONS } from '../../../../../../server/utils/constants';

class TurnOnOffLight extends Component {
  getOptions = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: 'light',
        device_feature_type: 'binary'
      });
      const deviceOptions = devices.map(device => ({
        value: device.selector,
        label: device.name
      }));
      await this.setState({ deviceOptions, devices });
      this.refreshSelectedOptions(this.props);
      return deviceOptions;
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOptions => {
    if (selectedOptions) {
      const lights = selectedOptions.map(selectedOption => selectedOption.value);
      this.props.updateActionProperty(this.props.path, 'devices', lights);
    } else {
      this.props.updateActionProperty(this.props.path, 'devices', []);
    }
  };
  // on a phone the lights are picked in the device picker sheet, by room
  handlePickerChange = lights => {
    this.props.updateActionProperty(this.props.path, 'devices', lights);
  };
  refreshSelectedOptions = nextProps => {
    const selectedOptions = [];
    if (nextProps.action.devices && this.state.deviceOptions) {
      nextProps.action.devices.forEach(light => {
        const deviceOption = this.state.deviceOptions.find(deviceOption => deviceOption.value === light);
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
          {props.action.type === ACTIONS.LIGHT.TURN_ON && <Text id="editScene.actionsCard.turnOnLights.label" />}
          {props.action.type === ACTIONS.LIGHT.TURN_OFF && <Text id="editScene.actionsCard.turnOffLights.label" />}
          {props.action.type === ACTIONS.LIGHT.TOGGLE && <Text id="editScene.actionsCard.toggleLights.label" />}
        </label>
        {props.action.type === ACTIONS.LIGHT.TOGGLE && (
          <p>
            <Text id="editScene.actionsCard.toggleLights.description" />
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

export default connect('httpClient', {})(TurnOnOffLight);
