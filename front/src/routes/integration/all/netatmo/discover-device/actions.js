import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getNetatmoDeviceSensors(state) {
      store.setState({
        getNetatmoDeviceSensorsStatus: RequestStatus.Getting
      });
      try {
        const netatmoSensorsDiscover = await state.httpClient.get('/api/v1/service/netatmo/sensor');
        const netatmoDevice = await state.httpClient.get('/api/v1/service/netatmo/device');
        const netatmoSensors = [];

        let keyNetatmoSensorsDiscover = 0;
        netatmoSensorsDiscover.forEach(sensor => {
          const indexNetatmoSensorsFiltered = netatmoDevice.findIndex(
            element => element.external_id === sensor.external_id
          );
          if (indexNetatmoSensorsFiltered !== -1) {
            netatmoSensorsDiscover[keyNetatmoSensorsDiscover].not_handled = true;
          } else {
            netatmoSensorsDiscover[keyNetatmoSensorsDiscover].not_handled = false;
            netatmoSensors[netatmoSensors.length] = netatmoSensorsDiscover[keyNetatmoSensorsDiscover];
          }
          keyNetatmoSensorsDiscover = keyNetatmoSensorsDiscover + 1;
        });
        keyNetatmoSensorsDiscover = 0;
        netatmoSensorsDiscover.forEach(sensor => {
          const indexNetatmoSensorsFiltered = netatmoSensors.findIndex(
            element => element.external_id === sensor.external_id
          );
          if (indexNetatmoSensorsFiltered === -1) {
            netatmoSensors[netatmoSensors.length] = netatmoSensorsDiscover[keyNetatmoSensorsDiscover];
          } else {
          }
          keyNetatmoSensorsDiscover = keyNetatmoSensorsDiscover + 1;
        });

        store.setState({
          netatmoSensors,
          getNetatmoDeviceSensorsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getNetatmoDeviceSensorsStatus: RequestStatus.Error
        });
      }
    },
    async createDevice(state, device, sensorIndex) {
      await state.httpClient.post('/api/v1/device', device);
      const newState = update(store.getState(), {
        netatmoSensors: {
          $splice: [[sensorIndex, 1]]
        }
      });
      store.setState(newState);
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        netatmoDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        netatmoDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    }
  };
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
