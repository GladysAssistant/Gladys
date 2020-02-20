import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import get from 'get-value';

@connect('httpClient', {})
class SelectDeviceFeature extends Component {
  getOptions = async () => {
    try {
      // we get the rooms with the devices
      const rooms = await this.props.httpClient.get('/api/v1/room?expand=devices');
      const deviceOptions = [];

      const deviceFeaturesDictionnary = {};

      // and compose the multi-level options
      rooms.forEach(room => {
        const roomDeviceFeatures = [];
        room.devices.forEach(device => {
          device.features.forEach(feature => {
            deviceFeaturesDictionnary[feature.selector] = feature;
            roomDeviceFeatures.push({
              value: feature.selector,
              label: `${device.name} (${get(
                this,
                `context.intl.dictionary.deviceFeatureCategory.${feature.category}.${feature.type}`
              )}) `
            });
          });
        });
        if (roomDeviceFeatures.length > 0) {
          roomDeviceFeatures.sort((a, b) => {
            if (a.label < b.label) {
              return -1;
            } else if (a.label > b.label) {
              return 1;
            }
            return 0;
          });
          deviceOptions.push({
            label: room.name,
            options: roomDeviceFeatures
          });
        }
      });
      await this.setState({ deviceOptions, deviceFeaturesDictionnary });
      await this.refreshSelectedOptions(this.props);
      if (this.state.selectedOption && this.state.selectedOption.value) {
        this.props.onDeviceFeatureChange(this.state.deviceFeaturesDictionnary[this.state.selectedOption.value]);
      }
      return deviceOptions;
    } catch (e) {
      console.log(e);
    }
  };
  handleChange = selectedOption => {
    const { deviceFeaturesDictionnary } = this.state;
    if (selectedOption && selectedOption.value) {
      this.props.onDeviceFeatureChange(deviceFeaturesDictionnary[selectedOption.value]);
    } else {
      this.props.onDeviceFeatureChange(null);
    }
  };
  refreshSelectedOptions = async nextProps => {
    let selectedOption = '';
    if (nextProps.value && this.state.deviceOptions) {
      let deviceOption;
      let i = 0;
      while (i < this.state.deviceOptions.length && deviceOption === undefined) {
        deviceOption = this.state.deviceOptions[i].options.find(option => option.value === nextProps.value);
        i++;
      }

      if (deviceOption) {
        selectedOption = deviceOption;
      }
    }
    await this.setState({ selectedOption });
  };
  constructor(props) {
    super(props);
    this.state = {
      deviceOptions: null,
      selectedOption: ''
    };
  }

  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOption, deviceOptions }) {
    if (!deviceOptions) {
      return null;
    }
    return <Select defaultValue={''} value={selectedOption} onChange={this.handleChange} options={deviceOptions} />;
  }
}

export default SelectDeviceFeature;
