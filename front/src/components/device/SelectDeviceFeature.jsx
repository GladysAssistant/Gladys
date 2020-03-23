import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from '../form/Select';

import { getDeviceFeatureName } from '../../utils/device';

@connect('httpClient', {})
class SelectDeviceFeature extends Component {
  getOptions = async () => {
    const deviceOptions = [];
    try {
      this.setState({ loading: true });

      // we get the rooms with the devices
      const rooms = await this.props.httpClient.get('/api/v1/room?expand=devices');

      // and compose the multi-level options
      rooms.forEach(room => {
        const roomDeviceFeatures = [];
        room.devices.forEach(device => {
          device.features.forEach(feature => {
            roomDeviceFeatures.push({
              device,
              feature,
              label: getDeviceFeatureName(this.context.intl.dictionary, device, feature)
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
    } catch (e) {
      console.log(e);
    }

    await this.setState({ deviceOptions, loading: false });
    await this.refreshSelectedOptions(this.props);
    if (this.state.selectedOption) {
      this.handleChange(this.state.selectedOption);
    }
  };

  handleChange = selectedOption => {
    if (selectedOption) {
      this.props.onDeviceFeatureChange(selectedOption.feature, selectedOption.device);
    } else {
      this.props.onDeviceFeatureChange(null, null);
    }
  };

  refreshSelectedOptions = async nextProps => {
    let selectedOption;
    if (nextProps.value && this.state.deviceOptions) {
      let deviceOption;
      let i = 0;
      while (i < this.state.deviceOptions.length && deviceOption === undefined) {
        deviceOption = this.state.deviceOptions[i].options.find(option => option.feature.selector === nextProps.value);
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
      selectedOption: null
    };
  }

  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render({}, { deviceOptions, selectedOption, loading }) {
    return (
      <Select
        value={selectedOption}
        onChange={this.handleChange}
        options={deviceOptions}
        useGroups
        searchable
        loading={loading}
      />
    );
  }
}

export default SelectDeviceFeature;
