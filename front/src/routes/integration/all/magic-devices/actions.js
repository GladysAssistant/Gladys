import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../actions/house';
import createActionsIntegration from '../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {

    async getMagicDevices(state) {

      store.setState({
        getMagicDevicesStatus: RequestStatus.Getting
      });
      
      try {
        const options = {
          service: 'magic-devices',
          order_dir: state.getMagicDeviceOrderDir || 'asc',
          take: 10000,
          skip: 0
        };

        if (state.magicDeviceSearch && state.magicDeviceSearch.length) {
          options.search = state.magicDeviceSearch;
        }

        const magicDevices = await state.httpClient.get('/api/v1/service/magic-devices/devices', options);

        const magicDevicesMap = new Map();
        magicDevices.forEach(magicDevice => {
          console.log("found " + magicDevice.external_id)
          magicDevicesMap.set(magicDevice.external_id, magicDevice);
        });

        store.setState({
          magicDevices,
          magicDevicesMap,
          getMagicDevicesStatus: RequestStatus.Success
        });
        actions.getMagicSensors(store.getState());

      } catch (e) {
        store.setState({
          getMagicDevicesStatus: RequestStatus.Error
        });
      }
    },

    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },

    async deleteDevice(state, device, index) {
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        magicDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },

    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        magicDevices: {
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
        magicDeviceSearch: e.target.value
      });
      await actions.getMagicDevices(store.getState());
    }
  
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
