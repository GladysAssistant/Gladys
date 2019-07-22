import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MqttPage from '../MqttPage';
import SetupTab from './SetupTab';
import integrationConfig from '../../../../../config/integrations';

@connect(
  'user,session,mqttStatus',
  actions
)
class MqttNodePage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('mqtt');
    // this.props.getStatus();
  }

  render(props, {}) {
    return (
      <MqttPage integration={integrationConfig[props.user.language].mqtt}>
        <SetupTab {...props} />
      </MqttPage>
    );
  }
}

export default MqttNodePage;
