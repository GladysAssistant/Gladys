import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import XiaomiSensorPage from './XiaomiSensor';
import XiaomiPage from '../XiaomiPage';

@connect(
  'user,xiaomiSensor,houses,sensor',
  actions
)
class XiaomiSensorMtPage extends Component {
  componentWillMount() {
    this.props.getXiaomiSensor(100, 0);
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <XiaomiPage>
        <XiaomiSensorPage {...props} />
      </XiaomiPage>
    );
  }
}

export default XiaomiSensorMtPage;
