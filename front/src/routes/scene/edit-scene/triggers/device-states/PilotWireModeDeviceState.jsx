import { Component, Fragment } from 'preact';
import Select from 'react-select';
import get from 'get-value';

import { PILOT_WIRE_MODE } from '../../../../../../../server/utils/constants';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class PilotWireModeDeviceState extends Component {
  handleValueChange = ({ value }) => {
    this.props.updateTriggerProperty(this.props.index, 'value', value);
  };

  getOptions = () => {
    const modeLabels = {
      0: 'deviceFeatureAction.category.heater.pilot-wire-mode.off',
      1: 'deviceFeatureAction.category.heater.pilot-wire-mode.frost-protection',
      2: 'deviceFeatureAction.category.heater.pilot-wire-mode.eco',
      3: 'deviceFeatureAction.category.heater.pilot-wire-mode.comfort_-1',
      4: 'deviceFeatureAction.category.heater.pilot-wire-mode.comfort_-2',
      5: 'deviceFeatureAction.category.heater.pilot-wire-mode.comfort'
    };

    const options = Object.keys(PILOT_WIRE_MODE).map(key => {
      const value = PILOT_WIRE_MODE[key];
      return {
        label: get(this.props.intl.dictionary, modeLabels[value], {
          default: value
        }),
        value
      };
    });

    this.setState({ options });
  };

  componentWillMount() {
    this.props.updateTriggerProperty(this.props.index, 'operator', '=');

    this.getOptions();
  }

  render({ trigger }, { options }) {
    const defaultValue = options.find(option => trigger.value === option.value);

    return (
      <Fragment>
        <div class="col-2 col-md-1">
          <div class="text-center" style={{ marginTop: '10px' }}>
            <i class="fe fe-arrow-right" style={{ fontSize: '20px' }} />
          </div>
        </div>
        <div class="col-10 col-md-5">
          <div class="form-group">
            <Select defaultValue={defaultValue || ''} onChange={this.handleValueChange} options={options} />
          </div>
        </div>
      </Fragment>
    );
  }
}

export default withIntlAsProp(PilotWireModeDeviceState);
