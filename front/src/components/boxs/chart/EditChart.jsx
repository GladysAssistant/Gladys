import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import update from 'immutability-helper';
import get from 'get-value';

import BaseEditBox from '../baseEditBox';
import Chart from './Chart';
import { getDeviceFeatureName } from '../../../utils/device';
import { DeviceListWithDragAndDrop } from '../../drag-and-drop/DeviceListWithDragAndDrop';
import { DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { DEFAULT_COLORS, DEFAULT_COLORS_NAME } from './ApexChartComponent';

const FEATURES_THAT_ARE_NOT_COMPATIBLE = {
  [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: true,
  [DEVICE_FEATURE_TYPES.CAMERA.IMAGE]: true
};

const FEATURE_BINARY = {
  [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: true,
  [DEVICE_FEATURE_TYPES.SENSOR.PUSH]: true
};

const CHART_TYPE_OTHERS = ['line', 'stepline', 'area', 'bar'];

const CHART_TYPE_BINARY = ['timeline'];

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
    this.setState({ chart_type: e.target.value });
    this.getDeviceFeatures(e.target.value);
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

  addDeviceFeature = async selectedDeviceFeatureOption => {
    const newSelectedDeviceFeaturesOptions = [...this.state.selectedDeviceFeaturesOptions, selectedDeviceFeatureOption];
    await this.setState({ selectedDeviceFeaturesOptions: newSelectedDeviceFeaturesOptions });
    this.refreshDeviceUnitAndChartType(newSelectedDeviceFeaturesOptions);
    this.refreshDeviceFeaturesNames();
  };

  refreshDeviceFeaturesNames = () => {
    const newDeviceFeatureNames = this.state.selectedDeviceFeaturesOptions.map(o => {
      return o.new_label !== undefined && o.new_label !== '' ? o.new_label : o.label;
    });
    const newDeviceFeature = this.state.selectedDeviceFeaturesOptions.map(o => {
      return o.value;
    });
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_feature_names: newDeviceFeatureNames,
      device_features: newDeviceFeature
    });
  };

  refreshChartTypeList = (firstDeviceSelector = null) => {
    let chartTypeList = [];

    if (!firstDeviceSelector) {
      chartTypeList = [...CHART_TYPE_BINARY, ...CHART_TYPE_OTHERS];
    } else if (FEATURE_BINARY[firstDeviceSelector.type]) {
      chartTypeList = CHART_TYPE_BINARY;
    } else {
      chartTypeList = CHART_TYPE_OTHERS;
    }
    this.setState({ chartTypeList });
  };

  refreshDeviceUnitAndChartType = selectedDeviceFeaturesOptions => {
    const firstDeviceSelector =
      selectedDeviceFeaturesOptions.length > 0
        ? this.deviceFeatureBySelector.get(selectedDeviceFeaturesOptions[0].value)
        : null;

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
        unit: undefined,
        chart_type: ''
      });
      this.setState({ chart_type: '' });
    }
    this.refreshChartTypeList(firstDeviceSelector);
    this.setState({ selectedDeviceFeaturesOptions });
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
    const { deviceOptions, selectedDeviceFeaturesOptions } = this.getSelectedDeviceFeaturesAndOptions(
      this.state.devices
    );
    await this.setState({ deviceOptions, selectedDeviceFeaturesOptions });
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

    if (name !== '') {
      this.refreshDeviceFeaturesNames();
    }
  };

  getSelectedDeviceFeaturesAndOptions = (devices, chartType = this.state.chart_type) => {
    const deviceOptions = [];
    let selectedDeviceFeaturesOptions = [];

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
          if (chartType.includes(CHART_TYPE_BINARY)) {
            if (FEATURE_BINARY[feature.type]) {
              deviceFeaturesOptions.push(featureOption);
            }
          } else if (chartType === '') {
            deviceFeaturesOptions.push(featureOption);
          } else if (!FEATURE_BINARY[feature.type]) {
            deviceFeaturesOptions.push(featureOption);
          }
        }
        // If the feature is already selected
        if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
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
      if (deviceFeaturesOptions.length > 0) {
        deviceFeaturesOptions.sort((a, b) => {
          if (a.label < b.label) {
            return -1;
          } else if (a.label > b.label) {
            return 1;
          }
          return 0;
        });
        const filteredDeviceFeatures = deviceFeaturesOptions.filter(
          feature => !selectedDeviceFeaturesOptions.some(selected => selected.value === feature.value)
        );
        if (filteredDeviceFeatures.length > 0) {
          deviceOptions.push({
            label: device.name,
            options: filteredDeviceFeatures
          });
        }
      }
    });

    // Filter the device options based on the chart type
    if (selectedDeviceFeaturesOptions.length > 0) {
      const firstDeviceSelector = this.deviceFeatureBySelector.get(selectedDeviceFeaturesOptions[0].value);
      this.refreshChartTypeList(firstDeviceSelector);
      if (FEATURE_BINARY[firstDeviceSelector.type]) {
        deviceOptions.forEach(deviceOption => {
          deviceOption.options = deviceOption.options.filter(featureOption => {
            return FEATURE_BINARY[this.deviceFeatureBySelector.get(featureOption.value).type];
          });
        });
      } else {
        deviceOptions.forEach(deviceOption => {
          deviceOption.options = deviceOption.options.filter(featureOption => {
            return !FEATURE_BINARY[this.deviceFeatureBySelector.get(featureOption.value).type];
          });
        });
      }
    }
    if (this.props.box.device_features) {
      selectedDeviceFeaturesOptions = selectedDeviceFeaturesOptions.sort(
        (a, b) => this.props.box.device_features.indexOf(a.value) - this.props.box.device_features.indexOf(b.value)
      );
    }
    return { deviceOptions, selectedDeviceFeaturesOptions };
  };

  getDeviceFeatures = async (chartType = this.state.chart_type) => {
    try {
      this.setState({ loading: true });
      // we get the rooms with the devices
      const devices = await this.props.httpClient.get(`/api/v1/device`);
      const { deviceOptions, selectedDeviceFeaturesOptions } = this.getSelectedDeviceFeaturesAndOptions(
        devices,
        chartType
      );
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
    await this.refreshDeviceFeaturesNames();
    this.refreshDeviceUnitAndChartType(this.state.selectedDeviceFeaturesOptions);
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.deviceFeatureBySelector = new Map();
    this.state = {
      chart_type: '',
      selectedDeviceFeaturesOptions: [],
      deviceOptions: [],
      loading: false,
      displayPreview: false,
      chartTypeList: [...CHART_TYPE_BINARY, ...CHART_TYPE_OTHERS]
    };
  }

  componentDidMount() {
    this.getDeviceFeatures();
  }

  componentDidUpdate(previousProps) {
    const deviceFeatureChanged = get(previousProps, 'box.device_features') !== get(this.props, 'box.device_features');
    const unitsChanged = get(previousProps, 'box.units') !== get(this.props, 'box.units');
    if (deviceFeatureChanged || unitsChanged) {
      this.refreshDisplayForNewProps();
    }
  }

  render(props, { selectedDeviceFeaturesOptions, deviceOptions, loading, displayPreview, chartTypeList }) {
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
                  onInput={this.updateBoxTitle}
                />
              </Localizer>
            </div>
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.devices.addADeviceLabel" />
                </label>
                <Select onChange={this.addDeviceFeature} value={[]} options={deviceOptions} maxMenuHeight={220} />
              </div>
            )}
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
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.chartType" />
              </label>
              <select onChange={this.updateChartType} class="form-control" value={props.box.chart_type}>
                <option value="">
                  <Text id="global.emptySelectOption" />
                </option>
                {chartTypeList &&
                  chartTypeList.map(chartType => (
                    <option value={chartType}>
                      <Text id={`dashboard.boxes.chart.${chartType}`} />
                    </option>
                  ))}
              </select>
            </div>

            {props.box.chart_type !== 'timeline' &&
              selectedDeviceFeaturesOptions &&
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
            {props.box.chart_type === 'timeline' && (
              <>
                <div class="form-group">
                  <label>
                    <Text id={`dashboard.boxes.chart.dataColor`} />
                    <Text id="dashboard.boxes.chart.on" />
                  </label>
                  <Select
                    defaultValue={colorOptions.find(({ value }) => value === DEFAULT_COLORS[0])}
                    value={
                      props.box.colors &&
                      props.box.colors.length &&
                      colorOptions.find(({ value }) => value === props.box.colors[0])
                    }
                    onChange={({ value }) => this.updateChartColor(0, value)}
                    options={colorOptions}
                    styles={colorSelectorStyles}
                  />
                </div>
                <div class="form-group">
                  <label>
                    <Text id={`dashboard.boxes.chart.dataColor`} />
                    <Text id="dashboard.boxes.chart.off" />
                  </label>
                  <Select
                    defaultValue={colorOptions.find(({ value }) => value === DEFAULT_COLORS[1])}
                    value={
                      props.box.colors &&
                      props.box.colors.length &&
                      colorOptions.find(({ value }) => value === props.box.colors[1])
                    }
                    onChange={({ value }) => this.updateChartColor(1, value)}
                    options={colorOptions}
                    styles={colorSelectorStyles}
                  />
                </div>
              </>
            )}
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
            {props.box.chart_type !== 'timeline' && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.displayVariation" />
                </label>
                <select
                  onChange={this.updateDisplayVariation}
                  className="form-control"
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
            )}
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
                {props.box.chart_type !== 'timeline' && (
                  <option value="last-week">
                    <Text id="dashboard.boxes.chart.lastSevenDays" />
                  </option>
                )}
                {props.box.chart_type !== 'timeline' && (
                  <option value="last-month">
                    <Text id="dashboard.boxes.chart.lastThirtyDays" />
                  </option>
                )}
                {props.box.chart_type !== 'timeline' && (
                  <option value="last-three-months">
                    <Text id="dashboard.boxes.chart.lastThreeMonths" />
                  </option>
                )}
                {props.box.chart_type !== 'timeline' && (
                  <option value="last-year">
                    <Text id="dashboard.boxes.chart.lastYear" />
                  </option>
                )}
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
