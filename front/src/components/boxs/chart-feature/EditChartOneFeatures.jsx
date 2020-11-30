import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';

import BaseEditBox from '../baseEditBox';
import ChartTypeSelector from './ChartTypeSelector';
import ChartPeriodSelector from './ChartPeriodSelector';
import { getDeviceFeatureName } from '../../../utils/device';
import { DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

import actions from '../../../actions/dashboard/edit-boxes/editChartFeatures';

@connect('httpClient', actions)
class EditChartMultiFeatures extends Component {
  updateBoxChartType = chartType => {
    this.props.updateBoxChartType(this.props.x, this.props.y, chartType.value);
  };

  updateBoxChartPeriod = chartPeriod => {
    this.props.updateBoxChartPeriod(this.props.x, this.props.y, chartPeriod.value);
  };

  updateDeviceFeatures = selectedDeviceFeaturesOptions => {
    selectedDeviceFeaturesOptions = selectedDeviceFeaturesOptions || {};
    const deviceFeatures = [selectedDeviceFeaturesOptions.value];
    this.props.updateBoxDeviceFeatures(this.props.x, this.props.y, deviceFeatures);
    this.setState({ selectedDeviceFeaturesOptions });
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });

      const excludeFeatyreType = [
        DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
        DEVICE_FEATURE_TYPES.SENSOR.UNKNOWN,
        DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN,
        DEVICE_FEATURE_TYPES.LIGHT.COLOR
      ];

      let devices = await this.props.httpClient.get(`/api/v1/device`);

      const deviceOptions = [];
      const selectedDeviceFeaturesOptions = [];
      devices.forEach(device => {
        const roomDeviceFeatures = [];
        device.features.forEach(feature => {
          if (!excludeFeatyreType.includes(feature.type)) {
            const featureOption = {
              value: feature.selector,
              label: getDeviceFeatureName(this.context.intl.dictionary, device, feature)
            };
            if (feature.read_only) {
              roomDeviceFeatures.push(featureOption);
            }
            if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
              selectedDeviceFeaturesOptions.push(featureOption);
            }
          }
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
            label: device.name,
            options: roomDeviceFeatures
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
    this.getDeviceFeatures();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.box.room !== this.props.box.room ||
      prevProps.box.chartLimitClass !== this.props.box.chartLimitClass
    ) {
      this.getDeviceFeatures();
    }
  }

  render(props, { selectedDeviceFeaturesOptions, deviceOptions, loading }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.chart-multi-feature">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devicesChart.editChartType" />
              </label>
              <ChartTypeSelector
                selectedChartType={props.box.chartType}
                updateChartTypeSelection={this.updateBoxChartType}
              />
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devicesChart.editChartPeriod" />
              </label>
              <ChartPeriodSelector
                selectedChartPeriod={props.box.chartPeriod}
                updateChartPeriodSelection={this.updateBoxChartPeriod}
              />
            </div>
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.devicesChart.editDeviceFeaturesLabel" />
                </label>
                <Select
                  value={selectedDeviceFeaturesOptions}
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

export default EditChartMultiFeatures;
