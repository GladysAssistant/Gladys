import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from 'react-select';

import { getDeviceFeatureName } from '../../utils/device';
import withIntlAsProp from '../../utils/withIntlAsProp';

class SelectDeviceFeature extends Component {
  getOptions = async () => {
    try {
      const rooms = await this.props.httpClient.get('/api/v1/room', { expand: 'devices' });
      const deviceOptions = [];

      const deviceDictionnary = {};
      const deviceFeaturesDictionnary = {};

      const sortByLabel = (a, b) => {
        if (a.label < b.label) {
          return -1;
        }
        if (a.label > b.label) {
          return 1;
        }
        return 0;
      };

      const pushDeviceFeatures = (devices, targetFeatures) => {
        devices.forEach(device => {
          device.features.forEach(feature => {
            deviceFeaturesDictionnary[feature.selector] = feature;
            deviceDictionnary[feature.selector] = device;

            if (this.props.exclude_read_only_device_features === true && feature.read_only) {
              return;
            }

            targetFeatures.push({
              value: feature.selector,
              label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
            });
          });
        });
      };

      rooms.forEach(room => {
        const roomDeviceFeatures = [];
        pushDeviceFeatures(room.devices, roomDeviceFeatures);
        if (roomDeviceFeatures.length > 0) {
          roomDeviceFeatures.sort(sortByLabel);
          deviceOptions.push({
            label: room.name,
            options: roomDeviceFeatures
          });
        }
      });

      let devicesWithoutRoom = [];
      try {
        const allDevices = await this.props.httpClient.get('/api/v1/device');
        devicesWithoutRoom = allDevices.filter(device => !device.room_id);
      } catch (e) {
        console.error('Could not load devices without room', e);
      }

      const noRoomDeviceFeatures = [];
      pushDeviceFeatures(devicesWithoutRoom, noRoomDeviceFeatures);
      if (noRoomDeviceFeatures.length > 0) {
        noRoomDeviceFeatures.sort(sortByLabel);
        deviceOptions.push({
          label: this.props.intl.dictionary.device.noRoom,
          options: noRoomDeviceFeatures
        });
      }

      await this.setState({ deviceOptions, deviceFeaturesDictionnary, deviceDictionnary });
      await this.refreshSelectedOptions(this.props);
      return deviceOptions;
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOption => {
    const { deviceFeaturesDictionnary, deviceDictionnary } = this.state;
    if (selectedOption && selectedOption.value) {
      this.props.onDeviceFeatureChange(
        deviceFeaturesDictionnary[selectedOption.value],
        deviceDictionnary[selectedOption.value]
      );
    } else {
      this.props.onDeviceFeatureChange(null);
    }
  };
  refreshSelectedOptions = async nextProps => {
    let selectedOption = '';
    const { selectedOption: originalSelected } = this.state;
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

    if (originalSelected !== selectedOption) {
      if (selectedOption) {
        this.props.onDeviceFeatureChange(
          this.state.deviceFeaturesDictionnary[selectedOption.value],
          this.state.deviceDictionnary[selectedOption.value]
        );
      } else {
        this.props.onDeviceFeatureChange(null, null);
      }
    }
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
    return (
      <Select
        class="select-device-feature"
        defaultValue={''}
        value={selectedOption}
        onChange={this.handleChange}
        options={deviceOptions}
        styles={{ menu: base => ({ ...base, zIndex: 2 }) }}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(SelectDeviceFeature));
