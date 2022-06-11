import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import BroadlinkPage from '../BroadlinkPage';
import PeripheralTab from './PeripheralTab';

@connect('session,user,broadlinkPeripherals,getBroadlinkPeripheralsStatus,housesWithRooms', actions)
class BroadlinkDevicePage extends Component {
  componentWillMount() {
    this.props.getHouses();
    this.props.getBroadlinkPeripherals();
  }

  render(props, {}) {
    return (
      <BroadlinkPage>
        <PeripheralTab {...props} />
      </BroadlinkPage>
    );
  }
}

export default BroadlinkDevicePage;
