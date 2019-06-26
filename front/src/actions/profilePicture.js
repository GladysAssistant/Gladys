import { RequestStatus } from '../utils/consts';

function createActions(store) {
  const actions = {
    async loadProfilePicture(state) {
      // if a profile picture already exist
      if (state.profilePicture) {
        return;
      }
      // test if profile picture is present locally
      const localProfilePicture = state.session.getProfilePicture();
      if (localProfilePicture) {
        return store.setState({
          profilePicture: localProfilePicture
        });
      }
      // if not, we get them from the server
      store.setState({
        GetProfilePictureStatus: RequestStatus.Getting
      });
      try {
        const profilePicture = await state.httpClient.get(`/api/v1/me/picture`);
        state.session.saveProfilePicture(profilePicture);
        store.setState({
          profilePicture,
          GetProfilePictureStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          GetProfilePictureStatus: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
