import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import get from 'get-value';

import BaseEditBox from '../baseEditBox';
import ChartHistory from './ChartHistory';
import { getDeviceFeatureName } from '../../../utils/device';
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

class EditChartHistoric extends Component {
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

  updateService = selectedService => {
    this.setState({ selectedService }, this.getDeviceFeatures);
  };

  updateDevices = selectedDevicesOptions => {
    this.setState({ selectedDevicesOptions }, this.getDeviceFeatures);
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
      const deviceServices = [];
      const deviceRooms = [];
      const deviceOptions = [];
      const deviceFeaturesOptions = [];
      const selectedDeviceFeaturesOptions = [];
      const selectedService = this.state.selectedService;
      const selectedDevices = this.state.selectedDevicesOptions
        ? this.state.selectedDevicesOptions.map(option => option.value)
        : [];

      const deviceOptionsForRoom = [];
      devices.forEach(device => {
        const { name, id } = device.service;
        const serviceExists = deviceServices.some(service => service.name === name && service.id === id);
        if (!serviceExists) {
          deviceServices.push({ name, id });
        }
        const roomExists = deviceRooms.some(room =>
          device.room ? room.name === device.room.name && room.id === device.room.id : room.name === 'Unknown'
        );
        if (!roomExists) {
          device.room
            ? deviceRooms.push({ name: device.room.name, id: device.room.id })
            : deviceRooms.push({ name: 'Unknown', id: 'unknown' });
        }
        const deviceOption = {
          value: device.selector,
          room: device.room ? device.room.name : 'Unknown',
          service: device.service ? device.service.name : 'Unknown',
          label: device.name
        };
        deviceOptionsForRoom.push(deviceOption);

        const deviceFeaturesOptionsForDevice = [];
        device.features.forEach(feature => {
          const featureOption = {
            value: feature.selector,
            label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
          };
          this.deviceFeatureBySelector.set(feature.selector, feature);
          if (!FEATURES_THAT_ARE_NOT_COMPATIBLE[feature.type]) {
            deviceFeaturesOptionsForDevice.push(featureOption);
          }
          if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
            selectedDeviceFeaturesOptions.push(featureOption);
          }
        });

        if (deviceFeaturesOptionsForDevice.length > 0) {
          deviceFeaturesOptionsForDevice.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
          if (selectedService && (selectedService === 'all' || selectedService === device.service.name)) {
            if (selectedDevices.length === 0 || selectedDevices.includes(device.selector)) {
              deviceFeaturesOptions.push({
                label: device.name,
                options: deviceFeaturesOptionsForDevice
              });
            }
          }
        }
      });
      if (deviceOptionsForRoom.length > 0) {
        deviceOptionsForRoom.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));

        const roomDeviceMap = new Map();

        deviceOptionsForRoom.forEach(deviceOption => {
          if (selectedService && (selectedService === 'all' || selectedService === deviceOption.service)) {
            const roomName = deviceOption.room || 'Unknown';
            if (!roomDeviceMap.has(roomName)) {
              roomDeviceMap.set(roomName, []);
            }
            roomDeviceMap.get(roomName).push(deviceOption);
          }
        });

        roomDeviceMap.forEach((options, roomName) => {
          deviceOptions.push({
            label: roomName,
            options: options
          });
        });
      }

      let chartTypeList = [...CHART_TYPE_BINARY, ...CHART_TYPE_OTHERS];

      //Filter
      if (selectedDeviceFeaturesOptions.length > 0) {
        const firstDeviceSelector = this.deviceFeatureBySelector.get(selectedDeviceFeaturesOptions[0].value);
        if (FEATURE_BINARY[firstDeviceSelector.type]) {
          deviceFeaturesOptions.forEach(deviceFeatureOption => {
            deviceFeatureOption.options = deviceFeatureOption.options.filter(featureOption => {
              return FEATURE_BINARY[this.deviceFeatureBySelector.get(featureOption.value).type];
            });
          });
          chartTypeList = CHART_TYPE_BINARY;
        } else {
          deviceFeaturesOptions.forEach(deviceFeatureOption => {
            deviceFeatureOption.options = deviceFeatureOption.options.filter(featureOption => {
              return !FEATURE_BINARY[this.deviceFeatureBySelector.get(featureOption.value).type];
            });
          });
          chartTypeList = CHART_TYPE_OTHERS;
        }
      }

      await this.setState({
        deviceServices,
        deviceOptions,
        deviceFeaturesOptions,
        selectedDeviceFeaturesOptions,
        chartTypeList,
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
    this.deviceFeatureBySelector = new Map();
    this.state = {
      selectedService: 'all',
      selectedDevicesOptions: [],
      selectedDeviceFeaturesOptions: [],
      deviceOptions: [],
      deviceFeaturesOptions: [],
      loading: false
    };
  }

  componentDidMount() {
    this.getDeviceFeatures();
  }

  componentDidUpdate(previousProps) {
    const deviceFeatureChanged = get(previousProps, 'box.device_features') !== get(this.props, 'box.device_features');
    const devicesChanged = get(previousProps, 'box.devices') !== get(this.props, 'box.devices');
    const unitsChanged = get(previousProps, 'box.units') !== get(this.props, 'box.units');
    if (deviceFeatureChanged || devicesChanged || unitsChanged) {
      this.getDeviceFeatures();
    }
  }

  render(
    props,
    {
      selectedService,
      selectedDevicesOptions,
      selectedDeviceFeaturesOptions,
      deviceServices,
      deviceOptions,
      deviceFeaturesOptions,
      displayPreview,
      chartTypeList,
      loading
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
            {deviceServices && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.editServiceLabel" />
                </label>
                <Localizer>
                  <select
                    value={selectedService}
                    onChange={e => this.updateService(e.target.value)}
                    class="form-control"
                  >
                    <option value="all">
                      <Text id="dashboard.boxes.chart.allServices" />
                    </option>
                    {deviceServices &&
                      deviceServices.map(service => (
                        <option value={service.name}>
                          <Text id={`integration.${service.name}.title`} />
                        </option>
                      ))}
                  </select>
                </Localizer>
              </div>
            )}
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.editDevicesLabel" />
                </label>
                <Select
                  defaultValue={null}
                  value={selectedDevicesOptions}
                  placeholder={<Text id="dashboard.boxes.chart.editDevicesPlaceholder" />}
                  isMulti
                  onChange={this.updateDevices}
                  options={deviceOptions}
                />
              </div>
            )}
            {deviceFeaturesOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.editDeviceFeaturesLabel" />
                </label>
                <Select
                  defaultValue={null}
                  value={selectedDeviceFeaturesOptions}
                  isMulti
                  onChange={this.updateDeviceFeatures}
                  options={deviceFeaturesOptions}
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
              <select
                onChange={this.updateChartType}
                class="form-control"
                value={props.box.chart_type}
                defaultValue={null}
              >
                {chartTypeList &&
                  chartTypeList.map(chartType => (
                    <option value={chartType}>
                      <Text id={`dashboard.boxes.chart.${chartType}`} />
                    </option>
                  ))}
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
            {props.box.chart_type !== 'timeline' && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.defaultInterval" />
                </label>
                <select onChange={this.updateDefaultInterval} className="form-control" value={props.box.interval}>
                  <option>
                    <Text id="global.emptySelectOption" />
                  </option>
                  <option value="last-hour">
                    <Text id="dashboard.boxes.chart.lastHour" />
                  </option>
                  <option value="last-12-hours">
                    <Text id="dashboard.boxes.chart.last12Hours" />
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
            )}
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.preview" />
              </label>
              {displayPreview && <ChartHistory box={props.box} />}
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

export default withIntlAsProp(connect('httpClient', {})(EditChartHistoric));
