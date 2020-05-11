import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';
import uuid from 'uuid';
import {
  DEVICE_POLL_FREQUENCIES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} from '../../../../../../../server/utils/constants';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getKodiDevices(state) {
      store.setState({
        getKodiDevicesStatus: RequestStatus.Getting
      });

      try {
        const options = {
          service: 'kodi',
          order_dir: state.getKodiDeviceOrderDir || 'asc',
          take: 10000,
          skip: 0
        };
        if (state.kodiDeviceSearch && state.kodiDeviceSearch.length) {
          options.search = state.kodiDeviceSearch;
        }

        const kodiDevicesReceived = await state.httpClient.get('/api/v1/service/kodi/device', options);
        const kodiDevices = kodiDevicesReceived;

        const kodiDevicesMap = new Map();
        kodiDevices.forEach(device => kodiDevicesMap.set(device.external_id, device));
        store.setState({
          kodiDevices,
          kodiDevicesMap,
          getKodiDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getKodiDevicesStatus: RequestStatus.Error
        });
      }
    },
    async changeOrderDir(state, e) {
      store.setState({
        getKodiOrderDir: e.target.value
      });
      await actions.getKodiDevices(store.getState(), 20, 0);
    },
    async saveDevice(state, device) {
      device.selector = device.external_id;
      await state.httpClient.post('/api/v1/device', device);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        kodiDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async addKodi(state) {
      const uniqueId = uuid.v4();
      let defaultValue = false;
      if (state.kodiDevices && state.kodiDevices.length === 0) {
        defaultValue = true;
      }
      const kodiDevices = update(state.kodiDevices, {
        $push: [
          {
            id: uniqueId,
            name: null,
            room_id: null,
            service_id: state.currentIntegration.id,
            should_poll: true,
            poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
            features: [
              {
                name: 'PING_STATUS',
                selector: 'kodi-ping',
                external_id: uniqueId,
                category: DEVICE_FEATURE_CATEGORIES.KODI,
                type: DEVICE_FEATURE_TYPES.KODI.PING,
                read_only: false,
                keep_history: false,
                has_feedback: false,
                min: 0,
                max: 0
              }
            ],
            params: [
              {
                name: 'default',
                value: defaultValue
              },
              {
                name: 'host',
                value: null
              },
              {
                name: 'port',
                value: null
              }
            ]
          }
        ]
      });
      store.setState({
        kodiDevices
      });
    },
    async testConnection(state, deviceIndex) {
      const device = state.kodiDevices[deviceIndex];

      await state.httpClient.post('/api/v1/service/kodi/test', device);

      store.setState({
        device
      });
    },
    updateDeviceProperty(state, deviceIndex, property, value) {
      const newState = update(state, {
        kodiDevices: {
          [deviceIndex]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },
    updateParamProperty(state, deviceIndex, paramIndex, paramName, value) {
      if (paramName === 'default') {
        state.kodiDevices.forEach(function(device, index) {
          device.params.forEach((item, i) => {
            if (item.name === 'default') {
              if (index !== deviceIndex) {
                item.value = false;
                const newState = update(item, {
                  kodiDevices: {
                    [deviceIndex]: {
                      params: {
                        [paramIndex]: {
                          value: {
                            $set: 'false'
                          }
                        }
                      }
                    }
                  }
                });
                store.setState(newState);
              } else {
                item.value = value;
                const newState = update(state, {
                  kodiDevices: {
                    [deviceIndex]: {
                      params: {
                        [paramIndex]: {
                          value: {
                            $set: '' + value
                          }
                        }
                      }
                    }
                  }
                });
                store.setState(newState);
              }
            }
          });
        });
      } else {
        const newState = update(state, {
          kodiDevices: {
            [deviceIndex]: {
              params: {
                [paramIndex]: {
                  value: {
                    $set: value
                  }
                }
              }
            }
          }
        });
        store.setState(newState);
      }
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
