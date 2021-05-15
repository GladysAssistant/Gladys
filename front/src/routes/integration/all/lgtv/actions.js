import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import createActionsIntegration from '../../../../actions/integration';
import UpdateDevice from '../../../../components/device/UpdateDevice';
import createActionsHouse from '../../../../actions/house';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const houseActions = createActionsHouse(store);
  const actions = {
    async getLGTVDevices(state) {
      store.setState({
        getLGTVDevicesStatus: RequestStatus.Getting
      });
      try {
        const lgtvDevices = await state.httpClient.get('/api/v1/service/lgtv/device');

        store.setState({
          lgtvDevices,
          getLGTVDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getLGTVDevicesStatus: RequestStatus.Error
        });
      }
    },
    async scan(state) {
      store.setState({
        scanLGTVDevicesStatus: RequestStatus.Getting
      });
      try {
        const allScannedDevices = await state.httpClient.post('/api/v1/service/lgtv/scan');
        const existingDeviceIDs = state.lgtvDevices.map(device => device.external_id);

        const scannedDevices = allScannedDevices.filter(device => !existingDeviceIDs.includes(device.deviceExternalID));

        store.setState({
          scannedDevices,
          scanLGTVDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          scanLGTVDevicesStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceProperty(state, device, property, value) {
      const index = state.lgtvDevices.findIndex(haystack => haystack.id === device.id);
      const newState = update(state, {
        lgtvDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },
    async createDevice(state, lgDevice) {
      const createdDevice = await state.httpClient.post('/api/v1/service/lgtv/device', lgDevice);
      const lgtvDevices = update(state.lgtvDevices, {
        $push: [createdDevice]
      });

      store.setState({
        lgtvDevices,
        scannedDevices: []
      });
    },

    async updateDevice(state, device) {
      console.log(device);
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const index = state.lgtvDevices.findIndex(haystack => haystack.id === device.id);
      const newState = update(state, {
        lgtvDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async deleteDevice(state, device) {
      console.log(device);
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);

      const index = state.lgtvDevices.findIndex(haystack => haystack.id === device.id);

      const newState = update(state, {
        lgtvDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    }
  };

  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
