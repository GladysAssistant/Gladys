import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import XiaomiCapteurTemperaturePage from './XiaomiCapteurTemperature';
import integrationConfig from '../../../../config/integrations';

@connect(
  'user,xiaomiCapteurTemperature,houses',
  actions
)
class XiaomiIntegration extends Component {
  componentWillMount() {
    this.props.getXiaomiCapteurTemperature(100, 0);
    this.props.getHouses();
  }

  render(props, {}) {
    return <XiaomiCapteurTemperaturePage {...props} integration={integrationConfig[props.user.language].xiaomi} />;
  }
}

export default XiaomiIntegration;
