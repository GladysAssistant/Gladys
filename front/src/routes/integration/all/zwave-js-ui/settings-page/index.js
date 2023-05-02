import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwaveJSUIPage from '../ZwaveJSUIPage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

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
      props.zwaveGetStatusStatus === RequestStatus.Getting ||
      props.zwaveGetConfigurationStatus === RequestStatus.Getting ||
      props.zwaveGetUsbPortStatus === RequestStatus.Getting ||
      props.zwaveDisconnectStatus === RequestStatus.Getting ||
      props.zwaveConnectStatus === RequestStatus.Getting;

    return (
      <ZwaveJSUIPage user="{props.user}">
        <SettingsTab {...props} loading={loading} />
      </ZwaveJSUIPage>
    );
  }
}

export default connect(
  'user,session,ready,externalZwaveJSUI,driverPath,mqttUrl,mqttUsername,mqttPassword,mqttTopicPrefix,mqttTopicWithLocation,s2UnauthenticatedKey,s2AuthenticatedKey,s2AccessControlKey,s0LegacyKey,usbPorts,usbConfigured,mqttExist,mqttRunning,mqttConnected,zwaveJSUIExist,zwaveJSUIRunning,zwaveJSUIConnected,zwaveJSUIVersion,zwaveJSUIExpectedVersion,dockerBased,zwaveGetConfigurationStatus,zwaveGetUsbPortStatus,zwaveGetStatusStatus,zwaveDisconnectStatus,zwaveConnectStatus',
  actions
)(ZwaveJSUISettingsPage);
