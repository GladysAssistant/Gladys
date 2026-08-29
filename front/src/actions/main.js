import createActionsProfilePicture from './profilePicture';
import createActionsDarkMode from './darkMode';
import createActionsExternalIntegrationUpdates from './externalIntegrationUpdates';
import { getDefaultState } from '../utils/getDefaultState';
import { route } from 'preact-router';
import get from 'get-value';
import config from '../config';
import { isUrlInArray } from '../utils/url';
import { setSidebarCollapsedPreference } from '../utils/sidebarPreference';
import {
  isInstanceBehindFront,
  isInstanceVersionCheckSettled,
  markInstanceVersionCheckSettled
} from '../utils/instanceVersion';

const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
// Self-hosted gateways without Stripe get a ~100-year "trial": past this
// horizon a countdown is meaningless, so the indicator stays hidden.
const MAX_TRIAL_DAYS_DISPLAYED = 92;
// Every focus-triggered refresh costs the gateway two Stripe calls: a user
// hopping between tabs must not pay for them over and over.
const GATEWAY_TRIAL_REFRESH_INTERVAL_MS = 30 * 1000;
// The instance version changes at most a few times a day (Watchtower): one
// call a minute on tab focus is enough to notice an update happened.
const INSTANCE_VERSION_REFRESH_INTERVAL_MS = 60 * 1000;

let lastGatewayTrialRefresh = 0;
let lastInstanceVersionRefresh = 0;

