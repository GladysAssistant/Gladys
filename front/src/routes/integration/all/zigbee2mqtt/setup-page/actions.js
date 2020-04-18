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
      store.setState({
        DockerGetContainersStatus: RequestStatus.Getting
      });
      try {
        const dockerContainers = await state.httpClient.get('/api/v1/docker/container/list');
        dockerContainers.forEach(container => {
          container.created_at_formatted = dayjs(container.created_at * 1000)
            .locale(state.user.language)
            .fromNow();
          if (container.name === '/zigbee2mqtt') {
            z2mContainerExists = true;
            if (container.state === 'running') {
              z2mContainerRunning = true;
            }
          }
          if (container.name === '/mqtt4z2m') {
            mqtt4z2mContainerExists = true;
            if (container.state === 'running') {
              mqtt4z2mContainerRunning = true;
            }
          }
        });
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
    toggleEnable(state) {
      let checked = state.z2mEnabled;
      const zigbee2mqttContainerStatus = state.zigbee2mqttContainerStatus;
      const dockerContainers = state.dockerContainers;

      if (zigbee2mqttContainerStatus !== RequestStatus.Getting && dockerContainers) {
        checked = !checked;
  
        console.log('toggle : ', checked);
  
        if (checked) {
          this.startContainer();
        } else {
          this.stopContainer();
        }
  
        store.setState({
          z2mEnabled: checked
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
      let error=false;
      dockerContainers.forEach(container => {
        if (container.name === '/zigbee2mqtt' || container.name === '/mqtt4z2m') {
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
        store.setState({
          z2mEnabled: false,
          dockerContainers,
          zigbee2mqttContainerStatus: RequestStatus.Error
        });
      } else {
        this.saveVariable();
        store.setState({
          dockerContainers,
          mqtt4z2mContainerRunning,
          z2mContainerRunning,
          zigbee2mqttContainerStatus: RequestStatus.Success
        });
      }
    },
    async stopContainer(state) {
      let dockerContainers = state.dockerContainers;
      let z2mEnabled = true;
      let error=false;
      dockerContainers.forEach(container => {
        if (container.name === '/zigbee2mqtt' || container.name === '/mqtt4z2m') {
          container.state = 'stopping';
        }
      });
      store.setState({
        dockerContainers,
        z2mEnabled,
        zigbee2mqttContainerStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/docker/container/zigbee2mqtt/stop');
      } catch (e) {
        error = get(e, 'response.status');
      }
      try {
        await state.httpClient.post('/api/v1/docker/container/mqtt4z2m/stop');
      } catch (e) {
        error = error | get(e, 'response.status');
      }

      this.getContainers();
      if (error) {
        store.setState({
          dockerContainers,
          zigbee2mqttContainerStatus: RequestStatus.Error
        });
      } else {
        this.saveVariable();
        store.setState({
          dockerContainers,
          zigbee2mqttStoppingStatus: RequestStatus.Success
        });
      }

    },

    async saveVariable(state) {
      store.setState({
        actionStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/variable/ENABLED', state.z2mEnabled);
        store.setState({
          actionStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          actionStatus: RequestStatus.Error,
        });
      };

    }

    async loadProps(state) {
      let z2mEnabled = false;
      store.setState({
        actionStatus: RequestStatus.Getting
      });
      try {
        z2mEnabled = await state.httpClient.get('/api/v1/service/zigbee2mqtt/variable/ENABLED');
        store.setState({
          z2mEnabled,
          actionStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          z2mEnabled,
          actionStatus: RequestStatus.Error,
        });
      };
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
