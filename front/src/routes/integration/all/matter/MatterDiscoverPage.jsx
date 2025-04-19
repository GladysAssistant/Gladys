import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { route } from 'preact-router';
import { connect } from 'unistore/preact';
import MatterPage from './MatterPage';

class MatterDiscoverPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pairingCode: '',
      loading: false
    };
  }

  handleSubmit = async e => {
    e.preventDefault();
    this.setState({ loading: true });

    try {
      await this.props.httpClient.post('/api/v1/service/matter/pair-device', {
        pairing_code: this.state.pairingCode
      });
      route('/dashboard/integration/device/matter');
    } catch (e) {
      console.error(e);
    }

    this.setState({ loading: false });
  };

  render() {
    return (
      <MatterPage user={this.props.user}>
        <div class="card">
          <div class="card-header">
            <div class="d-flex align-items-center">
              <button onClick={() => window.history.back()} class="btn btn-secondary mr-2">
                <i class="fe fe-arrow-left" />
                <Text id="global.backButton" />
              </button>
              <h3 class="card-title mb-0">
                <Text id="integration.matter.discover.title" />
              </h3>
            </div>
          </div>
          <div class="card-body">
            <div class="alert alert-info">
              <Text id="integration.matter.discover.description" />
            </div>

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
                    pattern="([0-9]{4}-[0-9]{3}-[0-9]{4})|([0-9]{11})"
                    required
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
                  disabled={this.state.loading}
                >
                  <Text id="integration.matter.discover.addButton" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </MatterPage>
    );
  }
}

export default connect('httpClient,user', {})(MatterDiscoverPage);
