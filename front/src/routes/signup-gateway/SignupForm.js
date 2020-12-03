import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

const SignupForm = ({ children, ...props }) => (
  <form onSubmit={props.validateForm} className="card">
    <div className="card-body p-6">
      <div className="card-title">
        <Text id="gatewaySignup.createAccount" />
      </div>
      {props.accountAlreadyExist && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewaySignup.emailAlreadyExistError" />
        </div>
      )}
      {props.browserCompatible === false && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewaySignup.browserNotCompatibleError" />
        </div>
      )}

      {props.tokenError === true && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewaySignup.tokenError" />
        </div>
      )}

      {props.unknownError === true && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewaySignup.unknownError" />
        </div>
      )}

      {props.invitationError && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewaySignup.invalidInvitationError" />
        </div>
      )}

      {!props.invitationError && props.browserCompatible && (
        <div>
          <div className="form-group">
            <label className="form-label">
              <Text id="gatewaySignUp.usernameLabel" />
            </label>
            <Localizer>
              <input
                type="text"
                className={cx('form-control', { 'is-invalid': props.fieldsErrored.includes('name') })}
                placeholder={<Text id="gatewaySignUp.usernamePlaceholder" />}
                value={props.name}
                onInput={props.updateName}
              />
            </Localizer>
            <div class="invalid-feedback">
              <Text id="gatewaySignUp.usernameInvalid" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              <Text id="gatewaySignUp.emailLabel" />
            </label>
            <Localizer>
              <input
                type="email"
                className={cx('form-control', { 'is-invalid': props.fieldsErrored.includes('email') })}
                placeholder={<Text id="gatewaySignUp.emailPlaceholder" />}
                value={props.email}
                disabled={props.token && 'disabled'}
                onInput={props.updateEmail}
              />
            </Localizer>
            <div class="invalid-feedback">
              <Text id="gatewaySignUp.emailInvalid" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              <Text id="gatewaySignUp.passwordLabel" />
            </label>
            <Localizer>
              <input
                type="password"
                className={cx('form-control', { 'is-invalid': props.fieldsErrored.includes('password') })}
                placeholder={<Text id="gatewaySignUp.passwordPlaceholder" />}
                value={props.password}
                onInput={props.updatePassword}
              />
            </Localizer>
            <div class="invalid-feedback">
              <Text id="gatewaySignUp.passwordInvalid" />
            </div>
          </div>
          <div className="form-footer">
            <button type="submit" className="btn btn-primary btn-block">
              <Text id="gatewaySignUp.createAccountButton" />
            </button>
          </div>
        </div>
      )}
    </div>
  </form>
);

export default SignupForm;
