import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import get from 'get-value';

import BaseEditBox from '../baseEditBox';
import Chart from './Chart';
import { getDeviceFeatureName } from '../../../utils/device';
import { DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';
import withIntlAsProp from '../../../utils/withIntlAsProp';

const FEATURES_THAT_ARE_NOT_COMPATIBLE = {
  [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: true,
  [DEVICE_FEATURE_TYPES.SENSOR.PUSH]: true,
  [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: true,
  [DEVICE_FEATURE_TYPES.CAMERA.IMAGE]: true
};

class EditChart extends Component {
  showPreview = () => {
    this.setState({
      displayPreview: true
    });
  };

  updateDefaultInterval = e => {
    if (e.target.value && e.target.value.length) {
      this.props.updateBoxConfig(this.props.x, this.props.y, { interval: e.target.value });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, { interval: undefined });
    }
  };

  updateChartType = e => {
    if (e.target.value && e.target.value.length) {
      this.props.updateBoxConfig(this.props.x, this.props.y, { chart_type: e.target.value });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, { chart_type: undefined });
    }
  };

  updateDisplayAxes = e => {
    if (e.target.value && e.target.value.length) {
      const valueBoolean = e.target.value === 'yes';
      this.props.updateBoxConfig(this.props.x, this.props.y, { display_axes: valueBoolean });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, { display_axes: undefined });
    }
  };

  updateDisplayVariation = e => {
    if (e.target.value && e.target.value.length) {
      const valueBoolean = e.target.value === 'yes';
      this.props.updateBoxConfig(this.props.x, this.props.y, { display_variation: valueBoolean });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, { display_variation: undefined });
    }
  };

  updateBoxTitle = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { title: e.target.value });
  };

  updateDeviceFeatures = selectedDeviceFeaturesOptions => {
    if (selectedDeviceFeaturesOptions && selectedDeviceFeaturesOptions.length > 0) {
      const deviceFeaturesSelectors = selectedDeviceFeaturesOptions.map(
        selectedDeviceFeaturesOption => selectedDeviceFeaturesOption.value
      );
      const units = selectedDeviceFeaturesOptions.map(selectedDeviceFeaturesOption => {
        const deviceFeature = this.deviceFeatureBySelector.get(selectedDeviceFeaturesOption.value);
        return deviceFeature.unit;
      });
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_features: deviceFeaturesSelectors,
        units,
        unit: undefined
      });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_features: [],
        units: [],
        unit: undefined
      });
    }
    this.setState({ selectedDeviceFeaturesOptions });
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      const devices = await this.props.httpClient.get('/api/v1/device');
      const deviceOptions = [];
      const selectedDeviceFeaturesOptions = [];

      devices.forEach(device => {
        const deviceFeaturesOptions = [];
        device.features.forEach(feature => {
          const featureOption = {
            value: feature.selector,
            label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
          };
          this.deviceFeatureBySelector.set(feature.selector, feature);
          // We don't support all devices for this view
          if (!FEATURES_THAT_ARE_NOT_COMPATIBLE[feature.type]) {
            deviceFeaturesOptions.push(featureOption);
          }
          if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
            selectedDeviceFeaturesOptions.push(featureOption);
          }
        });
        if (deviceFeaturesOptions.length > 0) {
          deviceFeaturesOptions.sort((a, b) => {
            if (a.label < b.label) {
              return -1;
            } else if (a.label > b.label) {
              return 1;
            }
            return 0;
          });
          deviceOptions.push({
            label: device.name,
            options: deviceFeaturesOptions
          });
        }
      });
      await this.setState({ deviceOptions, selectedDeviceFeaturesOptions, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.deviceFeatureBySelector = new Map();
  }

  componentDidMount() {
    this.getDeviceFeatures();
  }

  componentDidUpdate(previousProps) {
    const deviceFeatureChanged = get(previousProps, 'box.device_feature') !== get(this.props, 'box.device_feature');
    const unitsChanged = get(previousProps, 'box.units') !== get(this.props, 'box.units');
    if (deviceFeatureChanged || unitsChanged) {
      this.getDeviceFeatures();
    }
  }

  render(props, { selectedDeviceFeaturesOptions, deviceOptions, loading, displayPreview }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.chart" titleValue={props.box.title}>
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.editDeviceFeaturesLabel" />
                </label>
                <Select
                  defaultValue={null}
                  value={selectedDeviceFeaturesOptions}
                  isMulti
                  onChange={this.updateDeviceFeatures}
                  options={deviceOptions}
                />
              </div>
            )}
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.editNameLabel" />
                </label>
                <Localizer>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={<Text id="dashboard.boxes.chart.editNamePlaceholder" />}
                    value={props.box.title}
                    onChange={this.updateBoxTitle}
                  />
                </Localizer>
              </div>
            )}
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.chartType" />
              </label>
              <select onChange={this.updateChartType} class="form-control" value={props.box.chart_type}>
                <option>
                  <Text id="global.emptySelectOption" />
                </option>
                <option value="line">
                  <Text id="dashboard.boxes.chart.line" />
                </option>
                <option value="stepline">
                  <Text id="dashboard.boxes.chart.stepline" />
                </option>
                <option value="area">
                  <Text id="dashboard.boxes.chart.area" />
                </option>
                <option value="bar">
                  <Text id="dashboard.boxes.chart.bar" />
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.displayAxes" />
              </label>
              <select
                onChange={this.updateDisplayAxes}
                class="form-control"
                value={props.box.display_axes ? 'yes' : 'no'}
              >
                <option value="yes">
                  <Text id="dashboard.boxes.chart.yes" />
                </option>
                <option value="no">
                  <Text id="dashboard.boxes.chart.no" />
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.displayVariation" />
              </label>
              <select
                onChange={this.updateDisplayVariation}
                class="form-control"
                value={props.box.display_variation ? 'yes' : 'no'}
              >
                <option value="yes">
                  <Text id="dashboard.boxes.chart.yes" />
                </option>
                <option value="no">
                  <Text id="dashboard.boxes.chart.no" />
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.defaultInterval" />
              </label>
              <select onChange={this.updateDefaultInterval} class="form-control" value={props.box.interval}>
                <option>
                  <Text id="global.emptySelectOption" />
                </option>
                <option value="last-hour">
                  <Text id="dashboard.boxes.chart.lastHour" />
                </option>
                <option value="last-day">
                  <Text id="dashboard.boxes.chart.lastDay" />
                </option>
                <option value="last-week">
                  <Text id="dashboard.boxes.chart.lastSevenDays" />
                </option>
                <option value="last-month">
                  <Text id="dashboard.boxes.chart.lastThirtyDays" />
                </option>
                <option value="last-three-months">
                  <Text id="dashboard.boxes.chart.lastThreeMonths" />
                </option>
                <option value="last-year">
                  <Text id="dashboard.boxes.chart.lastYear" />
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.preview" />
              </label>
              {displayPreview && <Chart box={props.box} />}
              {!displayPreview && (
                <div>
                  <button class="btn btn-secondary" onClick={this.showPreview}>
                    <Text id="dashboard.boxes.chart.showPreviewButton" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditChart));
