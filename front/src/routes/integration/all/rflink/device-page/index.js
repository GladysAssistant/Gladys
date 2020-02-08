import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import DevicePage from './DevicePage';
import FoundDevices from './FoundDevices';
import RflinkPage from '../RflinkPage.jsx';

@connect(
  'session,user,rflinksDevices,houses,getRflinkDevicesStatus,rflinkNewDevices,getRflinkCreateDeviceStatus,getRflinkNewDevicesStatus',
  actions
)
class RflinkDevicePage extends Component {
  componentWillMount() {
    this.props.getRflinkDevices();
    this.props.getHouses();
    this.props.getRflinkNewDevices();
    this.props.getIntegrationByName('rflink');
  }

  render(props, {}) {
    return (
      <RflinkPage>
        {props.rflinkDevices && props.rflinkDevices.length ? <DevicePage {...props} /> : <div />}
        <FoundDevices {...props} />
      </RflinkPage>
    );
  }
}

export default RflinkDevicePage;
