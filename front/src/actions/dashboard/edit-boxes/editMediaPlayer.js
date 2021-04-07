import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getMediaPlayers(state) {
      store.setState({
        DashboardEditMediaPlayerStatus: RequestStatus.Getting
      });
      try {
        const players = await state.httpClient.get('/api/v1/media-player');
        store.setState({
          players,
          DashboardEditMediaPlayerStatus: RequestStatus.Success
        });
      } catch (e) {
        console.log(e);
        store.setState({
          DashboardEditMediaPlayerStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, boxActions);
}

export default createActions;
