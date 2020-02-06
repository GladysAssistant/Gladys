import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RflinkPage from '../RflinkPage';
import SettingsTab from './SettingsTab';
import integrationConfig from '../../../../../config/integrations';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,usbPorts,rflinkPath,rflinkStatus,getRflinkUsbPortStatus,getCurrentRflinkPathStatus,rflinkGetStatusStatus,rflinkFailed,rflinkDisconnectStatus,connectRflinkStatus,RflinkConnectionInProgress',
  actions
)
class RflinkSettingsPage extends Component {
  rflinkReadyListener = () => this.props.getStatus();
  rflinkFailedListener = () => this.props.rflinkFailed();

  componentWillMount() {
    this.props.getUsbPorts();
    this.props.getStatus();
    this.props.getCurrentRflinkPath();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_READY, this.rflinkReadyListener);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_FAILED, this.rflinkFailedListener);
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
      <RflinkPage integration={integrationConfig[props.user.language].rflink}>
        <SettingsTab {...props} loading={loading} />
      </RflinkPage>
    );
  }
}

export default RflinkSettingsPage;
