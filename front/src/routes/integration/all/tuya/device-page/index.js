import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import DeviceTab from './DeviceTab';
import TuyaPage from "../TuyaPage";

class TuyaIntegration extends Component {
  componentWillMount() {
    this.props.getTuyaDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('tuya');
  }

  render(props, {}) {
    return (
      <TuyaPage user={props.user}>
        <DeviceTab {...props} />
      </TuyaPage>
    );
  }
}

export default connect(
  'user,tuyaDevices,housesWithRooms,getTuyaStatus,tuyaSearch,getTuyaOrderDir',
  actions
)(TuyaIntegration);
