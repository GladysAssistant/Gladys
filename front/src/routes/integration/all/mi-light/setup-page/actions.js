import update from 'immutability-helper';
import { RequestStatus } from '../../../../../utils/consts';
import { BRIDGE_MODEL } from '../../../../../../../server/services/mi-light/lib/utils/consts';

const actions = store => ({
  async getBridges(state) {
    store.setState({
      miLightGetBridgesStatus: RequestStatus.Getting
    });
    try {
      const miLightBridges = await state.httpClient.get('/api/v1/service/mi-light/bridge');
      store.setState({
        miLightBridges,
        miLightGetBridgesStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        miLightGetBridgesStatus: RequestStatus.Error,
        miLightGetBridgeError: e.message
      });
    }
  },
  async getMiLightDevices(state) {
    store.setState({
      miLightGetDevicesStatus: RequestStatus.Getting
    });
    try {
      const miLightDevices = await state.httpClient.get('/api/v1/service/mi-light/device');
      const miLightBridgesDevices = miLightDevices.filter(device => device.model === BRIDGE_MODEL);
      store.setState({
        miLightBridgesDevices,
        miLightGetDevicesStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        miLightGetDevicesStatus: RequestStatus.Error,
        miLightGetDevicesError: e.message
      });
    }
  },
  async deleteDevice(state, device, index) {
    store.setState({
      miLightDeleteDeviceStatus: RequestStatus.Getting
    });
    try {
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        miLightBridgesDevices: {
          $splice: [[index, 1]]
        },
        miLightDeleteDeviceStatus: {
          $set: RequestStatus.Success
        }
      });
      store.setState(newState);
    } catch (e) {
      store.setState({
        miLightDeleteDeviceStatus: RequestStatus.Error
      });
    }
  },
  
  async connectBridge(state, bridge) {
    store.setState({
      miLightCreateDeviceStatus: RequestStatus.Getting
    });
    try {
      const createdDevice = await state.httpClient.post('/api/v1/service/mi-light/bridge/configure', {
        mac: bridge.mac
      });
      const newState = update(state, {
        miLightBridgesDevices: {
          $push: [createdDevice]
        },
        miLightCreateDeviceStatus: {
          $set: RequestStatus.Success
        }
      });
      store.setState(newState);
    } catch (e) {
      throw e;
    }
  }
});

export default actions;
