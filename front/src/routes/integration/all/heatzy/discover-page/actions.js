import {RequestStatus} from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsIntegration from '../../../../../actions/integration';

let scanTimer;

function actions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async discover(state) {
      store.setState({
        discoverHeatzy: true
      });
      try {
        const heatzyDiscover = await state.httpClient.get('/api/v1/service/heatzy/discover');

        scanTimer = setTimeout(function () {
          if (!heatzyDiscover) {
            store.setState( {
              discoverHeatzy: false,
              discoverHeatzyError: 'integration.heatzy.discover.noResponse'
            });
          }
        }.bind(this), 15000);
      } catch (e) {
        store.setState({
          discoverHeatzy: false,
          discoverHeatzyError: 'integration.heatzy.discover.serverNoResponse'
        });
      }
    },
    setDiscoveredDevices(state, heatzyDevices) {
      clearTimeout(scanTimer);
      store.setState({
        heatzyDevices,
        discoverHeatzy: false,
        discoverHeatzyError: null
      });
    },
    updateDeviceField(state, index, field, value) {
      const heatzyDevices = update(state.heatzyDevices, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        heatzyDevices
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
console.log('in save device');
      const device = state.heatzyDevices[index];
console.log(device);
      device.features.forEach(feature => {
        feature.name = feature.category.charAt(0).toUpperCase() + feature.category.slice(1);
      });
console.log(device);
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      savedDevice.model = device.model;
      const heatzyDevices = update(state.heatzyDevices, {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        heatzyDevices
      });
    }
  };

  return Object.assign({}, integrationActions, actions);
}

export default actions;
