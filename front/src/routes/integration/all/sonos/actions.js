import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import debounce from 'debounce';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getSonosDevices(state, take, skip) {
      store.setState({
        getSonosDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getSonosOrderDir || 'asc',
          take,
          skip
        };
        if (state.sonosSearch && state.sonosSearch.length) {
          options.search = state.sonosSearch;
        }
        const sonosDevicesReceived = await state.httpClient.get('/api/v1/service/sonos/device', options);
        // find camera url
        sonosDevicesReceived.forEach(sonosDevice => {
          const spotifyRegion = sonosDevice.params.find(param => param.name === 'SPOTIFY_REGION');
          if (spotifyRegion) {
            sonosDevice.spotifyRegion = spotifyRegion;
          }
        });
        let sonosDevices;
        if (skip === 0) {
          sonosDevices = sonosDevicesReceived;
        } else {
          sonosDevices = update(state.sonosDevices, {
            $push: sonosDevicesReceived
          });
        }
        store.setState({
          sonosDevices,
          getSonosDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getSonosDevicesStatus: RequestStatus.Error
        });
      }
    },
    async scan(state) {
      store.setState({
        scanSonosDevicesStatus: RequestStatus.Getting
      });
      try {
        const sonosDevicesDetected = await state.httpClient.get(`/api/v1/service/sonos/device/live`);
        store.setState({
          sonosDevicesDetected,
          scanSonosDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          scanSonosDevicesStatus: RequestStatus.Error
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
    addSonosDevice(state) {
      const uniqueId = uuid.v4();
      const sonosDevices = update(state.sonosDevices, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: false,
            poll_frequency: null,
            external_id: null,
            service_id: state.currentIntegration.id,
            spotifyRegion: {
              name: 'SPOTIFY_REGION',
              value: null
            },
            features: [
              {
                name: null,
                selector: null,
                external_id: uniqueId,
                category: DEVICE_FEATURE_CATEGORIES.MUSIC,
                type: DEVICE_FEATURE_TYPES.MUSIC.MUSIC,
                read_only: false,
                keep_history: false,
                has_feedback: false,
                min: 0,
                max: 0
              }
            ],
            params: [
              {
                name: 'SPOTIFY_REGION',
                value: null
              }
            ]
          }
        ]
      });
      store.setState({
        sonosDevices
      });
      actions.scan(store.getState());
    },
    updateDeviceField(state, index, field, value) {
      const sonosDevices = update(state.sonosDevices, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        sonosDevices
      });
    },
    updateDeviceSpotifyRegion(state, index, value) {
      const trimmedValue = value && value.trim ? value.trim() : value;
      let spotifyRegionIndex = state.sonosDevices[index].params.findIndex(param => param.name === 'SPOTIFY_REGION');
      const sonosDevices = update(state.sonosDevices, {
        [index]: {
          spotifyRegion: {
            value: {
              $set: trimmedValue
            }
          },
          params: {
            [spotifyRegionIndex]: {
              value: {
                $set: trimmedValue
              }
            }
          }
        }
      });
      store.setState({
        sonosDevices
      });
    },
    async saveDevice(state, index) {
      const sonosDevice = state.sonosDevices[index];
      await state.httpClient.post(`/api/v1/device`, sonosDevice);
    },
    async deleteDevice(state, index) {
      const device = state.sonosDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const sonosDevices = update(state.sonosDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        sonosDevices
      });
    },
    async testConnection(state, index) {},
    async search(state, e) {
      store.setState({
        sonosSearch: e.target.value
      });
      await actions.getSonosDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getSonosOrderDir: e.target.value
      });
      await actions.getSonosDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
