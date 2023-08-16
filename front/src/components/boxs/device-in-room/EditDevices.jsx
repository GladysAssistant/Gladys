import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import BaseEditBox from '../baseEditBox';
import { getDeviceFeatureName } from '../../../utils/device';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import SUPPORTED_FEATURE_TYPES from './SupportedFeatureTypes';

class EditDevices extends Component {
  updateDeviceFeatures = selectedDeviceFeaturesOptions => {
    selectedDeviceFeaturesOptions = selectedDeviceFeaturesOptions || [];
    const deviceFeatures = selectedDeviceFeaturesOptions.map(option => option.value);
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_features: deviceFeatures
    });
    this.setState({ selectedDeviceFeaturesOptions });
  };

  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      // we get the rooms with the devices
      const devices = await this.props.httpClient.get(`/api/v1/device`);
      const deviceOptions = [];
      const selectedDeviceFeaturesOptions = [];

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
          if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
            selectedDeviceFeaturesOptions.push(featureOption);
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
      await this.setState({ deviceOptions, selectedDeviceFeaturesOptions, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  componentDidMount() {
    this.getDeviceFeatures();
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
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.devices.editDeviceFeaturesLabel" />
                </label>
                <Select
                  defaultValue={[]}
                  value={selectedDeviceFeaturesOptions}
                  isMulti
                  onChange={this.updateDeviceFeatures}
                  options={deviceOptions}
                  maxMenuHeight={220}
                />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditDevices));
