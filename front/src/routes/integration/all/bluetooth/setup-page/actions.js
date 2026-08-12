import update from 'immutability-helper';
import { RequestStatus } from '../../../../../utils/consts';

import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import createActionsBluetooth from '../commons/actions';

const createActions = store => {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const bluetoothActions = createActionsBluetooth(store);
  const actions = {
    async getPeripherals(state) {
      store.setState({
        bluetoothGetPeripheralsStatus: RequestStatus.Getting
      });
      try {
        const bluetoothPeripherals = await state.httpClient.get('/api/v1/service/bluetooth/peripheral');
        store.setState({
          bluetoothPeripherals,
          bluetoothGetPeripheralsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          bluetoothGetPeripheralsStatus: RequestStatus.Error
        });
      }
    },
    async addPeripheral(state, peripheral) {
      const peripheralKey = peripheral.selector;
      let bluetoothPeripherals = state.bluetoothPeripherals || [];
      const currentIndex = bluetoothPeripherals.findIndex(p => p.selector === peripheralKey);

      if (currentIndex >= 0) {
        bluetoothPeripherals = update(bluetoothPeripherals, {
          [currentIndex]: { $set: peripheral }
        });
      } else {
        bluetoothPeripherals = update(bluetoothPeripherals, {
          $push: [peripheral]
        });
      }

      store.setState({
        bluetoothPeripherals
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

      const { httpClient } = state;

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
    }
  };
  return Object.assign({}, actions, houseActions, integrationActions, bluetoothActions);
};

export default createActions;
