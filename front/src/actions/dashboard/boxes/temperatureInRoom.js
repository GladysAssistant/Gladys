import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

const BOX_KEY = 'TemperatureInRoom';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getTemperatureInRoom(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const room = await state.httpClient.get(`/api/v1/room/${box.room}?expand=temperature`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          room
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
