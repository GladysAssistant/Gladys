import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getHouses(state) {
      store.setState({
        DashboardEditWeatherStatus: RequestStatus.Getting
      });
      try {
        const houses = await state.httpClient.get('/api/v1/house');
        store.setState({
          houses,
          DashboardEditWeatherStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          DashboardEditWeatherStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, boxActions);
}

export default createActions;
