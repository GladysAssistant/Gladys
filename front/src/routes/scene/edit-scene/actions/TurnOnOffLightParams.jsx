import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

import { ACTIONS } from '../../../../../../server/utils/constants';

class TurnOnOffLight extends Component {
  getOptions = async () => {
    try {
      const deviceFeatures = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: 'light',
        device_feature_type: 'binary'
      });
      const deviceFeatureOptions = deviceFeatures
        .flatMap(device => device.features)
        .map(deviceFeature => ({
          value: deviceFeature.selector,
          label: deviceFeature.name
        }));
      await this.setState({ deviceFeatureOptions });
      this.refreshSelectedOptions(this.props);
      return deviceFeatureOptions;
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOptions => {
    if (selectedOptions) {
      const lights = selectedOptions.map(selectedOption => selectedOption.value);
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'device_features', lights);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'device_features', []);
    }
  };
  refreshSelectedOptions = nextProps => {
    const selectedOptions = [];
    if (nextProps.action.device_features && this.state.deviceFeatureOptions) {
      nextProps.action.device_features.forEach(light => {
        const deviceFeatureOption = this.state.deviceFeatureOptions.find(
          deviceFeatureOption => deviceFeatureOption.value === light
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
          {props.action.type === ACTIONS.LIGHT.TURN_ON && <Text id="editScene.actionsCard.turnOnLights.label" />}
          {props.action.type === ACTIONS.LIGHT.TURN_OFF && <Text id="editScene.actionsCard.turnOffLights.label" />}
          {props.action.type === ACTIONS.LIGHT.TOGGLE && <Text id="editScene.actionsCard.toggleLights.label" />}
        </label>
        {props.action.type === ACTIONS.LIGHT.TOGGLE && (
          <p>
            <Text id="editScene.actionsCard.toggleLights.description" />
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

export default connect('httpClient', {})(TurnOnOffLight);
