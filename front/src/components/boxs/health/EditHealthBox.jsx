import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';

import BaseEditBox from '../baseEditBox';
import { getDeviceFeatureName } from '../../../utils/device';

import actions from '../../../actions/dashboard/edit-boxes/editHealth';

@connect('httpClient', actions)
class EditHealthBox extends Component {
  updateDeviceFeatures = selectedDeviceFeaturesOptions => {
    selectedDeviceFeaturesOptions = selectedDeviceFeaturesOptions || [];
    const deviceFeatures = selectedDeviceFeaturesOptions.map(option => option.value);
    this.props.updateBoxDeviceFeatures(this.props.x, this.props.y, deviceFeatures);
    this.setState({ selectedDeviceFeaturesOptions });
  };

  getHealthData = async () => {
    try {
      this.setState({ loading: true });

      // we get the all health data
      const healthData = await this.props.httpClient.get(`/api/v1/health`);
      const deviceOptions = [];
      const selectedDeviceFeaturesOptions = [];

      healthData.devices.forEach(device => {
        const healthDeviceFeatures = [];
        device.features.forEach(feature => {
          const featureOption = {
            value: feature.selector,
            label: getDeviceFeatureName(this.context.intl.dictionary, device, feature)
          };
          healthDeviceFeatures.push(featureOption);

          if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
            selectedDeviceFeaturesOptions.push(featureOption);
          }
        });

        if (healthDeviceFeatures.length > 0) {
          healthDeviceFeatures.sort((a, b) => {
            if (a.label < b.label) {
              return -1;
            } else if (a.label > b.label) {
              return 1;
            }
            return 0;
          });
          deviceOptions.push({
            label: device.name,
            options: healthDeviceFeatures
          });
        }
      });

      await this.setState({ deviceOptions, selectedDeviceFeaturesOptions, loading: false });
    } catch (e) {
      console.log(e);
      this.setState({ loading: false });
    }
  };

  componentDidMount() {
    this.getHealthData();
  }

  render(props, { selectedDeviceFeaturesOptions, deviceOptions, loading }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.health">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.health.editDeviceFeaturesLabel" />
                </label>
                <Select
                  defaultValue={[]}
                  value={selectedDeviceFeaturesOptions}
                  isMulti
                  onChange={this.updateDeviceFeatures}
                  options={deviceOptions}
                />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default EditHealthBox;
