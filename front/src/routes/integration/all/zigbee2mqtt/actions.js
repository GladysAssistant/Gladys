import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import debounce from 'debounce';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getZigbee2mqttDevices(state, take, skip) {
      store.setState({
        getZigbee2mqttStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getZigbee2mqttOrderDir || 'asc',
          take,
          skip
        };
        if (state.zigbee2mqttSearch && state.zigbee2mqttSearch.length) {
          options.search = state.zigbee2mqttSearch;
        }

        // TODO how to get MQTT Zigbee2mqtt device ? Using device param ?
        let zigbee2mqttsReceived = await state.httpClient.get('/api/v1/service/mqtt/device', options);
        zigbee2mqttsReceived = zigbee2mqttsReceived
          .filter(device => {
            return device.params.find(p => p.name === 'subService' && p.value === 'zigbee2mqtt');
          })
          .map(device => {
            const model = device.params.find(p => p.name === 'model');
            if (model) {
              device.model = model.value;
            }
            return device;
          });

        let zigbee2mqttDevices;
        if (skip === 0) {
          zigbee2mqttDevices = zigbee2mqttsReceived;
        } else {
          zigbee2mqttDevices = update(state.zigbee2mqttDevices, {
            $push: zigbee2mqttsReceived
          });
        }
        store.setState({
          zigbee2mqttDevices,
          getZigbee2mqttStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          philipsHueGetBridgesStatus: RequestStatus.Error,
          getZigbee2mqttStatus: e.message
        });
      }
    },
    addDevice(state) {
      const uniqueId = uuid.v4();
      const zigbee2mqttDevices = update(state.zigbee2mqttDevices, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: false,
            service_id: state.currentIntegration.id,
            params: [
              {
                name: 'subService',
                value: 'zigbee2mqtt'
              }
            ]
          }
        ]
      });
      store.setState({
        zigbee2mqttDevices
      });
    },
    updateDeviceField(state, index, field, value) {
      const zigbee2mqttDevices = update(state.zigbee2mqttDevices, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        zigbee2mqttDevices
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
      const device = state.zigbee2mqttDevices[index];
      device.features.forEach(feature => {
        feature.name = device.name + ' - ' + feature.type;
        feature.external_id = device.external_id + ':' + feature.type;
      });
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      savedDevice.model = device.model;
      const zigbee2mqttDevices = update(state.zigbee2mqttDevices, {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        zigbee2mqttDevices
      });
    },
    async deleteDevice(state, index) {
      const device = state.zigbee2mqttDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const zigbee2mqttDevices = update(state.zigbee2mqttDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        zigbee2mqttDevices
      });
    },
    async search(state, e) {
      store.setState({
        zigbee2mqttSearch: e.target.value
      });
      await actions.getZigbee2mqttDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getZigbee2mqttOrderDir: e.target.value
      });
      await actions.getZigbee2mqttDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
