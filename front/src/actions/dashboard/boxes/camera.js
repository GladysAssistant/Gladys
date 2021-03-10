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
        const cameras = await state.httpClient.get(`/api/v1/camera`);
        let camera;
        cameras.forEach(cameraDB => {
          if (box.camera === cameraDB.selector) {
            camera = cameraDB.features[0];
          }
        });
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          camera,
          image
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          image: null,
          camera: null
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    deviceFeatureWebsocketEvent(state, box, x, y, payload) {
      if (box.camera === payload.device) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          image: payload.last_value_string,
          camera: payload
        });
      }
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
