import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';

dayjs.extend(relativeTime);

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async checkStatus(state) {
      let zwave2mqttStatus = {
        zwave2mqttConfigured: false,
        mqttExist: false,
        mqttRunning: false,
        zwave2mqttExist: false,
        zwave2mqttRunning: false,
        gladysConnected: false,
        zwave2mqttConnected: false,
        z2mEnabled: false,
        dockerBased: false,
        networkModeValid: false
      };
      try {
        zwave2mqttStatus = await state.httpClient.get('/api/v1/service/zwave2mqtt/status');
      } finally {
        store.setState({
          mqttExist: zwave2mqttStatus.mqttExist,
          mqttRunning: zwave2mqttStatus.mqttRunning,
          zwave2mqttExist: zwave2mqttStatus.zwave2mqttExist,
          zwave2mqttRunning: zwave2mqttStatus.zwave2mqttRunning,
          zwave2mqttConfigured: zwave2mqttStatus.zwave2mqttConfigured,
          zwave2mqttConnected: zwave2mqttStatus.zwave2mqttConnected,
          gladysConnected: zwave2mqttStatus.gladysConnected,
          z2mEnabled: zwave2mqttStatus.z2mEnabled,
          dockerBased: zwave2mqttStatus.dockerBased,
          networkModeValid: zwave2mqttStatus.networkModeValid
        });
      }
    },

    async startContainer(state) {
      let z2mEnabled = true;
      let error = false;

      store.setState({
        z2mEnabled,
        zwave2mqttStatus: RequestStatus.Getting
      });

      await state.httpClient.post('/api/v1/service/zwave2mqtt/variable/ZWAVE2MQTT_ENABLED', {
        value: z2mEnabled
      });

      try {
        await state.httpClient.post('/api/v1/service/zwave2mqtt/connect');
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
    },

    displayConnectedMessage(state) {
      // display 3 seconds a message "MQTT connected"
      store.setState({
        zwave2mqttConnected: true
      });
      setTimeout(
        () =>
          store.setState({
            zwave2mqttConnected: false,
            connectMqttStatus: undefined
          }),
        3000
      );
    },
    displayMqttError(state, error) {
      store.setState({
        zwave2mqttConnected: false,
        mqttConnectionError: error
      });
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
