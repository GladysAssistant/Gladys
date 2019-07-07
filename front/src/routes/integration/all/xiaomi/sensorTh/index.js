import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import XiaomiSensorTemperaturePage from './XiaomiSensorTemperature';
import XiaomiPage from '../XiaomiPage';

@connect(
  'user,xiaomiSensorTemperature,houses,sensorTh',
  actions
)
class XiaomiSensorThPage extends Component {
  componentWillMount() {
    this.props.getXiaomiSensorTemperature(100, 0);
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <XiaomiPage>
        <XiaomiSensorTemperaturePage {...props} />
      </XiaomiPage>
    );
  }
}

export default XiaomiSensorThPage;
