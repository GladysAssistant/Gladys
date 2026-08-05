import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import get from 'get-value';

import { WATER_HEATER_MODE } from '../../../../server/utils/constants';
import withIntlAsProp from '../../utils/withIntlAsProp';

class SelectWaterHeaterMode extends Component {
  handleValueChange = ({ value }) => {
    this.props.updateValue(value);
  };

  getLabel = value =>
    get(this.props.intl.dictionary, `deviceFeatureValue.category.water-heater.mode.${value}`, {
      default: value
    });

  getOptions = () => {
    const deviceFeatureOptions = Object.keys(WATER_HEATER_MODE).map(key => {
      const value = WATER_HEATER_MODE[key];
      return {
        label: this.getLabel(value),
        value
      };
    });

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
