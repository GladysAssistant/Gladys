import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../actions/house';
import createActionsIntegration from '../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {

    async getDevices(state) {

      console.debug("calling /api/v1/service/magic-devices/devices");

      store.setState({
        getDevicesStatus: RequestStatus.Getting
      });

      try {
        const options = {
          service: 'magic-devices',
          order_dir: state.getDeviceOrderDir || 'asc',
          take: 10000,
          skip: 0
        };

        if (state.deviceSearch && state.deviceSearch.length) {
          options.search = state.deviceSearch;
        }

        const devices = await state.httpClient.get('/api/v1/service/magic-devices/devices', options);
        const devicesMap = new Map();
        devices.forEach(device => {
          devicesMap.set(device.external_id, device);
        });

        store.setState({
          devices,
          devicesMap,
          getDevicesStatus: RequestStatus.Success
        });

        console.log(devices)

      } catch (e) {
        store.setState({
          getDevicesStatus: RequestStatus.Error
        });
      }
    },

    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },

    async deleteDevice(state, device, index) {
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        devices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    
    async setValue(state, deviceFeature, value) {

      console.log("deviceFeature:", deviceFeature)
      console.log("value:", value)



      await state.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, {
        value
      });
    },

    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        devices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },

    async search(state, e) {
      store.setState({
        deviceSearch: e.target.value
      });
      await actions.getDevices(store.getState());
    },

    async changeOrderDir(state, e) {
      store.setState({
        getDeviceOrderDir: e.target.value
      });
      await actions.getDevices(store.getState());
    }
  };
  
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
