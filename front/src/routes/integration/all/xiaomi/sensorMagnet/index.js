import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import XiaomiSensorMagnetPage from './XiaomiSensorMagnet';
import XiaomiPage from '../XiaomiPage';

@connect(
  'user,xiaomiSensorMagnet,houses,sensorMagnet',
  actions
)
class XiaomiSensorMtPage extends Component {
  componentWillMount() {
    this.props.getXiaomiSensorMagnet(100, 0);
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <XiaomiPage>
        <XiaomiSensorMagnetPage {...props} />
      </XiaomiPage>
    );
  }
}

export default XiaomiSensorMtPage;
