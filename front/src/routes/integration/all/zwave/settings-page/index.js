import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,ready,restartRequired,zwaveMode,zwaveDriverPath,usbPorts,zwaveConnectionInProgress,usbConfigured,mqttExist,mqttRunning,dockerBased,zwave2mqttExist,zwave2mqttRunning,zwaveConnected,mqttConnected,getConfigurationStatus,getZwaveUsbPortStatus,saveConfigurationStatus,getStatusStatus,zwaveDisconnectStatus,zwaveConnectStatus',
  actions
)
class ZwaveSettingsPage extends Component {
  // driverReadyListener = () => this.props.getStatus();
  // driverFailedListener = () => this.props.driverFailed();

  componentWillMount() {
    this.props.getStatus();
    this.props.getUsbPorts();
    this.props.getConfiguration();
    // this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.STATUS_CHANGE, this.props.getStatus);
    // this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_READY, this.driverReadyListener);
    // this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_FAILED, this.driverFailedListener);
  }

  componentWillUnmount() {
    // this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.STATUS_CHANGE, this.props.checkStatus);
    /* this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_READY, this.driverReadyListener);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_FAILED,
      this.driverFailedListener
    ); */
  }

  render(props, {}) {
    const loading =
      props.getConfigurationStatus === RequestStatus.Getting ||
      props.getZwaveUsbPortStatus === RequestStatus.Getting ||
      props.getStatusStatus === RequestStatus.Getting ||
      props.saveConfigurationStatus === RequestStatus.Getting ||
      props.zwaveDisconnectStatus === RequestStatus.Getting ||
      props.zwaveConnectStatus === RequestStatus.Getting;

    return (
      <ZwavePage>
        <SettingsTab {...props} loading={loading} />
      </ZwavePage>
    );
  }
}

export default ZwaveSettingsPage;
