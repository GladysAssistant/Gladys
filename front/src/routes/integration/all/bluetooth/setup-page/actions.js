import { RequestStatus } from '../../../../../utils/consts';
import createActionsHouse from '../../../../../actions/house';

const createActions = store => {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getStatus(state) {
      store.setState({
        bluetoothGetDriverStatus: RequestStatus.Getting
      });
      try {
        const bluetoothStatus = await state.httpClient.get('/api/v1/service/bluetooth/status');
        store.setState({
          ...bluetoothStatus,
          bluetoothGetDriverStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          bluetoothGetDriverStatus: RequestStatus.Error
        });
      }
    },
    async getPeripherals(state) {
      store.setState({
        bluetoothGetPeripheralsStatus: RequestStatus.Getting
      });
      try {
        const bluetoothPeripherals = await state.httpClient.get('/api/v1/service/bluetooth/peripheral');
        const bluetoothPeripheralUuids = Object.keys(bluetoothPeripherals);
        store.setState({
          bluetoothPeripherals,
          bluetoothPeripheralUuids,
          bluetoothGetPeripheralsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          bluetoothGetPeripheralsStatus: RequestStatus.Error
        });
      }
    },
    async scan(state) {
      store.setState({
        bluetoothScanStatus: RequestStatus.Getting
      });

      let action;
      if (state.bluetoothStatus === 'scanning') {
        action = 'off';
      } else {
        action = 'on';
      }

      try {
        const bluetoothStatus = await state.httpClient.post('/api/v1/service/bluetooth/scan', {
          scan: action
        });
        store.setState({
          ...bluetoothStatus,
          bluetoothScanStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          bluetoothScanStatus: RequestStatus.Error
        });
      }
    },
    async updateStatus(state, bluetoothStatus) {
      store.setState({
        ...bluetoothStatus
      });
    },
    async addPeripheral(state, peripheral) {
      let bluetoothPeripherals = {};
      Object.assign(bluetoothPeripherals, state.bluetoothPeripherals);
      const bluetoothPeripheralUuids = (state.bluetoothPeripheralUuids || []).slice();
      const uuid = peripheral.uuid;

      const foundPeripheral = bluetoothPeripherals[uuid];
      if (!foundPeripheral) {
        bluetoothPeripheralUuids.push(uuid);
      }

      bluetoothPeripherals[uuid] = peripheral;
      store.setState({
        bluetoothPeripherals,
        bluetoothPeripheralUuids
      });
    },
    async resetSaveStatus() {
      store.setState({
        bluetoothSaveStatus: undefined
      });
    },
    async createDevice(state, device) {
      store.setState({
        bluetoothSaveStatus: RequestStatus.Getting
      });

      const { currentIntegration, httpClient } = state;

      device.service_id = currentIntegration.id;
      device.features.forEach(feature => {
        feature.external_id = `${device.external_id}:${feature.type.replace(' ', '_')}`;
        feature.selector = feature.external_id;
      });

      try {
        await httpClient.post(`/api/v1/device`, device);
        store.setState({
          bluetoothSaveStatus: RequestStatus.Success,
          bluetoothCreatedDevice: device
        });
      } catch (e) {
        store.setState({
          bluetoothSaveStatus: RequestStatus.Error
        });
      }
    },
    async getIntegrationByName(state, name) {
      const currentIntegration = await state.httpClient.get(`/api/v1/service/${name}`);
      store.setState({
        currentIntegration
      });
    }
  };
  return Object.assign({}, actions, houseActions);
};

export default createActions;
