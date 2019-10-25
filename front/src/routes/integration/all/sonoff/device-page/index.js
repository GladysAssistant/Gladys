import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import SonoffPage from '../SonoffPage';
import DeviceTab from './DeviceTab';

@connect(
  'user,sonoffDevices,housesWithRooms,getSonoffStatus',
  actions
)
class SonoffIntegration extends Component {
  componentWillMount() {
    this.props.getSonoffDevices(100, 0);
    this.props.getHouses();
    this.props.getIntegrationByName('sonoff');
  }

  render(props, {}) {
    return (
      <SonoffPage user={props.user}>
        <DeviceTab {...props} />
      </SonoffPage>
    );
  }
}

export default SonoffIntegration;
