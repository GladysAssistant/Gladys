import { RequestStatus } from '../../utils/consts';

function createActions(store) {
  const actions = {
    async loadClient(state, queryParams) {
      store.setState({
        oauthStatus: RequestStatus.Getting,
        redirectUri: queryParams.redirect_uri,
        oauthState: queryParams.state
      });
      try {
        const oauthClient = await state.httpClient.get(`/api/v1/oauth/client/${queryParams.client_id}`);
        store.setState({
          oauthClient,
          oauthStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          oauthStatus: RequestStatus.Error
        });
      }
    },
    denyAuthorize() {
      store.setState({
        oauthStatus: RequestStatus.ValidationError
      });
    },
    async allowAuthorize(state) {
      store.setState({
        oauthorizeStatus: RequestStatus.Getting
      });
      try {
        const redirectData = await state.httpClient.get(`/api/v1/oauth/authorize${window.location.search}`);
        store.setState({
          oauthorizeStatus: RequestStatus.Success
        });
        window.location.href = redirectData.uri;
      } catch (e) {
        store.setState({
          oauthorizeStatus: RequestStatus.Error
        });
      }
    }
  };

  return actions;
}

export default createActions;
