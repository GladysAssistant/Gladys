import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import debounce from 'debounce';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import createActionsIntegration from '../../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getMerossDevices(state) {
      store.setState({
        getMerossStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getMerossOrderDir || 'asc'
        };
        if (state.merossSearch && state.merossSearch.length) {
          options.search = state.merossSearch;
        }
        const merossDevices = await state.httpClient.get('/api/v1/service/meross/device', options);

        // find camera url
        merossDevices.forEach(device => {
          const deviceUrlParam = device.params.find(param => param.name === 'DEVICE_URL');
          if (deviceUrlParam) {
            device.deviceUrl = deviceUrlParam;
          }
        });

        console.log(merossDevices);

        store.setState({
          merossDevices,
          getMerossStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getMerossStatus: RequestStatus.Error
          //getMerossStatus: e.message
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
    async createOrUpdateDevice(state, index) {
      const device = await state.httpClient.post(`/api/v1/device`, state.merossDevices[index]);
      const merossDevices = update(state.merossDevices, {
        [index]: {
          $set: device
        }
      });
      store.setState({
        merossDevices
      });
    },
    async addDevice(state) {
      const uniqueId = uuid.v4();
      await integrationActions.getIntegrationByName(state, 'meross');
      const merossDevices = update(state.merossDevices, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: false,
            poll_frequency: null,
            external_id: uniqueId,
            service_id: store.getState().currentIntegration.id,
            deviceUrl: {
              name: 'DEVICE_URL',
              value: null
            },
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
                max: 0
              }
            ],
            params: [
              {
                name: 'DEVICE_URL',
                value: null
              }
            ]
          }
        ]
      });

      store.setState({
        merossDevices
      });
      console.log(store);
    },
    updateDeviceField(state, index, field, value) {
      const merossDevices = update(state.merossDevices, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        merossDevices
      });
    },
    updateDeviceUrl(state, index, value) {
      const trimmedValue = value && value.trim ? value.trim() : value;
      let deviceUrlParamIndex = state.merossDevices[index].params.findIndex(param => param.name === 'DEVICE_URL');
      const merossDevices = update(state.merossDevices, {
        [index]: {
          deviceUrl: {
            value: {
              $set: trimmedValue
            }
          },
          params: {
            [deviceUrlParamIndex]: {
              value: {
                $set: trimmedValue
              }
            }
          }
        }
      });
      store.setState({
        merossDevices
      });
    },
    async saveDevice(state, index) {
      const device = state.merossDevices[index];
      device.features[0].name = device.name;
      const newDevice = await state.httpClient.post(`/api/v1/device`, device);
      const merossDevices = update(state.merossDevices, {
        [index]: {
          $set: newDevice
        }
      });
      store.setState({
        merossDevices
      });
    },
    async deleteDevice(state, index) {
      const device = state.merossDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const merossDevices = update(state.merossDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        merossDevices
      });
    },
    async search(state, e) {
      store.setState({
        merossSearch: e.target.value
      });
      await actions.getMerossDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getMerossOrderDir: e.target.value
      });
      await actions.getMerossDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
