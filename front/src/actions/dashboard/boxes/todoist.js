import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

const BOX_KEY = 'Todoist';

function waitTime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getTasks(state, todoistProjectId, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const url = todoistProjectId
          ? `/api/v1/service/todoist/projects/${todoistProjectId}/tasks`
          : '/api/v1/service/todoist/tasks';
        const tasks = await state.httpClient.get(url);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, { tasks });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },

    async completeTask(state, taskId, x, y) {
      let { tasks } = boxActions.getBoxData(state, BOX_KEY, x, y);
      tasks = tasks.map(t => (t.id === taskId ? { ...t, pending: true } : t));
      boxActions.mergeBoxData(state, BOX_KEY, x, y, { tasks });

      await Promise.all([state.httpClient.post(`/api/v1/service/todoist/tasks/${taskId}/complete`), waitTime(1500)]);

      tasks = boxActions.getBoxData(state, BOX_KEY, x, y).tasks;
      tasks = tasks.filter(t => t.id !== taskId);
      boxActions.mergeBoxData(state, BOX_KEY, x, y, { tasks });
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
