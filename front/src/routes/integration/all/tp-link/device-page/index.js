import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import TpLinkPage from '../TpLinkPage';
import DevicePage from './DevicePage';
import FoundDevices from './FoundDevices';

class TpLinkDevicePage extends Component {
  componentWillMount() {
    this.props.getTpLinkDevices();
    this.props.getHouses();
    this.props.getTpLinkNewDevices();
    this.props.getIntegrationByName('tp-link');
  }

  render(props, {}) {
    return (
      <TpLinkPage>
        {props.tpLinkDevices && props.tpLinkDevices.length ? <DevicePage {...props} /> : <div />}
        <FoundDevices {...props} />
      </TpLinkPage>
    );
  }
}

export default connect(
  'session,user,tpLinkDevices,houses,getTpLinkDevicesStatus,tpLinkNewDevices,getTpLinkCreateDeviceStatus,getTpLinkNewDevicesStatus,getTpLinkDeviceOrderDir,tpLinkDeviceSearch',
  actions
)(TpLinkDevicePage);
