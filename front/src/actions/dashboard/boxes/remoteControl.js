import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import createDeviceActions from '../../device';

const BOX_KEY = 'Remote';

function createActions(store) {
  const boxActions = createBoxActions(store);
  const deviceActions = createDeviceActions(store);

  const actions = {
    async getRemoteControl(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);

      try {
        const device = await state.httpClient.get(`/api/v1/device/${box.device}`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          device
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          device: null
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    }
  };
  return Object.assign({}, actions, boxActions, deviceActions);
}

export default createActions;
