import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import YeelightPage from '../YeelightPage';
import DeviceTab from './DeviceTab';

class YeelightIntegration extends Component {
  componentWillMount() {
    this.props.getYeelightDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('yeelight');
  }

  render(props, {}) {
    return (
      <YeelightPage user={props.user}>
        <DeviceTab {...props} />
      </YeelightPage>
    );
  }
}

export default connect('user,yeelightDevices,housesWithRooms,getYeelightStatus', actions)(YeelightIntegration);