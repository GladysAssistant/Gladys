import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getCameras(state) {
      store.setState({
        DashboardEditCameraStatus: RequestStatus.Getting
      });
      try {
        const cameras = await state.httpClient.get('/api/v1/camera');
        store.setState({
          cameras,
          DashboardEditCameraStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          DashboardEditCameraStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, boxActions);
}

export default createActions;
