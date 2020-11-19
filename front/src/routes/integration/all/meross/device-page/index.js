import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MerossDevicePage from './MerossDevicePage';
import MerossPage from '../MerossPage';

@connect('user,merossDevices,housesWithRooms,getMerossStatus', actions)
class MerossIntegration extends Component {
  componentWillMount() {
    this.props.getMerossDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('meross');
  }

  render(props, {}) {
    return (
      <MerossPage>
        <MerossDevicePage {...props} />
      </MerossPage>
    );
  }
}

export default MerossIntegration;
