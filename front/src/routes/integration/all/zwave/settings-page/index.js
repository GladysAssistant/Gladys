import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import SettingsTab from './SettingsTab';
import integrationConfig from '../../../../../config/integrations';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,usbPorts,zwaveInfos,zwaveDriverPath,zwaveStatus,getZwaveUsbPortStatus,getCurrentZwaveDriverPathStatus,zwaveGetStatusStatus,zwaveDriverFailed,zwaveDisconnectStatus,connectZwaveStatus,zwaveConnectionInProgress',
  actions
)
class ZwaveSettingsPage extends Component {
  driverReadyListener = () => this.props.getStatus();
  driverFailedListener = () => this.props.driverFailed();

  componentWillMount() {
    this.props.getUsbPorts();
    this.props.getInfos();
    this.props.getStatus();
    this.props.getCurrentZwaveDriverPath();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_READY, this.driverReadyListener);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_FAILED, this.driverFailedListener);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_READY, this.driverReadyListener);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_FAILED,
      this.driverFailedListener
    );
  }

  render(props, {}) {
    const loading =
      props.getZwaveUsbPortStatus === RequestStatus.Getting ||
      props.getCurrentZwaveDriverPathStatus === RequestStatus.Getting ||
      props.zwaveGetStatusStatus === RequestStatus.Getting ||
      props.zwaveDisconnectStatus === RequestStatus.Getting ||
      props.connectZwaveStatus === RequestStatus.Getting;

    return (
      <ZwavePage integration={integrationConfig[props.user.language].zwave}>
        <SettingsTab {...props} loading={loading} />
      </ZwavePage>
    );
  }
}

export default ZwaveSettingsPage;
