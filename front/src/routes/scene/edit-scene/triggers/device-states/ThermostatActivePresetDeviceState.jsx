import { Component, Fragment } from 'preact';
import Select from '../../../../../components/form/Select';
import get from 'get-value';

import { THERMOSTAT_ACTIVE_PRESET } from '../../../../../../../server/utils/constants';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

// The preset in force is stored as a number: the trigger names the preset, so
// that nobody has to know that Comfort is 5.
const PRESET_VALUES = Object.keys(THERMOSTAT_ACTIVE_PRESET).map(key => THERMOSTAT_ACTIVE_PRESET[key]);

class ThermostatActivePresetDeviceState extends Component {
  handleValueChange = ({ value }) => {
    this.props.updateTriggerProperty(this.props.index, 'value', value);
  };

  componentWillMount() {
    this.props.updateTriggerProperty(this.props.index, 'operator', '=');
  }

  render({ trigger, intl }) {
    const options = PRESET_VALUES.map(value => ({
      label: get(intl.dictionary, `deviceFeatureValue.category.thermostat.active-preset.${value}`, {
        default: String(value)
      }),
      value
    }));
    const selectedOption = options.find(option => trigger.value === option.value) || null;

    return (
      <Fragment>
        <div class="col-2 col-md-1">
          <div class="text-center" style={{ marginTop: '10px' }}>
            <i class="fe fe-arrow-right" style={{ fontSize: '20px' }} />
          </div>
        </div>
        <div class="col-10 col-md-5">
          <div class="form-group">
            <Select
              value={selectedOption}
              onChange={this.handleValueChange}
              options={options}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </Fragment>
    );
  }
}

export default withIntlAsProp(ThermostatActivePresetDeviceState);
