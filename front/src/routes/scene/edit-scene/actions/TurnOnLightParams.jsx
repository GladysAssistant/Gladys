import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from 'react-select';

@connect('httpClient', {})
class TurnOnLight extends Component {
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
      await this.setState({ deviceOptions });
      this.refreshSelectedOptions(this.props);
      return deviceOptions;
    } catch (e) {
      console.log(e);
    }
  };
  handleChange = selectedOptions => {
    if (selectedOptions) {
      const lights = selectedOptions.map(selectedOption => selectedOption.value);
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'devices', lights);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'devices', []);
    }
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
        <label class="form-label">Select the lights you want to turn on</label>
        <Select
          defaultValue={[]}
          isMulti
          value={selectedOptions}
          onChange={this.handleChange}
          options={deviceOptions}
        />
      </div>
    );
  }
}

export default TurnOnLight;
