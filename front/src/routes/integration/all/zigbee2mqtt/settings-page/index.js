import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

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
    this.setState({
      getZigbee2mqttUsbPortStatus: RequestStatus.Getting
    });

    try {
      const rawUsbPorts = await this.props.httpClient.get('/api/v1/service/usb/port');
      const usbPorts = rawUsbPorts.map(usbPort => ({
        label: `${usbPort.comPath} ${usbPort.comName ? ` - ${usbPort.comName}` : ''} ${
          usbPort.comVID ? ` - ${usbPort.comVID}` : ''
        }`,
        value: usbPort.comPath
      }));
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

  loadZigbeeAdapters = async () => {
    try {
      const zigbeeAdapterLabels = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/adapter');
      const zigbeeAdapters = zigbeeAdapterLabels.map(adapter => ({
        label: adapter,
        value: adapter
      }));

      this.setState({
        zigbeeAdapters,
        getZigbeeAdaptersStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        getZigbeeAdaptersStatus: RequestStatus.Error
      });
    }
  };

  loadZ2MConfiguration = async () => {
    let zigbeeDriverPath;
    let zigbeeDongleName;

    try {
      let zigbeeDriverPathVariable = await this.props.httpClient.get(
        '/api/v1/service/zigbee2mqtt/variable/ZIGBEE2MQTT_DRIVER_PATH'
      );
      zigbeeDriverPath = zigbeeDriverPathVariable.value;
    } catch (e) {
      // Variable is not set yet
    }

    try {
      let zigbeeDongleNameVariable = await this.props.httpClient.get(
        '/api/v1/service/zigbee2mqtt/variable/ZIGBEE_DONGLE_NAME'
      );
      zigbeeDongleName = zigbeeDongleNameVariable.value;
    } catch (e) {
      // Variable is not set yet
    }

    this.setState({
      zigbeeDriverPath,
      zigbeeDongleName,
      getCurrentZigbee2mqttDriverPathStatus: RequestStatus.Success
    });
  };

  updateZigbeeDriverPath = option => {
    this.setState({
      zigbeeDriverPath: option.value
    });
  };

  updateZigbeeDongleName = option => {
    const zigbeeDongleName = get(option, 'value', { default: '' });
    this.setState({
      zigbeeDongleName
    });
  };

  saveDriverPath = async () => {
    this.setState({
      zigbee2mqttSaveStatus: RequestStatus.Getting
    });

    try {
      // If DriverPath contains '---------' then we remove ZIGBEE2MQTT_DRIVER_PATH variable
      let { zigbeeDriverPath = '', zigbeeDongleName = '' } = this.state;
      if (zigbeeDriverPath.indexOf('/dev/') === -1) {
        zigbeeDriverPath = '';
      }

      const payload = {
        ZIGBEE2MQTT_DRIVER_PATH: zigbeeDriverPath,
        ZIGBEE_DONGLE_NAME: zigbeeDongleName
      };

      await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/setup', payload);

      this.setState({
        zigbee2mqttSaveStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        zigbee2mqttSaveStatus: RequestStatus.Error
      });
    }

    await this.loadZ2MStatus();
  };

  constructor(props) {
    super(props);

    this.state = {
      usbPorts: [],
      zigbeeAdapters: [],
      getZigbee2mqttUsbPortStatus: RequestStatus.Getting,
      getCurrentZigbee2mqttDriverPathStatus: RequestStatus.Getting,
      zigbee2mqttGetStatusStatus: RequestStatus.Getting,
      getZigbeeAdaptersStatus: RequestStatus.Getting
    };
  }

  componentWillMount() {
    this.loadUsbPorts();
    this.loadZigbeeAdapters();
    this.loadZ2MConfiguration();
    this.loadZ2MStatus();
  }

  render(props, state) {
    const loading =
      state.getCurrentZigbee2mqttDriverPathStatus === RequestStatus.Getting ||
      state.zigbee2mqttGetStatusStatus === RequestStatus.Getting ||
      state.getZigbeeAdaptersStatus === RequestStatus.Getting ||
      state.zigbee2mqttSaveStatus === RequestStatus.Getting;

    return (
      <Zigbee2mqttPage user={props.user}>
        <SettingsTab
          {...props}
          {...state}
          loading={loading}
          saveDriverPath={this.saveDriverPath}
          updateZigbeeDriverPath={this.updateZigbeeDriverPath}
          updateZigbeeDongleName={this.updateZigbeeDongleName}
          loadUsbPorts={this.loadUsbPorts}
        />
      </Zigbee2mqttPage>
    );
  }
}

export default connect('user,httpClient')(Zigbee2mqttSettingsPage);
