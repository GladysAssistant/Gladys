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
  }
});

export default actions;
