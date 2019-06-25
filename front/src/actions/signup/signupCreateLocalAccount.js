import createActionsProfilePicture from '../profilePicture';
import { RequestStatus, CreateUserErrors } from '../../utils/consts';
import update from 'immutability-helper';
import get from 'get-value';
import { route } from 'preact-router';
import createActionsWelcome from './welcome';
import validateEmail from '../../utils/validateEmail';
import { fileToBase64, getCropperBase64Image } from '../../utils/picture';
import { getYearsMonthsAndDays } from '../../utils/date';

const MIN_PASSWORD_LENGTH = 8;

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);
  const welcomeActions = createActionsWelcome(store);

  const actions = {
    resetNewUser(state) {
      store.setState({
        newUser: {
          firstname: '',
          lastname: '',
          email: '',
          role: 'admin',
          language: navigator.language === 'fr' ? 'fr' : 'en',
          password: '',
          passwordRepeat: ''
        },
        createLocalAccountStatus: null,
        signupErrors: {}
      });
    },
    validatePassword(state) {
      store.setState({
        validPassword: state.newUser.password.length >= MIN_PASSWORD_LENGTH
      });
    },
    validatePasswordRepeat(state) {
      store.setState({
        validPasswordRepeat: state.newUser.password === state.newUser.passwordRepeat
      });
    },
    updateDays(state) {
      const { days, months, years } = getYearsMonthsAndDays(state.newUser.birthdateYear, state.newUser.birthdateMonth);
      store.setState({
        days,
        months,
        years
      });
    },
    validateUser(state) {
      let errored = false;
      const errors = {};
      const user = state.newUser;
      if (!user.firstname || user.firstname.length === 0) {
        errored = true;
        errors.firstname = true;
      }
      if (!user.lastname || user.lastname.length === 0) {
        errored = true;
        errors.lastname = true;
      }
      if (!validateEmail(user.email)) {
        errored = true;
        errors.email = true;
      }
      if (user.password !== user.passwordRepeat) {
        errored = true;
        errors.passwordRepeat = true;
      }
      if (user.password.length < MIN_PASSWORD_LENGTH) {
        errored = true;
        errors.password = true;
      }
      if (!user.birthdateMonth || !user.birthdateDay || !user.birthdateYear) {
        errored = true;
        errors.birthdate = true;
      }
      store.setState({
        signupErrors: errors
      });
      return errored;
    },
    async createUser(state) {
      store.setState({
        signupAlreadySubmitted: true
      });
      const errored = actions.validateUser(state);
      if (errored) {
        return;
      }
      const userToCreate = Object.assign({}, state.newUser, {
        birthdate: new Date(
          `${state.newUser.birthdateYear}-${state.newUser.birthdateMonth}-${state.newUser.birthdateDay}`
        )
      });
      if (state.cropper) {
        userToCreate.picture = await getCropperBase64Image(state.cropper);
      }
      store.setState({
        createLocalAccountStatus: RequestStatus.Getting
      });
      try {
        const user = await state.httpClient.post(`/api/v1/signup`, userToCreate);
        store.setState({
          user,
          createLocalAccountStatus: RequestStatus.Success
        });
        state.session.saveUser(user);
        state.session.init();
        if (userToCreate.picture) {
          state.session.saveProfilePicture(userToCreate.picture);
          store.setState({
            profilePicture: userToCreate.picture
          });
        }
        actionsProfilePicture.loadProfilePicture(state);
        route('/signup/preference');
      } catch (e) {
        const status = get(e, 'response.status');
        const message = get(e, 'response.data.message');
        if (!status) {
          store.setState({
            createLocalAccountStatus: RequestStatus.NetworkError
          });
        } else if (message === 'INSTANCE_ALREADY_CONFIGURED') {
          store.setState({
            createLocalAccountStatus: CreateUserErrors.InstanceAlreadyConfigured,
            createLocalAccountError: e.response.data
          });
        } else {
          store.setState({
            createLocalAccountStatus: RequestStatus.Error,
            createLocalAccountError: e.response.data
          });
        }
      }
    },
    async updateProfilePicture(state, e) {
      const base64Image = await fileToBase64(e.target.files[0]);
      const newState = update(state, {
        newProfilePicture: {
          $set: base64Image
        },
        newProfilePictureFormValue: {
          $set: e.target.value
        }
      });
      store.setState(newState);
    },
    setCropperInstance(state, cropper) {
      store.setState({
        cropper
      });
    },
    updateNewUserProperty(state, property, value) {
      const newState = update(state, {
        newUser: {
          [property]: {
            $set: value
          }
        }
      });
      store.setState(newState);
      if (state.signupAlreadySubmitted) {
        actions.validateUser(store.getState());
      }
    }
  };
  return Object.assign(actions, welcomeActions);
}

export default createActions;
