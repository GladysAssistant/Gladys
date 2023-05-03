import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';

class Zigbee2mqttSettingsPage extends Component {
  loadZ2MStatus = async () => {
    try {
      const zigbee2mqttStatus = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      this.setState({
        usbConfigured: zigbee2mqttStatus.usbConfigured,
        zigbee2mqttGetStatusStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        zigbee2mqttGetStatusStatus: RequestStatus.Error
      });
    }
  };

  loadUsbPorts = async () => {
    try {
      const usbPorts = await this.props.httpClient.get('/api/v1/service/usb/port');
      this.setState({
        usbPorts,
        getZigbee2mqttUsbPortStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        getZigbee2mqttUsbPortStatus: RequestStatus.Error
      });
    }
  };

  loadCurrentZigbee2mqttDriverPathStatus = async () => {
    try {
      const zigbee2mqttDriverPath = await this.props.httpClient.get(
        '/api/v1/service/zigbee2mqtt/variable/ZIGBEE2MQTT_DRIVER_PATH'
      );
      this.setState({
        zigbee2mqttDriverPath: zigbee2mqttDriverPath.value,
        getCurrentZigbee2mqttDriverPathStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        getCurrentZigbee2mqttDriverPathStatus: RequestStatus.Error
      });
    }
  };

  updateZigbee2mqttDriverPath = e => {
    this.setState({
      zigbee2mqttDriverPath: e.target.value
    });
  };

  saveDriverPath = async () => {
    this.setState({
      zigbee2mqttSaveStatus: RequestStatus.Getting
    });
    try {
      // If DriverPath contains '---------' then we remove ZIGBEE2MQTT_DRIVER_PATH variable
      let { zigbee2MqttDriverPath } = this.state;
      if (zigbee2MqttDriverPath.indexOf('/dev/') === -1) {
        zigbee2MqttDriverPath = '';
      }
      await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/variable/ZIGBEE2MQTT_DRIVER_PATH', {
        value: zigbee2MqttDriverPath
      });
      await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/connect');
      const zigbee2mqttStatus = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      this.setState({
        usbConfigured: zigbee2mqttStatus.usbConfigured,
        zigbee2mqttSaveStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        zigbee2mqttSaveStatus: RequestStatus.Error
      });
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      usbPorts: [],
      getZigbee2mqttUsbPortStatus: RequestStatus.Getting,
      getCurrentZigbee2mqttDriverPathStatus: RequestStatus.Getting,
      zigbee2mqttGetStatusStatus: RequestStatus.Getting
    };
  }

  componentWillMount() {
    this.loadUsbPorts();
    this.loadCurrentZigbee2mqttDriverPathStatus();
    this.loadZ2MStatus();
  }

  render(props, state) {
    const loading =
      state.getZigbee2mqttUsbPortStatus === RequestStatus.Getting ||
      state.getCurrentZigbee2mqttDriverPathStatus === RequestStatus.Getting ||
      state.zigbee2mqttGetStatusStatus === RequestStatus.Getting ||
      state.zigbee2mqttSaveStatus === RequestStatus.Getting;

    return (
      <Zigbee2mqttPage user={props.user}>
        <SettingsTab
          {...props}
          {...state}
          loading={loading}
          saveDriverPath={this.saveDriverPath}
          updateZigbee2mqttDriverPath={this.updateZigbee2mqttDriverPath}
        />
      </Zigbee2mqttPage>
    );
  }
}

export default connect('user,httpClient')(Zigbee2mqttSettingsPage);
