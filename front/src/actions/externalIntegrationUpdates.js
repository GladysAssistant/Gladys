import { USER_ROLE } from '../../../server/utils/constants';

// the server refreshes its copy of the store index every 30 minutes: polling
// at the same cadence is what makes a version published while Gladys is open
// show up in the counter without a page reload
const EXTERNAL_INTEGRATION_UPDATES_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Number of installed community (external) integrations having a newer
 * version published in the store. It lives in the global state so the counter
 * can be displayed in the header, from any page, and not only in the
 * integration catalog which is the only screen loading that list today.
 */
function createActions(store) {
  const actions = {
    // the integration catalog already downloaded the list: it feeds the
    // counter from what it has instead of asking the server a second time
    setExternalIntegrationsToUpdate(state, externalIntegrationsToUpdate) {
      store.setState({ externalIntegrationsToUpdate });
    },
    async refreshExternalIntegrationsToUpdate(state, user = state.user) {
      // update detection is an admin matter: the server does not even send
      // the update_available flag to the other users
      if (!user || user.role !== USER_ROLE.ADMIN) {
        store.setState({ externalIntegrationsToUpdate: 0 });
        return;
      }
      try {
        const integrations = await state.httpClient.get('/api/v1/external_integration');
        store.setState({
          externalIntegrationsToUpdate: integrations.filter(integration => integration.update_available).length
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return actions;
}

export { EXTERNAL_INTEGRATION_UPDATES_REFRESH_INTERVAL_MS };
export default createActions;
