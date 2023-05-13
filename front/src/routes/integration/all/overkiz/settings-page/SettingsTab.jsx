import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

class SetupTab extends Component {
  updateOverkizType = e => {
    this.props.updateConfiguration({ overkizType: e.target.value });
  };

  updateOverkizUsername = e => {
    this.props.updateConfiguration({ overkizUsername: e.target.value });
  };

  updateOverkizPassword = e => {
    this.props.updateConfiguration({ overkizPassword: e.target.value, passwordChanges: true });
  };

  showPassword = () => {
    this.setState({ showPassword: true });
    setTimeout(() => this.setState({ showPassword: false }), 5000);
  };

  render(props, { overkizTypes, showPassword }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.overkiz.settings.title" />
          </h1>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: props.connectOverkizStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <p>
                <Text id="integration.overkiz.settings.overkizDescription" />
              </p>
              {props.connectOverkizStatus === RequestStatus.Error && !props.overkizConnectionError && (
                <p class="alert alert-danger">
                  <Text id="integration.overkiz.settings.error" />
                </p>
              )}
              {props.connectOverkizStatus === RequestStatus.Success && !props.overkizConnected && (
                <p class="alert alert-info">
                  <Text id="integration.overkiz.settings.connecting" />
                </p>
              )}
              {props.overkizConnected && (
                <p class="alert alert-success">
                  <Text id="integration.overkiz.settings.connected" />
                </p>
              )}
              {props.overkizConnectionError && (
                <p class="alert alert-danger">
                  <Text id="integration.overkiz.settings.connectionError" />
                </p>
              )}

              <form>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.overkiz.settings.typeLabel" />
                  </label>
                  <select class="form-control" onChange={this.updateOverkizType}>
                    {overkizTypes &&
                      overkizTypes.map(({ name, overkizType }) => (
                        <option value={name} selected={props.overkizType === name}>
                          {overkizType.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div class="form-group">
                  <label for="overkizUsername" class="form-label">
                    <Text id={`integration.overkiz.settings.userLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="overkizUsername"
                      placeholder={<Text id="integration.overkiz.settings.userPlaceholder" />}
                      value={props.overkizUsername}
                      class="form-control"
                      onInput={this.updateOverkizUsername}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label for="overkizPassword" class="form-label">
                    <Text id={`integration.overkiz.settings.passwordLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="overkizPassword"
                      type="password"
                      placeholder={<Text id="integration.overkiz.settings.passwordPlaceholder" />}
                      value={props.overkizPassword}
                      class="form-control"
                      onInput={this.updateOverkizPassword}
                    />
                  </Localizer>
                  <span class="input-icon-addon cursor-pointer" onClick={this.showPassword}>
                    <i
                      class={cx('fe', {
                        'fe-eye': !showPassword,
                        'fe-eye-off': showPassword
                      })}
                    />
                  </span>
                </div>

                <div class="row mt-5">
                  <div class="col">
                    <button type="submit" class="btn btn-success" onClick={props.connect}>
                      <Text id="integration.overkiz.settings.connectButton" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SetupTab;
