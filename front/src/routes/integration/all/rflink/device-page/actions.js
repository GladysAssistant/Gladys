import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getRflinkDevices(state, take, skip) {
      store.setState({
        getRflinkDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'rflink',
          order_dir: state.getRflinkDeviceOrderDir || 'asc',
          take,
          skip
        };
        if (state.rflinkDeviceSearch && state.rflinkDeviceSearch.length) {
          options.search = state.rflinkDeviceSearch;
        }
        const rflinkDevicesReceived = await state.httpClient.get('/api/v1/service/rflink/device', options);
        let rflinkDevices;
        if (skip === 0) {
          rflinkDevices = rflinkDevicesReceived;
        } else {
          rflinkDevices = update(state.rflinkDevices, {
            $push: rflinkDevicesReceived
          });
        }
        store.setState({
          rflinkDevices,
          getRflinkDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getRflinkDevicesStatus: RequestStatus.Error
        });
      }
    },
    addDevice(state) {
      const uniqueId = uuid.v4();
      const rflinkDevices = update(state.rflinkDevices, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: false,
            service_id: state.currentIntegration.id,
            external_id: 'rflink:'
          }
        ]
      });
      store.setState({
        rflinkDevices
      });
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        rflinkDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        rflinkDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        rflinkDeviceSearch: e.target.value
      });
      await actions.getRflinkDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getRflinkDeviceOrderDir: e.target.value
      });
      await actions.getRflinkDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
