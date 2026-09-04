import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from '../form/Select';

import { getDeviceFeatureName } from '../../utils/device';
import withIntlAsProp from '../../utils/withIntlAsProp';

// Search should not care about case or accents ("temperature" must match "Température")
const normalizeSearchString = str =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Keeps the room grouping while filtering options, dropping rooms left empty
const filterOptionGroups = (groups, predicate) =>
  groups
    .map(group => ({
      ...group,
      options: group.options.filter(predicate)
    }))
    .filter(group => group.options.length > 0);

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

      const pushDeviceFeatures = (devices, targetFeatures, roomName) => {
        devices.forEach(device => {
          device.features.forEach(feature => {
            deviceFeaturesDictionnary[feature.selector] = feature;
            deviceDictionnary[feature.selector] = device;

            if (this.props.exclude_read_only_device_features === true && feature.read_only) {
              return;
            }

            // optional caller-provided predicate: some pickers only accept a
            // subset of features (e.g. the quick-actions box only commands
            // writable binaries and shutter/curtain state)
            if (typeof this.props.filterFeature === 'function' && !this.props.filterFeature(feature)) {
              return;
            }

            const label = getDeviceFeatureName(this.props.intl.dictionary, device, feature);
            targetFeatures.push({
              value: feature.selector,
              label,
              // room is only the group header in the menu, so it is searchable through
              // this field: typing "motion living-room" narrows down to the right row
              searchText: normalizeSearchString(`${roomName} ${label}`)
            });
          });
        });
      };

      rooms.forEach(room => {
        const roomDeviceFeatures = [];
        pushDeviceFeatures(room.devices, roomDeviceFeatures, room.name);
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
      pushDeviceFeatures(devicesWithoutRoom, noRoomDeviceFeatures, this.props.intl.dictionary.device.noRoom);
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
    if (this.props.isMulti) {
      const selectedOptions = selectedOption || [];
      this.props.onDeviceFeaturesChange(
        selectedOptions.map(option => deviceFeaturesDictionnary[option.value]),
        selectedOptions.map(option => deviceDictionnary[option.value]),
        true
      );
      return;
    }
    if (selectedOption && selectedOption.value) {
      this.props.onDeviceFeatureChange(
        deviceFeaturesDictionnary[selectedOption.value],
        deviceDictionnary[selectedOption.value]
      );
    } else {
      this.props.onDeviceFeatureChange(null);
    }
  };
  findOption = value => {
    let deviceOption;
    let i = 0;
    while (i < this.state.deviceOptions.length && deviceOption === undefined) {
      deviceOption = this.state.deviceOptions[i].options.find(option => option.value === value);
      i++;
    }
    return deviceOption;
  };
  refreshSelectedOptions = async nextProps => {
    if (nextProps.isMulti) {
      const { selectedOptions: originalSelectedOptions = [] } = this.state;
      const selectedOptions = [];
      if (nextProps.value && this.state.deviceOptions) {
        nextProps.value.forEach(value => {
          const deviceOption = this.findOption(value);
          if (deviceOption) {
            selectedOptions.push(deviceOption);
          }
        });
      }

      await this.setState({ selectedOptions });

      // On first load, features are stored as selectors only: once resolved, the parent
      // needs the full feature objects (to pick the right condition widget for example).
      // This resolution is display-only (isUserChange = false): a selector that cannot be
      // resolved (deleted device, list still loading) must not be written back to the
      // trigger, so the saved selection is never silently truncated.
      const getValues = options => options.map(option => option.value).join(',');
      if (getValues(originalSelectedOptions) !== getValues(selectedOptions)) {
        this.props.onDeviceFeaturesChange(
          selectedOptions.map(option => this.state.deviceFeaturesDictionnary[option.value]),
          selectedOptions.map(option => this.state.deviceDictionnary[option.value]),
          false
        );
      }
      return;
    }

    let selectedOption = '';
    const { selectedOption: originalSelected } = this.state;
    if (nextProps.value && this.state.deviceOptions) {
      const deviceOption = this.findOption(nextProps.value);

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
  // Multiple features share a single condition, so they have to be comparable: once a
  // first feature is picked, only features of the same category/type stay selectable.
  // Side effect: the huge all-features list shrinks to the relevant ones.
  getDisplayedOptions = () => {
    const { deviceOptions, deviceFeaturesDictionnary, selectedOptions = [] } = this.state;
    const { excludedDeviceFeatures = [] } = this.props;
    let displayedOptions = deviceOptions;
    // Callers that manage their own list of picked features (e.g. the dashboard
    // devices box) hide the ones already picked so they cannot be added twice.
    // This is evaluated at render time (unlike filterFeature) because the list
    // changes after every pick.
    if (excludedDeviceFeatures.length > 0) {
      displayedOptions = filterOptionGroups(
        displayedOptions,
        option => excludedDeviceFeatures.indexOf(option.value) === -1
      );
    }
    if (!this.props.isMulti || selectedOptions.length === 0) {
      return displayedOptions;
    }
    const firstFeature = deviceFeaturesDictionnary[selectedOptions[0].value];
    if (!firstFeature) {
      return displayedOptions;
    }
    return filterOptionGroups(displayedOptions, option => {
      const feature = deviceFeaturesDictionnary[option.value];
      return feature && feature.category === firstFeature.category && feature.type === firstFeature.type;
    });
  };
  // Every typed word must match (implicit AND) against room + device + feature,
  // so "motion living" finds the motion sensor of the living room
  filterOption = (option, rawInput) => {
    if (!rawInput) {
      return true;
    }
    const searchText = option.data.searchText || normalizeSearchString(option.label);
    return normalizeSearchString(rawInput)
      .split(/\s+/)
      .filter(Boolean)
      .every(word => searchText.includes(word));
  };
  constructor(props) {
    super(props);
    this.state = {
      deviceOptions: null,
      selectedOption: '',
      selectedOptions: []
    };
  }

  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOption, selectedOptions, deviceOptions }) {
    if (!deviceOptions) {
      return null;
    }
    return (
      <Select
        class="select-device-feature"
        defaultValue={props.isMulti ? [] : ''}
        isMulti={props.isMulti}
        value={props.isMulti ? selectedOptions : selectedOption}
        onChange={this.handleChange}
        options={this.getDisplayedOptions()}
        filterOption={this.filterOption}
        styles={{ menu: base => ({ ...base, zIndex: 2 }) }}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(SelectDeviceFeature));
