import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from '../../../../components/form/Select';

import { ACTIONS } from '../../../../../../server/utils/constants';

@connect('httpClient', {})
class TurnOnOffLight extends Component {
  getOptions = async () => {
    this.setState({ loading: true });
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: 'light',
        device_feature_type: 'binary'
      });
      await this.setState({ devices });
      this.refreshselectedDevices(this.props);
    } catch (e) {
      console.log(e);
    }
    this.setState({ loading: false });
  };
  handleChange = selectedDevices => {
    if (selectedDevices) {
      const lights = selectedDevices.map(selectedDevice => selectedDevice.selector);
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'devices', lights);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'devices', []);
    }
  };
  refreshselectedDevices = nextProps => {
    const selectedDevices = [];
    if (nextProps.action.devices && this.state.devices) {
      nextProps.action.devices.forEach(light => {
        const device = this.state.devices.find(device => device.selector === light);
        if (device) {
          selectedDevices.push(device);
        }
      });
    }
    this.setState({ selectedDevices });
  };
  constructor(props) {
    super(props);
    this.state = {
      devices: null,
      selectedDevices: []
    };
  }
  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshselectedDevices(nextProps);
  }

  render(props, { selectedDevices, devices, loading }) {
    return (
      <div class="form-group">
        <label class="form-label">
          {props.action.type === ACTIONS.LIGHT.TURN_ON && <Text id="editScene.actionsCard.turnOnLights.label" />}
          {props.action.type === ACTIONS.LIGHT.TURN_OFF && <Text id="editScene.actionsCard.turnOffLights.label" />}
        </label>
        <Select
          multiple
          searchable
          value={selectedDevices}
          onChange={this.handleChange}
          options={devices}
          loading={loading}
          itemLabelKey="name"
        />
      </div>
    );
  }
}

export default TurnOnOffLight;
