import { RequestStatus } from '../utils/consts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';

dayjs.extend(relativeTime);

function createActions(store) {
  const actions = {
    async getContainers(state) {
      store.setState({
        SystemGetContainersStatus: RequestStatus.Getting
      });
      try {
        const dockerContainers = await state.httpClient.get('/api/v1/docker/container/list');
        dockerContainers.forEach(container => {
          container.created_at_formatted = dayjs(container.created_at * 1000)
            .locale(state.user.language)
            .fromNow();
        });
        store.setState({
          dockerContainers,
          DockerGetContainersStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          DockerGetContainersStatus: RequestStatus.Error
        });
      }
    },
    async startContainer(state, containerId, e) {
      store.setState({
        zigbee2mqttContainerStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post(`/api/v1/docker/container/start`, { containerId });
        store.setState({
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
    async stopContainer(state, containerId, e) {
      store.setState({
        zigbee2mqttContainerStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post(`/api/v1/docker/container/stop`, { containerId });
        store.setState({
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
  };

  return actions;
}

export default createActions;
