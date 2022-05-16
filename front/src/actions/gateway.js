import get from 'get-value';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { RequestStatus, LoginStatus } from '../utils/consts';
import { validateEmail } from '../utils/validator';
import { ERROR_MESSAGES, SYSTEM_VARIABLE_NAMES } from '../../../server/utils/constants';

function createActions(store) {
  const actions = {
    async getStatus(state) {
      store.setState({
        gatewayGetStatusStatus: RequestStatus.Getting
      });
      try {
        const gatewayStatus = await state.httpClient.get('/api/v1/gateway/status');
        store.setState({
          gatewayStatus,
          gatewayGetStatusStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          gatewayGetStatusStatus: RequestStatus.Error
        });
      }
    },
    async login(state, e) {
      if (e) {
        e.preventDefault();
      }
      if (!validateEmail(state.gatewayLoginEmail)) {
        return store.setState({
          gatewayLoginStatus: LoginStatus.WrongEmailError
        });
      }
      store.setState({
        gatewayLoginStatus: RequestStatus.Getting
      });
      try {
        const gatewayLoginResults = await state.httpClient.post('/api/v1/gateway/login', {
          email: state.gatewayLoginEmail,
          password: state.gatewayLoginPassword
        });
        store.setState({
          gatewayLoginResults,
          gatewayLoginStep2: true,
          gatewayLoginStatus: RequestStatus.Success
        });
      } catch (e) {
        const error = get(e, 'response.data.error');
        if (error === ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET) {
          store.setState({
            gatewayLoginStatus: RequestStatus.NetworkError
          });
        } else {
          store.setState({
            gatewayLoginStatus: LoginStatus.WrongCredentialsError
          });
        }
      }
    },
    async loginTwoFactor(state, e) {
      if (e) {
        e.preventDefault();
      }
      store.setState({
        gatewayLoginStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/gateway/login-two-factor', {
          two_factor_token: state.gatewayLoginResults.two_factor_token,
          two_factor_code: state.gatewayLoginTwoFactorCode
        });
        await actions.getStatus(store.getState());
        await actions.getKeys(store.getState());
        await actions.getInstanceKeys(store.getState());
        await actions.getBackupKey(store.getState());
        store.setState({
          gatewayLoginStatus: RequestStatus.Success,
          displayGatewayLogin: false,
          gatewayLoginStep2: false,
          displayConnectedSuccess: true
        });
      } catch (e) {
        store.setState({
          gatewayLoginStatus: RequestStatus.Error
        });
      }
    },
    finalizeGatewaySetup() {
      store.setState({
        displayConnectedSuccess: false
      });
    },
    async disconnect(state) {
      store.setState({
        gatewayDisconnectStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/gateway/logout');
        store.setState({
          gatewayDisconnectStatus: RequestStatus.Success
        });
        actions.getStatus(store.getState());
      } catch (e) {
        store.setState({
          gatewayDisconnectStatus: RequestStatus.Error
        });
      }
    },
    async getBackupKey(state) {
      store.setState({
        gatewayGetBackupKeyStatus: RequestStatus.Getting
      });
      try {
        const data = await state.httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_KEY}`);
        store.setState({
          gatewayBackupKey: data.value,
          gatewayGetBackupKeyStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          gatewayGetBackupKeyStatus: RequestStatus.Error
        });
      }
    },
    async saveBackupKey(state) {
      store.setState({
        gatewaySaveBackupKeyStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_KEY}`, {
          value: state.gatewayBackupKey
        });
        store.setState({
          gatewaySaveBackupKeyStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          gatewaySaveBackupKeyStatus: RequestStatus.Error
        });
      }
    },
    async createBackup(state) {
      store.setState({
        gatewayCreateBackupStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/gateway/backup');
        store.setState({
          gatewayCreateBackupStatus: RequestStatus.Success
        });
        // we remove the backup status after 1 second
        setTimeout(() => {
          store.setState({
            gatewayCreateBackupStatus: null
          });
          route('/dashboard/settings/jobs');
        }, 1000);
      } catch (e) {
        store.setState({
          gatewayCreateBackupStatus: RequestStatus.Error
        });
      }
    },
    async updateBackupKey(state, e) {
      store.setState({
        gatewayBackupKey: e.target.value
      });
    },
    async getKeys(state) {
      store.setState({
        gatewayGetKeysStatus: RequestStatus.Getting
      });
      try {
        const gatewayUsersKeys = await state.httpClient.get('/api/v1/gateway/key');
        store.setState({
          gatewayUsersKeys,
          gatewayGetKeysStatus: RequestStatus.Success
        });
      } catch (e) {
        const error = get(e, 'response.data.error');
        if (error === ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET) {
          store.setState({
            gatewayGetKeysStatus: RequestStatus.NetworkError
          });
        } else {
          store.setState({
            gatewayGetKeysStatus: LoginStatus.WrongCredentialsError
          });
        }
      }
    },
    async switchUserKey(state, userIndex, value) {
      const newGatewayUsersKeys = update(state.gatewayUsersKeys, {
        [userIndex]: {
          accepted: {
            $set: value
          }
        }
      });
      store.setState({
        gatewayUsersKeys: newGatewayUsersKeys,
        gatewaySwitchUserKeyStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.patch('/api/v1/gateway/key', newGatewayUsersKeys);
        store.setState({
          gatewaySwitchUserKeyStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          gatewaySwitchUserKeyStatus: RequestStatus.Error
        });
      }
    },
    async getInstanceKeys(state) {
      store.setState({
        gatewayGetInstanceKeysStatus: RequestStatus.Getting
      });
      try {
        const gatewayInstanceKeys = await state.httpClient.get('/api/v1/gateway/instance/key');
        store.setState({
          gatewayInstanceKeys,
          gatewayGetInstanceKeysStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          gatewayGetInstanceKeysStatus: RequestStatus.Error
        });
      }
    },
    async getBackups(state) {
      store.setState({
        gatewayGetBackupsStatus: RequestStatus.Getting
      });
      try {
        const gatewayBackups = await state.httpClient.get('/api/v1/gateway/backup');
        store.setState({
          gatewayBackups,
          gatewayGetBackupsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          gatewayGetBackupsStatus: RequestStatus.Error
        });
      }
    },
    async restoreBackup(state, fileUrl) {
      store.setState({
        gatewayRestoreBackupStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/gateway/backup/restore', {
          file_url: fileUrl
        });
        store.setState({
          gatewayRestoreInProgress: true,
          gatewayRestoreBackupStatus: RequestStatus.Success
        });
        actions.waitForRestoreToFinish(store.getState());
      } catch (e) {
        store.setState({
          gatewayRestoreBackupStatus: RequestStatus.Error
        });
      }
    },
    async getRestoreStatus(state) {
      store.setState({
        gatewayRestoreStatusStatus: RequestStatus.Getting
      });
      try {
        const restoreStatus = await state.httpClient.get('/api/v1/gateway/backup/restore/status');
        store.setState({
          gatewayRestoreInProgress: restoreStatus.restore_in_progress,
          gatewayRestoreErrored: restoreStatus.restore_errored,
          gatewayRestoreStatusStatus: RequestStatus.Success,
          gatewayGladysRestarting: false
        });
      } catch (e) {
        store.setState({
          gatewayRestoreStatusStatus: RequestStatus.Error
        });
      }
    },
    async waitForRestoreToFinish(state) {
      try {
        const restoreStatus = await state.httpClient.get('/api/v1/gateway/backup/restore/status');
        if (restoreStatus.restore_in_progress) {
          setTimeout(() => {
            actions.waitForRestoreToFinish(state);
          }, 2000);
        } else if (restoreStatus.restore_errored) {
          store.setState({
            gatewayRestoreInProgress: false,
            gatewayRestoreErrored: true,
            gatewayGladysRestarting: false
          });
        } else {
          window.location = '/dashboard';
        }
      } catch (e) {
        const status = get(e, 'response.status');
        if (e.message === 'Network Error') {
          store.setState({
            gatewayGladysRestarting: true
          });
        } else if (status === 401) {
          window.location = '/dashboard';
        }
        setTimeout(() => {
          actions.waitForRestoreToFinish(state);
        }, 2000);
      }
    },
    updateLoginEmail(state, e) {
      store.setState({
        gatewayLoginEmail: e.target.value
      });
    },
    updateUserCardName(state, e) {
      store.setState({
        userCardName: e.target.value
      });
    },
    updateLoginPassword(state, e) {
      store.setState({
        gatewayLoginPassword: e.target.value
      });
    },
    updateLoginTwoFactorCode(state, e) {
      store.setState({
        gatewayLoginTwoFactorCode: e.target.value
      });
    },
    cancelGatewayLogin(state, e) {
      if (e) {
        e.preventDefault();
      }
      store.setState({
        displayGatewayLogin: false,
        gatewayLoginStatus: null,
        gatewayLoginStep2: false
      });
    },
    displayGatewayLoginForm(state, e) {
      if (e) {
        e.preventDefault();
      }
      store.setState({
        displayGatewayLogin: true,
        gatewayLoginStep2: false,
        gatewayLoginStatus: null,
        gatewayLoginEmail: null,
        gatewayLoginPassword: null,
        gatewayLoginTwoFactorCode: null
      });
    },
    async refreshCard(state) {
      try {
        const stripeCard = await state.session.gatewayClient.getCard();
        store.setState({ stripeCard });
      } catch (e) {}
    },
    async saveBillingInformations(state, stripeToken) {
      // if no stripe token is passed, error
      if (!stripeToken) {
        return store.setState({ savingBillingError: true, paymentInProgress: false });
      }

      try {
        await state.session.gatewayClient.updateCard(stripeToken.id);
        store.setState({
          savingBillingError: false,
          paymentInProgress: false,
          billingRequestStatus: RequestStatus.Success
        });
        await actions.refreshCard(store.getState());
      } catch (e) {
        store.setState({
          savingBillingError: true,
          paymentInProgress: false,
          billingRequestStatus: RequestStatus.Error
        });
      }
    },

    async cancelMonthlySubscription(state) {
      store.setState({
        billingRequestStatus: RequestStatus.Getting
      });
      try {
        await state.session.gatewayClient.cancelMonthlyPlan();
        await actions.refreshCard(store.getState());
        store.setState({
          cancelMonthlySubscriptionSuccess: true,
          cancelMonthlySubscriptionError: false,
          billingRequestStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({ cancelMonthlySubscriptionError: true, billingRequestStatus: RequestStatus.Error });
      }
    },
    async reSubcribeMonthlyPlan(state) {
      store.setState({
        billingRequestStatus: RequestStatus.Getting,
        cancelMonthlySubscriptionSuccess: false,
        cancelMonthlySubscriptionError: false
      });
      try {
        await state.session.gatewayClient.reSubcribeMonthlyPlan();
        await actions.refreshCard(store.getState());
        store.setState({ reSubscribeMonthlyPlanError: false, billingRequestStatus: RequestStatus.Success });
      } catch (e) {
        store.setState({ reSubscribeMonthlyPlanError: true, billingRequestStatus: RequestStatus.Error });
      }
    },
    updateBillingRequestPending() {
      store.setState({
        billingRequestStatus: RequestStatus.Getting
      });
    },
    loadStripe(state) {
      if (state.stripeLoaded) {
        return;
      }

      // we load the script script
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      document.body.appendChild(script);

      script.onload = () => {
        store.setState({ stripeLoaded: true });
      };
    },
    async tempSignupForRestore(state, language) {
      await state.session.init();
      if (state.session.isConnected()) {
        return null;
      }
      const user = await state.httpClient.post(`/api/v1/signup`, {
        firstname: 'temp-user',
        lastname: 'temp-user',
        password: 'temp-password',
        role: 'admin',
        email: 'temp-user@test.fr',
        language,
        birthdate: new Date()
      });
      store.setState({
        user,
        createLocalAccountStatus: RequestStatus.Success
      });
      await state.session.saveUser(user);
      await state.session.init();
    }
  };
  return actions;
}

export default createActions;
