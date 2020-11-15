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
    },
    async getContainers(state) {
      let mqtt4z2mContainerExists = false;
      let z2mContainerExists = false;
      let mqtt4z2mContainerRunning = false;
      let z2mContainerRunning = false;
      //      let z2mEnabled = state.z2mEnabled;
      let dockerContainers = [];
      store.setState({
        DockerGetContainersStatus: RequestStatus.Getting
      });
      try {
        const containers = await state.httpClient.get('/api/v1/system/container');
        containers.forEach(container => {
          container.created_at_formatted = dayjs(container.created_at * 1000)
            .locale(state.user.language)
            .fromNow();
          if (container.name === '/zigbee2mqtt') {
            z2mContainerExists = true;
            if (container.state === 'running') {
              z2mContainerRunning = true;
            }
            dockerContainers.push(container);
          }
          if (container.name === '/z2m-mqtt') {
            mqtt4z2mContainerExists = true;
            if (container.state === 'running') {
              mqtt4z2mContainerRunning = true;
            }
            dockerContainers.push(container);
          }
          //          dockerContainers.push(container);
        });
        //        if (z2mEnabled && (!mqtt4z2mContainerRunning || !z2mContainerRunning)) {
        //          this.startContainer();
        //        }
        //        if (mqtt4z2mContainerRunning && z2mContainerRunning) {
        //          z2mEnabled = true;
        //        }
        store.setState({
          dockerContainers,
          //          z2mEnabled,
          z2mContainerExists,
          mqtt4z2mContainerExists,
          z2mContainerRunning,
          mqtt4z2mContainerRunning,
          DockerGetContainersStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          //          z2mEnabled,
          z2mContainerExists,
          mqtt4z2mContainerExists,
          z2mContainerRunning,
          mqtt4z2mContainerRunning,
          DockerGetContainersStatus: RequestStatus.Error
        });
      }
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
//        await state.httpClient.post('/api/v1/service/zigbee2mqtt/mqtt/start');
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/connect');
      } catch (e) {
        error = error | get(e, 'response.status');
      }

      // try {
      //   await state.httpClient.post('/api/v1/service/zigbee2mqtt/z2m/start');
      // } catch (e) {
      //   error = error | get(e, 'response.status');
      // }

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

    displayConnectedMessage(state) {
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
