import { PhilipsHueGetBridgesStatus } from '../../../../utils/consts';

const actions = store => ({
  async getBridges(state) {
    store.setState({
      philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Getting
    });
    try {
      const bridges = await state.httpClient.get('/api/v1/service/philips-hue/bridge');
      store.setState({
        bridges,
        philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Success
      });
    } catch (e) {
      store.setState({
        philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Error,
        philipsHueGetBridgeError: e.message
      });
    }
  },
  async discoverBridge(state) {
    store.setState({
      philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Getting
    });
    // FIXME How to get current bridge (from click)
    const bridge = state.bridges[0];
    bridge.name = 'Bridge1';
    try {
      const bridges = await state.httpClient.post('/api/v1/service/philips-hue/bridge/discover', {
        name: bridge.name,
        ipaddress: bridge.ipaddress
      });
      store.setState({
        bridges,
        philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Success
      });
    } catch (e) {
      store.setState({
        philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Error,
        philipsHueGetBridgeError: e.response.data.error.message
      });
    }
  },
  async configureBridge(state, event) {
    event.preventDefault();
    // FIXME How to get current bridge (from form)
    const bridge = state.bridges[0];
    store.setState({
      philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Getting
    });
    try {
      await state.httpClient.post('/api/v1/service/philips-hue/bridge/configure', {
        name: bridge.name,
        ipaddress: bridge.ipaddress,
        userId: bridge.userId,
        lights: bridge.lights
      });
      store.setState({
        philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Success
      });
    } catch (e) {
      store.setState({
        philipsHueGetBridgesStatus: PhilipsHueGetBridgesStatus.Error,
        philipsHueGetBridgeError: e.message
      });
    }
  }
});

export default actions;
