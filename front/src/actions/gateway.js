import get from 'get-value';
import update from 'immutability-helper';
import { RequestStatus, LoginStatus } from '../utils/consts';
import { validateEmail } from '../utils/validator';
import { ERROR_MESSAGES } from '../../../server/utils/constants';

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
    async loginTwoFactor(state) {
      store.setState({
        gatewayLoginStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/gateway/login-two-factor', {
          two_factor_token: state.gatewayLoginResults.two_factor_token,
          two_factor_code: state.gatewayLoginTwoFactorCode
        });
        store.setState({
          gatewayLoginStatus: RequestStatus.Success,
          displayGatewayLogin: false,
          gatewayLoginStep2: false
        });
        await actions.getStatus(state);
      } catch (e) {
        store.setState({
          gatewayLoginStatus: RequestStatus.Error
        });
      }
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
    async createBackup(state) {
      store.setState({
        gatewayCreateBackupsStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/gateway/backup');
        store.setState({
          gatewayCreateBackupsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          gatewayCreateBackupsStatus: RequestStatus.Error
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
          gatewayRestoreStatusStatus: RequestStatus.Success
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
        } else {
          window.location = '/dashboard';
        }
      } catch (e) {
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
    }
  };
  return actions;
}

export default createActions;
