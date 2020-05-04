import { RequestStatus } from '../../../../../utils/consts';

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
    async getCurrentArduinoPath(state) {
      store.setState({
        getCurrentArduinoPathStatus: RequestStatus.Getting
      });
      try {
        const arduinoPath = await state.httpClient.get('/api/v1/service/arduino/variable/ARDUINO_PATH');
        store.setState({
          arduinoPath: arduinoPath.value,
          getCurrentArduinoPathStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentArduinoPathStatus: RequestStatus.Error
        });
      }
    },
    async checkConnected(state) {
      store.setState({
        getCurrentArduinoPathStatus: RequestStatus.Getting
      });
      try {
        await actions.getUsbPorts(store.getState());
        var connected = false;
        await actions.getCurrentArduinoPath(store.getState());
        const arduinoPath = store.getState().arduinoPath;

        if (arduinoPath !== "---------") {
          store.getState().usbPorts.forEach(element => {
            if (element.comPath === arduinoPath) {
              connected = true;
            }
          });

          if (connected) {
            store.setState({
              arduinoConnected: true
            });
          } else {
            store.setState({
              arduinoConnected: false
            });
          }
        } else {
          store.setState({
            arduinoConnected: false
          });
        }
      } catch (e) {
        store.setState({
          getCurrentArduinoPathStatus: RequestStatus.Error
        });
      }
    },
    updateArduinoPath(state, e) {
      store.setState({
        arduinoPath: e.target.value
      });
    },
    getModel(state){
      store.setState({
        arduinoModels: [
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
      } catch (e) {
        store.setState({
          connectArduinoStatus: RequestStatus.Error
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
