import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';
import {
  DEVICE_SUBSERVICE,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} from '../../../../../../../server/utils/constants';

const actions = (store) => {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
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
    async getDevices(state) {
      store.setState({
        getDevicesStatus: RequestStatus.Getting,
      });
      try {
        const options = {
          order_dir: state.getDevicesOrderDir || 'asc',
        };
        if (state.devicesSearch && state.devicesSearch.length) {
          options.search = state.devicesSearch;
        }
        const list = await state.httpClient.get('/api/v1/service/arduino/device', options);

        var devices = [];
        list.forEach((element) => {
          if (element.model != 'card') {
            devices.push(element);
          }
        });

        store.setState({
          devices,
          getDevicesStatus: RequestStatus.Success,
        });
      } catch (e) {
        store.setState({
          getDevicesStatus: RequestStatus.Error,
        });
      }
    },
    async addDevice(state) {
      const uniqueId = uuid.v4();
      await integrationActions.getIntegrationByName(state, 'arduino');
      const devices = update(state.devices, {
        $push: [
          {
            name: null,
            selector: null,
            external_id: uniqueId,
            service_id: store.getState().currentIntegration.id,
            room_id: null,
            features: [
              {
                name: null,
                selector: null,
                external_id: uniqueId,
                category: DEVICE_FEATURE_CATEGORIES.SWITCH,
                type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
                read_only: false,
                keep_history: false,
                has_feedback: false,
                min: 0,
                max: 1,
              },
            ],
            params: [
              {
                name: 'DATA_PIN',
                value: null,
              },
              {
                name: 'SUBSERVICE',
                value: null,
              },
              {
                name: 'ARDUINO_LINKED',
                value: null,
              },
              {
                name: 'CODE',
                value: '0',
              },
              {
                name: 'CODE_ON',
                value: '0',
              },
              {
                name: 'CODE_OFF',
                value: '0',
              },
            ],
          },
        ],
      });
      store.setState({
        devices,
      });
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        devices: {
          [index]: {
            [property]: {
              $set: value,
            },
          },
        },
      });
      store.setState(newState);
    },
    updateName(state, index, value) {
      const devices = update(state.devices, {
        [index]: {
          ['name']: {
            $set: value,
          },
        },
      });
      store.setState({
        devices,
      });
    },
    updateDataPin(state, index, value) {
      let arduinoDataPinIndex = state.devices[index].params.findIndex((param) => param.name === 'DATA_PIN');
      const devices = update(state.devices, {
        [index]: {
          params: {
            [arduinoDataPinIndex]: {
              value: {
                $set: value,
              },
            },
          },
        },
      });
      store.setState({
        devices,
      });
    },
    updateSubservice(state, index, newValue) {
      let arduinoSubserviceIndex = state.devices[index].params.findIndex((param) => param.name === 'SUBSERVICE');
      const devices = update(state.devices, {
        [index]: {
          params: {
            [arduinoSubserviceIndex]: {
              value: {
                $set: newValue,
              },
            },
          },
        },
      });
      store.setState({
        devices,
      });
    },
    updateArduino(state, index, newValue) {
      let arduinoLinkedIndex = state.devices[index].params.findIndex((param) => param.name === 'ARDUINO_LINKED');
      const devices = update(state.devices, {
        [index]: {
          params: {
            [arduinoLinkedIndex]: {
              value: {
                $set: newValue,
              },
            },
          },
        },
      });
      store.setState({
        devices,
      });
    },
    updateCode(state, index, newValue) {
      let arduinoCodeIndex = state.devices[index].params.findIndex((param) => param.name === 'CODE');
      const devices = update(state.devices, {
        [index]: {
          params: {
            [arduinoCodeIndex]: {
              value: {
                $set: newValue,
              },
            },
          },
        },
      });
      store.setState({
        devices,
      });
    },
    updateCodeOn(state, index, newValue) {
      let arduinoCodeIndex = state.devices[index].params.findIndex((param) => param.name === 'CODE_ON');
      const devices = update(state.devices, {
        [index]: {
          params: {
            [arduinoCodeIndex]: {
              value: {
                $set: newValue,
              },
            },
          },
        },
      });
      store.setState({
        devices,
      });
    },
    updateCodeOff(state, index, newValue) {
      let arduinoCodeIndex = state.devices[index].params.findIndex((param) => param.name === 'CODE_OFF');
      const devices = update(state.devices, {
        [index]: {
          params: {
            [arduinoCodeIndex]: {
              value: {
                $set: newValue,
              },
            },
          },
        },
      });
      store.setState({
        devices,
      });
    },
    async search(state, e) {
      store.setState({
        deviceSearch: e.target.value,
      });
      await actions.getDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getDeviceOrderDir: e.target.value,
      });
      await actions.getDevices(store.getState());
    },
    async saveDevice(state, index) {
      const device = state.devices[index];
      device.features[0].name = device.name;
      await state.httpClient.post(`/api/v1/device`, device);
    },
    async deleteDevice(state, index) {
      const device = state.devices[index];
      if (device.createdAt) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const devices = update(state.devices, {
        $splice: [[index, 1]],
      });
      store.setState({
        devices,
      });
    },
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
};

export default actions;
