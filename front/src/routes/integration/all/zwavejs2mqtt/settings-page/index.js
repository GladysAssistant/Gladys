import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zwavejs2mqttPage from '../Zwavejs2mqttPage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,ready,externalZwavejs2mqtt,driverPath,mqttUrl,mqttUsername,mqttPassword,s2UnauthenticatedKey,s2AuthenticatedKey,s2AccessControlKey,s0LegacyKey,usbPorts,usbConfigured,mqttExist,mqttRunning,mqttConnected,zwavejs2mqttExist,zwavejs2mqttRunning,dockerBased,getConfigurationStatus,getZwaveUsbPortStatus,saveConfigurationStatus,getStatusStatus,zwaveDisconnectStatus,zwaveConnectStatus',
  actions
)
class Zwavejs2mqttSettingsPage extends Component {

  componentWillMount() {
    this.props.getStatus();
    this.props.getUsbPorts();
    this.props.getConfiguration();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE, this.props.getStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
      this.props.getStatus
    );
  }

  render(props, {}) {
    const loading =
      props.getStatusStatus === RequestStatus.Getting ||
      props.getConfigurationStatus === RequestStatus.Getting ||
      props.getZwaveUsbPortStatus === RequestStatus.Getting ||
      props.saveConfigurationStatus === RequestStatus.Getting ||
      props.zwaveDisconnectStatus === RequestStatus.Getting ||
      props.zwaveConnectStatus === RequestStatus.Getting;

    return (
      <Zwavejs2mqttPage>
        <SettingsTab {...props} loading={loading} />
      </Zwavejs2mqttPage>
    );
  }
}

export default Zwavejs2mqttSettingsPage;
