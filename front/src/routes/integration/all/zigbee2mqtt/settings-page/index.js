import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';

class Zigbee2mqttSettingsPage extends Component {
  componentWillMount() {
    this.props.getUsbPorts();
    this.props.getStatus();
    this.props.getCurrentZigbee2mqttDriverPath();
  }

  componentWillUnmount() {}

  render(props, {}) {
    const loading =
      props.getZigbee2mqttUsbPortStatus === RequestStatus.Getting ||
      props.getCurrentZigbee2mqttDriverPathStatus === RequestStatus.Getting ||
      props.zigbee2mqttGetStatusStatus === RequestStatus.Getting ||
      props.zigbee2mqttSaveStatus === RequestStatus.Getting;

    return (
      <Zigbee2mqttPage user={props.user}>
        <SettingsTab {...props} loading={loading} />
      </Zigbee2mqttPage>
    );
  }
}

export default connect(
  'user,session,usbPorts,zigbee2mqttStatus,zigbee2mqttDriverPath,getZigbee2mqttUsbPortStatus,getCurrentZigbee2mqttDriverPathStatus,zigbee2mqttGetStatusStatus,zigbee2mqttSaveStatus,zigbee2mqttSavingInProgress',
  actions
)(Zigbee2mqttSettingsPage);
