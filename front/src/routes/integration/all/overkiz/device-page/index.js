import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import OverkizPage from '../OverkizPage';
import DeviceTab from './DeviceTab';

@connect('user,overkizDevices,housesWithRooms,getOverkizStatus', actions)
class OverkizIntegration extends Component {
  componentWillMount() {
    this.props.getOverkizDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('overkiz');
  }

  render(props, {}) {
    return (
      <OverkizPage user={props.user}>
        <DeviceTab {...props} />
      </OverkizPage>
    );
  }
}

export default OverkizIntegration;
