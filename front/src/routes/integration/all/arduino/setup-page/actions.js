import { RequestStatus } from '../../../../../utils/consts';
import uuid from 'uuid';
import update from 'immutability-helper';

const actions = store => {
  const actions = {
    async getUsbPorts(state) {
      store.setState({
        getArduinoUsbPortStatus: RequestStatus.Getting
      });
      try {
        const usbPorts = await state.httpClient.get('/api/v1/service/usb/port');
        store.setState({
          usbPorts,
          getArduinoUsbPortStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getArduinoUsbPortStatus: RequestStatus.Error
        });
      }
    },
    updateArduinoPath(state, e) {
      store.setState({
        arduinoPath: e.target.value
      });
    },
    updateArduinoModel(state, e) {
      store.setState({
        arduinoModel: e.target.value
      });
    },
    getModels(state) {
      store.setState({
        arduinoModelsList: [
          "Arduino Yun",
          "Arduino Uno",
          "Arduino Duemilanove or Diecimila",
          "Arduino Nano",
          "Arduino Mega or Mega 2560",
          "Arduino Leonardo",
          "Arduino Leonardo ETH",
          "Arduino Micro",
          "Arduino Esplora",
          "Arduino Mini",
          "Arduino Ethernet",
          "Arduino Fio",
          "Arduino BT",
          "LilyPad Arduino USB",
          "LilyPad Arduino",
          "Arduino Pro or Pro Mini",
          "Arduino NG or older",
          "Arduino Robot Control",
          "Arduino Robot Motor",
          "Arduino Gemma",
          "Arduino Circuit Playground",
          "Arduino Yun Mini",
          "Arduino Industrial 101",
          "Linino One",
          "Arduino Uno WiFi"
        ]
      });
    },
    getManufacturers(state) {
      store.setState({
        arduinoManufacturersList: [
          "arduino",
          "1a86",
          "qinheng",
          "silicon_labs"
        ]
      });
    },
    async addDevice(state) {
      const uniqueId = uuid.v4();
      await integrationActions.getIntegrationByName(state, 'arduino');
      const arduinoDevices = update(state.arduinoDevices, {
        $push: [
          {
            name: 'test',
            selector: 'test',
            external_id: uniqueId,
            service_id: state.currentIntegration.id,
            room_id: null,
            model: null
          }
        ]
      });
      store.setState({
        arduinoDevices
      });
    },
    async savePathAndConnect(state) {
      store.setState({
        connectArduinoStatus: RequestStatus.Getting,
        arduinoDriverFailed: false
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_PATH', {
          value: state.arduinoPath
        });
        await state.httpClient.post('/api/v1/service/arduino/connect');
        store.setState({
          connectArduinoStatus: RequestStatus.Success,
          arduinoConnectionInProgress: true,
          arduinoConnected: true
        });
        await actions.saveModel(store.getState());
      } catch (e) {
        store.setState({
          connectArduinoStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, index) {
      const arduino = state.arduinoDevices[index];
      await state.httpClient.post(`/api/v1/device`, arduino);

    },
    async deleteDevice(state, index) {
      const arduion = state.arduinoDevices[index];
      if (arduino.created_at) {
        await state.httpClient.delete(`/api/v1/device/${arduino.selector}`);
      }
      const arduino = update(state.arduinoDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        arduinoDevices
      });
    },
    async discardModel(state) {
      store.setState({
        arduinoDiscardModel: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_MODEL', {
          value: "---------"
        });
        await actions.getStatus(store.getState());
        store.setState({
          arduinoDiscardModel: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          arduinoDiscardModel: RequestStatus.Error
        });
      }
    },
    async disconnect(state) {
      store.setState({
        arduinoDisconnectStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_PATH', {
          value: "---------"
        });
        await state.httpClient.post('/api/v1/service/arduino/disconnect');
        await actions.getStatus(store.getState());
        store.setState({
          arduinoDisconnectStatus: RequestStatus.Success,
          arduinoConnected: false
        });
        await actions.discardModel(store.getState());
      } catch (e) {
        store.setState({
          arduinoDisconnectStatus: RequestStatus.Error
        });
      }
    }
  };

  return actions;
};

export default actions;