const OPEN_PAGES = [
  '/signup',
  '/signup/create-account-gladys-gateway',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/gateway-configure-two-factor',
  '/signup-gateway',
  '/subscribe-gateway',
  '/confirm-email'
];

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);
  const actionsDarkMode = createActionsDarkMode(store);
  const actionsExternalIntegrationUpdates = createActionsExternalIntegrationUpdates(store);

  const actions = {
    handleRoute(state, e) {
      store.setState({
        currentUrl: e.url,
        showDropDown: false,
        showCollapsedMenu: false
      });
    },
    toggleDropDown(state) {
      store.setState({
        showDropDown: !state.showDropDown
      });
    },
    closeDropDown() {
      store.setState({
        showDropDown: false
      });
    },
    toggleCollapsedMenu(state) {
      store.setState({
        showCollapsedMenu: !state.showCollapsedMenu
      });
    },
    closeCollapsedMenu() {
      store.setState({
        showCollapsedMenu: false
      });
    },
    // Expanded rail ⇄ collapsed, at desktop widths (below them the rail is
    // an on-demand drawer whatever this says). Both states are resting
    // states: expanded is the docked rail with the content beside it, never
    // an overlay.
    toggleSidebarCollapsed(state) {
      const sidebarCollapsed = !state.sidebarCollapsed;
      setSidebarCollapsedPreference(sidebarCollapsed);
      store.setState({
        sidebarCollapsed
      });
    },
    redirectToLogin() {
      const returnUrl = window.location.pathname + window.location.search;
      route(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    },
    async refreshTabletMode(state) {
      try {
        const currentSession = await state.httpClient.get('/api/v1/session/tablet_mode');
        store.setState({
          tabletMode: currentSession.tablet_mode
        });
      } catch (e) {
        console.error(e);
      }
    },
    async checkSession(state) {
      actionsDarkMode.initDarkMode(state);
      if (isUrlInArray(state.currentUrl, OPEN_PAGES)) {
        return null;
      }
      try {
        await state.session.init();
        if (!state.session.isConnected()) {
          actions.redirectToLogin();
        }
        const tasks = [
          state.httpClient.get('/api/v1/me'),
          actionsProfilePicture.loadProfilePicture(state),
          actions.refreshTabletMode(state)
        ];
        const [user] = await Promise.all(tasks);
        store.setState({
          user
        });
        // the "integrations to update" counter is displayed in the header, on
        // every page: it is loaded once the user (and their role) is known,
        // without blocking the rest of the session check
        actionsExternalIntegrationUpdates.refreshExternalIntegrationsToUpdate(state, user);
        // same fire-and-forget for the instance version behind Gladys Plus
        actions.refreshInstanceVersionState(state);
        if (state.session.getGatewayUser) {
          const gatewayUser = await state.session.getGatewayUser();
          const now = new Date();
          if (new Date(gatewayUser.current_period_end) < now) {
            store.setState({
              gatewayAccountExpired: true
            });
          } else {
            await actions.refreshGatewayTrialState(state, gatewayUser);
          }
        }
      } catch (e) {
        const status = get(e, 'response.status');
        const error = get(e, 'response.data.error');
        const gatewayErrorMessage = get(e, 'response.data.error_message');
        const errorMessageOtherFormat = get(e, 'response.data.message');
        if (status === 401 && errorMessageOtherFormat === 'TABLET_IS_LOCKED') {
          route(`/locked${window.location.search}`);
        } else if (status === 401) {
          state.session.reset();
          actions.redirectToLogin();
        } else if (error === 'GATEWAY_USER_NOT_LINKED') {
          route('/link-gateway-user');
        } else if (error === 'USER_NOT_ACCEPTED_LOCALLY') {
          route('/link-gateway-user');
        } else if (gatewayErrorMessage === 'NO_INSTANCE_FOUND' || errorMessageOtherFormat === 'NO_INSTANCE_DETECTED') {
          route('/link-gateway-user');
        } else {
          console.error(e);
        }
      }
    },
    // Called at session check with the gateway user already in hand, and again
    // with no argument when the tab regains focus: the user comes back from the
    // Stripe portal, where they may just have entered the card this card asks
    // for — or ended the trial altogether.
    async refreshGatewayTrialState(state, gatewayUserFromSessionCheck) {
      let gatewayUser = gatewayUserFromSessionCheck;
      if (!gatewayUser) {
        if (Date.now() - lastGatewayTrialRefresh < GATEWAY_TRIAL_REFRESH_INTERVAL_MS) {
          return;
        }
        try {
          gatewayUser = await state.session.getGatewayUser();
        } catch (e) {
          console.error(e);
          return;
        }
      }
      lastGatewayTrialRefresh = Date.now();
      // The gateway API returns current_period_end padded with a 24-hour grace
      // period (see getMySelf in the gateway: `current_period_end + interval
      // '24 hour'`). The account indeed stays usable during that day — which is
      // why the expiry check above compares against the padded value — but what
      // this card counts down to is the end of the free trial, when the card on
      // file gets charged, so the pad is taken back out here.
      const trialEnd = new Date(gatewayUser.current_period_end).getTime() - ONE_DAY_IN_MILLISECONDS;
      // floor, not ceil: with 12 hours to go the trial ends today, it does not
      // have "1 day left". Only a full remaining day counts as one.
      const daysLeft = Math.max(0, Math.floor((trialEnd - Date.now()) / ONE_DAY_IN_MILLISECONDS));
      // Billing belongs to the admin of the Gladys Plus account: the other
      // members of the household get neither the countdown nor a one-click link
      // into the Stripe portal of a subscription that is not theirs.
      if (gatewayUser.status !== 'trialing' || gatewayUser.role !== 'admin' || daysLeft > MAX_TRIAL_DAYS_DISPLAYED) {
        store.setState({
          gatewayTrialDaysLeft: null,
          gatewayTrialHasPaymentMethod: true,
          gatewayTrialStripePortalKey: null
        });
        return;
      }
      // The "add a payment method" call-to-action must not show up when the
      // card check fails: better no reminder than a wrong one.
      let hasPaymentMethod = true;
      let stripePortalKey = null;
      try {
        const [card, setupState] = await Promise.all([
          state.session.gatewayClient.getCard(),
          state.session.gatewayClient.getSetupState()
        ]);
        hasPaymentMethod = card !== null;
        stripePortalKey = setupState.stripe_portal_key || null;
      } catch (e) {
        console.error(e);
      }
      store.setState({
        gatewayTrialDaysLeft: daysLeft,
        gatewayTrialHasPaymentMethod: hasPaymentMethod,
        gatewayTrialStripePortalKey: stripePortalKey
      });
    },
    // On Gladys Plus the front redeploys at release time while the local
    // instance waits for Watchtower (up to ~24h): the instance version is
    // loaded so the header can announce the mismatch (InstanceUpdateNotice)
    // instead of letting it surface as random bugs. Called at session check,
    // and again when the tab regains focus while the notice is displayed —
    // the moment Watchtower may just have resolved it.
    async refreshInstanceVersionState(state) {
      // served locally, the front comes from the instance itself: the
      // versions cannot diverge. The demo has no real instance at all.
      if (!config.gatewayMode || config.demoMode) {
        return;
      }
      // the system/info payload is a lot more than a version string: once the
      // instance has caught up with this front build, stop asking for it
      // until the next front deploy (see instanceVersion.js)
      if (isInstanceVersionCheckSettled()) {
        return;
      }
      if (Date.now() - lastInstanceVersionRefresh < INSTANCE_VERSION_REFRESH_INTERVAL_MS) {
        return;
      }
      lastInstanceVersionRefresh = Date.now();
      // logout swaps the session object out of the store: that identity is
      // what tells a response landing after logout that it must not write
      // the previous session's version into the next one
      const requestSession = state.session;
      try {
        const systemInfos = await state.httpClient.get('/api/v1/system/info');
        if (store.getState().session !== requestSession) {
          return;
        }
        const instanceGladysVersion = systemInfos.gladys_version || null;
        // a response with no mismatch settles the check — an unreadable
        // version too, since it could never display the notice anyway
        if (!isInstanceBehindFront(instanceGladysVersion)) {
          markInstanceVersionCheckSettled();
        }
        store.setState({
          instanceGladysVersion
        });
      } catch (e) {
        // instance unreachable: better no notice than a wrong one, and the
        // check stays unsettled so the next session retries
        console.error(e);
      }
    },
    async logout(state, e) {
      e.preventDefault();
      const user = state.session.getUser();
      if (user && user.session_id) {
        await state.httpClient.post(`/api/v1/session/${user.session_id}/revoke`);
      }
      state.session.reset();
      // a pending "integrations to update" request must not write the count of
      // the session being closed into the fresh state
      actionsExternalIntegrationUpdates.invalidateExternalIntegrationsToUpdate();
      // and the instance version throttle must not carry over: logging back
      // in right away gets a fresh check, not a 60s silence
      lastInstanceVersionRefresh = 0;
      route('/login', true);
      const defaultState = getDefaultState();
      store.setState(defaultState, true);
    }
  };

  return Object.assign(actions, actionsProfilePicture, actionsDarkMode, actionsExternalIntegrationUpdates);
}

export default createActions;
