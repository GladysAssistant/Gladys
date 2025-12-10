import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';

import BaseEditBox from '../baseEditBox';
import EnergyConsumption from './EnergyConsumption';
import { getDeviceFeatureName } from '../../../utils/device';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { DEFAULT_COLORS, DEFAULT_COLORS_NAME } from '../chart/ApexChartComponent';

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
        device_features: selectedOptions.map(option => option.value)
      });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_features: []
      });
    }
  };

  updateChartColor = (i, value) => {
    const colors = this.props.box.colors || [];
    if (value) {
      colors[i] = value;
    }
    // Make sure all colors are filled with a default color
    const selectedDeviceFeatures = this.getSelectedDeviceFeatures();
    for (let y = 0; y < selectedDeviceFeatures.length; y += 1) {
      // if no color is filled, pick a default color in array
      if (colors[y] === null || colors[y] === undefined) {
        colors[y] = DEFAULT_COLORS[y];
        // if we are outside of the default color array,
        // Take the first default color
        if (!colors[y]) {
          colors[y] = DEFAULT_COLORS[0];
        }
      }
    }
    this.props.updateBoxConfig(this.props.x, this.props.y, { colors });
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
    const manyFeatures = selectedDeviceFeatures && selectedDeviceFeatures.length > 1;
    const colorOptions = DEFAULT_COLORS.map((colorValue, i) => ({
      value: colorValue,
      label: props.intl.dictionary.color[DEFAULT_COLORS_NAME[i]] || DEFAULT_COLORS_NAME[i]
    }));

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
            onChange={this.updateDeviceFeatures}
            options={deviceFeatureOptions.length > 0 ? deviceFeatureOptions : null}
            maxMenuHeight={220}
            isMulti
          />
        </div>
        {selectedDeviceFeatures &&
          selectedDeviceFeatures.map((feature, i) => (
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
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          ))}
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
