import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwaveJSUIPage from '../ZwaveJSUIPage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,ready,externalZwaveJSUI,driverPath,mqttUrl,mqttUsername,mqttPassword,s2UnauthenticatedKey,s2AuthenticatedKey,s2AccessControlKey,s0LegacyKey,usbPorts,usbConfigured,mqttExist,mqttRunning,mqttConnected,zwaveJSUIExist,zwaveJSUIRunning,dockerBased,getConfigurationStatus,getZwaveUsbPortStatus,getStatusStatus,zwaveDisconnectStatus,zwaveConnectStatus',
  actions
)
class ZwaveJSUISettingsPage extends Component {
  componentWillMount() {
    this.props.getStatus();
    this.props.getUsbPorts();
    this.props.getConfiguration();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE, this.props.getStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE, this.props.getStatus);
  }

  render(props, {}) {
    const loading =
      props.getStatusStatus === RequestStatus.Getting ||
      props.getConfigurationStatus === RequestStatus.Getting ||
      props.getZwaveUsbPortStatus === RequestStatus.Getting ||
      props.zwaveDisconnectStatus === RequestStatus.Getting ||
      props.zwaveConnectStatus === RequestStatus.Getting;

    return (
      <ZwaveJSUIPage>
        <SettingsTab {...props} loading={loading} />
      </ZwaveJSUIPage>
    );
  }
}

export default ZwaveJSUISettingsPage;
