import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

const MIN_PASSWORD_LENGTH = 8;

class ResetPassword extends Component {
  updatePassword = e => {
    this.setState({
      password: e.target.value
    });
  };
  updatePasswordRepeat = e => {
    this.setState({
      passwordRepeat: e.target.value
    });
  };
  validatePassword = (password, passwordRepeat) => {
    const errors = {
      password: password.length < MIN_PASSWORD_LENGTH,
      passwordRepeat: password !== passwordRepeat
    };
    const valid = errors.password === false && errors.passwordRepeat === false;
    return { valid, errors };
  };
  saveNewPassword = async () => {
    const { password, passwordRepeat } = this.state;

    const { valid, errors } = this.validatePassword(password, passwordRepeat);
    this.setState({ valid, errors });
    if (!valid) {
      return;
    }
    await this.setState({ loading: true });
    try {
      await this.props.httpClient.patch(`/api/v1/user/${this.props.userSelector}`, {
        password
      });
      this.setState({
        loading: false,
        password: '',
        passwordRepeat: ''
      });
    } catch (e) {
      console.error(e);
      this.setState({
        loading: false,
        valid: false
      });
    }
  };
  constructor() {
    super();
    this.state = {
      password: '',
      passwordRepeat: ''
    };
  }
  render(props, { loading, password, passwordRepeat, errors }) {
    return (
      <div class={loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="form-group">
            <label class="form-label">
              <Text id="profile.passwordLabel" />
            </label>
            <Localizer>
              <input
                type="password"
                class={cx('form-control', {
                  'is-invalid': get(errors, 'password'),
                  'is-valid': password && errors && !get(errors, 'password') === false
                })}
                value={password}
                onInput={this.updatePassword}
                placeholder={<Text id="profile.passwordOtherUserPlaceholder" />}
              />
            </Localizer>
            <div class="invalid-feedback">
              <Text id="profile.passwordError" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <Text id="profile.passwordOtherUserRepeatLabel" />
            </label>
            <Localizer>
              <input
                type="password"
                class={cx('form-control', {
                  'is-invalid': get(errors, 'passwordRepeat'),
                  'is-valid': passwordRepeat && errors && get(errors, 'passwordRepeat') === false
                })}
                value={passwordRepeat}
                onInput={this.updatePasswordRepeat}
                placeholder={<Text id="profile.passwordRepeatOtherUserPlaceholder" />}
              />
            </Localizer>
            <div class="invalid-feedback">
              <Text id="profile.passwordRepeatError" />
            </div>
          </div>
          <div class="form-group">
            <button onClick={this.saveNewPassword} class="btn btn-success">
              <Text id="usersSettings.editUser.resetPasswordButton" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('currentUrl,httpClient', {})(ResetPassword);
