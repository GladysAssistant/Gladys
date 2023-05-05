import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

import { ACTIONS } from '../../../../../../server/utils/constants';
import { getDeviceFeatureName } from '../../../../utils/device';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

class TurnOnOffSwitch extends Component {
  getOptions = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: 'switch',
        device_feature_type: 'binary'
      });
      // keep only write switches, not read only
      const deviceFeatureOptions = [];
      devices.forEach(device => {
        device.features
          .filter(deviceFeature => deviceFeature.read_only === false)
          .map(deviceFeature => ({
            value: deviceFeature.selector,
            label: getDeviceFeatureName(this.props.intl.dictionary, device, deviceFeature)
          }))
          .forEach(deviceFeatureOption => deviceFeatureOptions.push(deviceFeatureOption));
      });
      await this.setState({ deviceFeatureOptions });
      this.refreshSelectedOptions(this.props);
      return deviceFeatureOptions;
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOptions => {
    if (selectedOptions) {
      const switches = selectedOptions.map(selectedOption => selectedOption.value);
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'device_features', switches);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'device_features', []);
    }
  };
  refreshSelectedOptions = nextProps => {
    const selectedOptions = [];
    if (nextProps.action.device_features && this.state.deviceFeatureOptions) {
      nextProps.action.device_features.forEach(switches => {
        const deviceFeatureOption = this.state.deviceFeatureOptions.find(
          deviceFeatureOption => deviceFeatureOption.value === switches
        );
        if (deviceFeatureOption) {
          selectedOptions.push(deviceFeatureOption);
        }
      });
    }
    this.setState({ selectedOptions });
  };
  constructor(props) {
    super(props);
    this.state = {
      deviceFeatureOptions: null,
      selectedOptions: []
    };
  }
  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOptions, deviceFeatureOptions }) {
    return (
      <div class="form-group">
        <label class="form-label">
          {props.action.type === ACTIONS.SWITCH.TURN_ON && <Text id="editScene.actionsCard.turnOnSwitches.label" />}
          {props.action.type === ACTIONS.SWITCH.TURN_OFF && <Text id="editScene.actionsCard.turnOffSwitches.label" />}
          {props.action.type === ACTIONS.SWITCH.TOGGLE && <Text id="editScene.actionsCard.toggleSwitches.label" />}
        </label>
        {props.action.type === ACTIONS.SWITCH.TOGGLE && (
          <p>
            <Text id="editScene.actionsCard.toggleSwitches.description" />
          </p>
        )}
        <Select
          defaultValue={[]}
          isMulti
          value={selectedOptions}
          onChange={this.handleChange}
          options={deviceFeatureOptions}
        />
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(TurnOnOffSwitch));
