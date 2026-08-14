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
// the periodic poll and the refresh triggered right after an update can
// overlap: without this, the slower request wins and puts back the count it
// read before the update.
// Module scope and not a closure of createActions: unistore calls the factory
// once per connected component instance, so a per-factory counter would be
// bumped by logout (bound on AppRouter) without invalidating the request the
// poll (bound on MainApp) has in flight — one counter, or no guard at all
let lastRequestId = 0;

function createActions(store) {
  const applyCount = (requestId, externalIntegrationsToUpdate) => {
    if (requestId === lastRequestId) {
      store.setState({ externalIntegrationsToUpdate });
    }
  };

  const actions = {
    // called on logout: the revoke races the requests already dispatched, so
    // one of them can resolve with the previous admin's count after the state
    // has been reset. It would then be rendered on the next login, before the
    // refresh of that session has answered — to a non-admin too
    invalidateExternalIntegrationsToUpdate() {
      lastRequestId += 1;
    },
    // the integration catalog already downloaded the list: it feeds the
    // counter from what it has instead of asking the server a second time
    setExternalIntegrationsToUpdate(state, externalIntegrationsToUpdate) {
      lastRequestId += 1;
      store.setState({ externalIntegrationsToUpdate });
    },
    async refreshExternalIntegrationsToUpdate(state, user = state.user) {
      lastRequestId += 1;
      const requestId = lastRequestId;
      // update detection is an admin matter: the server does not even send
      // the update_available flag to the other users
      if (!user || user.role !== USER_ROLE.ADMIN) {
        applyCount(requestId, 0);
        return;
      }
      try {
        const integrations = await state.httpClient.get('/api/v1/external_integration');
        applyCount(requestId, integrations.filter(integration => integration.update_available).length);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return actions;
}

export { EXTERNAL_INTEGRATION_UPDATES_REFRESH_INTERVAL_MS };
export default createActions;
