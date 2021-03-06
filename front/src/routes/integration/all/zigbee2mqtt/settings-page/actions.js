import { RequestStatus } from '../../../../../utils/consts';

const actions = store => {
  const actions = {
    async getUsbPorts(state) {
      store.setState({
        getZigbee2mqttUsbPortStatus: RequestStatus.Getting
      });
      try {
        const usbPorts = await state.httpClient.get('/api/v1/service/usb/port');
        store.setState({
          usbPorts,
          getZigbee2mqttUsbPortStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getZigbee2mqttUsbPortStatus: RequestStatus.Error
        });
      }
    },
    async getCurrentZigbee2mqttDriverPath(state) {
      store.setState({
        getCurrentZigbee2mqttDriverPathStatus: RequestStatus.Getting
      });
      try {
        const zigbee2mqttDriverPath = await state.httpClient.get(
          '/api/v1/service/zigbee2mqtt/variable/ZIGBEE2MQTT_DRIVER_PATH'
        );
        store.setState({
          zigbee2mqttDriverPath: zigbee2mqttDriverPath.value,
          getCurrentZigbee2mqttDriverPathStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentZigbee2mqttDriverPathStatus: RequestStatus.Error
        });
      }
    },
    updateZigbee2mqttDriverPath(state, e) {
      store.setState({
        zigbee2mqttDriverPath: e.target.value
      });
    },
    async saveDriverPath(state) {
      store.setState({
        zigbee2mqttSaveStatus: RequestStatus.Getting,
        zigbee2mqttSavingInProgress: true
      });
      try {
        // If DriverPath contains '---------' then we remove ZIGBEE2MQTT_DRIVER_PATH variable
        let zigbee2MqttDriverPath = '';
        if (state.zigbee2mqttDriverPath.indexOf('/dev/') !== -1) {
          zigbee2MqttDriverPath = state.zigbee2mqttDriverPath;
        }
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/variable/ZIGBEE2MQTT_DRIVER_PATH', {
          value: zigbee2MqttDriverPath
        });
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/connect');
        const zigbee2mqttStatus = await state.httpClient.get('/api/v1/service/zigbee2mqtt/status');
        store.setState({
          zigbee2mqttStatus,
          zigbee2mqttSaveStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zigbee2mqttSaveStatus: RequestStatus.Error
        });
      }
      store.setState({
        zigbee2mqttSavingInProgress: false
      });
    },
    async getStatus(state) {
      store.setState({
        zigbee2mqttGetStatusStatus: RequestStatus.Getting
      });
      try {
        const zigbee2mqttStatus = await state.httpClient.get('/api/v1/service/zigbee2mqtt/status');
        store.setState({
          zigbee2mqttStatus,
          zigbee2mqttGetStatusStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zigbee2mqttGetStatusStatus: RequestStatus.Error
        });
      }
    }
  };

  return actions;
};

export default actions;
