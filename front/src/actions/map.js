import { RequestStatus } from '../utils/consts';

function createActions(store) {
  const actions = {
    async getUsersWithLocation(state) {
      store.setState({
        getUsersWithlocationStatus: RequestStatus.Getting
      });
      try {
        const usersWithLocation = await state.httpClient.get(
          '/api/v1/user?fields=id,firstname,selector,picture,last_latitude,last_longitude,last_altitude,last_accuracy,last_location_changed'
        );
        store.setState({
          usersWithLocation,
          getUsersWithlocationStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getUsersWithlocationStatus: RequestStatus.Error
        });
      }
    },
    async getHousesWithLocation(state) {
      store.setState({
        getHousesWithLocation: RequestStatus.Getting
      });
      try {
        const housesWithLocation = await state.httpClient.get('/api/v1/house');
        store.setState({
          housesWithLocation,
          getHousesWithLocation: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getHousesWithLocation: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
