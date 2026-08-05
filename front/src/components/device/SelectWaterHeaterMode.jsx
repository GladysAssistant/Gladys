import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
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

    if (value === undefined) {
      return undefined;
    }

    return {
      label: this.getLabel(value),
      value
    };
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
        defaultValue={''}
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
