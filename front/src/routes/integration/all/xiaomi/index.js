import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import XiaomiLayout from './XiaomiLayout';
import SetupPanel from './SetupPanel';
import DevicePanel from './DevicePanel';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../server/utils/constants';

class XiaomiPage extends Component {
  componentWillMount() {
    this.props.getHouses();
    this.props.getXiaomiSensors();
    this.props.getXiaomiDevices();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.XIAOMI.NEW_DEVICE, () => {
      this.props.getXiaomiSensors();
    });
  }

  render(props, {}) {
    return (
      <XiaomiLayout>
        {props.xiaomiDevices && props.xiaomiDevices.length ? <DevicePanel {...props} /> : <div />}
        <SetupPanel {...props} />
      </XiaomiLayout>
    );
  }
}

export default connect(
  'user,session,xiaomiSensors,xiaomiDevices,houses,getXiaomiDevicesStatus,xiaomiDeviceSearch,getXiaomiDeviceOrderDir',
  actions
)(XiaomiPage);
