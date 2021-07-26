import createActionsService from '../actions';
import { RequestStatus } from '../../../../../utils/consts';
import get from 'get-value';

const createActions = store => {
  const serviceActions = createActionsService(store);
  
  const actions = {

    async startContainer(state) {
      let z2mEnabled = true;
      let error = false;

      store.setState({
        z2mEnabled,
        zwave2mqttStatus: RequestStatus.Getting
      });

      await state.httpClient.post('/api/service/zwave2mqtt/variable/ZWAVE2MQTT_ENABLED', {
        value: z2mEnabled
      });

      try {
        await state.httpClient.post('/api/service/zwave2mqtt/connect');
      } catch (e) {
        error = error | get(e, 'response.status');
      }

      if (error) {
        store.setState({
          zwave2mqttStatus: RequestStatus.Error,
          z2mEnabled: false
        });
      } else {
        store.setState({
          zwave2mqttStatus: RequestStatus.Success,
          z2mEnabled: true
        });
      }

      await this.checkStatus();
    },

    async stopContainer(state) {
      let error = false;
      try {
        await state.httpClient.post('/api/v1/service/zwave2mqtt/disconnect');
      } catch (e) {
        error = error | get(e, 'response.status');
      }

      if (error) {
        store.setState({
          zwave2mqttStatus: RequestStatus.Error
        });
      } else {
        store.setState({
          zwave2mqttStatus: RequestStatus.Success
        });
      }

      await this.checkStatus();
    }
  };

  return Object.assign({}, actions, serviceActions);
};

export default createActions;
