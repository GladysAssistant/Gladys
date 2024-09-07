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
import { DEFAULT_COLORS, DEFAULT_COLORS_NAME } from './ApexChartComponent';
import ManualThresholdForm from './ManualThresholdForm';

const FEATURES_THAT_ARE_NOT_COMPATIBLE = {
  [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: true,
  [DEVICE_FEATURE_TYPES.SENSOR.PUSH]: true,
  [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: true,
  [DEVICE_FEATURE_TYPES.CAMERA.IMAGE]: true
};

const square = (color = 'transparent') => ({
  alignItems: 'center',
  display: 'flex',

  ':before': {
    backgroundColor: color,
    content: '" "',
    display: 'block',
    marginRight: 8,
    height: 10,
    width: 10
  }
});

const colorSelectorStyles = {
  control: styles => ({ ...styles, backgroundColor: 'white' }),
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    const { value: color } = data;
    return {
      ...styles,
      backgroundColor: isDisabled ? undefined : isSelected ? color : isFocused ? color : undefined,
      color: isDisabled ? '#ccc' : isSelected ? 'white' : isFocused ? 'white' : color,
      cursor: isDisabled ? 'not-allowed' : 'default',

      ':active': {
        ...styles[':active'],
        backgroundColor: !isDisabled ? color : undefined
      }
    };
  },
  input: styles => ({ ...styles, ...square() }),
  placeholder: styles => ({ ...styles, ...square('#ccc') }),
  singleValue: (styles, { data }) => ({ ...styles, ...square(data.value) })
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

  updateChartColor = (i, value) => {
    const colors = this.props.box.colors || [];
    if (value) {
      colors[i] = value;
    } else {
      colors[i] = null;
    }
    const atLeastOneColor = colors.some(Boolean);
    this.props.updateBoxConfig(this.props.x, this.props.y, { colors: atLeastOneColor ? colors : undefined });
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

  addManualThreshold = () => {
    const { manualThresholdDetails } = this.state;
    manualThresholdDetails.push({ name: '', value: '', unit: '', color: '' });
    this.setState({ manualThresholdDetails });
  };
  deleteManualThreshold = index => {
    const { manualThresholdDetails } = this.state;
    manualThresholdDetails.splice(index, 1);
    this.setState({ manualThresholdDetails });
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      manual_features_treshold_details: manualThresholdDetails
    });
  };

  updateManualThresholdDetail = (index, field, value) => {
    const { manualThresholdDetails } = this.state;
    manualThresholdDetails[index][field] = value;
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      manual_features_treshold_details: manualThresholdDetails
    });
    this.setState({ manualThresholdDetails });
  };

  updateDeviceFeaturesTreshold = newSelectedTresholdOptions => {
    if (newSelectedTresholdOptions && newSelectedTresholdOptions.length > 0) {
      const deviceFeaturesSelectors = newSelectedTresholdOptions.map(
        selectedDeviceFeaturesOption => selectedDeviceFeaturesOption.value
      );
      const units = newSelectedTresholdOptions.map(selectedTresholdOption => {
        const deviceFeature = this.deviceFeatureBySelector.get(selectedTresholdOption.value);
        return deviceFeature.unit;
      });
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_features_treshold: deviceFeaturesSelectors,
        manual_units: units,
        unit: undefined
      });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_features_treshold: [],
        manual_units: [],
        unit: undefined
      });
    }
    this.setState({ selectedTresholdOptions: newSelectedTresholdOptions });
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
      const deviceThresholdOptions = [];
      const selectedDeviceFeaturesOptions = [];
      const selectedTresholdOptions = [];

      devices.forEach(device => {
        const deviceFeaturesOptions = [];
        const deviceFeaturesTresholdOptions = [];
        device.features.forEach(feature => {
          const featureOption = {
            value: feature.selector,
            label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
          };
          const featureOptionTreshold = {
            value: feature.selector,
            label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
          };
          this.deviceFeatureBySelector.set(feature.selector, feature);
          // We don't support all devices for this view
          if (!FEATURES_THAT_ARE_NOT_COMPATIBLE[feature.type]) {
            deviceFeaturesOptions.push(featureOption);
            deviceFeaturesTresholdOptions.push(featureOptionTreshold);
          }
          if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
            selectedDeviceFeaturesOptions.push(featureOption);
          }
          if (
            this.props.box.device_features_treshold &&
            this.props.box.device_features_treshold.indexOf(feature.selector) !== -1
          ) {
            selectedTresholdOptions.push(featureOptionTreshold);
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
        if (deviceFeaturesTresholdOptions.length > 0) {
          deviceFeaturesTresholdOptions.sort((a, b) => {
            if (a.label < b.label) {
              return -1;
            } else if (a.label > b.label) {
              return 1;
            }
            return 0;
          });
          deviceThresholdOptions.push({
            label: device.name,
            options: deviceFeaturesTresholdOptions
          });
        }
      });
      await this.setState({
        deviceOptions,
        selectedDeviceFeaturesOptions,
        deviceThresholdOptions,
        selectedTresholdOptions,
        loading: false
      });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    const box = this.props.box;
    this.deviceFeatureBySelector = new Map();
    this.state = {
      selectedTresholdOptions: [],
      manualThresholdDetails: box.manual_features_treshold_details || []
    };
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

  render(
    props,
    {
      manualThresholdDetails,
      selectedDeviceFeaturesOptions,
      selectedTresholdOptions,
      deviceOptions,
      deviceThresholdOptions,
      loading,
      displayPreview
    }
  ) {
    const manyFeatures = selectedDeviceFeaturesOptions && selectedDeviceFeaturesOptions.length > 1;
    const colorOptions = DEFAULT_COLORS.map((colorValue, i) => ({
      value: colorValue,
      label: props.intl.dictionary.color[DEFAULT_COLORS_NAME[i]] || DEFAULT_COLORS_NAME[i]
    }));
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
            {selectedDeviceFeaturesOptions &&
              selectedDeviceFeaturesOptions.map((feature, i) => (
                <div class="form-group">
                  <label>
                    <Text
                      id={`dashboard.boxes.chart.${manyFeatures ? 'dataColor' : 'chartColor'}`}
                      fields={{ featureLabel: feature && feature.label }}
                    />
                  </label>
                  <Select
                    defaultValue={colorOptions.find(({ value }) => value === DEFAULT_COLORS[i])}
                    value={
                      props.box.colors &&
                      props.box.colors.length &&
                      colorOptions.find(({ value }) => value === props.box.colors[i])
                    }
                    onChange={({ value }) => this.updateChartColor(i, value)}
                    options={colorOptions}
                    styles={colorSelectorStyles}
                  />
                </div>
              ))}
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
            {deviceThresholdOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.editDeviceFeaturesTresholdLabel" />
                </label>
                <div>
                  <Select
                    defaultValue={null}
                    value={selectedTresholdOptions}
                    isMulti
                    onChange={this.updateDeviceFeaturesTreshold}
                    options={deviceThresholdOptions}
                  />

                  {manualThresholdDetails.map((detail, index) => (
                    <ManualThresholdForm
                      key={index}
                      index={index}
                      manualThresholdDetail={detail}
                      colorOptions={colorOptions}
                      colorSelectorStyles={colorSelectorStyles}
                      updateManualThresholdDetail={this.updateManualThresholdDetail}
                      deleteManualThreshold={this.deleteManualThreshold}
                    />
                  ))}
                  <button class="btn btn-secondary w-100" onClick={this.addManualThreshold}>
                    <Text id="dashboard.boxes.chart.editDeviceFeaturesTresholdManualLabel" className="w-100" />
                  </button>
                </div>
              </div>
            )}
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.preview" />
              </label>
              {displayPreview && <Chart box={props.box} />}
              {!displayPreview && (
                <div>
                  <button class="btn btn-secondary w-100" onClick={this.showPreview}>
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
