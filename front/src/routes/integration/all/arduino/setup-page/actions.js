import { RequestStatus } from '../../../../../utils/consts';
import uuid from 'uuid';

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
            id: uniqueId,
            name: null,
            selector: null,
            external_id: uniqueId,
            service_id: store.getState().currentIntegration.id,
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
    async saveArduinoDevice(state) {
      const uniqueId = uuid.v4();
      store.setState({
        connectArduinoStatus: RequestStatus.Getting,
        arduinoDriverFailed: false
      });
      try {
        await state.httpClient.post('/api/v1/device', {
          id: uniqueId,
          name: 'test',
          external_id: uniqueId,
          service_id: store.getState().currentIntegration.id,
          model: state.arduinoModel,
          room_id: null,
          selector: arduinoPath
        });
      } catch (e) {
        store.setState({
          connectArduinoStatus: RequestStatus.Error
        });
      }
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
