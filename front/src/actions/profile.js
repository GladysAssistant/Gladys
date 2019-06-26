import { RequestStatus } from '../utils/consts';
import validateEmail from '../utils/validateEmail';
import update from 'immutability-helper';
import get from 'get-value';
import { fileToBase64, getCropperBase64Image } from '../utils/picture';
import { getYearsMonthsAndDays } from '../utils/date';

const MIN_PASSWORD_LENGTH = 8;

function createActions(store) {
  const actions = {
    async getMySelf(state) {
      store.setState({
        ProfileGetStatus: RequestStatus.Getting,
        cropper: null,
        newProfilePicture: null,
        newProfilePictureFormValue: null
      });
      try {
        const user = await state.httpClient.get('/api/v1/me');
        user.birthdateDay = parseInt(user.birthdate.substr(8, 2), 10);
        user.birthdateMonth = parseInt(user.birthdate.substr(5, 2), 10);
        user.birthdateYear = parseInt(user.birthdate.substr(0, 4), 10);
        store.setState({
          newUser: user,
          ProfileGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          ProfileGetStatus: RequestStatus.Error
        });
      }
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
      if (user.password) {
        if (user.password !== user.passwordRepeat) {
          errored = true;
          errors.passwordRepeat = true;
        }
        if (user.password.length < MIN_PASSWORD_LENGTH) {
          errored = true;
          errors.password = true;
        }
      }
      if (!user.birthdateMonth || !user.birthdateDay || !user.birthdateYear) {
        errored = true;
        errors.birthdate = true;
      }
      store.setState({
        profileUpdateErrors: errors
      });
      return errored;
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
      const { days, months, years } = getYearsMonthsAndDays(
        get(state, 'newUser.birthdateYear'),
        get(state, 'newUser.birthdateMonth')
      );
      store.setState({
        days,
        months,
        years
      });
    },
    async saveProfile(state, e) {
      e.preventDefault();
      store.setState({
        ProfilePatchStatus: RequestStatus.Getting
      });
      try {
        const data = Object.assign({}, state.newUser);
        const errored = actions.validateUser(state);
        if (errored) {
          throw new Error();
        }
        data.birthdate = new Date(data.birthdateYear, data.birthdateMonth - 1, data.birthdateDay);
        delete data.birthdateYear;
        delete data.birthdateMonth;
        delete data.birthdateDay;
        if (state.cropper) {
          const profilePicture = await getCropperBase64Image(state.cropper);
          if (profilePicture) {
            data.picture = profilePicture;
          }
        }
        await state.httpClient.patch('/api/v1/me', data);
        if (data.picture) {
          state.session.saveProfilePicture(data.picture);
          store.setState({
            profilePicture: data.picture
          });
        }
        state.session.saveUser(data);
        store.setState({
          user: data,
          ProfileGetStatus: RequestStatus.Getting,
          ProfilePatchStatus: RequestStatus.Success
        });
        actions.getMySelf(state);
      } catch (e) {
        console.log(e);
        store.setState({
          ProfilePatchStatus: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
