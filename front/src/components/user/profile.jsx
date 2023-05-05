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
                  placeholder={
                    props.editingOtherUser ? (
                      <Text id="profile.firstnameOtherUserPlaceholder" />
                    ) : (
                      <Text id="profile.firstnamePlaceholder" />
                    )
                  }
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
                  placeholder={
                    props.editingOtherUser ? (
                      <Text id="profile.lastnameOtherUserPlaceholder" />
                    ) : (
                      <Text id="profile.lastnamePlaceholder" />
                    )
                  }
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
        <small>
          <Text id="profile.emailText" />
        </small>
        <Localizer>
          <input
            type="email"
            class={cx('form-control', {
              'is-invalid': get(props, 'errors.email')
            })}
            value={props.newUser.email}
            onInput={props.updateEmail}
            placeholder={
              props.editingOtherUser ? (
                <Text id="profile.emailOtherUserPlaceholder" />
              ) : (
                <Text id="profile.emailPlaceholder" />
              )
            }
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
        <select value={props.newUser.language} onChange={props.updateLanguage} class="form-control">
          <option value="en">
            <Text id="profile.english" />
          </option>
          <option value="fr">
            <Text id="profile.french" />
          </option>
        </select>
      </div>
      {!props.disableRole && (
        <div class="form-group">
          <label class="form-label">
            <Text id="profile.roleLabel" />
          </label>
          <p>
            <small>
              <Text id="profile.roleDescription" />
            </small>
          </p>
          <select value={props.newUser.role} onChange={props.updateRole} class="form-control">
            <option value="admin">
              <Text id="profile.adminRole" />
            </option>
            <option value="user">
              <Text id="profile.userRole" />
            </option>
          </select>
        </div>
      )}
      {!props.disableBirthdate && (
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
                  <option value={year}>{year}</option>
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
                  <option value={day}>{day}</option>
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
      )}
      {!props.disablePreferences && (
        <div class="form-group">
          <label class="form-label">
            <Text id="signup.preferences.temperatureUnitsLabel" />
          </label>
          <select
            value={props.newUser.temperature_unit_preference}
            onInput={props.updateTemperatureUnit}
            class="form-control"
          >
            <option value="celsius">
              <Text id="signup.preferences.temperatureUnitsCelsius" />
            </option>
            <option value="fahrenheit">
              <Text id="signup.preferences.temperatureUnitsFahrenheit" />
            </option>
          </select>
        </div>
      )}
      {!props.disablePreferences && (
        <div class="form-group">
          <label class="form-label">
            <Text id="signup.preferences.distanceUnit" />
          </label>
          <select
            value={props.newUser.distance_unit_preference}
            onInput={props.updateDistanceUnit}
            class="form-control"
          >
            <option value="metric">
              <Text id="signup.preferences.distanceUnitMeter" />
            </option>
            <option value="us">
              <Text id="signup.preferences.distanceUnitUs" />
            </option>
          </select>
        </div>
      )}
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
      {!props.disablePassword && (
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
              placeholder={
                props.editingOtherUser ? (
                  <Text id="profile.passwordOtherUserPlaceholder" />
                ) : (
                  <Text id="profile.passwordPlaceholder" />
                )
              }
            />
          </Localizer>
          <div class="invalid-feedback">
            <Text id="profile.passwordError" />
          </div>
        </div>
      )}
      {!props.disablePassword && (
        <div class="form-group">
          <label class="form-label">
            {props.editingOtherUser ? (
              <Text id="profile.passwordOtherUserRepeatLabel" />
            ) : (
              <Text id="profile.passwordRepeatLabel" />
            )}
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
              placeholder={
                props.editingOtherUser ? (
                  <Text id="profile.passwordRepeatOtherUserPlaceholder" />
                ) : (
                  <Text id="profile.passwordRepeatPlaceholder" />
                )
              }
            />
          </Localizer>
          <div class="invalid-feedback">
            <Text id="profile.passwordRepeatError" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
