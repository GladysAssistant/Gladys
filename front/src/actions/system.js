import { RequestStatus } from '../utils/consts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';

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
    async getInfos(state) {
      store.setState({
        SystemGetInfosStatus: RequestStatus.Getting
      });
      try {
        const systemInfos = await state.httpClient.get('/api/v1/system/info');
        const today = new Date().getTime();
        const systemStartedAt = today - systemInfos.uptime * 1000;
        systemInfos.uptime_formatted = dayjs(systemStartedAt)
          .locale(state.user.language)
          .fromNow();
        store.setState({
          systemInfos,
          SystemGetInfosStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          SystemGetInfosStatus: RequestStatus.Error
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
    },
    async getUpgradeDownloadStatus(state) {
      store.setState({
        getUpgradeDownloadStatusStatus: RequestStatus.Getting
      });
      try {
        const upgradeDownloadStatus = await state.httpClient.get('/api/v1/system/upgrade/download/status');
        if (upgradeDownloadStatus.upgrade_finished !== null) {
          actions.downloadFinished(state);
        } else if (upgradeDownloadStatus.last_event !== null) {
          actions.newDownloadProgress(state, {
            event: upgradeDownloadStatus.last_event
          });
        }
        store.setState({
          getUpgradeDownloadStatusStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getUpgradeDownloadStatusStatus: RequestStatus.Error
        });
      }
    },
    async downloadUpgrade(state) {
      store.setState({
        downloadUpgradeStatus: RequestStatus.Getting,
        downloadUpgradeProgress: 0
      });
      try {
        await state.httpClient.post('/api/v1/system/upgrade/download', {
          tag: state.systemInfos.latest_gladys_version
        });
      } catch (e) {
        store.setState({
          downloadUpgradeStatus: RequestStatus.Error,
          downloadUpgradeProgress: null
        });
      }
    },
    newDownloadProgress(state, data) {
      const layerId = get(data, 'event.id');
      const current = get(data, 'event.progressDetail.current');
      const total = get(data, 'event.progressDetail.total');
      if (current && total && layerId) {
        const downloadUpgradeLayers = Object.assign({}, state.downloadUpgradeLayers, {
          [layerId]: {
            current,
            total
          }
        });
        let sumTotal = 0;
        let sumCurrent = 0;
        Object.keys(downloadUpgradeLayers).forEach(layerId => {
          sumTotal += downloadUpgradeLayers[layerId].total;
          sumCurrent += downloadUpgradeLayers[layerId].current;
        });
        const progress = Math.round((100 * sumCurrent) / sumTotal);
        store.setState({
          downloadUpgradeProgress: progress,
          downloadUpgradeLayers
        });
      }
    },
    downloadFinished() {
      store.setState({
        downloadUpgradeProgress: 100,
        downloadUpgradeStatus: RequestStatus.Success
      });
    },
    downloadFailed() {
      store.setState({
        downloadUpgradeStatus: RequestStatus.Error,
        downloadUpgradeProgress: null
      });
    }
  };
  return actions;
}

export default createActions;
