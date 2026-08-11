import { Component, Fragment } from 'preact';
import Select from 'react-select';
import get from 'get-value';

import { WATER_HEATER_MODE } from '../../../../../../../server/utils/constants';
import { resolveFeatureOptions } from '../../../../../utils/supportedOptions';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

const MODE_CATALOG = Object.keys(WATER_HEATER_MODE).map((key) => ({ value: WATER_HEATER_MODE[key] }));

class WaterHeaterModeDeviceState extends Component {
  handleValueChange = ({ value }) => {
    this.props.updateTriggerProperty(this.props.index, 'value', value);
  };

  getOptions = () => {
    // Offer only the modes this appliance declares, so a trigger cannot be saved on a mode the
    // device never reports. resolveFeatureOptions returns the whole catalog when the feature
    // carries no supported_options, which keeps legacy and hand-made features usable.
    const options = resolveFeatureOptions(this.props.selectedDeviceFeature, MODE_CATALOG).map((option) => ({
      label: get(this.props.intl.dictionary, `deviceFeatureValue.category.water-heater.mode.${option.value}`, {
        default: option.label || option.value,
      }),
      value: option.value,
    }));

    this.setState({ options });
  };

  componentWillMount() {
    this.props.updateTriggerProperty(this.props.index, 'operator', '=');

    this.getOptions();
  }

  componentDidUpdate(previousProps) {
    // Same reason as the action-side selector: the options depend on the selected feature, and
    // switching between two water-heater mode features does not remount this component.
    if (previousProps.selectedDeviceFeature !== this.props.selectedDeviceFeature) {
      this.getOptions();
    }
  }

  render({ trigger }, { options }) {
    // Controlled rather than defaultValue: the option list is recomputed when the selected feature
    // changes, and an uncontrolled select would keep displaying the previous device's mode. `null`
    // when nothing matches, so a mode the feature no longer declares shows as unselected.
    const selectedOption = (options || []).find((option) => trigger.value === option.value) || null;

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

export default withIntlAsProp(WaterHeaterModeDeviceState);
