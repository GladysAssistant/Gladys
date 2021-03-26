import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

const BOX_KEY = 'Pihole';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getPiholeSummary(state, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const piholestats = await state.httpClient.get(`/api/v1/pihole/getPiholeSummary`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          piholestats
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
