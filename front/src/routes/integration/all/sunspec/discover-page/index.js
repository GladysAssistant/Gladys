import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import SunSpecPage from '../SunSpecPage';
import SunSpecDiscoverTab from './SunSpecDiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class SunSpecDiscoverPage extends Component {
  componentWillMount() {
    this.props.getSunSpecStatus();
    this.props.getDiscoveredDevices();
    this.props.getHouses();

    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SUNSPEC.SCANNING, this.props.handleStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SUNSPEC.SCANNING, this.props.handleStatus);
  }

  render(props, {}) {
    return (
      <SunSpecPage>
        <SunSpecDiscoverTab {...props} />
      </SunSpecPage>
    );
  }
}

export default connect(
  'session,httpClient,houses,sunspecDiscoveredDevices,sunspecGetDiscoveredDevicesStatus,sunspecDiscoverUpdate,sunspecStatus,filterExisting',
  actions
)(SunSpecDiscoverPage);
