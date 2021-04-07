import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

const BOX_KEY = 'MediaPlayer';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const updateHandler = sourceString => {
    // state.device.deviceFeatures.findIndex(feature => feature.type = )
    // boxActions.mergeBoxData(state, BOX_KEY, x, y, {
    //   device
    // });
    console.log(sourceString);
  };

  const actions = {
    async getMediaPlayer(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const device = await state.httpClient.get(`/api/v1/device/${box.player}`);
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
    },
    addListeners(state) {
      state.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE, updateHandler);
    },
    removeListeners(state) {
      state.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE, updateHandler);
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
