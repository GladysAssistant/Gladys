import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';

import { REGIONS } from './constants';

class ApplicationSetup extends Component {
  showPasswordTimer = null;

  updateApplicationId = event => {
    const { value: applicationId } = event.target;
    this.setState({ applicationId });
  };

  updateApplicationSecret = event => {
    const { value: applicationSecret } = event.target;
    this.setState({ applicationSecret });
  };

  updateApplicationRegion = event => {
    const { value: applicationRegion } = event.target;
    this.setState({ applicationRegion });
  };

  saveConfiguration = async event => {
    event.preventDefault();
    const { applicationId, applicationSecret, applicationRegion } = this.state;
    const configuration = { applicationId, applicationSecret, applicationRegion };
    this.props.saveConfiguration(configuration);
  };

  resetConfiguration = event => {
    event.preventDefault();
    const { ewelinkConfig = {} } = this.props;
    const { applicationId = '', applicationSecret = '', applicationRegion } = ewelinkConfig;
    this.setState({ applicationId, applicationSecret, applicationRegion });
    this.props.resetConfiguration();
  };

  togglePassword = () => {
    const { showPassword } = this.state;

    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }

    this.setState({ showPassword: !showPassword });

    if (!showPassword) {
      this.showPasswordTimer = setTimeout(() => this.setState({ showPassword: false }), 5000);
    }
  };

  constructor(props) {
    super(props);

    const { ewelinkConfig = {} } = props;
    const { applicationId = '', applicationSecret = '', applicationRegion } = ewelinkConfig;
    this.state = {
      applicationId,
      applicationSecret,
      applicationRegion
    };
  }

  componentWillUnmount() {
    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }
  }

  componentWillReceiveProps(nextProps) {
    const { ewelinkConfig = {} } = nextProps;
    const { applicationId = '', applicationSecret = '', applicationRegion } = ewelinkConfig;
    const {
      applicationId: currentApplicationId,
      applicationSecret: currentApplicationSecret,
      applicationRegion: currentApplicationRegion
    } = this.state;

    if (
      applicationId !== currentApplicationId ||
      applicationSecret !== currentApplicationSecret ||
      applicationRegion !== currentApplicationRegion
    ) {
      this.setState({ applicationId, applicationSecret, applicationRegion });
    }
  }

  render({ disabled }, { applicationId, applicationSecret, applicationRegion, showPassword }) {
    const saveDisabled = applicationId === '' || applicationSecret === '' || !applicationRegion;
    return (
      <form onSubmit={this.saveConfiguration} autocomplete="off" data-cy="ewelink-application-setup-form">
        <div class="form-group">
          <label for="eweLinkAppId" class="form-label">
            <Text id={'integration.eWeLink.setup.applicationIdLabel'} />
          </label>
          <Localizer>
            <input
              id="eweLinkAppId"
              class="form-control"
              placeholder={<Text id="integration.eWeLink.setup.applicationIdPlaceholder" />}
              value={applicationId}
              onInput={this.updateApplicationId}
              disabled={disabled}
              autocomplete="off"
              required
              data-cy="ewelink-application-setup-app-id"
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label for="eweLinkAppSecret" class="form-label">
            <Text id={'integration.eWeLink.setup.applicationSecretLabel'} />
          </label>
          <div class="input-icon mb-3">
            <Localizer>
              <input
                id="eweLinkAppSecret"
                class="form-control"
                type={showPassword ? 'text' : 'password'}
                placeholder={<Text id="integration.eWeLink.setup.applicationSecretPlaceholder" />}
                value={applicationSecret}
                onInput={this.updateApplicationSecret}
                disabled={disabled}
                autocomplete="off"
                required
                data-cy="ewelink-application-setup-app-secret"
              />
            </Localizer>
            <span class="input-icon-addon cursor-pointer" onClick={this.togglePassword}>
              <i
                class={cx('fe', {
                  'fe-eye': !showPassword,
                  'fe-eye-off': showPassword
                })}
              />
            </span>
          </div>
        </div>
        <div class="form-group">
          <label for="eweLinkAppRegion" class="form-label">
            <Text id={'integration.eWeLink.setup.applicationRegionLabel'} />
          </label>
          <div class="input-icon mb-3">
            <Localizer>
              <select
                id="eweLinkAppRegion"
                class="form-control"
                onChange={this.updateApplicationRegion}
                disabled={disabled}
                required
                data-cy="ewelink-application-setup-app-region"
                value={applicationRegion}
              >
                {REGIONS.map(region => (
                  <option value={region}>
                    <Text id={`integration.eWeLink.setup.regions.${region}`}>{region}</Text>
                  </option>
                ))}
              </select>
            </Localizer>
          </div>
        </div>
        <div class="d-flex form-group">
          <button
            type="submit"
            class="btn btn-success mx-auto"
            disabled={saveDisabled || disabled}
            data-cy="ewelink-application-setup-save"
          >
            <i class="fe fe-save mr-2" />
            <Text id="global.save" />
          </button>
          <button
            class="btn btn-primary mx-auto"
            onClick={this.resetConfiguration}
            disabled={disabled}
            data-cy="ewelink-application-setup-cancel"
          >
            <i class="fe fe-rotate-ccw mr-2" />
            <Text id="global.cancel" />
          </button>
        </div>
      </form>
    );
  }
}

export default ApplicationSetup;
