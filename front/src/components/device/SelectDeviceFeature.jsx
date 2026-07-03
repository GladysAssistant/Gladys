import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import get from 'get-value';

import { getDeviceFeatureName } from '../../utils/device';
import withIntlAsProp from '../../utils/withIntlAsProp';
import './SelectDeviceFeature.css';

const sortByLabel = (a, b) => a.label.localeCompare(b.label);

class SelectDeviceFeature extends Component {
  getFeatureTypeLabel = (category, type) => {
    const label = get(this.props.intl.dictionary, `deviceFeatureCategory.${category}.${type}`);
    if (label) {
      return label;
    }
    return `${category} / ${type}`;
  };

  getOptions = async () => {
    try {
      const rooms = await this.props.httpClient.get('/api/v1/room', { expand: 'devices' });

      const deviceDictionnary = {};
      const deviceFeaturesDictionnary = {};
      const allFeatures = [];
      const roomOptions = [];

      const pushDeviceFeatures = (devices, roomId = null, roomName = null) => {
        devices.forEach(device => {
          device.features.forEach(feature => {
            deviceFeaturesDictionnary[feature.selector] = feature;
            deviceDictionnary[feature.selector] = device;

            if (this.props.exclude_read_only_device_features === true && feature.read_only) {
              return;
            }

            allFeatures.push({
              feature,
              device,
              roomId,
              roomName
            });
          });
        });
      };

      rooms.forEach(room => {
        roomOptions.push({ value: room.id, label: room.name });
        pushDeviceFeatures(room.devices, room.id, room.name);
      });

      let devicesWithoutRoom = [];
      try {
        const allDevices = await this.props.httpClient.get('/api/v1/device');
        devicesWithoutRoom = allDevices.filter(device => !device.room_id);
      } catch (e) {
        console.error('Could not load devices without room', e);
      }

      pushDeviceFeatures(devicesWithoutRoom, 'no-room', this.props.intl.dictionary.device.noRoom);

      const featureTypeOptions = [];
      const seenFeatureTypes = new Set();
      allFeatures.forEach(({ feature }) => {
        const featureTypeKey = `${feature.category}:${feature.type}`;
        if (!seenFeatureTypes.has(featureTypeKey)) {
          seenFeatureTypes.add(featureTypeKey);
          featureTypeOptions.push({
            value: featureTypeKey,
            label: this.getFeatureTypeLabel(feature.category, feature.type)
          });
        }
      });
      featureTypeOptions.sort(sortByLabel);
      roomOptions.sort(sortByLabel);

      await this.setState({
        allFeatures,
        roomOptions,
        featureTypeOptions,
        deviceFeaturesDictionnary,
        deviceDictionnary
      });
      await this.refreshSelectedOptions(this.props);
    } catch (e) {
      console.error(e);
    }
  };

