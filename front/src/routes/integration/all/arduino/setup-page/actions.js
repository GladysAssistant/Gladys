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
    async getCurrentArduinoModel(state) {
      store.setState({
        getCurrentArduinoModelStatus: RequestStatus.Getting
      });
      try {
        const arduinoModel = await state.httpClient.get('/api/v1/service/arduino/variable/ARDUINO_MODEL');
        store.setState({
          arduinoModel: arduinoModel.value,
          getCurrentArduinoModelStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentArduinoModelStatus: RequestStatus.Error
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
    updateArduinoModel(state, e) {
      store.setState({
        arduinoModel: e.target.value
      });
    },
    getModels(state){
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
    async saveModel(state) {
      store.setState({
        setArduinoModel: RequestStatus.Getting,
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_MODEL', {
          value: state.arduinoModel
        });
        store.setState({
          setArduinoModel: RequestStatus.Success,
        });
      } catch (e) {
        store.setState({
          setArduinoModel: RequestStatus.Error
        });
      }
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
    }
  };

  return actions;
};

export default actions;
