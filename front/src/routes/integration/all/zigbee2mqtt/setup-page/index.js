import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import SetupTab from './SetupTab';


@connect(
  'user,session,z2mEnabled,dockerContainers,z2mContainerExists,mqtt4z2mContainerExists,zigbee2mqttContainerStatus,connectMqttStatus,mqttConnected,mqttConnectionError',
  actions
)
class Zigbee2mqttSetupPage extends Component {
  async componentWillMount() {
//    this.props.z2mEnabled = false;
    await this.props.loadProps();
    await this.props.getContainers();
  }

  render(props, {}) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <SetupTab {...props} />
      </Zigbee2mqttPage>
    );
  }
}

export default Zigbee2mqttSetupPage;
