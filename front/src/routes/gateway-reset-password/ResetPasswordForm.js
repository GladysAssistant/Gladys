import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

const ResetPassworFrom = ({ children, ...props }) => (
  <form onSubmit={props.resetPassword} className="card">
    <div className="card-body p-6">
      <div className="card-title">
        <Text id="gatewayResetPassword.formTitle" />
      </div>
      {props.browserCompatible === false && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewayResetPassword.incompatibleBrowserLabel" />
        </div>
      )}
      {props.errorLink && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewayResetPassword.errorLinkLabel" />
        </div>
      )}
      {props.passwordNotMatching && (
        <div class="alert alert-warning" role="alert">
          <Text id="gatewayResetPassword.passwordNotMatchingLabel" />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">
          <Text id="gatewayResetPassword.passwordLabel" />
        </label>
        <Localizer>
          <input
            type="password"
            className={cx('form-control', { 'is-invalid': props.passwordError })}
            placeholder={<Text id="gatewayResetPassword.passwordPlaceholder" />}
            value={props.password}
            onInput={props.updatePassword}
          />
        </Localizer>
        <div class="invalid-feedback">
          <Text id="gatewayResetPassword.passwordInvalid" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">
          <Text id="gatewayResetPassword.repeatPasswordLabel" />
        </label>
        <Localizer>
          <input
            type="password"
            className={cx('form-control', { 'is-invalid': props.passwordError })}
            placeholder={<Text id="gatewayResetPassword.passwordPlaceholder" />}
            value={props.passwordRepeat}
            onInput={props.updatePasswordRepeat}
          />
        </Localizer>
        <div class="invalid-feedback">
          <Text id="gatewayResetPassword.passwordInvalid" />
        </div>
      </div>
      {props.twoFactorEnabled && (
        <div className="form-group">
          <label className="form-label">
            <Text id="gatewayResetPassword.twoFactorCodeLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="gatewayResetPassword.twoFactorCodePlaceholder" />}
              value={props.twoFactorCode}
              onInput={props.updateTwoFactorCode}
            />
          </Localizer>
        </div>
      )}
      <div className="form-footer">
        <button type="submit" className="btn btn-primary btn-block" disabled={props.resetInProgress}>
          <Text id="gatewayResetPassword.resetPasswordButton" />
        </button>
      </div>
    </div>
  </form>
);

export default ResetPassworFrom;
