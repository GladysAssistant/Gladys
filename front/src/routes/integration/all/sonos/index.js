import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import SonosPage from './Sonos';

@connect(
  'user,sonosDevices,sonosDevicesDetected,housesWithRooms,getSonosDevicesStatus',
  actions
)
class SonosIntegration extends Component {
  componentWillMount() {
    this.props.getSonosDevices(100, 0);
    this.props.getHouses();
    this.props.scan();
    this.props.getIntegrationByName('sonos');
  }

  render(props, {}) {
    return <SonosPage {...props} />;
  }
}

export default SonosIntegration;
