import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import EweLinkPage from '../EweLinkPage';
import DeviceTab from './DeviceTab';

class EweLinkIntegration extends Component {
  componentWillMount() {
    this.props.getEweLinkDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('ewelink');
  }

  render(props, {}) {
    return (
      <EweLinkPage user={props.user}>
        <DeviceTab {...props} />
      </EweLinkPage>
    );
  }
}

export default connect(
  'user,eweLinkDevices,housesWithRooms,getEweLinkStatus,eweLinkSearch,getEweLinkOrderDir',
  actions
)(EweLinkIntegration);
