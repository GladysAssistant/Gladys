import createActionsService from '../actions';
import { RequestStatus } from '../../../../../utils/consts';

const actions = store => {
  const serviceActions = createActionsService(store);
  const actions = {
    async getCurrentZwave2mqttUrl(state) {
      store.setState({
        getCurrentZwave2mqttUrlStatus: RequestStatus.Getting
      });
      try {
        const zwave2mqttUrl = await state.httpClient.get('/api/v1/service/zwave2mqtt/variable/ZWAVE2MQTT_URL');
        store.setState({
          zwave2mqttUrl: zwave2mqttUrl.value,
          getCurrentZwave2mqttUrlStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentZwave2mqttUrlStatus: RequestStatus.Error
        });
      }
    },
    updateZwave2mqttUrl(state, e) {
      store.setState({
        zwave2mqttUrl: e.target.value
      });
    },
    async saveZwave2mqttUrl(state) {
      store.setState({
        zwave2mqttSaveStatus: RequestStatus.Getting,
        zwave2mqttSavingInProgress: true
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave2mqtt/variable/ZWAVE2MQTT_URL', {
          value: state.zwave2mqttUrl
        });
        await state.httpClient.post('/api/v1/service/zwave2mqtt/connect');
        const zwave2mqttStatus = await state.httpClient.get('/api/v1/service/zwave2mqtt/status');
        store.setState({
          zwave2mqttStatus,
          zwave2mqttSaveStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwave2mqttSaveStatus: RequestStatus.Error
        });
      }
      store.setState({
        zwave2mqttSavingInProgress: false
      });
    }
  };

  return Object.assign({}, actions, serviceActions);
};

export default actions;
