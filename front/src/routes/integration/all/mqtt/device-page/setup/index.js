import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './../actions';
import FeatureTab from './FeatureTab';
import MqttPage from '../../MqttPage';
import integrationConfig from '../../../../../../config/integrations';

@connect(
  'session,user,mqttDevices,houses',
  actions
)
class MqttDeviceSetupPage extends Component {
  render(props, {}) {
    let deviceIndex = -1;
    if (this.props.mqttDevices) {
      deviceIndex = this.props.mqttDevices.findIndex(d => d.id === this.props.uuid);
    }
    let device;
    if (deviceIndex >= 0) {
      device = this.props.mqttDevices[deviceIndex];
    }

    return (
      <MqttPage integration={integrationConfig[props.user.language].mqtt}>
        <FeatureTab {...props} device={device} deviceIndex={deviceIndex} />
      </MqttPage>
    );
  }
}

export default MqttDeviceSetupPage;
