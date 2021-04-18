import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const BOX_KEY = 'Pihole';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getPiholeSummary(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const piholestats = await state.httpClient.get(`/api/v1/pihole/getPiholeSummary`);
        if (piholestats.gravity_last_updated.absolute) {
          piholestats.gravity_updated_relative_to_now = dayjs(dayjs.unix(piholestats.gravity_last_updated.absolute))
            .locale(state.user.language)
            .fromNow();
        }
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
