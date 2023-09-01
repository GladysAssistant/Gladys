import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import createDeviceActions from '../../device';

const BOX_KEY = 'Vacbot';

function createActions(store) {
  const boxActions = createBoxActions(store);
  const deviceActions = createDeviceActions(store);

  const actions = {
    async getVacbotBoxDatas(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const status = await state.httpClient.get(`/api/v1/service/ecovacs/${box.device_feature}/status`);
        // api/v1/device/:device_selector
        const vacbotDevice = await state.httpClient.get(`/api/v1/device/${box.device_feature}`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          vacbotStatus: status,
          device: vacbotDevice,
          status: RequestStatus.Success
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          vacbotStatus: null,
          device: null,
          status: RequestStatus.Error
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    }
  };

    
  return Object.assign({}, actions);
}

export default createActions;
