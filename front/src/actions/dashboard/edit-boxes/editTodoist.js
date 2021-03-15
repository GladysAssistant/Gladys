import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getProjects(state) {
      store.setState({
        DashboardEditTodoistStatus: RequestStatus.Getting
      });
      try {
        const projects = await state.httpClient.get('/api/v1/service/todoist/projects');
        store.setState({
          projects,
          DashboardEditTodoistStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          DashboardEditTodoistStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, boxActions);
}

export default createActions;
