import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';

dayjs.extend(relativeTime);

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getContainers(state) {
      let mqtt4z2mContainerExists = false;
      let z2mContainerExists = false;
      let mqtt4z2mContainerRunning = false;
      let z2mContainerRunning = false;
      let z2mEnabled = state.z2mEnabled;
      let dockerContainers = [];
      store.setState({
        DockerGetContainersStatus: RequestStatus.Getting
      });
      try {
        const containers = await state.httpClient.get('/api/v1/docker/container/list');
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
          if (container.name === '/mqtt4z2m') {
            mqtt4z2mContainerExists = true;
            if (container.state === 'running') {
              mqtt4z2mContainerRunning = true;
            }
            dockerContainers.push(container);
          }
        });
        if (z2mEnabled && (!mqtt4z2mContainerRunning || !z2mContainerRunning)) {
          this.startContainer();
        }
        if ( mqtt4z2mContainerRunning && z2mContainerRunning ) {
          z2mEnabled = true;
        }
        store.setState({
          dockerContainers,
          z2mEnabled,
          z2mContainerExists,
          mqtt4z2mContainerExists,
          z2mContainerRunning,
          mqtt4z2mContainerRunning,
          DockerGetContainersStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          z2mEnabled,
          z2mContainerExists,
          mqtt4z2mContainerExists,
          z2mContainerRunning,
          mqtt4z2mContainerRunning,
          DockerGetContainersStatus: RequestStatus.Error
        });
      }
    },
    async startContainer(state) {
      let dockerContainers = state.dockerContainers;
      let z2mEnabled = true;
      const z2mContainerExists = state.z2mContainerExists;
      const mqtt4z2mContainerExists = state.mqtt4z2mContainerExists;
      let z2mContainerRunning = state.z2mContainerRunning;
      let mqtt4z2mContainerRunning = state.mqtt4z2mContainerRunning;
      let error = false;
      dockerContainers.forEach(container => {
        if (container.name === '/zigbee2mqtt' && !z2mContainerRunning ) {
          container.state = 'starting';
        }
        if (container.name === '/mqtt4z2m' && !mqtt4z2mContainerRunning ) {
          container.state = 'starting';
        }
      });
      store.setState({
        z2mEnabled,
        dockerContainers,
        zigbee2mqttContainerStatus: RequestStatus.Getting
      });

      // if MQTT container exists, we just need to start it
      if (mqtt4z2mContainerExists && !mqtt4z2mContainerRunning) {
        try {
          await state.httpClient.post('/api/v1/docker/container/mqtt4z2m/start');
          mqtt4z2mContainerRunning = true;
        } catch (e) {
          error = get(e, 'response.status');
        }
      }

      // if Zigbee2mqtt container exists, we just need to start it
      if (z2mContainerExists && !z2mContainerRunning) {
        try {
          await state.httpClient.post('/api/v1/docker/container/zigbee2mqtt/start');
          z2mContainerRunning = true;
        } catch (e) {
          error = error | get(e, 'response.status');
        }
      }

      this.getContainers();
      // If an error occurs
      if (error) {
        z2mEnabled = false;
        store.setState({
          z2mEnabled,
          dockerContainers,
          zigbee2mqttContainerStatus: RequestStatus.Error
        });
      } else {
        store.setState({
          dockerContainers,
          mqtt4z2mContainerRunning,
          z2mContainerRunning,
          zigbee2mqttContainerStatus: RequestStatus.Success
        });
      }
      await this.saveVariable();
    },

    async stopContainer(state) {
      let z2mContainerRunning = state.z2mContainerRunning;
      let mqtt4z2mContainerRunning = state.mqtt4z2mContainerRunning;
      let dockerContainers = state.dockerContainers;
      let z2mEnabled = false;
      let error = false;
      dockerContainers.forEach(container => {
        if (container.name === '/zigbee2mqtt' && z2mContainerRunning ) {
          container.state = 'stopping';
        }
        if (container.name === '/mqtt4z2m' && mqtt4z2mContainerRunning ) {
          container.state = 'stopping';
        }
      });
      store.setState({
        dockerContainers,
        z2mEnabled,
        zigbee2mqttContainerStatus: RequestStatus.Getting
      });
      // if Zigbee2mqtt container is running, we just need to stop it
      if (z2mContainerRunning) {
        try {
          await state.httpClient.post('/api/v1/docker/container/zigbee2mqtt/stop');
          z2mContainerRunning = false;
        } catch (e) {
          error = get(e, 'response.status');
        }
      }
      // if Mqtt4Z2m container is running, we just need to stop it
      if (mqtt4z2mContainerRunning) {
        try {
          await state.httpClient.post('/api/v1/docker/container/mqtt4z2m/stop');
          mqtt4z2mContainerRunning = false;
        } catch (e) {
          error = error | get(e, 'response.status');
        }
      }

      this.getContainers();

      if (error) {
        z2mEnabled = true;
        store.setState({
          dockerContainers,
          z2mEnabled,
          zigbee2mqttContainerStatus: RequestStatus.Error
        });
      } else {
        store.setState({
          dockerContainers,
          z2mContainerRunning,
          mqtt4z2mContainerRunning,
          zigbee2mqttContainerStatus: RequestStatus.Success
        });
      }
      await this.saveVariable();
    },

    async saveVariable(state) {
      store.setState({
        actionStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/variable/ENABLED', {
           value: state.z2mEnabled 
        });
        store.setState({
          actionStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          actionStatus: RequestStatus.Error,
        });
      };

    },

    async loadProps(state) {
      let z2mEnabled = false;
      store.setState({
        actionStatus: RequestStatus.Getting
      });
      try {
        const enabled = await state.httpClient.get('/api/v1/service/zigbee2mqtt/variable/ENABLED');
        z2mEnabled = (enabled.value !== "0");
        store.setState({
          z2mEnabled,
          actionStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          z2mEnabled,
          actionStatus: RequestStatus.Error,
        });
      }
    },

    displayConnectedMessage(state) {
      // display 3 seconds a message "MQTT connected"
      store.setState({
        mqttConnected: true
      });
      setTimeout(
        () =>
          store.setState({
            mqttConnected: false,
            connectMqttStatus: undefined
          }),
        3000
      );
    },
    displayMqttError(state, error) {
      store.setState({
        mqttConnected: false,
        mqttConnectionError: error
      });
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
