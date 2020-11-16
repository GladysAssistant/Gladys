import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

const BOX_KEY = 'Todoist';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getTasks(state, todoist_project_id, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const url = todoist_project_id
          ? `/api/v1/service/todoist/projects/${todoist_project_id}/tasks`
          : '/api/v1/service/todoist/tasks';
        const tasks = await state.httpClient.get(url);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, { tasks });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
