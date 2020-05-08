import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import dayjs from 'dayjs';
import get from 'get-value';
import EditableProfilePicture from './EditableProfilePicture';
import Select from '../form/Select';

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
        <Select
          value={props.newUser.language}
          onChange={props.updateLanguage}
          uniqueKey="value"
          options={[
            {
              value: 'en',
              label: <Text id="profile.english" />
            },
            {
              value: 'fr',
              label: <Text id="profile.french" />
            }
          ]}
        />
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="profile.birthdateLabel" />
        </label>
        <div class="row gutters-xs">
          <div class="col-4">
            <Select
              searchable
              value={props.newUser.birthdateYear}
              onChange={props.updateBirthdateYear}
              placeholder={<Text id="profile.year" />}
              options={props.years}
            />
          </div>
          <div class="col-5">
            <Select
              searchable
              value={props.newUser.birthdateMonth}
              onChange={props.updateBirthdateMonth}
              placeholder={<Text id="profile.month" />}
              uniqueKey="value"
              options={props.months.map(month => {
                return {
                  value: month,
                  label: dayjs()
                    .set('month', month - 1)
                    .locale(props.newUser.language)
                    .format('MMMM')
                };
              })}
            />
          </div>
          <div class="col-3">
            <Select
              searchable
              value={props.newUser.birthdateDay}
              onChange={props.updateBirthdateDay}
              placeholder={<Text id="profile.day" />}
              options={props.days}
            />
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
              lang={props.newUser.language}
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
