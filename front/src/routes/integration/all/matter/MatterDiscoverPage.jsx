import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { route } from 'preact-router';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../utils/consts';
import style from './style.css';
import MatterPage from './MatterPage';
import {
  withMobileViewport,
  MobileNotice,
  MobileField,
  fieldClass,
  BigButton,
  kitStyle
} from '../../../../components/mobile';
import { MobileIntegrationTab, MobileWaitingNotice } from '../../../../components/integration/mobile';

// same codes as the desktop field: 11 or 21 digits, with or without their dashes
const PAIRING_CODE_PATTERN =
  '([0-9]{4}-[0-9]{3}-[0-9]{4})|([0-9]{11})|([0-9]{5}-[0-9]{5}-[0-9]{5}-[0-9]{6})|([0-9]{21})';

class MatterDiscoverPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pairingCode: '',
      loading: false,
      getDataLoading: true,
      matterEnabled: null,
      error: null
    };
  }

  componentDidMount() {
    this.loadConfiguration();
  }

  loadConfiguration = async () => {
    try {
      await this.setState({ getDataLoading: true });
      const { value: matterEnabled } = await this.props.httpClient.get(
        '/api/v1/service/matter/variable/MATTER_ENABLED'
      );
      await this.setState({
        matterEnabled: matterEnabled === 'true',
        getDataLoading: false
      });
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status !== 404) {
        this.setState({ error: RequestStatus.Error });
      }
      await this.setState({
        matterEnabled: false,
        getDataLoading: false
      });
    }
  };

  handleSubmit = async e => {
    e.preventDefault();
    this.setState({ loading: true, error: null });

    try {
      await this.props.httpClient.post('/api/v1/service/matter/pair-device', {
        pairing_code: this.state.pairingCode
      });
      route('/dashboard/integration/device/matter');
    } catch (e) {
      console.error(e);
      if (e.response && e.response.data && e.response.data.error) {
        this.setState({ error: e.response.data.error });
      }
    }

    this.setState({ loading: false });
  };

  updatePairingCode = e => this.setState({ pairingCode: e.target.value });

  // The pairing form on a phone (docs/specs/mobile-pages/integration-devices.md, E): the same
  // state and the same request, a field that does not make iOS zoom and a full-width button
  renderMobile() {
    const { pairingCode, loading, getDataLoading, matterEnabled, error } = this.state;
    return (
      <MatterPage user={this.props.user}>
        <MobileIntegrationTab dataCy="matter-discover-mobile">
          {matterEnabled === false && !getDataLoading && (
            <MobileNotice tone="warning" icon="alert-triangle">
              <MarkupText id="integration.matter.settings.disabledWarning" />
            </MobileNotice>
          )}
          <p class={kitStyle.lead}>
            <Text id="integration.matter.discover.description" />
          </p>
          <MobileNotice tone="warning" icon="alert-triangle">
            <MarkupText id="integration.matter.discover.borderRouterWarning" />
          </MobileNotice>
          <form onSubmit={this.handleSubmit}>
            <MobileField
              label={<Text id="integration.matter.discover.pairingCodeLabel" />}
              help={<Text id="integration.matter.discover.pairingCodeHelp" />}
              htmlFor="matterPairingCode"
            >
              <Localizer>
                <input
                  id="matterPairingCode"
                  type="text"
                  class={fieldClass.input}
                  placeholder={<Text id="integration.matter.discover.pairingCodePlaceholder" />}
                  value={pairingCode}
                  onInput={this.updatePairingCode}
                  pattern={PAIRING_CODE_PATTERN}
                  required
                  disabled={!matterEnabled || loading}
                  inputmode="numeric"
                  autocomplete="off"
                  enterkeyhint="go"
                  data-cy="matter-pairing-code"
                />
              </Localizer>
            </MobileField>
            {loading && (
              <MobileWaitingNotice data-cy="matter-pairing-loading">
                <Text id="integration.matter.discover.loading" />
              </MobileWaitingNotice>
            )}
            {error && (
              <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="matter-pairing-error">
                <MarkupText id="integration.matter.discover.error" />
                {error !== RequestStatus.Error && <div class="mt-2">{error}</div>}
              </MobileNotice>
            )}
            <BigButton
              type="submit"
              variant="primary"
              icon="plus"
              loading={loading}
              disabled={!matterEnabled}
              data-cy="matter-pairing-submit"
            >
              <Text id="integration.matter.discover.addButton" />
            </BigButton>
          </form>
        </MobileIntegrationTab>
      </MatterPage>
    );
  }

  render() {
    if (this.props.isMobile) {
      return this.renderMobile();
    }
    return (
      <MatterPage user={this.props.user}>
        <div class="card">
          <div class="card-header">
            <div class="d-flex align-items-center">
              <h3 class="card-title mb-0">
                <Text id="integration.matter.discover.title" />
              </h3>
            </div>
          </div>
          <div class={cx('card-body dimmer', { active: this.state.getDataLoading })}>
            <div class="loader" />
            <div class="dimmer-content">
              {!this.state.matterEnabled && (
                <div class="alert alert-warning">
                  <MarkupText id="integration.matter.settings.disabledWarning" />
                </div>
              )}
              <div class="alert alert-info">
                <Text id="integration.matter.discover.description" />
              </div>

              <div class="alert alert-warning">
                <MarkupText id="integration.matter.discover.borderRouterWarning" />
              </div>

              {this.state.error && (
                <>
                  <div class="alert alert-danger">
                    <MarkupText id="integration.matter.discover.error" />
                  </div>
                  <div class="alert alert-danger">{this.state.error}</div>
                </>
              )}

              <div class={this.state.loading ? 'dimmer active' : 'dimmer'}>
                {this.state.loading && (
                  <div>
                    <div class="loader" />
                    <div class={style.loadingText}>
                      <Text id="integration.matter.discover.loading" />
                    </div>
                  </div>
                )}
                <div class="dimmer-content">
                  <form onSubmit={this.handleSubmit}>
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.matter.discover.pairingCodeLabel" />
                      </label>
                      <Localizer>
                        <input
                          type="text"
                          class="form-control"
                          placeholder={<Text id="integration.matter.discover.pairingCodePlaceholder" />}
                          value={this.state.pairingCode}
                          onInput={e => this.setState({ pairingCode: e.target.value })}
                          pattern="([0-9]{4}-[0-9]{3}-[0-9]{4})|([0-9]{11})|([0-9]{5}-[0-9]{5}-[0-9]{5}-[0-9]{6})|([0-9]{21})"
                          required
                          disabled={!this.state.matterEnabled}
                        />
                      </Localizer>
                      <small class="form-text text-muted">
                        <Text id="integration.matter.discover.pairingCodeHelp" />
                      </small>
                    </div>

                    <div class="form-group">
                      <button
                        type="submit"
                        class={cx('btn btn-primary', { loading: this.state.loading })}
                        disabled={this.state.loading || !this.state.matterEnabled}
                      >
                        <Text id="integration.matter.discover.addButton" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MatterPage>
    );
  }
}

export default connect('httpClient,user', {})(withMobileViewport(MatterDiscoverPage));
