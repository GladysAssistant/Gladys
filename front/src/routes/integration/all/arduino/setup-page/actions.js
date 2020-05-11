import { RequestStatus } from '../../../../../utils/consts';
import uuid from 'uuid';
import update from 'immutability-helper';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

const actions = (store) => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getArduinoDevices(state) {
      store.setState({
        getArduinoDevicesStatus: RequestStatus.Getting,
      });
      try {
        const options = {
          order_dir: state.getArduinoDevicesOrderDir || 'asc',
        };
        if (state.arduinoDevicesSearch && state.arduinoDevicesSearch.length) {
          options.search = state.arduinoDevicesSearch;
        }
        const list = await state.httpClient.get('/api/v1/service/arduino/device', options);

        var arduinoDevices = [];
        list.forEach((element) => {
          if (element.model === 'card') {
            arduinoDevices.push(element);
          }
        });

        store.setState({
          arduinoDevices,
          getArduinoDevicesStatus: RequestStatus.Success,
        });
      } catch (e) {
        store.setState({
          getArduinoDevices: RequestStatus.Error,
        });
      }
    },
    async getUsbPorts(state) {
      store.setState({
        getArduinoUsbPortStatus: RequestStatus.Getting,
      });
      try {
        const usbPorts = await state.httpClient.get('/api/v1/service/usb/port');
        store.setState({
          usbPorts,
          getArduinoUsbPortStatus: RequestStatus.Success,
        });
      } catch (e) {
        store.setState({
          getArduinoUsbPortStatus: RequestStatus.Error,
        });
      }
    },
    getModels(state) {
      store.setState({
        arduinoModelsList: [
          'Arduino Yun',
          'Arduino Uno',
          'Arduino Duemilanove or Diecimila',
          'Arduino Nano',
          'Arduino Mega or Mega 2560',
          'Arduino Leonardo',
          'Arduino Leonardo ETH',
          'Arduino Micro',
          'Arduino Esplora',
          'Arduino Mini',
          'Arduino Ethernet',
          'Arduino Fio',
          'Arduino BT',
          'LilyPad Arduino USB',
          'LilyPad Arduino',
          'Arduino Pro or Pro Mini',
          'Arduino NG or older',
          'Arduino Robot Control',
          'Arduino Robot Motor',
          'Arduino Gemma',
          'Arduino Circuit Playground',
          'Arduino Yun Mini',
          'Arduino Industrial 101',
          'Linino One',
          'Arduino Uno WiFi',
        ],
      });
    },
    getManufacturers(state) {
      store.setState({
        arduinoManufacturersList: ['arduino', '1a86', 'qinheng', 'silicon_labs'],
      });
    },
    async addDevice(state) {
      const uniqueId = uuid.v4();
      await integrationActions.getIntegrationByName(state, 'arduino');
      const arduinoDevices = update(state.arduinoDevices, {
        $push: [
          {
            name: null,
            selector: null,
            external_id: uniqueId,
            service_id: store.getState().currentIntegration.id,
            room_id: null,
            model: 'card',
            params: [
              {
                name: 'ARDUINO_PATH',
                value: null,
              },
              {
                name: 'ARDUINO_MODEL',
                value: null,
              },
              {
                name: 'ARDUINO_MANUFACTURER',
                value: null,
              },
            ],
          },
        ],
      });
      store.setState({
        arduinoDevices,
      });
    },
    updateArduinoPath(state, index, value) {
      let arduinoPathIndex = state.arduinoDevices[index].params.findIndex((param) => param.name === 'ARDUINO_PATH');
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          params: {
            [arduinoPathIndex]: {
              value: {
                $set: value,
              },
            },
          },
        },
      });
      store.setState({
        arduinoDevices,
      });
    },
    updateArduinoManufacturer(state, index, value) {
      let arduinoManufacturerIndex = state.arduinoDevices[index].params.findIndex((param) => param.name === 'ARDUINO_MANUFACTURER');
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          params: {
            [arduinoManufacturerIndex]: {
              value: {
                $set: value,
              },
            },
          },
        },
      });
      store.setState({
        arduinoDevices,
      });
    },
    updateArduinoModel(state, index, value) {
      let arduinoModelIndex = state.arduinoDevices[index].params.findIndex((param) => param.name === 'ARDUINO_MODEL');
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          params: {
            [arduinoModelIndex]: {
              value: {
                $set: value,
              },
            },
          },
        },
      });
      store.setState({
        arduinoDevices,
      });
    },
    updateArduinoName(state, index, value) {
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          ['name']: {
            $set: value,
          },
        },
      });
      store.setState({
        arduinoDevices,
      });
    },
    async saveDevice(state, index) {
      const arduino = state.arduinoDevices[index];
      await state.httpClient.post(`/api/v1/device`, arduino);
    },
    async deleteDevice(state, index) {
      const device = state.arduinoDevices[index];
      if (device.createdAt) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const arduinoDevices = update(state.arduinoDevices, {
        $splice: [[index, 1]],
      });
      store.setState({
        arduinoDevices,
      });
    },
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
};

export default actions;
