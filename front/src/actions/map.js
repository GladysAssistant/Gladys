import { RequestStatus } from '../utils/consts';

function createActions(store) {
  const actions = {
    async getUsersWithLocation(state) {
      store.setState({
        GetUsersWithlocationStatus: RequestStatus.Getting
      });
      try {
        const usersWithLocation = await state.httpClient.get(
          '/api/v1/user?fields=id,firstname,selector,picture,last_latitude,last_longitude,last_altitude,last_accuracy,last_location_changed'
        );
        store.setState({
          usersWithLocation,
          GetUsersWithlocationStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          GetUsersWithlocationStatus: RequestStatus.Error
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
    },
    async createAreasWithLocation(state) {
      store.setState({
        createAreasWithLocation: RequestStatus.Getting
      });
      try {
        const areasWithLocation = await state.httpClient.post('/api/v1/area', {
          name: 'Work',
          latitude: state.latitude,
          longitude: state.longitude,
          radius: state.radius,
          color: '#00000'
        });
        store.setState({
          areasWithLocation,
          createAreasWithLocation: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          createAreasWithLocation: RequestStatus.Error
        });
      }
    },
    async getAreasWithLocation(state) {
      store.setState({
        getAreasWithLocation: RequestStatus.Getting
      });
      try {
        const areasWithLocation = await state.httpClient.get('/api/v1/area');
        store.setState({
          areasWithLocation,
          getAreasWithLocation: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getAreasWithLocation: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
