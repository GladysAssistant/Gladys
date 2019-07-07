import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import XiaomiSensorTemperaturePage from './XiaomiSensorTemperature';

@connect(
  'user,xiaomiSensorTemperature,houses,sensorTh',
  actions
)
class XiaomiIntegration extends Component {
  componentWillMount() {
    this.props.getXiaomiSensorTemperature(100, 0);
    this.props.getHouses();
  }

  render(props, {}) {
    return <XiaomiSensorTemperaturePage {...props} />;
  }
}

export default XiaomiIntegration;
