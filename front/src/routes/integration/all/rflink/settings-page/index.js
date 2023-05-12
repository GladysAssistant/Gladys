import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RflinkPage from '../RflinkPage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class RflinkSettingsPage extends Component {
  rflinkReadyListener = () => this.props.getStatus();
  rflinkFailedListener = () => this.props.rflinkFailed();
  rflinkGetStatus = () => this.props.getStatus();

  componentWillMount() {
    this.props.getUsbPorts();
    this.props.getStatus();
    this.props.getCurrentRflinkPath();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_READY, this.rflinkReadyListener);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_FAILED, this.rflinkFailedListener);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_MESSAGE, this.rflinkGetStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_READY, this.rflinkReadyListener);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_FAILED,
      this.rflinkFailedListener
    );
  }

  render(props, {}) {
    const loading =
      props.getRflinkUsbPortStatus === RequestStatus.Getting ||
      props.getCurrentRflinkPathStatus === RequestStatus.Getting ||
      props.rflinkGetStatusStatus === RequestStatus.Getting ||
      props.rflinkDisconnectStatus === RequestStatus.Getting ||
      props.connectRflinkStatus === RequestStatus.Getting;

    return (
      <RflinkPage>
        <SettingsTab {...props} loading={loading} />
      </RflinkPage>
    );
  }
}

export default connect(
  'user,session,usbPorts,RflinkPath,rflinkStatus,getRflinkUsbPortStatus,getCurrentRflinkPathStatus,rflinkGetStatusStatus,rflinkFailed,rflinkDisconnectStatus,connectRflinkStatus,RflinkConnectionInProgress,currentMilightGateway,currentMilightZone',
  actions
)(RflinkSettingsPage);
