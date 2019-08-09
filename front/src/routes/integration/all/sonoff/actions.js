import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import debounce from 'debounce';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getSonoffDevices(state, take, skip) {
      store.setState({
        getSonoffStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getSonoffOrderDir || 'asc',
          take,
          skip
        };
        if (state.sonoffSearch && state.sonoffSearch.length) {
          options.search = state.sonoffSearch;
        }

        // TODO how to get MQTT Sonoff device ? Using device param ?
        let sonoffsReceived = await state.httpClient.get('/api/v1/service/mqtt/device', options);
        sonoffsReceived = sonoffsReceived
          .filter(device => {
            return device.params.find(p => p.name === 'subService' && p.value === 'sonoff');
          })
          .map(device => {
            const model = device.params.find(p => p.name === 'model');
            if (model) {
              device.model = model.value;
            }
            return device;
          });

        let sonoffDevices;
        if (skip === 0) {
          sonoffDevices = sonoffsReceived;
        } else {
          sonoffDevices = update(state.sonoffDevices, {
            $push: sonoffsReceived
          });
        }
        store.setState({
          sonoffDevices,
          getSonoffStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          philipsHueGetBridgesStatus: RequestStatus.Error,
          getSonoffStatus: e.message
        });
      }
    },
    addDevice(state) {
      const uniqueId = uuid.v4();
      const sonoffDevices = update(state.sonoffDevices, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: false,
            service_id: state.currentIntegration.id,
            params: [
              {
                name: 'subService',
                value: 'sonoff'
              }
            ]
          }
        ]
      });
      store.setState({
        sonoffDevices
      });
    },
    updateDeviceField(state, index, field, value) {
      const sonoffDevices = update(state.sonoffDevices, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        sonoffDevices
      });
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
    async saveDevice(state, index) {
      const device = state.sonoffDevices[index];
      device.features.forEach(feature => {
        feature.name = device.name + ' - ' + feature.type;
        feature.external_id = device.external_id + ':' + feature.type;
      });
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      savedDevice.model = device.model;
      const sonoffDevices = update(state.sonoffDevices, {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        sonoffDevices
      });
    },
    async deleteDevice(state, index) {
      const device = state.sonoffDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const sonoffDevices = update(state.sonoffDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        sonoffDevices
      });
    },
    async search(state, e) {
      store.setState({
        sonoffSearch: e.target.value
      });
      await actions.getSonoffDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getSonoffOrderDir: e.target.value
      });
      await actions.getSonoffDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
