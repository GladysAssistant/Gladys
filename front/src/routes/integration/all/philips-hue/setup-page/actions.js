import update from 'immutability-helper';
import get from 'get-value';
import { RequestStatus } from '../../../../../utils/consts';
import { BRIDGE_MODEL } from '../../../../../../../server/services/philips-hue/lib/utils/consts';

const actions = store => ({
  async getBridges(state) {
    store.setState({
      philipsHueGetBridgesStatus: RequestStatus.Getting
    });
    try {
      const philipsHueBridges = await state.httpClient.get('/api/v1/service/philips-hue/bridge');
      store.setState({
        philipsHueBridges,
        philipsHueGetBridgesStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        philipsHueGetBridgesStatus: RequestStatus.Error,
        philipsHueGetBridgeError: e.message
      });
    }
  },
  async getPhilipsHueDevices(state) {
    store.setState({
      philipsHueGetDevicesStatus: RequestStatus.Getting
    });
    try {
      const philipsHueDevices = await state.httpClient.get('/api/v1/service/philips-hue/device');
      const philipsHueBridgesDevices = philipsHueDevices.filter(device => device.model === BRIDGE_MODEL);
      store.setState({
        philipsHueBridgesDevices,
        philipsHueGetDevicesStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        philipsHueGetDevicesStatus: RequestStatus.Error,
        philipsHueGetDevicesError: e.message
      });
    }
  },
  async deleteDevice(state, device, index) {
    store.setState({
      philipsHueDeleteDeviceStatus: RequestStatus.Getting
    });
    try {
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        philipsHueBridgesDevices: {
          $splice: [[index, 1]]
        },
        philipsHueDeleteDeviceStatus: {
          $set: RequestStatus.Success
        }
      });
      store.setState(newState);
    } catch (e) {
      store.setState({
        philipsHueDeleteDeviceStatus: RequestStatus.Error
      });
    }
  },
  async connectBridge(state, bridge) {
    store.setState({
      philipsHueCreateDeviceStatus: RequestStatus.Getting
    });
    try {
      const createdDevice = await state.httpClient.post('/api/v1/service/philips-hue/bridge/configure', {
        ipAddress: bridge.ipaddress
      });
      const newState = update(state, {
        philipsHueBridgesDevices: {
          $push: [createdDevice]
        },
        philipsHueCreateDeviceStatus: {
          $set: RequestStatus.Success
        }
      });
      store.setState(newState);
    } catch (e) {
      const responseMessage = get(e, 'response.data.message');
      if (responseMessage === 'BRIDGE_BUTTON_NOT_PRESSED') {
        store.setState({
          philipsHueCreateDeviceStatus: RequestStatus.PhilipsHueBridgeButtonNotPressed
        });
      } else {
        store.setState({
          philipsHueCreateDeviceStatus: RequestStatus.Error
        });
      }
    }
  }
});

export default actions;
