import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import update from 'immutability-helper';
import BaseEditBox from '../baseEditBox';
import { getDeviceFeatureName } from '../../../utils/device';
import { DeviceListWithDragAndDrop } from './DeviceListWithDragAndDrop';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import SUPPORTED_FEATURE_TYPES from './SupportedFeatureTypes';

class EditDevices extends Component {
  addDeviceFeature = async selectedDeviceFeatureOption => {
    const newSelectedDeviceFeaturesOptions = [...this.state.selectedDeviceFeaturesOptions, selectedDeviceFeatureOption];
    await this.setState({ selectedDeviceFeaturesOptions: newSelectedDeviceFeaturesOptions });
    this.refreshDeviceFeaturesNames();
  };

  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  refreshDeviceFeaturesNames = () => {
    const newDeviceFeatureNames = this.state.selectedDeviceFeaturesOptions.map(o => {
      return o.new_label !== undefined ? o.new_label : o.label;
    });
    const newDeviceFeature = this.state.selectedDeviceFeaturesOptions.map(o => {
      return o.value;
    });
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_feature_names: newDeviceFeatureNames,
      device_features: newDeviceFeature
    });
  };

  refreshDisplayForNewProps = async () => {
    if (!this.state.devices) {
      return;
    }
    if (!this.props.box || !this.props.box.device_features) {
      return;
    }
    if (!this.state.deviceOptions) {
      return;
    }
    const { selectedDeviceFeaturesOptions } = this.getSelectedDeviceFeaturesAndOptions(this.state.devices);
    await this.setState({ selectedDeviceFeaturesOptions });
  };

  updateDeviceFeatureName = async (index, name) => {
    const newState = update(this.state, {
      selectedDeviceFeaturesOptions: {
        [index]: {
          new_label: {
            $set: name
          }
        }
      }
    });
    await this.setState(newState);
    this.refreshDeviceFeaturesNames();
  };

  getSelectedDeviceFeaturesAndOptions = devices => {
    const deviceOptions = [];
    let selectedDeviceFeaturesOptions = [];

    devices.forEach(device => {
      const deviceFeatures = [];
      device.features.forEach(feature => {
        const featureOption = {
          value: feature.selector,
          label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
        };
        if (feature.read_only || SUPPORTED_FEATURE_TYPES.includes(feature.type)) {
          deviceFeatures.push(featureOption);
        }
        // If the feature is already selected
        if (this.props.box.device_features) {
          const featureIndex = this.props.box.device_features.indexOf(feature.selector);
          if (this.props.box.device_features && featureIndex !== -1) {
            // and there is a name associated to it
            if (this.props.box.device_feature_names && this.props.box.device_feature_names[featureIndex]) {
              // We set the new_label in the object
              featureOption.new_label = this.props.box.device_feature_names[featureIndex];
            }
            // And we push this to the list of selected feature
            selectedDeviceFeaturesOptions.push(featureOption);
          }
        }
      });
      if (deviceFeatures.length > 0) {
        deviceFeatures.sort((a, b) => {
          if (a.label < b.label) {
            return -1;
          } else if (a.label > b.label) {
            return 1;
          }
          return 0;
        });
        deviceOptions.push({
          label: device.name,
          options: deviceFeatures
        });
      }
    });
    if (this.props.box.device_features) {
      selectedDeviceFeaturesOptions = selectedDeviceFeaturesOptions.sort(
        (a, b) => this.props.box.device_features.indexOf(a.value) - this.props.box.device_features.indexOf(b.value)
      );
    }
    return { deviceOptions, selectedDeviceFeaturesOptions };
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      // we get the rooms with the devices
      const devices = await this.props.httpClient.get(`/api/v1/device`);
      const { deviceOptions, selectedDeviceFeaturesOptions } = this.getSelectedDeviceFeaturesAndOptions(devices);
      await this.setState({ devices, deviceOptions, selectedDeviceFeaturesOptions, loading: false });
      this.refreshDeviceFeaturesNames();
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  moveDevice = async (currentIndex, newIndex) => {
    const element = this.state.selectedDeviceFeaturesOptions[currentIndex];

    const newStateWithoutElement = update(this.state, {
      selectedDeviceFeaturesOptions: {
        $splice: [[currentIndex, 1]]
      }
    });
    const newState = update(newStateWithoutElement, {
      selectedDeviceFeaturesOptions: {
        $splice: [[newIndex, 0, element]]
      }
    });
    await this.setState(newState);
    this.refreshDeviceFeaturesNames();
  };

  removeDevice = async index => {
    const newStateWithoutElement = update(this.state, {
      selectedDeviceFeaturesOptions: {
        $splice: [[index, 1]]
      }
    });
    await this.setState(newStateWithoutElement);
    this.refreshDeviceFeaturesNames();
  };

  componentDidMount() {
    this.getDeviceFeatures();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.box.device_features !== this.props.box.device_features) {
      this.refreshDisplayForNewProps();
    }
  }

  render(props, { selectedDeviceFeaturesOptions, deviceOptions, loading }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.devices">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devices.editNameLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class="form-control"
                  placeholder={<Text id="dashboard.boxes.devices.editNamePlaceholder" />}
                  value={props.box.name}
                  onInput={this.updateName}
                />
              </Localizer>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devices.editDeviceFeaturesLabel" />
              </label>
              {selectedDeviceFeaturesOptions && (
                <DeviceListWithDragAndDrop
                  selectedDeviceFeaturesOptions={selectedDeviceFeaturesOptions}
                  moveDevice={this.moveDevice}
                  removeDevice={this.removeDevice}
                  updateDeviceFeatureName={this.updateDeviceFeatureName}
                  isTouchDevice={false}
                />
              )}
            </div>
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.devices.addADeviceLabel" />
                </label>
                <Select onChange={this.addDeviceFeature} value={[]} options={deviceOptions} maxMenuHeight={220} />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditDevices));
