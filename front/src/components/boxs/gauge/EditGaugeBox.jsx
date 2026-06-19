import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import ReactSlider from 'react-slider';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import { getDeviceFeatureName } from '../../../utils/device';
import withIntlAsProp from '../../../utils/withIntlAsProp';

import BaseEditBox from '../baseEditBox';
import { DEFAULT_COLORS, DEFAULT_COLORS_NAME } from '../chart/ApexChartComponent';

const DEFAULT_GAUGE_COLOR_LOW = '#316cbe';
const DEFAULT_GAUGE_COLOR_IN_RANGE = '#00b894';
const DEFAULT_GAUGE_COLOR_HIGH = '#d63031';

const colorSelectorStyles = {
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
  }
};

const renderColorOption = ({ value, label }) => (
  <div class="d-flex align-items-center">
    <span
      class="d-inline-block mr-2"
      style={{ width: 12, height: 12, backgroundColor: value, borderRadius: 2, flexShrink: 0 }}
    />
    <span>{label}</span>
  </div>
);

class EditGaugeBoxComponent extends Component {
  updateDeviceFeature = option => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_feature: option ? option.value : null
    });
    this.setState({ selectedDeviceFeatureOptions: option });
  };

  updateBoxUseCustomValue = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      gauge_use_custom_value: e.target.checked
    });
  };

  updateThresholds = values => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      gauge_min: values[0],
      gauge_max: values[1]
    });
  };

  updateColor = key => option => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      [key]: option ? option.value : null
    });
  };

  getSelectedDeviceFeatureAndOptions = devices => {
    const deviceOptions = [];
    let selectedDeviceFeatureOptions = null;
    let selectedFeature = null;

    devices.forEach(device => {
      const deviceFeatures = [];
      device.features.forEach(feature => {
        const featureOption = {
          value: feature.selector,
          label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
        };
        deviceFeatures.push(featureOption);
        if (this.props.box.device_feature === feature.selector) {
          selectedDeviceFeatureOptions = featureOption;
          selectedFeature = feature;
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
        deviceOptions.push({
          label: device.name,
          options: deviceFeatures
        });
      }
    });
    return { deviceOptions, selectedDeviceFeatureOptions, selectedFeature };
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      const devices = await this.props.httpClient.get(`/api/v1/device`);
      const { deviceOptions, selectedDeviceFeatureOptions, selectedFeature } = this.getSelectedDeviceFeatureAndOptions(
        devices
      );
      this.setState({ deviceOptions, selectedDeviceFeatureOptions, selectedFeature, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  componentDidMount() {
    this.getDeviceFeatures();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.box.device_feature !== this.props.box.device_feature) {
      this.getDeviceFeatures();
    }
  }

  render(props, { deviceOptions, selectedDeviceFeatureOptions, selectedFeature }) {
    const { box, intl } = props;
    const useCustomValue = box.gauge_use_custom_value || false;
    const featureHasRange =
      selectedFeature &&
      selectedFeature.min !== null &&
      selectedFeature.min !== undefined &&
      selectedFeature.max !== null &&
      selectedFeature.max !== undefined &&
      selectedFeature.max > selectedFeature.min;

    const featureMin = featureHasRange ? selectedFeature.min : 0;
    const featureMax = featureHasRange ? selectedFeature.max : 100;
    const range = featureMax - featureMin;
    const step = range < 50 ? 0.1 : 1;

    let gaugeMin = box.gauge_min;
    let gaugeMax = box.gauge_max;
    if (typeof gaugeMin !== 'number' || isNaN(gaugeMin)) {
      gaugeMin = featureMin + range / 3;
    }
    if (typeof gaugeMax !== 'number' || isNaN(gaugeMax)) {
      gaugeMax = featureMin + (range * 2) / 3;
    }
    gaugeMin = Math.max(featureMin, Math.min(featureMax, gaugeMin));
    gaugeMax = Math.max(featureMin, Math.min(featureMax, gaugeMax));

    const colorLow = box.gauge_color_low || DEFAULT_GAUGE_COLOR_LOW;
    const colorInRange = box.gauge_color_in_range || DEFAULT_GAUGE_COLOR_IN_RANGE;
    const colorHigh = box.gauge_color_high || DEFAULT_GAUGE_COLOR_HIGH;
    const trackColors = [colorLow, colorInRange, colorHigh];

    const colorOptions = DEFAULT_COLORS.map((value, i) => ({
      value,
      label:
        (intl && intl.dictionary && intl.dictionary.color && intl.dictionary.color[DEFAULT_COLORS_NAME[i]]) ||
        DEFAULT_COLORS_NAME[i]
    }));
    const colorOptionByValue = value => colorOptions.find(o => o.value === value) || null;

    const unitShort =
      selectedFeature && selectedFeature.unit && intl && intl.dictionary && intl.dictionary.deviceFeatureUnitShort
        ? intl.dictionary.deviceFeatureUnitShort[selectedFeature.unit] || ''
        : '';

    const formatThumbValue = value => {
      const rounded = step < 1 ? Number(value).toFixed(1) : Math.round(value);
      return unitShort ? `${rounded} ${unitShort}` : `${rounded}`;
    };

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
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        {selectedFeature && (
          <div>
            <div className="form-group form-check mb-3">
              <label className="form-check-label">
                <input
                  type="checkbox"
                  id="gaugeUseCustomValue"
                  className="form-check-input"
                  checked={useCustomValue}
                  onChange={this.updateBoxUseCustomValue}
                  disabled={!featureHasRange}
                />
                <Text id="dashboard.boxes.gauge.thresholdsLabel" />
              </label>
              {!featureHasRange && (
                <small class="form-text text-muted">
                  <Text id="dashboard.boxes.gauge.thresholdsNoRange" />
                </small>
              )}
            </div>
            {featureHasRange && (
              <div>
                <div class="form-group mb-4">
                  <ReactSlider
                    className={cx('gauge-slider', { 'opacity-60': !useCustomValue })}
                    thumbClassName="gauge-slider-thumb"
                    trackClassName="gauge-slider-track"
                    value={[gaugeMin, gaugeMax]}
                    min={featureMin}
                    max={featureMax}
                    step={step}
                    pearling
                    minDistance={step}
                    onAfterChange={this.updateThresholds}
                    disabled={!useCustomValue}
                    renderTrack={(trackProps, state) => (
                      <div {...trackProps} style={{ ...trackProps.style, backgroundColor: trackColors[state.index] }} />
                    )}
                    renderThumb={(thumbProps, state) => (
                      <div {...thumbProps}>
                        <div
                          className={`absolute ${state.index === 0 ? 'bottom-0' : 'top-0'}
                            left-1/2
                            -translate-x-1/2
                            whitespace-nowrap`}
                        >
                          {formatThumbValue(state.valueNow)}
                        </div>
                      </div>
                    )}
                  />
                </div>
                <div class="row">
                  <div class="form-group col-md-4 d-flex flex-column">
                    <label class="form-label flex-grow-1">
                      <Text id="dashboard.boxes.gauge.colorLowLabel" />
                    </label>
                    <Select
                      value={colorOptionByValue(colorLow)}
                      onChange={this.updateColor('gauge_color_low')}
                      options={colorOptions}
                      styles={colorSelectorStyles}
                      formatOptionLabel={renderColorOption}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isDisabled={!useCustomValue}
                    />
                  </div>
                  <div class="form-group col-md-4 d-flex flex-column">
                    <label class="form-label flex-grow-1">
                      <Text id="dashboard.boxes.gauge.colorInRangeLabel" />
                    </label>
                    <Select
                      value={colorOptionByValue(colorInRange)}
                      onChange={this.updateColor('gauge_color_in_range')}
                      options={colorOptions}
                      styles={colorSelectorStyles}
                      formatOptionLabel={renderColorOption}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isDisabled={!useCustomValue}
                    />
                  </div>
                  <div class="form-group col-md-4 d-flex flex-column">
                    <label class="form-label flex-grow-1">
                      <Text id="dashboard.boxes.gauge.colorHighLabel" />
                    </label>
                    <Select
                      value={colorOptionByValue(colorHigh)}
                      onChange={this.updateColor('gauge_color_high')}
                      options={colorOptions}
                      styles={colorSelectorStyles}
                      formatOptionLabel={renderColorOption}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isDisabled={!useCustomValue}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(EditGaugeBoxComponent));
