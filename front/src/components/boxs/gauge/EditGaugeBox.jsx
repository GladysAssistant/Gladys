import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import { connect } from 'unistore/preact';
import { getDeviceFeatureName } from '../../../utils/device';
import withIntlAsProp from '../../../utils/withIntlAsProp';

import BaseEditBox from '../baseEditBox';

class EditGaugeBoxComponent extends Component {
  updateDeviceFeature = option => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_feature: option ? option.value : null
    });
    this.setState({ selectedDeviceFeatureOptions: option });
  };

  getSelectedDeviceFeatureAndOptions = devices => {
    const deviceOptions = [];
    let selectedDeviceFeatureOptions = null;

    devices.forEach(device => {
      const deviceFeatures = [];
      device.features.forEach(feature => {
        const featureOption = {
          value: feature.selector,
          label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
        };
        deviceFeatures.push(featureOption);
        // If the feature is already selected
        if (this.props.box.device_feature === feature.selector) {
          selectedDeviceFeatureOptions = featureOption;
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
        if (deviceFeatures.length > 0) {
          deviceOptions.push({
            label: device.name,
            options: deviceFeatures
          });
        }
      }
    });
    return { deviceOptions, selectedDeviceFeatureOptions };
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      // we get the rooms with the devices
      const devices = await this.props.httpClient.get(`/api/v1/device`);
      const { deviceOptions, selectedDeviceFeatureOptions } = this.getSelectedDeviceFeatureAndOptions(devices);
      this.setState({ deviceOptions, selectedDeviceFeatureOptions, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  componentDidMount() {
    this.getDeviceFeatures();
  }

  render(props, { deviceOptions, selectedDeviceFeatureOptions }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.gauge">
        <p>
          <Text id="dashboard.boxes.gauge.description" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.boxes.gauge.selectDeviceLabel" />
          </label>
          <Select
            defaultValue={selectedDeviceFeatureOptions}
            value={selectedDeviceFeatureOptions}
            onChange={this.updateDeviceFeature}
            options={deviceOptions}
          />
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(EditGaugeBoxComponent));
