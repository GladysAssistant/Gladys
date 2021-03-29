import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

const BOX_KEY = 'Camera';

function createActions(store) {
  const boxActions = createBoxActions(store);
  const actions = {
    async getCameraImage(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const image = await state.httpClient.get(`/api/v1/camera/${box.camera}/image`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          image
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          image: null
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    deviceFeatureWebsocketEvent(state, box, x, y, payload) {
      if (box.camera === payload.device) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          image: payload.last_value_string
        });
      }
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
