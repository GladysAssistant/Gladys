import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import { getDeviceFeatureName } from '../../../utils/device';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import BaseEditBox from '../baseEditBox';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

const SELECT_STYLES = {
  valueContainer: provided => ({ ...provided, paddingLeft: '8px' }),
  input: provided => ({ ...provided, paddingLeft: '4px' }),
  placeholder: provided => ({ ...provided, paddingLeft: '4px' }),
  singleValue: provided => ({ ...provided, marginLeft: '0px', paddingLeft: '4px' })
};

class EditThermostatBoxComponent extends Component {
  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { name: e.target.value || undefined });
  };

  updateThermostatFeature = option => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { thermostat_feature: option ? option.value : null });
    this.setState({ selectedThermostatOption: option || null });
  };

  buildOptions = devices => {
    const options = [];
    devices.forEach(device => {
      const featureOptions = [];
      device.features.forEach(feature => {
        // Only the setpoints created by this integration: the widget drives the
        // thermostat service, which cannot regulate a feature it does not own.
        if (
          feature.category !== DEVICE_FEATURE_CATEGORIES.THERMOSTAT ||
          feature.type !== DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE
        ) {
          return;
        }
        featureOptions.push({
          value: feature.selector,
          label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
        });
      });
      // An external thermostat owns no feature: the setpoint it drives belongs
      // to the real device (Netatmo, Zigbee, Matter, MQTT...). It is still one of
      // this service's thermostats, so it is offered under its own name — without
      // this it could never be added to a dashboard at all.
      const targetParam = (device.params || []).find(param => param.name === 'THERMOSTAT_TARGET_FEATURE');
      if (featureOptions.length === 0 && targetParam && targetParam.value) {
        featureOptions.push({ value: targetParam.value, label: device.name });
      }
      if (featureOptions.length > 0) {
        options.push({ label: device.name, options: featureOptions });
      }
    });
    return options;
  };

  getDevices = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/service/thermostat/device');
      const thermostatOptions = this.buildOptions(devices);
      let selectedThermostatOption = null;
      thermostatOptions.forEach(group =>
        group.options.forEach(opt => {
          if (opt.value === this.props.box.thermostat_feature) selectedThermostatOption = opt;
        })
      );
      this.setState({ thermostatOptions, selectedThermostatOption });
    } catch (e) {
      this.setState({ thermostatOptions: [] });
    }
  };

  componentDidMount() {
    this.getDevices();
  }

  render(props, { thermostatOptions, selectedThermostatOption }) {
    const t = props.intl && props.intl.dictionary && props.intl.dictionary.dashboard.boxes.thermostat;
    const placeholder = (t && t.selectPlaceholder) || '';

    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.thermostat">
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.boxes.thermostat.editNameLabel" />
          </label>
          <input
            type="text"
            class="form-control"
            placeholder={(t && t.editNamePlaceholder) || ''}
            value={props.box.name || ''}
            onInput={this.updateName}
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.boxes.thermostat.thermostatFeatureLabel" />
            <span class="text-danger"> *</span>
          </label>
          <Select
            menuPlacement="auto"
            value={selectedThermostatOption}
            onChange={this.updateThermostatFeature}
            options={thermostatOptions || []}
            placeholder={placeholder}
            maxMenuHeight={220}
            className="react-select-container"
            classNamePrefix="react-select"
            styles={SELECT_STYLES}
          />
          <small class="form-text text-muted">
            <Text id="dashboard.boxes.thermostat.thermostatFeatureHelp" />
          </small>
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(EditThermostatBoxComponent));
