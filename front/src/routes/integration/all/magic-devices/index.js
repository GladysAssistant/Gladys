import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MagicDevicesLayout from './MagicDevicesLayout';
import DevicePanel from './DevicePanel';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../server/utils/constants';

@connect('user,session,magicDevices,houses', actions)
class MagicDevicesPage extends Component {
  componentWillMount() {
    this.props.getHouses();
    this.props.getMagicDevices();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MAGIC_DEVICES.NEW_DEVICE, payload => {
      this.props.getMagicDevices();
    });
  }

  render(props, {}) {
    return (
      <MagicDevicesLayout>
        {props.magicDevices && props.magicDevices.length ? <DevicePanel {...props} /> : <div />}
      </MagicDevicesLayout>
    );
  }
}

export default MagicDevicesPage;
