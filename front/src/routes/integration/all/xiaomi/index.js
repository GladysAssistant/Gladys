import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import XiaomiSensorTemperaturePage from './XiaomiSensorTemperature';
import integrationConfig from '../../../../config/integrations';

@connect(
  'user,xiaomiSensorTemperature,houses',
  actions
)
class XiaomiIntegration extends Component {
  componentWillMount() {
    this.props.getXiaomiSensorTemperature(100, 0);
    this.props.getHouses();
    this.props.getSensorTh();
  }

  render(props, {}) {
    return <XiaomiSensorTemperaturePage {...props} integration={integrationConfig[props.user.language].xiaomi} />;
  }
}

export default XiaomiIntegration;
