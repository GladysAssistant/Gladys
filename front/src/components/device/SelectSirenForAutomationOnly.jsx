import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import get from 'get-value';

import { SIREN_AUTOMATION_STATE } from '../../../../server/utils/constants';
import withIntlAsProp from '../../utils/withIntlAsProp';

class SelectSirenForAutomationOnly extends Component {
  handleValueChange = ({ value }) => {
    this.props.updateValue(value);
  };

  getOptions = () => {
    const deviceFeatureOptions = Object.keys(SIREN_AUTOMATION_STATE).map(key => {
      const value = SIREN_AUTOMATION_STATE[key];
      return {
        label: get(this.props.intl.dictionary, `deviceFeatureValue.category.siren.for-automation-only.${value}`, {
          default: value
        }),
        value
      };
    });

    this.setState({ deviceFeatureOptions });
  };

  getSelectedOption = () => {
    const { value } = this.props;

    if (value !== undefined && value !== null) {
      return {
        label: get(this.props.intl.dictionary, `deviceFeatureValue.category.siren.for-automation-only.${value}`, {
          default: value
        }),
        value
      };
    }
    return undefined;
  };

  componentDidMount() {
    this.getOptions();
  }

  render(props, { deviceFeatureOptions }) {
    const selectedOption = this.getSelectedOption();
    return (
      <Select
        class="select-device-feature"
        defaultValue=""
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

export default withIntlAsProp(SelectSirenForAutomationOnly);
