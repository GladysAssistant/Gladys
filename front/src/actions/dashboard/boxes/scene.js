import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

const BOX_KEY = 'Scene';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getScene(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const scene = await state.httpClient.get(`/api/v1/scene/${box.scene}`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          scene
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    async switchActiveScene(state, box, x, y, active) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const scene = await state.httpClient.patch(`/api/v1/scene/${box.scene}`, {
          active
        });
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          scene
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    }
  };

  return Object.assign({}, actions);
}

export default createActions;
