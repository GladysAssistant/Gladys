import { RequestStatus } from '../utils/consts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function createActions(store) {
  const actions = {
    async ping(state) {
      store.setState({
        PingStatus: RequestStatus.Getting
      });
      try {
        const now = new Date().getTime();
        await state.httpClient.get('/api/v1/ping');
        const systemPing = new Date().getTime() - now;
        store.setState({
          systemPing,
          PingStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          PingStatus: RequestStatus.Error
        });
      }
    },
    async getDiskSpace(state) {
      store.setState({
        SystemGetDiskSpaceStatus: RequestStatus.Getting
      });
      try {
        const systemDiskSpace = await state.httpClient.get('/api/v1/system/disk');
        store.setState({
          systemDiskSpace,
          SystemGetDiskSpaceStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          SystemGetDiskSpaceStatus: RequestStatus.Error
        });
      }
    },
    async getContainers(state) {
      store.setState({
        SystemGetContainersStatus: RequestStatus.Getting
      });
      try {
        const systemContainers = await state.httpClient.get('/api/v1/system/container');
        systemContainers.forEach(container => {
          container.created_at_formatted = dayjs(container.created_at * 1000)
            .locale(state.user.language)
            .fromNow();
        });
        store.setState({
          systemContainers,
          SystemGetContainersStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          SystemGetContainersStatus: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
