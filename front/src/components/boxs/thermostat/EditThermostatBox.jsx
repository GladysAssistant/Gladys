import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import { connect } from 'unistore/preact';
import { getDeviceFeatureName } from '../../../utils/device';
import withIntlAsProp from '../../../utils/withIntlAsProp';

import BaseEditBox from '../baseEditBox';
import { th } from 'date-fns/locale';

class EditThermostatBox extends Component {
  state = {
    deviceOptions: [],
    selectedDeviceFeatureOptions: {},
    loading: true,
    deviceFeatures: [],
    deviceFeatureNames: [null, null, null, null, null, null],
    unit: ''
  };

  prompts = [
    {
      id: 'dashboard.boxes.thermostat.selectActualTempSensor',
      key: 'actual_temp_sensor',
      title: 'Select Actual Temperature Sensor'
    },
    {
      id: 'dashboard.boxes.thermostat.selectMinTempSetpoint',
      key: 'min_temp_setpoint',
      title: 'Select Minimum Temperature Setpoint'
    },
    {
      id: 'dashboard.boxes.thermostat.selectMaxTempSetpoint',
      key: 'max_temp_setpoint',
      title: 'Select Maximum Temperature Setpoint'
    },
    {
      id: 'dashboard.boxes.thermostat.selectTargetTempSetpoint',
      key: 'target_temp_setpoint',
      title: 'Select Target Temperature Setpoint'
    },
    {
      id: 'dashboard.boxes.thermostat.selectHeatingActiveSetpoint',
      key: 'heating_active_sensor',
      title: 'Select Heating Active Sensor'
    },
    {
      id: 'dashboard.boxes.thermostat.selectAutoManualSetting',
      key: 'auto_manual_setting',
      title: 'Select Auto/Manual Setting'
    }
  ];

  updateDeviceFeature = (option, key) => {
    const index = this.prompts.findIndex(prompt => prompt.key === key);
    if (index === -1) {
      return;
    }
    this.state.deviceFeatures[index] = option ? option.value : null;
    this.state.deviceFeatureNames[index] = key;
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_features: this.state.deviceFeatures,
      device_feature_names: this.state.deviceFeatureNames,
      unit: this.state.unit
    });
    this.setState({ deviceFeatures: this.state.deviceFeatures, deviceFeatureNames: this.state.deviceFeatureNames });
  };

  getSelectedDeviceFeatureAndOptions = devices => {
    const deviceOptions = [];

    devices.forEach(device => {
      const deviceFeatures = [];
      device.params.forEach(param => {
        if (param.name.match(/temp/)) {
          const unit = JSON.parse(param.value).unit;
          this.setState({ unit });
        }
      });
      device.features.forEach(feature => {
        const featureOption = {
          value: feature.selector,
          label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
        };
        deviceFeatures.push(featureOption);
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
    return deviceOptions;
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      // we get the rooms with the devices
      const devices = await this.props.httpClient.get(`/api/v1/device`);
      const deviceOptions = this.getSelectedDeviceFeatureAndOptions(devices);
      this.setState({
        deviceOptions,
        loading: false,
        deviceFeatures: this.props.box.device_features,
        deviceFeatureNames: this.props.box.device_feature_names,
        unit: this.props.box.unit
      });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  componentDidMount() {
    this.getDeviceFeatures();
  }

  render(props, { deviceOptions }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.thermostat" title="Thermostat">
        <p>
          <Text id="dashboard.boxes.thermostat.description" />
        </p>
        <div class="form-group">
          {this.prompts.map(prompt => {
            const index = this.prompts.findIndex(prompts => prompts.key === prompt.key);
            const selectedSelector = !this.state.loading ? this.state.deviceFeatures[index] : '';

            // Find the matching option object from deviceOptions
            let selectedOption = null;
            if (selectedSelector) {
              for (const group of deviceOptions) {
                const found = group.options.find(opt => opt.value === selectedSelector);
                if (found) {
                  selectedOption = found;
                  break;
                }
              }
            }
            return (
              <div key={prompt.id}>
                <label class="form-label">
                  <Text id={prompt.id}>{prompt.title}</Text>
                </label>
                <Select
                  defaultValue={selectedOption}
                  value={selectedOption}
                  onChange={e => this.updateDeviceFeature(e, prompt.key)}
                  options={deviceOptions}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            );
          })}
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(EditThermostatBox));
