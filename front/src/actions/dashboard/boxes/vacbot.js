import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

const BOX_KEY = 'Vacbot';

/*
const VACBOT_ICONS = {
  clean: 'fe-plat',
  clean2: 'fe-play-circle',
  pause: 'fe-pause',
  pause2: 'fe-pause-circle',
  stop: 'fe-stop',
  map: 'fe-map',
  info: 'fe-info'
};
*/

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getVacbot(state, box, x, y) {
      console.log(`getVacbot : ${JSON.stringify(box)} ${x} ${y}`);
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const vacbotStatus = await state.httpClient.get(`/api/v1/service/ecovacs/${box.device_feature}/status`);
        console.log(`status ${JSON.stringify(vacbotStatus)}`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          vacbot: vacbotStatus
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          vacbot: null
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    }
    /*,
    deviceFeatureWebsocketEvent(state, box, x, y, payload) {
      console.log(payload);
      if (box.vacbot === payload.device) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          vacbot: payload.last_value_string
        });
      }
    }*/
  };
  return Object.assign({}, actions);
}

export default createActions;
