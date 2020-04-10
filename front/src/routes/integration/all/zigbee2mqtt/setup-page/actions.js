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
      store.setState({
        DockerGetContainersStatus: RequestStatus.Getting
      });
      try {
        let mqtt4z2mContainerExists = false;
        let z2mContainerExists = false;
        let z2mEnabled = state.z2mEnabled;
        const dockerContainers = await state.httpClient.get('/api/v1/docker/container/list');
        dockerContainers.forEach(container => {
          container.created_at_formatted = dayjs(container.created_at * 1000)
            .locale(state.user.language)
            .fromNow();
          if (container.name === '/zigbee2mqtt') {
            z2mContainerExists = true;
          }
          if (container.name === '/mqtt4z2m') {
            mqtt4z2mContainerExists = true;
          }
        });
        store.setState({
          dockerContainers,
          z2mEnabled,
          z2mContainerExists,
          mqtt4z2mContainerExists,
          DockerGetContainersStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          DockerGetContainersStatus: RequestStatus.Error
        });
      }
    },
    async startContainer(state) {
      const dockerContainers = state.dockerContainers;
      const z2mContainerExist = state.z2mContainerExist;
      let z2mEnabled = state.z2mEnabled;
      const mqtt4z2mContainerExist = state.mqtt4z2mContainerExist;

      store.setState({
        z2mEnabled,
        zigbee2mqttContainerStatus: RequestStatus.Getting
      });
      console.log('start container');

      // if MQTT container exists, we just need to start it
      if (mqtt4z2mContainerExist) {
        try {
          await state.httpClient.post('/api/v1/docker/mqtt4z2m/start');
          console.log('Containers : ', state.dockerContainers);
          dockerContainers.forEach(container => {
            if (container.name === '/mqtt4z2m') {
              container.state = 'Starting';
            }
          });
          console.log('Containers : ', state.dockerContainers);
          store.setState({
            dockerContainers,
            zigbee2mqttContainerStatus: RequestStatus.Success
          });
        } catch (e) {
          const status = get(e, 'response.status');
          if (status) {
            store.setState({
              zigbee2mqttContainerStatus: RequestStatus.Error
            });
          }
        }
      }

      // if Zigbee2mqtt container exists, we just need to start it
      if (z2mContainerExist) {
        try {
          await state.httpClient.post('/api/v1/docker/zigbee2mqtt/start');
          console.log('Containers : ', state.dockerContainers);
          dockerContainers.forEach(container => {
            if (container.name === '/zigbee2mqtt') {
              container.state = 'Starting';
            }
          });
          console.log('Containers : ', state.dockerContainers);
          store.setState({
            dockerContainers,
            zigbee2mqttContainerStatus: RequestStatus.Success
          });
        } catch (e) {
          const status = get(e, 'response.status');
          if (status) {
            store.setState({
              zigbee2mqttContainerStatus: RequestStatus.Error
            });
          }
        }
      }

    },
    async stopContainer(state) {
      const dockerContainers = state.dockerContainers;
      store.setState({
        zigbee2mqttContainerStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/docker/zigbee2mqtt/stop');
        this.props.dockerContainers.forEach(container => {
          if (container.name === '/zigbee2mqtt') {
            container.state = 'Stopping';
          }
        });
        store.setState({
          dockerContainers,
          zigbee2mqttContainerStatus: RequestStatus.Success
        });
      } catch (e) {
        const status = get(e, 'response.status');
        if (status) {
          store.setState({
            zigbee2mqttContainerStatus: RequestStatus.Error
          });
        }
      }
      try {
        await state.httpClient.post('/api/v1/docker/mqtt4z2m/stop');
        this.props.dockerContainers.forEach(container => {
          if (container.name === '/mqtt4z2m') {
            container.state = 'Stopping';
          }
        });
        store.setState({
          dockerContainers,
          zigbee2mqttContainerStatus: RequestStatus.Success
        });
      } catch (e) {
        const status = get(e, 'response.status');
        if (status) {
          store.setState({
            zigbee2mqttContainerStatus: RequestStatus.Error
          });
        }
      }
    },

    async loadProps(state) {
      let z2mEnabled = state.z2mEnabled;
      let dockerContainers = state.dockerContainers;
      let zigbee2mqttContainerID = state.zigbee2mqttContainerID;

      dockerContainers.forEach(function(container) {
        if (container.Name === '/zigbee2mqtt') {
          zigbee2mqttContainerID = container.Id;
        }
      });

      store.setState({
        z2mEnabled,
        dockerContainers,
        zigbee2mqttContainerID
      });
      //  let zigbee2mqttDockername;

      //      try {
      //        zigbee2mqttAutoDeploy = await state.httpClient.get('/api/v1/service/zigbee2mqtt/variable/Z2M_AUTODEPLOY');
      //        mqttUsername = await state.httpClient.get('/api/v1/service/mqtt/variable/MQTT_USERNAME');
      //        if (mqttUsername.value) {
      //          mqttPassword = '*********'; // this is just used so that the field is filled
      //        }
      //     } finally {
      //       store.setState({
      //         zigbee2mqttAutoDeploy: (zigbee2mqttAutoDeploy || {}).value,
      //          mqttUsername: (mqttUsername || { value: '' }).value,
      //          mqttPassword,
      //          passwordChanges: false,
      //          connected: false
      //       });
      //     }
    },
    updateConfiguration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'mqttPassword') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectMqttStatus: RequestStatus.Getting,
        mqttConnected: false
      });
      try {
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/variable/ENABLED', {
          value: state.z2mEnabled
        });
      
      await state.httpClient.post(`/api/v1/service/mqtt/connect`);

        store.setState({
          connectMqttStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectMqttStatus: RequestStatus.Error,
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
