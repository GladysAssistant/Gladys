import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';
import config from '../../../../../config';

dayjs.extend(relativeTime);

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async checkStatus(state) {
      let zigbee2mqttStatus = {
        usbConfigured: false,
        mqttExist: false,
        mqttRunning: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        gladysConnected: false,
        zigbee2mqttConnected: false,
        z2mEnabled: false,
        dockerBased: false,
        networkModeValid: false
      };
      try {
        zigbee2mqttStatus = await state.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      } finally {
        store.setState({
          usbConfigured: zigbee2mqttStatus.usbConfigured,
          mqttExist: zigbee2mqttStatus.mqttExist,
          mqttRunning: zigbee2mqttStatus.mqttRunning,
          zigbee2mqttExist: zigbee2mqttStatus.zigbee2mqttExist,
          zigbee2mqttRunning: zigbee2mqttStatus.zigbee2mqttRunning,
          gladysConnected: zigbee2mqttStatus.gladysConnected,
          zigbee2mqttConnected: zigbee2mqttStatus.zigbee2mqttConnected,
          z2mEnabled: zigbee2mqttStatus.z2mEnabled,
          dockerBased: zigbee2mqttStatus.dockerBased,
          networkModeValid: zigbee2mqttStatus.networkModeValid
        });
      }

      // Compute Zigbee2Mqtt interface URL if connected locally (not through Gladys Plus Gateway)
      let z2mUrl = null;
      if (state.session.gatewayClient === undefined) {
        const url = new URL(config.localApiUrl);
        z2mUrl = `${url.protocol}//${url.hostname}:8080`;
      }
      store.setState({
        z2mUrl
      });
    },

    async startContainer(state) {
      let z2mEnabled = true;
      let error = false;

      store.setState({
        z2mEnabled,
        zigbee2mqttStatus: RequestStatus.Getting
      });

      await state.httpClient.post('/api/v1/service/zigbee2mqtt/variable/ZIGBEE2MQTT_ENABLED', {
        value: z2mEnabled
      });

      try {
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/connect');
      } catch (e) {
        error = error | get(e, 'response.status');
      }

      if (error) {
        store.setState({
          zigbee2mqttStatus: RequestStatus.Error,
          z2mEnabled: false
        });
      } else {
        store.setState({
          zigbee2mqttStatus: RequestStatus.Success,
          z2mEnabled: true
        });
      }

      await this.checkStatus();
    },

    async stopContainer(state) {
      let error = false;
      try {
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/disconnect');
      } catch (e) {
        error = error | get(e, 'response.status');
      }

      if (error) {
        store.setState({
          zigbee2mqttStatus: RequestStatus.Error
        });
      } else {
        store.setState({
          zigbee2mqttStatus: RequestStatus.Success
        });
      }

      await this.checkStatus();
    },

    displayConnectedMessage() {
      // display 3 seconds a message "MQTT connected"
      store.setState({
        zigbee2mqttConnected: true
      });
      setTimeout(
        () =>
          store.setState({
            zigbee2mqttConnected: false,
            connectMqttStatus: undefined
          }),
        3000
      );
    },
    displayMqttError(state, error) {
      store.setState({
        zigbee2mqttConnected: false,
        mqttConnectionError: error
      });
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
