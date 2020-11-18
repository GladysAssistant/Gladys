import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MerossPage from './MerossPage';
import { RequestStatus } from '../../../../utils/consts';

@connect('user,merossDevices,housesWithRooms,getMerossStatus', actions)
class MerossIntegration extends Component {
  componentWillMount() {
    this.props.getMerossDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('meross');
  }

  render(props, {}) {
    return <MerossPage {...props} />;
  }
}

export default MerossIntegration;
