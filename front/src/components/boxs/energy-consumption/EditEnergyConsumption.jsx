import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';

import BaseEditBox from '../baseEditBox';
import EnergyConsumption from './EnergyConsumption';
import { getDeviceFeatureName } from '../../../utils/device';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';
import withIntlAsProp from '../../../utils/withIntlAsProp';

class EditEnergyConsumption extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      devices: [],
      deviceFeatures: []
    };
  }

  componentDidMount() {
    this.getDevices();
  }

  getDevices = async () => {
    try {
      this.setState({ loading: true });
      const devices = await this.props.httpClient.get(`/api/v1/device`);

      this.setState({
        devices,
        loading: false
      });
    } catch (e) {
      console.error('Error fetching devices:', e);
      this.setState({ loading: false });
    }
  };

  updateBoxName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  updateDeviceFeatures = selectedOptions => {
    if (selectedOptions && selectedOptions.length > 0) {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_features: selectedOptions.map(selectedOption => selectedOption.value)
      });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_features: []
      });
    }
  };

  getSelectedDeviceFeatures = () => {
    if (!this.props.box.device_features) {
      return [];
    }
    return this.props.box.device_features.map(deviceFeatureSelector => {
      const deviceFeature = this.state.deviceFeatures.find(d => d.selector === deviceFeatureSelector);
      if (!deviceFeature) {
        return {
          label: deviceFeatureSelector,
          value: deviceFeatureSelector
        };
      }
      return {
        label: getDeviceFeatureName(this.state.devices, this.state.deviceFeatures, deviceFeature),
        value: deviceFeature.selector
      };
    });
  };

  getDeviceFeatureOptions = () => {
    const deviceFeaturesOptions = [];
    this.state.devices.forEach(device => {
      device.features.forEach(feature => {
        if (
          feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
          feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST
        ) {
          deviceFeaturesOptions.push({
            label: getDeviceFeatureName(this.props.intl.dictionary, device, feature),
            value: feature.selector
          });
        }
      });
    });
    return deviceFeaturesOptions;
  };

  render(props, { loading }) {
    if (loading) {
      return (
        <BaseEditBox {...props} titleKey="dashboard.boxTitle.energy-consumption">
          <div class="text-center">
            <div class="spinner-border" role="status">
              <span class="sr-only">
                <Text id="global.loading" />
              </span>
            </div>
          </div>
        </BaseEditBox>
      );
    }

    const selectedDeviceFeatures = this.getSelectedDeviceFeatures();
    const deviceFeatureOptions = this.getDeviceFeatureOptions();

    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.energy-consumption">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.energyConsumption.editName" />
          </label>
          <Localizer>
            <input
              type="text"
              value={props.box.name}
              onInput={this.updateBoxName}
              class="form-control"
              placeholder={<Text id="dashboard.boxes.energyConsumption.editNamePlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.energyConsumption.editDeviceFeatures" />
          </label>
          <Select
            defaultValue={[]}
            value={selectedDeviceFeatures}
            isMulti
            onChange={this.updateDeviceFeatures}
            options={deviceFeatureOptions}
            maxMenuHeight={220}
          />
        </div>
        <div class="form-group">
          <label>
            <Text id="global.preview" />
          </label>
          <EnergyConsumption {...props} />
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('user,session,httpClient', {})(withIntlAsProp(EditEnergyConsumption));
