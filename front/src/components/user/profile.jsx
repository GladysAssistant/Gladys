import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import dayjs from 'dayjs';
import get from 'get-value';
import EditableProfilePicture from './EditableProfilePicture';

const Profile = ({ children, ...props }) => {
  return (
    <div>
      {props.unknownError && (
        <div class="alert alert-danger" role="alert">
          <Text id="profile.unknownError" />
        </div>
      )}
      {props.networkError && (
        <div class="alert alert-danger" role="alert">
          <Text id="profile.networkError" />
        </div>
      )}
      {props.emailAlreadyExistError && (
        <div class="alert alert-danger" role="alert">
          <Text id="profile.emailAlreadyExistError" />
        </div>
      )}
      {props.selectorAlreadyExist && (
        <div class="alert alert-danger" role="alert">
          <Text id="profile.selectorAlreadyExistError" />
        </div>
      )}
      {props.instanceAlreadyConfiguredError && (
        <div class="alert alert-danger" role="alert">
          <Text id="profile.instanceAlreadyConfiguredError" />
        </div>
      )}
      <div>
        <div class="row gutters-xs">
          <div class="col">
            <div class="form-group">
              <label class="form-label">
                <Text id="profile.firstnameLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class={cx('form-control', {
                    'is-invalid': get(props, 'errors.firstname')
                  })}
                  value={props.newUser.firstname}
                  onInput={props.updateFirstname}
                  placeholder={<Text id="profile.firstnamePlaceholder" />}
                />
              </Localizer>
              <div class="invalid-feedback">
                <Text id="profile.firstnameError" />
              </div>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label class="form-label">
                <Text id="profile.lastnameLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class={cx('form-control', {
                    'is-invalid': get(props, 'errors.lastname')
                  })}
                  value={props.newUser.lastname}
                  onInput={props.updateLastname}
                  placeholder={<Text id="profile.lastnamePlaceholder" />}
                />
              </Localizer>
              <div class="invalid-feedback">
                <Text id="profile.lastnameError" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="profile.selectorLabel" />
        </label>
        <small>
          <Text id="profile.selectorText" />
        </small>
        <input class="form-control" disabled value={props.newUser.selector} />
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="profile.emailLabel" />
        </label>
        <Localizer>
          <input
            type="email"
            class={cx('form-control', {
              'is-invalid': get(props, 'errors.email')
            })}
            value={props.newUser.email}
            onInput={props.updateEmail}
            placeholder={<Text id="profile.emailPlaceholder" />}
          />
        </Localizer>
        <div class="invalid-feedback">
          <Text id="profile.emailError" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="profile.languageLabel" />
        </label>
        <select value={props.newUser.language} onChange={props.updateLanguage} class="form-control custom-select">
          <option value="en">
            <Text id="profile.english" />
          </option>
          <option value="fr">
            <Text id="profile.french" />
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="profile.birthdateLabel" />
        </label>
        <div class="row gutters-xs">
          <div class="col-4">
            <select
              value={props.newUser.birthdateYear}
              onInput={props.updateBirthdateYear}
              class={cx('form-control', 'custom-select', {
                'is-invalid': get(props, 'errors.birthdate')
              })}
            >
              <option value="">
                <Text id="profile.year" />
              </option>
              {props.years.map(year => (
                <option>{year}</option>
              ))}
            </select>
          </div>
          <div class="col-5">
            <select
              value={props.newUser.birthdateMonth}
              onInput={props.updateBirthdateMonth}
              class={cx('form-control', 'custom-select', {
                'is-invalid': get(props, 'errors.birthdate')
              })}
            >
              <option value="">
                <Text id="profile.month" />
              </option>
              {props.months.map(month => (
                <option value={month}>
                  {dayjs()
                    .set('month', month - 1)
                    .locale(props.newUser.language)
                    .format('MMMM')}
                </option>
              ))}
            </select>
          </div>
          <div class="col-3">
            <select
              value={props.newUser.birthdateDay}
              onInput={props.updateBirthdateDay}
              class={cx('form-control', 'custom-select', {
                'is-invalid': get(props, 'errors.birthdate')
              })}
            >
              <option value="">
                <Text id="profile.day" />
              </option>
              {props.days.map(day => (
                <option>{day}</option>
              ))}
            </select>
          </div>
        </div>
        <input
          type="hidden"
          class={cx('form-control', {
            'is-invalid': get(props, 'errors.birthdate')
          })}
        />
        <div class="invalid-feedback">
          <Text id="profile.birthdateError" />
        </div>
      </div>
      {!props.disableProfilePicture && (
        <div class="form-group">
          <label class="form-label">
            <Text id="profile.profilePictureLabel" />
          </label>

          <div class="custom-file">
            <input
              type="file"
              class="custom-file-input"
              onChange={props.updateProfilePicture}
              value={props.newProfilePictureFormValue}
            />
            <label class="custom-file-label">
              <Text id="profile.chooseFileLabel" />
            </label>
          </div>
          {props.newProfilePictureFormValue && (
            <EditableProfilePicture
              setCropperInstance={props.setCropperInstance}
              newProfilePicture={props.newProfilePicture}
            />
          )}
        </div>
      )}
      <div class="form-group">
        <label class="form-label">
          <Text id="profile.passwordLabel" />
        </label>
        <Localizer>
          <input
            type="password"
            class={cx('form-control', {
              'is-invalid': get(props, 'errors.password'),
              'is-valid': props.validPassword && !get(props, 'errors.password')
            })}
            value={props.newUser.password}
            onInput={props.updatePassword}
            placeholder={<Text id="profile.passwordPlaceholder" />}
          />
        </Localizer>
        <div class="invalid-feedback">
          <Text id="profile.passwordError" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="profile.passwordRepeatLabel" />
        </label>
        <Localizer>
          <input
            type="password"
            class={cx('form-control', {
              'is-invalid': get(props, 'errors.passwordRepeat'),
              'is-valid': props.validPasswordRepeat && !get(props, 'errors.passwordRepeat')
            })}
            value={props.newUser.passwordRepeat}
            onInput={props.updatePasswordRepeat}
            placeholder={<Text id="profile.passwordRepeatPlaceholder" />}
          />
        </Localizer>
        <div class="invalid-feedback">
          <Text id="profile.passwordRepeatError" />
        </div>
      </div>
    </div>
  );
};

export default Profile;
