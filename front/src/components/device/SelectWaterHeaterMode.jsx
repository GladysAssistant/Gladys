import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from '../form/Select';
import get from 'get-value';

import { WATER_HEATER_MODE } from '../../../../server/utils/constants';
import { resolveFeatureOptions } from '../../utils/supportedOptions';
import withIntlAsProp from '../../utils/withIntlAsProp';

const MODE_CATALOG = Object.keys(WATER_HEATER_MODE).map(key => ({ value: WATER_HEATER_MODE[key] }));

class SelectWaterHeaterMode extends Component {
  handleValueChange = ({ value }) => {
    this.props.updateValue(value);
  };

  getLabel = (value, fallback) =>
    get(this.props.intl.dictionary, `deviceFeatureValue.category.water-heater.mode.${value}`, {
      default: fallback || value
    });

  getOptions = () => {
    // Only the modes this appliance declares, so an action cannot be saved on a mode the device
    // does not have. Falls back to the whole catalog when the feature carries no supported_options.
    const deviceFeatureOptions = resolveFeatureOptions(this.props.deviceFeature, MODE_CATALOG).map(option => ({
      label: this.getLabel(option.value, option.label),
      value: option.value
    }));

    this.setState({ deviceFeatureOptions });
  };

  getSelectedOption = () => {
    const { value } = this.props;
    const { deviceFeatureOptions } = this.state;

    if (value === undefined || !deviceFeatureOptions) {
      return null;
    }

    // Resolve against the offered options rather than rebuilding a label from the raw value: a
    // mode the feature does not declare must show as nothing selected, not as a valid-looking
    // choice absent from the list, and options already carry the device's own label when the
    // value falls outside the catalog.
    return deviceFeatureOptions.find(option => option.value === value) || null;
  };

  componentDidMount() {
    this.getOptions();
  }

  componentDidUpdate(previousProps) {
    // The option list depends on the selected feature's supported_options, and switching between
    // two water-heater mode features re-renders this component without remounting it.
    if (previousProps.deviceFeature !== this.props.deviceFeature) {
      this.getOptions();
    }
  }

  render(props, { deviceFeatureOptions }) {
    const selectedOption = this.getSelectedOption();
    return (
      <Select
        class="select-device-feature"
        value={selectedOption}
        onChange={this.handleValueChange}
        options={deviceFeatureOptions}
        placeholder={<Text id="global.selectPlaceholder" />}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    );
  }
}

export default withIntlAsProp(SelectWaterHeaterMode);
