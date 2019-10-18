import { Text } from 'preact-i18n';

const ResetPassworFrom = ({ children, ...props }) => (
  <form onSubmit={props.resetPassword} className="card">
    <div className="card-body p-6">
      <div className="card-title">
        <Text id="gatewayResetPassword.formTitle" />
      </div>
      {props.browserCompatible === false && (
        <div class="alert alert-danger" role="alert">
          Sorry, your browser is not compatible with the Gladys Gateway. Your browser should support the WebCrypto API
          as well as IndexedDB database.
        </div>
      )}
      {props.errorLink && (
        <div class="alert alert-danger" role="alert">
          We cannot retrieve your reset password link. Maybe it was already used or has expired!
        </div>
      )}
      {props.passwordNotMatching && (
        <div class="alert alert-warning" role="alert">
          Password are not matching.
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Password (min 8 characters)</label>
        <input
          type="password"
          className={'form-control ' + (props.passwordError ? 'is-invalid' : '')}
          placeholder="Password"
          value={props.password}
          onInput={props.updatePassword}
        />
        <div class="invalid-feedback">Password should be min 8 characters</div>
      </div>
      <div className="form-group">
        <label className="form-label">Repeat Password</label>
        <input
          type="password"
          className={'form-control ' + (props.passwordError ? 'is-invalid' : '')}
          placeholder="Password"
          value={props.passwordRepeat}
          onInput={props.updatePasswordRepeat}
        />
        <div class="invalid-feedback">Password should be min 8 characters</div>
      </div>
      {props.twoFactorEnabled && (
        <div className="form-group">
          <label className="form-label">Two factor code</label>
          <input
            type="text"
            class="form-control"
            placeholder="6 digits two factor code"
            value={props.twoFactorCode}
            onInput={props.updateTwoFactorCode}
          />
        </div>
      )}
      <div className="form-footer">
        <button type="submit" className="btn btn-primary btn-block" disabled={props.resetInProgress}>
          Reset Password
        </button>
      </div>
    </div>
  </form>
);

export default ResetPassworFrom;