  getFilteredDeviceOptions = () => {
    const { allFeatures, filterRoom, filterType } = this.state;
    if (!allFeatures) {
      return [];
    }

    let filteredFeatures = allFeatures;
    if (filterRoom) {
      filteredFeatures = filteredFeatures.filter(({ roomId }) => roomId === filterRoom);
    }
    if (filterType) {
      filteredFeatures = filteredFeatures.filter(({ feature }) => `${feature.category}:${feature.type}` === filterType);
    }

    const featureOptions = filteredFeatures.map(({ feature, device }) => ({
      value: feature.selector,
      label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
    }));
    featureOptions.sort(sortByLabel);

    if (filterRoom || filterType) {
      return featureOptions;
    }

    const groupedOptions = {};
    filteredFeatures.forEach(({ feature, device, roomName }) => {
      const groupLabel = roomName || this.props.intl.dictionary.device.noRoom;
      if (!groupedOptions[groupLabel]) {
        groupedOptions[groupLabel] = [];
      }
      groupedOptions[groupLabel].push({
        value: feature.selector,
        label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
      });
    });

    return Object.keys(groupedOptions)
      .sort()
      .map(label => {
        const options = groupedOptions[label];
        options.sort(sortByLabel);
        return { label, options };
      });
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

  handleMultiChange = selectedOptions => {
    const { deviceFeaturesDictionnary, deviceDictionnary } = this.state;

    if (!selectedOptions || selectedOptions.length === 0) {
      this.setState({ selectedOption: null, selectedOptions: [] });
      this.props.onDeviceFeatureChange(null);
      return;
    }

    const firstOption = selectedOptions[0];
    const additionalOptions = selectedOptions.slice(1);

    this.props.onDeviceFeatureChange(
      deviceFeaturesDictionnary[firstOption.value],
      deviceDictionnary[firstOption.value]
    );

    if (additionalOptions.length > 0 && this.props.onAdditionalDeviceFeaturesSelected) {
      this.props.onAdditionalDeviceFeaturesSelected(
        additionalOptions.map(option => ({
          deviceFeature: deviceFeaturesDictionnary[option.value],
          device: deviceDictionnary[option.value]
        }))
      );
    }

    this.setState({ selectedOption: firstOption, selectedOptions: [firstOption] });
  };

  handleRoomFilterChange = selectedOption => {
    this.setState({ filterRoom: selectedOption ? selectedOption.value : null });
  };

  handleTypeFilterChange = selectedOption => {
    this.setState({ filterType: selectedOption ? selectedOption.value : null });
  };

  refreshSelectedOptions = async nextProps => {
    const deviceOptions = this.getFilteredDeviceOptions();
    let selectedOption = null;
    const { selectedOption: originalSelected } = this.state;

    if (nextProps.value && this.state.deviceFeaturesDictionnary[nextProps.value]) {
      const feature = this.state.deviceFeaturesDictionnary[nextProps.value];
      const device = this.state.deviceDictionnary[nextProps.value];
      selectedOption = {
        value: nextProps.value,
        label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
      };
    }

    const selectedOptions = selectedOption ? [selectedOption] : [];

    await this.setState({
      selectedOption,
      selectedOptions,
      deviceOptions
    });

    if (!this.props.isMulti && originalSelected !== selectedOption && nextProps.value !== this.props.value) {
      if (selectedOption) {
        this.props.onDeviceFeatureChange(
          this.state.deviceFeaturesDictionnary[selectedOption.value],
          this.state.deviceDictionnary[selectedOption.value]
        );
      } else if (nextProps.value === null || nextProps.value === undefined) {
        this.props.onDeviceFeatureChange(null, null);
      }
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      allFeatures: null,
      roomOptions: [],
      featureTypeOptions: [],
      deviceOptions: null,
      deviceFeaturesDictionnary: {},
      deviceDictionnary: {},
      filterRoom: null,
      filterType: null,
      selectedOption: null,
      selectedOptions: []
    };
  }

  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.filterRoom !== this.state.filterRoom ||
      prevState.filterType !== this.state.filterType ||
      prevState.allFeatures !== this.state.allFeatures
    ) {
      this.refreshSelectedOptions(this.props);
    }
  }

  render(props, state) {
    const { withFilters, isMulti } = props;
    const {
      deviceOptions,
      roomOptions,
      featureTypeOptions,
      filterRoom,
      filterType,
      selectedOption,
      selectedOptions
    } = state;

    if (!deviceOptions) {
      return null;
    }

    const roomFilterValue = filterRoom ? roomOptions.find(option => option.value === filterRoom) : null;
    const typeFilterValue = filterType ? featureTypeOptions.find(option => option.value === filterType) : null;

    return (
      <div>
        {withFilters && (
          <div class="select-device-feature-filters">
            <div class="select-device-feature-filter">
              <Select
                isClearable
                placeholder={<Text id="selectDeviceFeature.filterByRoom" />}
                value={roomFilterValue}
                onChange={this.handleRoomFilterChange}
                options={roomOptions}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <div class="select-device-feature-filter">
              <Select
                isClearable
                placeholder={<Text id="selectDeviceFeature.filterByType" />}
                value={typeFilterValue}
                onChange={this.handleTypeFilterChange}
                options={featureTypeOptions}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </div>
        )}
        <Select
          class="select-device-feature"
          defaultValue={isMulti ? [] : ''}
          isMulti={isMulti}
          closeMenuOnSelect={!isMulti}
          value={isMulti ? selectedOptions : selectedOption}
          onChange={isMulti ? this.handleMultiChange : this.handleChange}
          options={deviceOptions}
          styles={{ menu: base => ({ ...base, zIndex: 2 }) }}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(SelectDeviceFeature));
