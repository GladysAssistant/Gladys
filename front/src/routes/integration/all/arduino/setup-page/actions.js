import { RequestStatus } from '../../../../../utils/consts';
import uuid from 'uuid';
import update from 'immutability-helper';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';
import { DEVICE_POLL_FREQUENCIES } from '../../../../../../../server/utils/constants';

const actions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getArduinoDevices(state) {
      store.setState({
        getArduinoDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getArduinoDevicesOrderDir || 'asc'
        };
        if (state.arduinoDevicesSearch && state.arduinoDevicesSearch.length) {
          options.search = state.arduinoDevicesSearch;
        }
        const list = await state.httpClient.get('/api/v1/service/arduino/device', options);

        var arduinoDevices = [];
        list.forEach(element => {
          if (element.model === 'card') {
            arduinoDevices.push(element);
          }
        });

        store.setState({
          arduinoDevices,
          getArduinoDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getArduinoDevices: RequestStatus.Error
        });
      }
    },
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
    getManufacturers(state) {
      store.setState({
        arduinoManufacturersList: ['arduino', '1a86', 'qinheng', 'silicon_labs', 'Arduino (www.arduino.cc)']
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
            should_poll: false,
            poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
            params: [
              {
                name: 'ARDUINO_PATH',
                value: null
              },
              {
                name: 'ARDUINO_MODEL',
                value: null
              },
              {
                name: 'ARDUINO_SERIAL_NUMBER',
                value: null
              },
              {
                name: 'ARDUINO_PRODUCT_ID',
                value: null
              },
              {
                name: 'ARDUINO_VENDOR_ID',
                value: null
              }
            ]
          }
        ]
      });
      store.setState({
        arduinoDevices
      });
    },
    updateArduinoPath(state, index, path, serialNumber, productId, vendorId) {
      let arduinoPathIndex = state.arduinoDevices[index].params.findIndex(param => param.name === 'ARDUINO_PATH');
      let arduinoSerialNumberIndex = state.arduinoDevices[index].params.findIndex(
        param => param.name === 'ARDUINO_SERIAL_NUMBER'
      );
      let arduinoProductIdIndex = state.arduinoDevices[index].params.findIndex(
        param => param.name === 'ARDUINO_PRODUCT_ID'
      );
      let arduinoVendorIdIndex = state.arduinoDevices[index].params.findIndex(
        param => param.name === 'ARDUINO_VENDOR_ID'
      );
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          params: {
            [arduinoPathIndex]: {
              value: {
                $set: path
              }
            },
            [arduinoSerialNumberIndex]: {
              value: {
                $set: serialNumber
              }
            },
            [arduinoProductIdIndex]: {
              value: {
                $set: productId
              }
            },
            [arduinoVendorIdIndex]: {
              value: {
                $set: vendorId
              }
            }
          }
        }
      });
      store.setState({
        arduinoDevices
      });
    },
    updateArduinoManufacturer(state, index, value) {
      let arduinoManufacturerIndex = state.arduinoDevices[index].params.findIndex(
        param => param.name === 'ARDUINO_MANUFACTURER'
      );
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          params: {
            [arduinoManufacturerIndex]: {
              value: {
                $set: value
              }
            }
          }
        }
      });
      store.setState({
        arduinoDevices
      });
    },
    updateArduinoModel(state, index, value) {
      let arduinoModelIndex = state.arduinoDevices[index].params.findIndex(param => param.name === 'ARDUINO_MODEL');
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          params: {
            [arduinoModelIndex]: {
              value: {
                $set: value
              }
            }
          }
        }
      });
      store.setState({
        arduinoDevices
      });
    },
    updateArduinoName(state, index, value) {
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          ['name']: {
            $set: value
          }
        }
      });
      store.setState({
        arduinoDevices
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
        $splice: [[index, 1]]
      });
      store.setState({
        arduinoDevices
      });
    },
    async uploadCode(state, index) {
      store.setState({
        uploadingCode: RequestStatus.Getting
      });
      try {
        const device = state.arduinoDevices[index];
        await state.httpClient.post(`/api/v1/service/arduino/setup`, device);
      } catch (e) {
        store.setState({
          uploadingCode: RequestStatus.Error
        });
      }
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
};

export default actions;
