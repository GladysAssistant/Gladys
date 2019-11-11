import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsIntegration from '../../../../../actions/integration';

let scanTimer;

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async discover(state) {
      store.setState({
        discoverZigbee2mqtt: true
      });
      try {
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/discover');
        scanTimer = setTimeout(store.setState, 5000, {
          discoverZigbee2mqtt: false,
          discoverZigbee2mqttError: 'integration.zigbee2mqtt.discover.noResponse'
        });
      } catch (e) {
        store.setState({
          discoverZigbee2mqtt: false,
          discoverZigbee2mqttError: 'integration.zigbee2mqtt.discover.serverNoResponse'
        });
      }
    },
    setDiscoveredDevices(state, zigbee2mqttDiscoveredDevices) {
      clearTimeout(scanTimer); 

      let zigbee2mqttDevices = state.zigbee2mqttDevices

      // Si des devices ont déjà été créés
      if ( zigbee2mqttDevices !== undefined && zigbee2mqttDevices.lentgh !== 0 ) {
        // On établit la liste des external_ids des devices déjà créés
        let zigbee2mqttDevicesExternalId = [];
          zigbee2mqttDevices.forEach( item => {
          zigbee2mqttDevicesExternalId.push(item.external_id);
        });

        // On filtre les nouveaux devices
        let newZigbee2mqttDevices = zigbee2mqttDiscoveredDevices.filter( function (item) {
          return !zigbee2mqttDevicesExternalId.includes(item.external_id)
        });

        // On ajoute les nouveaux devices à la liste affichée
        zigbee2mqttDevices = zigbee2mqttDevices.concat(newZigbee2mqttDevices)
      }

      store.setState({
        zigbee2mqttDevices,
        discoverZigbee2mqtt: false,
        discoverZigbee2mqttError: null
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
        feature.name = `${device.name} - ${feature.category}`;
      });
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      savedDevice.model = device.model;
      const zigbee2mqttDevices = update(state.zigbee2mqttDevices, {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        zigbee2mqttDevices
      });
    }
  };

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
