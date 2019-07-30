import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MqttPage from '../MqttPage';
import DeviceTab from './DeviceTab';
import integrationConfig from '../../../../../config/integrations';

@connect(
  'session,user,mqttDevices,houses,getMqttDevicesStatus',
  actions
)
class MqttDevicePage extends Component {
  componentWillMount() {
    this.props.getMqttDevices(20, 0);
    this.props.getHouses();
    this.props.getIntegrationByName('mqtt');
  }

  render(props, {}) {
    return (
      <MqttPage integration={integrationConfig[props.user.language].mqtt}>
        <DeviceTab {...props} />
      </MqttPage>
    );
  }
}

export default MqttDevicePage;
