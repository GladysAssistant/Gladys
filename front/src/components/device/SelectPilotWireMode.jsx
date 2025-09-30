import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import get from 'get-value';

import { PILOT_WIRE_MODE } from '../../../../server/utils/constants';
import withIntlAsProp from '../../utils/withIntlAsProp';

class SelectPilotWireMode extends Component {
  handleValueChange = ({ value }) => {
    this.props.updateValue(value);
  };

  getOptions = () => {
    const deviceFeatureOptions = Object.keys(PILOT_WIRE_MODE).map(key => {
      const value = PILOT_WIRE_MODE[key];
      return {
        label: get(this.props.intl.dictionary, `deviceFeatureValue.category.heater.pilot-wire-mode.${value}`, {
          default: value
        }),
        value
      };
    });

    this.setState({ deviceFeatureOptions });
  };

  getSelectedOption = () => {
    const value = this.props.value;

    if (value !== undefined) {
      return {
        label: get(this.props.intl.dictionary, `deviceFeatureValue.category.heater.pilot-wire-mode.${value}`, {
          default: value
        }),
        value
      };
    } else {
      return;
    }
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

export default withIntlAsProp(SelectPilotWireMode);
