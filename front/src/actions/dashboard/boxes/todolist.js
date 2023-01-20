import { RequestStatus } from '../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import createBoxActions from '../boxActions';
import get from 'get-value';

const BOX_KEY = 'Todolist';

function waitTime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getTasks(state, todolistId, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const url = todolistId ? `/api/v1/todolist/${todolistId}/tasks` : '/api/v1/todolist/tasks';
        const tasks = await state.httpClient.get(url);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, { tasks });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        const responseMessage = get(e, 'response.data.message');
        if (responseMessage === ERROR_MESSAGES.SERVICE_NOT_CONFIGURED) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.ServiceNotConfigured);
        } else {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
        }
      }
    },

    async closeTask(state, taskId, x, y) {
      let { tasks } = boxActions.getBoxData(state, BOX_KEY, x, y);
      tasks = tasks.map(t => (t.id === taskId ? { ...t, pending: true } : t));
      boxActions.mergeBoxData(state, BOX_KEY, x, y, { tasks });

      await Promise.all([state.httpClient.post(`/api/v1/todolist/tasks/${taskId}/close`), waitTime(1500)]);

      tasks = boxActions.getBoxData(state, BOX_KEY, x, y).tasks;
      tasks = tasks.filter(t => t.id !== taskId);
      boxActions.mergeBoxData(state, BOX_KEY, x, y, { tasks });
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
