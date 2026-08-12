import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import get from 'get-value';

import { getFanFeatureOptions } from '../../../../server/utils/constants';
import withIntlAsProp from '../../utils/withIntlAsProp';

class SelectFanFeatureValue extends Component {
  handleValueChange = ({ value }) => {
    this.props.updateValue(value);
  };

  getOptions = () => {
    const { category, type, min, max } = this.props.deviceFeature;
    const deviceFeatureOptions = getFanFeatureOptions(type, min, max).map(value => ({
      label: get(this.props.intl.dictionary, `deviceFeatureValue.category.${category}.${type}.${value}`, {
        default: value
      }),
      value
    }));

    this.setState({ deviceFeatureOptions });
  };

  getSelectedOption = () => {
    const value = this.props.value;
    const { category, type } = this.props.deviceFeature;

    if (value !== undefined && value !== null) {
      return {
        label: get(this.props.intl.dictionary, `deviceFeatureValue.category.${category}.${type}.${value}`, {
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

  componentDidUpdate(prevProps) {
    if (prevProps.deviceFeature !== this.props.deviceFeature) {
      this.getOptions();
    }
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

export default withIntlAsProp(SelectFanFeatureValue);
