import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';
import { W215_PIN_CODE } from '../../../../../../server/services/w215/lib/utils/constants';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      
     // TODO : à effacer si besoin
     let pin_code;
      try{
        pin_code= 'TEST';
      } finally {
        store.setState({
          pin_code
        });
      }
    },
    displayW215Error(state, error) {
      store.setState({
        w215Connected: false,
        connectW215Status: undefined,
        w215ConnectionError: error
      });
    },
    async getW215Devices(state) {
      store.setState({
        getW215Status: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getW215OrderDir || 'asc'
        };
        if (state.w215Search && state.w215Search.length) {
          options.search = state.w215Search;
        }

        const w215Devices = await state.httpClient.get('/api/v1/service/w215/device', options);
        // find pin code
        w215Devices.forEach(w215Device => {
          const devicePinCode = w215Device.params.find(param => param.name === W215_PIN_CODE);
          if (devicePinCode) {
            w215Device.pin_code = devicePinCode;
          }
        });
        store.setState({
          w215Devices,
          getW215Status: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getW215Status: e.message
        });
      }
    },
    async getDiscoveredW215Devices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/w215/discover');
        store.setState({
          discoveredDevices,
          loading: false,
          errorLoading: false
        });
      } catch (e) {
        store.setState({
          loading: false,
          errorLoading: true
        });
      }
    },
    async getHouses(state) {
      store.setState({
        housesGetStatus: RequestStatus.Getting
      });
      try {
        const params = {
          expand: 'rooms'
        };
        const housesWithRooms = await state.httpClient.get(`/api/v1/house`, params);
        store.setState({
          housesWithRooms,
          housesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          housesGetStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceField(state, listName, index, field, value) {
      const devices = update(state[listName], {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        [listName]: devices
      });
    },
    updateFeatureProperty(state, listName, deviceIndex, featureIndex, property, value) {
      const devices = update(state[listName], {
        [deviceIndex]: {
          features: {
            [featureIndex]: {
              [property]: {
                $set: value
              }
            }
          }
        }
      });

      store.setState({
        [listName]: devices
      });
    },
    updateParamPinCode(state, index, value) {
      const trimmedValue = value && value.trim ? value.trim() : value;
      let pinCodeParamIndex = state.w215Devices[index].params.findIndex(param => param.name === W215_PIN_CODE);
      const devices = update(state.w215Devices, {
        [index]: {
          params: {
            pin_code: {
              value: {
                $set: trimmedValue
              }
            },
            [pinCodeParamIndex]: {
              value: {
                $set: trimmedValue
              }
            }
          }
        }
      });
      store.setState({
        devices
      });
    },
    async saveDevice(state, listName, index) {
      const device = state[listName][index];
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      const devices = update(state[listName], {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        [listName]: devices
      });
    },
    async deleteDevice(state, index) {
      const device = state.w215Devices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const w215Devices = update(state.w215Devices, {
        $splice: [[index, 1]]
      });
      store.setState({
        w215Devices
      });
    },
    async search(state, e) {
      store.setState({
        w215Search: e.target.value
      });
      await actions.getW215Devices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getW215OrderDir: e.target.value
      });
      await actions.getW215Devices(store.getState());
    },
    addDiscoveredDevice(state, newDevice) {
      const existingDevices = state.discoveredDevices || [];
      const newDevices = [];

      let added = false;
      existingDevices.forEach(device => {
        if (device.external_id === newDevice.external_id) {
          newDevices.push(newDevice);
          added = true;
        } else {
          newDevices.push(device);
        }
      });

      if (!added) {
        newDevices.push(newDevice);
      }

      store.setState({
        discoveredDevices: newDevices,
        loading: false
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
