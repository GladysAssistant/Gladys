import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { route } from 'preact-router';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../utils/consts';
import style from './style.css';
import MatterPage from './MatterPage';

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

  render() {
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

              {this.state.error && (
                <>
                  <div class="alert alert-danger">
                    <Text id="integration.matter.discover.error" />
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

export default connect('httpClient,user', {})(MatterDiscoverPage);
